import {
  Settings,
  MagiId,
  MagiInitialOutput,
  MagiDeliberationOutput,
  ConsensusResult,
  ProtocolLog,
  DecisionVote
} from '../types';
import { FetchedDocument } from './docFetcher';
import { buildFullSystemPrompt, SYSTEM_CONSENSUS_PROMPT } from '../config/defaultPrompts';
import { sendChatCompletion, extractJsonFromResponse } from './apiClient';

export interface MagiEngineCallbacks {
  onLog: (log: Omit<ProtocolLog, 'id' | 'timestamp'>) => void;
  onMagiStatusChange: (magiId: MagiId, status: 'THINKING' | 'DONE' | 'ERROR') => void;
}

// Phase 1: 独立初案思考
export async function runPhase1Initial(
  query: string,
  settings: Settings,
  callbacks: MagiEngineCallbacks,
  attachedDoc?: FetchedDocument
): Promise<Record<MagiId, MagiInitialOutput>> {
  const magiIds: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];
  const results: Partial<Record<MagiId, MagiInitialOutput>> = {};

  magiIds.forEach(id => callbacks.onMagiStatusChange(id, 'THINKING'));

  const docContext = attachedDoc
    ? `\n\n【参照外部ドキュメント / 参考資料】\nタイトル: ${attachedDoc.title}\nURL: ${attachedDoc.url}\n本文本文:\n${attachedDoc.content}\n`
    : '';

  const promises = magiIds.map(async (id) => {
    const personality = settings.personalities[id];
    const fullSystemPrompt = buildFullSystemPrompt(personality);

    callbacks.onLog({
      source: id,
      phase: 'CODE: 39 - INITIAL ANALYSIS',
      text: `${personality.name} 独立可否分析プロトコル開始...${attachedDoc ? ' (参照ドキュメント解析中)' : ''}`,
      type: 'info'
    });

    const messages = [
      { role: 'system' as const, content: fullSystemPrompt },
      { role: 'user' as const, content: `【本リクエストの検討議題】\n${query}${docContext}\n\n上記の【本リクエストの検討議題】および添付の【参照外部ドキュメント】のみに100%集中して分析してください。過去のセッションや本議題と無関係な話題についての記述は厳禁です。指定のJSON形式で回答してください。` }
    ];

    try {
      const rawRes = await sendChatCompletion(settings, messages, personality.modelOverride);
      const parsed = extractJsonFromResponse<{ vote?: DecisionVote; reasoning?: string; conditions?: string }>(rawRes, {
        vote: 'CONDITIONAL',
        reasoning: rawRes,
        conditions: ''
      });

      const vote: DecisionVote = parsed.vote || 'CONDITIONAL';
      const output: MagiInitialOutput = {
        magiId: id,
        reasoning: parsed.reasoning || rawRes,
        initialVote: vote,
        conditions: parsed.conditions,
        rawResponse: rawRes
      };

      results[id] = output;
      callbacks.onMagiStatusChange(id, 'DONE');
      callbacks.onLog({
        source: id,
        phase: 'CODE: 39 - PROPOSAL COMPLETE',
        text: `【初案決議: ${vote}】\n${output.reasoning}${output.conditions ? `\n\n【前提条件】:\n${output.conditions}` : ''}`,
        type: vote === 'APPROVAL' ? 'success' : vote === 'DENIED' ? 'warn' : 'info'
      });
    } catch (err: any) {
      callbacks.onMagiStatusChange(id, 'ERROR');
      callbacks.onLog({
        source: id,
        phase: 'ERROR',
        text: `通信エラー: ${err.message || err}`,
        type: 'warn'
      });
      // Fallback
      results[id] = {
        magiId: id,
        reasoning: `エラーにより思考停止: ${err.message}`,
        initialVote: 'CONDITIONAL',
        rawResponse: ''
      };
    }
  });

  await Promise.all(promises);
  return results as Record<MagiId, MagiInitialOutput>;
}

// Phase 2: 相互熟議 (Cross Examination)
export async function runPhase2Debate(
  query: string,
  initialOutputs: Record<MagiId, MagiInitialOutput>,
  settings: Settings,
  callbacks: MagiEngineCallbacks,
  attachedDoc?: FetchedDocument
): Promise<Record<MagiId, MagiDeliberationOutput>> {
  const magiIds: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];
  const results: Partial<Record<MagiId, MagiDeliberationOutput>> = {};

  magiIds.forEach(id => callbacks.onMagiStatusChange(id, 'THINKING'));

  const docContext = attachedDoc
    ? `\n\n【参照外部ドキュメント / 参考資料】\nタイトル: ${attachedDoc.title}\nURL: ${attachedDoc.url}\n本文抜粋:\n${attachedDoc.content}\n`
    : '';

  const initialSummary = magiIds.map(id => {
    const p = settings.personalities[id];
    const out = initialOutputs[id];
    return `■ ${p.name} (${p.role}):
【個別判定】: ${out.initialVote}
【分析根拠】: ${out.reasoning}
${out.conditions ? `【提示条件】: ${out.conditions}` : ''}`;
  }).join('\n\n');

  const promises = magiIds.map(async (id) => {
    const personality = settings.personalities[id];
    callbacks.onLog({
      source: id,
      phase: 'CODE: 407 - CROSS DELIBERATION',
      text: `${personality.name} 他2基の初案に対する熟議・反論プロトコル開始...`,
      type: 'info'
    });

    const fullSystemPrompt = buildFullSystemPrompt(personality);

    const debatePrompt = `【議題】
${query}${docContext}

【全MAGIユニットの第1次分析結果】
${initialSummary}

【あなた (${personality.name} / ${personality.role}) への指令】
議題・参照ドキュメント・他の2つのMAGIの意見を吟味した上で、あなたの視点から以下の点について熟議・反論・補足を行ってください：
1. 他のMAGIの意見で妥当な点、あるいは過度・見落としている危険な点
2. 相互議論を経た上での、あなたの【最終修正判定 (revisedVote)】
3. 最終的な判断理由

以下のJSON形式で回答してください：
{
  "revisedVote": "APPROVAL" | "DENIED" | "CONDITIONAL",
  "refinements": "他のMAGIへの同意・反論・懸念・補足コメント",
  "finalArgument": "最終的な主張と判断根拠"
}`;

    const messages = [
      { role: 'system' as const, content: fullSystemPrompt },
      { role: 'user' as const, content: debatePrompt }
    ];

    try {
      const rawRes = await sendChatCompletion(settings, messages, personality.modelOverride);
      const parsed = extractJsonFromResponse<{ revisedVote?: DecisionVote; refinements?: string; finalArgument?: string }>(rawRes, {
        revisedVote: initialOutputs[id].initialVote,
        refinements: rawRes,
        finalArgument: rawRes
      });

      const vote: DecisionVote = parsed.revisedVote || initialOutputs[id].initialVote;
      const output: MagiDeliberationOutput = {
        magiId: id,
        refinements: parsed.refinements || rawRes,
        revisedVote: vote,
        finalArgument: parsed.finalArgument || rawRes,
        rawResponse: rawRes
      };

      results[id] = output;
      callbacks.onMagiStatusChange(id, 'DONE');
      callbacks.onLog({
        source: id,
        phase: 'CODE: 407 - DELIBERATION COMPLETE',
        text: `【熟議後判定: ${vote}】\n${output.refinements}\n\n【最終主張】:\n${output.finalArgument}`,
        type: vote === 'APPROVAL' ? 'success' : vote === 'DENIED' ? 'warn' : 'info'
      });
    } catch (err: any) {
      callbacks.onMagiStatusChange(id, 'ERROR');
      results[id] = {
        magiId: id,
        refinements: `熟議エラー: ${err.message}`,
        revisedVote: initialOutputs[id].initialVote,
        finalArgument: initialOutputs[id].reasoning,
        rawResponse: ''
      };
    }
  });

  await Promise.all(promises);
  return results as Record<MagiId, MagiDeliberationOutput>;
}

// Phase 3: 最終集計と合意統合
export async function runPhase3Consensus(
  query: string,
  initialOutputs: Record<MagiId, MagiInitialOutput>,
  deliberationOutputs: Record<MagiId, MagiDeliberationOutput> | undefined,
  settings: Settings,
  callbacks: MagiEngineCallbacks
): Promise<ConsensusResult> {
  callbacks.onLog({
    source: 'MAGI_CORE',
    phase: 'CODE: 601 - CONSENSUS SYNTHESIS',
    text: 'MAGI SYSTEM 最終統合決議プロトコル起動...',
    type: 'info'
  });

  const votes: Record<MagiId, DecisionVote> = {
    MELCHIOR: deliberationOutputs ? deliberationOutputs.MELCHIOR.revisedVote : initialOutputs.MELCHIOR.initialVote,
    BALTHASAR: deliberationOutputs ? deliberationOutputs.BALTHASAR.revisedVote : initialOutputs.BALTHASAR.initialVote,
    CASPAR: deliberationOutputs ? deliberationOutputs.CASPAR.revisedVote : initialOutputs.CASPAR.initialVote,
  };

  const voteCounts = {
    APPROVAL: Object.values(votes).filter(v => v === 'APPROVAL').length,
    DENIED: Object.values(votes).filter(v => v === 'DENIED').length,
    CONDITIONAL: Object.values(votes).filter(v => v === 'CONDITIONAL').length,
  };

  const summaryOfDeliberation = (['MELCHIOR', 'BALTHASAR', 'CASPAR'] as MagiId[]).map(id => {
    const p = settings.personalities[id];
    const init = initialOutputs[id];
    const delib = deliberationOutputs ? deliberationOutputs[id] : null;
    return `### ${p.name} (${p.role})
- 初案判定: ${init.initialVote}
- 初案根拠: ${init.reasoning}
${delib ? `- 熟議後判定: ${delib.revisedVote}\n- 熟議論点: ${delib.refinements}\n- 最終主張: ${delib.finalArgument}` : ''}`;
  }).join('\n\n');

  const synthesizerMessages = [
    { role: 'system' as const, content: SYSTEM_CONSENSUS_PROMPT },
    {
      role: 'user' as const,
      content: `【議題】
${query}

【各MAGIの個別決議と熟議内容】
${summaryOfDeliberation}

【集計結果】
APPROVAL: ${voteCounts.APPROVAL}, DENIED: ${voteCounts.DENIED}, CONDITIONAL: ${voteCounts.CONDITIONAL}

上記のデータを統合し、指定されたJSON構造で最高精度の最終決議レポートを出力してください。`
    }
  ];

  try {
    const rawRes = await sendChatCompletion(settings, synthesizerMessages, settings.defaultModel);
    const parsed = extractJsonFromResponse<Partial<ConsensusResult>>(rawRes, {});

    let finalDecision: DecisionVote | 'SPLIT_DECISION' = 'CONDITIONAL';
    if (voteCounts.APPROVAL >= 2) finalDecision = 'APPROVAL';
    else if (voteCounts.DENIED >= 2) finalDecision = 'DENIED';
    else if (voteCounts.APPROVAL === 1 && voteCounts.DENIED === 1 && voteCounts.CONDITIONAL === 1) finalDecision = 'SPLIT_DECISION';
    else if (voteCounts.CONDITIONAL >= 2) finalDecision = 'CONDITIONAL';

    const consensusResult: ConsensusResult = {
      finalDecision: parsed.finalDecision || finalDecision,
      voteCounts: parsed.voteCounts || voteCounts,
      executiveSummary: parsed.executiveSummary || '決議の要約が作成されました。',
      synthesisDetails: parsed.synthesisDetails || rawRes,
      keyDisagreements: parsed.keyDisagreements || [],
      actionableRecommendation: parsed.actionableRecommendation || '状況に応じた対応を推奨します。',
      rawSynthesis: rawRes
    };

    callbacks.onLog({
      source: 'MAGI_CORE',
      phase: 'CODE: 601 - JUDGMENT RENDERED',
      text: `MAGI 決議完了: 【${consensusResult.finalDecision}】 (APPROVAL:${voteCounts.APPROVAL} DENIED:${voteCounts.DENIED} CONDITIONAL:${voteCounts.CONDITIONAL})`,
      type: consensusResult.finalDecision === 'APPROVAL' ? 'success' : 'warn'
    });

    return consensusResult;
  } catch (err: any) {
    callbacks.onLog({
      source: 'MAGI_CORE',
      phase: 'ERROR',
      text: `最終決議生成エラー: ${err.message}`,
      type: 'warn'
    });

    return {
      finalDecision: voteCounts.APPROVAL >= 2 ? 'APPROVAL' : voteCounts.DENIED >= 2 ? 'DENIED' : 'CONDITIONAL',
      voteCounts,
      executiveSummary: 'MAGIシステム統合処理中に通信障害が発生しましたが、個別得票率により自動決定されました。',
      synthesisDetails: '自動統合結果',
      keyDisagreements: [],
      actionableRecommendation: '通信状態を確認の上、必要に応じて再熟議を行ってください。',
      rawSynthesis: ''
    };
  }
}
