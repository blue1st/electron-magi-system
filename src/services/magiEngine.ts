import {
  Settings,
  MagiId,
  MagiInitialOutput,
  MagiDeliberationOutput,
  ConsensusResult,
  ProtocolLog,
  DecisionVote,
  DeliberationMode,
  OpinionShift
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
  attachedDoc?: FetchedDocument,
  deliberationId: string = `SESSION-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  parentConsensusSummary?: string
): Promise<Record<MagiId, MagiInitialOutput>> {
  const magiIds: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];
  const results: Partial<Record<MagiId, MagiInitialOutput>> = {};

  magiIds.forEach(id => callbacks.onMagiStatusChange(id, 'THINKING'));

  const docContext = attachedDoc
    ? `\n\n【参照外部ドキュメント / 参考資料】\nタイトル: ${attachedDoc.title}\nURL: ${attachedDoc.url}\n本文本文:\n${attachedDoc.content}\n`
    : '';

  const parentContext = parentConsensusSummary
    ? `\n\n【前提知識 / 直前の合議結果 (継続審議コンテキスト)】\n${parentConsensusSummary}\n`
    : '';

  const promises = magiIds.map(async (id) => {
    const personality = settings.personalities[id];
    const fullSystemPrompt = buildFullSystemPrompt(personality);

    const unitSessionId = `${deliberationId}-${id}-P1`;

    callbacks.onLog({
      source: id,
      phase: 'CODE: 39 - INITIAL ANALYSIS',
      text: `${personality.name} 独立可否分析プロトコル開始 (SESSION: ${unitSessionId})...${parentConsensusSummary ? ' (継続審議コンテキスト適用中)' : ''}${attachedDoc ? ' (参照ドキュメント解析中)' : ''}`,
      type: 'info'
    });

    const sessionIsolationDirective = parentConsensusSummary
      ? `\n\n【継続審議プロトコル指示 / UNIT_SESSION_ID: ${unitSessionId}】\n- 本セッションは【${personality.name}】による継続審議プロセスです。\n- 下記提示の【前提知識 / 直前の合議結果】を踏まえた上で、今回の追加議題に対して分析を行ってください。`
      : `\n\n【セッション隔離指示 / UNIT_SESSION_ID: ${unitSessionId}】\n- 本セッションは【${personality.name}】専用の完全独立アナリシスプロセス (SESSION: ${unitSessionId}) です。\n- 過去のセッションの記憶や他ユニットのコンテキスト、プロンプトキャッシュは完全に無効化・遮断されています。\n- 以下の【本リクエストの検討議題】および添付の【参照外部ドキュメント】のみに100%集中して独立分析を行ってください。`;

    const messages = [
      { role: 'system' as const, content: `${fullSystemPrompt}${sessionIsolationDirective}` },
      { role: 'user' as const, content: `【本リクエストの検討議題】\n${query}${parentContext}${docContext}\n\n上記の【本リクエストの検討議題】、前提知識および添付ドキュメントに集中して分析してください。指定のJSON形式で回答してください。` }
    ];

    try {
      const rawRes = await sendChatCompletion(settings, messages, personality.modelOverride);
      const parsed = extractJsonFromResponse<{ vote?: DecisionVote; stanceLabel?: string; reasoning?: string; conditions?: string }>(rawRes, {
        vote: 'CONDITIONAL',
        stanceLabel: '',
        reasoning: rawRes,
        conditions: ''
      });

      const vote: DecisionVote = parsed.vote || 'CONDITIONAL';
      const output: MagiInitialOutput = {
        magiId: id,
        reasoning: parsed.reasoning || rawRes,
        initialVote: vote,
        stanceLabel: parsed.stanceLabel || (vote === 'APPROVAL' ? '可決' : vote === 'DENIED' ? '否決' : '条件付可決'),
        conditions: parsed.conditions,
        rawResponse: rawRes
      };

      results[id] = output;
      callbacks.onMagiStatusChange(id, 'DONE');
      callbacks.onLog({
        source: id,
        phase: 'CODE: 39 - PROPOSAL COMPLETE',
        text: `【初案主張: ${output.stanceLabel} (${vote})】\n${output.reasoning}${output.conditions ? `\n\n【前提条件】:\n${output.conditions}` : ''}`,
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

// Phase 2: 相互熟議 (Cross Examination / Multi-Turn Debate)
export interface Phase2DebateResult {
  finalDeliberationOutputs: Record<MagiId, MagiDeliberationOutput>;
  allRounds: Array<Record<MagiId, MagiDeliberationOutput>>;
  opinionShifts: OpinionShift[];
}

export async function runPhase2Debate(
  query: string,
  initialOutputs: Record<MagiId, MagiInitialOutput>,
  settings: Settings,
  callbacks: MagiEngineCallbacks,
  attachedDoc?: FetchedDocument,
  deliberationId: string = `SESSION-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  parentConsensusSummary?: string,
  onRoundComplete?: (roundIndex: number, roundOutputs: Record<MagiId, MagiDeliberationOutput>, opinionShifts: OpinionShift[]) => void
): Promise<Phase2DebateResult> {
  const magiIds: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];
  const maxTurns = settings.maxDebateTurns && settings.maxDebateTurns >= 1 ? settings.maxDebateTurns : 2;

  const allRounds: Array<Record<MagiId, MagiDeliberationOutput>> = [];
  const opinionShifts: OpinionShift[] = [];

  let previousStances: Record<MagiId, { vote: DecisionVote; stanceLabel: string }> = {
    MELCHIOR: { vote: initialOutputs.MELCHIOR.initialVote, stanceLabel: initialOutputs.MELCHIOR.stanceLabel || initialOutputs.MELCHIOR.initialVote },
    BALTHASAR: { vote: initialOutputs.BALTHASAR.initialVote, stanceLabel: initialOutputs.BALTHASAR.stanceLabel || initialOutputs.BALTHASAR.initialVote },
    CASPAR: { vote: initialOutputs.CASPAR.initialVote, stanceLabel: initialOutputs.CASPAR.stanceLabel || initialOutputs.CASPAR.initialVote },
  };

  const docContext = attachedDoc
    ? `\n\n【参照外部ドキュメント / 参考資料】\nタイトル: ${attachedDoc.title}\nURL: ${attachedDoc.url}\n本文抜粋:\n${attachedDoc.content}\n`
    : '';

  const parentContext = parentConsensusSummary
    ? `\n\n【前提知識 / 直前の合議結果 (継続審議コンテキスト)】\n${parentConsensusSummary}\n`
    : '';

  for (let turn = 1; turn <= maxTurns; turn++) {
    magiIds.forEach(id => callbacks.onMagiStatusChange(id, 'THINKING'));

    const debateHistoryText = allRounds.map((round, rIdx) => {
      const roundNum = rIdx + 1;
      return `=== 熟議ラウンド ${roundNum} ===\n` + magiIds.map(id => {
        const p = settings.personalities[id];
        const out = round[id];
        return `■ ${p.name}: 立場 [${out.revisedStanceLabel || out.revisedVote} (${out.revisedVote})]
【反論・補足】: ${out.refinements}
【根拠】: ${out.finalArgument}${out.shiftReason ? `\n【変節理由】: ${out.shiftReason}` : ''}`;
      }).join('\n');
    }).join('\n\n');

    const initialSummary = magiIds.map(id => {
      const p = settings.personalities[id];
      const out = initialOutputs[id];
      return `■ ${p.name} (${p.role}):
【初案主張】: ${out.stanceLabel || out.initialVote} (${out.initialVote})
【分析根拠】: ${out.reasoning}
${out.conditions ? `【提示条件】: ${out.conditions}` : ''}`;
    }).join('\n\n');

    const currentRoundOutputs: Partial<Record<MagiId, MagiDeliberationOutput>> = {};

    const promises = magiIds.map(async (id) => {
      const personality = settings.personalities[id];
      const unitSessionId = `${deliberationId}-${id}-P2-T${turn}`;

      callbacks.onLog({
        source: id,
        phase: `CODE: 407 - DELIBERATION ROUND ${turn}/${maxTurns}`,
        text: `${personality.name} 第${turn}ターン熟議プロトコル開始 (SESSION: ${unitSessionId})...`,
        type: 'info'
      });

      const fullSystemPrompt = buildFullSystemPrompt(personality);
      const sessionIsolationDirective = parentConsensusSummary
        ? `\n\n【継続審議プロトコル指示 / UNIT_SESSION_ID: ${unitSessionId}】\n- 本熟議は【${personality.name}】による継続審議（第${turn}/${maxTurns}ターン）です。\n- 過去のターンでの各ユニットの意見の推移を踏まえてさらに深い議論を行ってください。`
        : `\n\n【セッション隔離指示 / UNIT_SESSION_ID: ${unitSessionId}】\n- 本熟議は【${personality.name}】専用の第${turn}/${maxTurns}ターン独立熟議プロセスです。`;

      const historySection = debateHistoryText
        ? `\n\n【これまでの熟議履歴 (前ターンまでの議論)】\n${debateHistoryText}`
        : '';

      const debatePrompt = `【議題】
${query}${parentContext}${docContext}

【全MAGIユニットの第1次分析結果】
${initialSummary}${historySection}

【あなた (${personality.name} / ${personality.role}) への指令】
第${turn}/${maxTurns}ターンの熟議を行います。
議題、他MAGIの初案およびこれまでの熟議の変節プロセスを精査し、あなたの視点から以下について深く考察・反論・または意見の修正を行ってください：
1. 他のMAGIの指摘で納得・妥当と思える点、あるいは納得できず対立する点
2. 相互議論を経た現時点での【修正判定 (revisedVote)】および【修正主張ショートラベル (revisedStanceLabel)】
3. 前ターン（または初案）から立場や条件に変更があった場合、その理由 (shiftReason) と、特にどのMAGIの意見に影響を受けたか (influencedBy)
4. 最終的な判断理由

以下のJSON形式で回答してください：
{
  "revisedVote": "APPROVAL" | "DENIED" | "CONDITIONAL",
  "revisedStanceLabel": "あなたの立場・主張のショートラベル (15文字以内)",
  "refinements": "他のMAGIへの同意・反論・懸念・補足コメント",
  "finalArgument": "最終的な主張と判断根拠",
  "shiftReason": "前ターンから立場を変更・妥協・修正した場合はその理由（変更がない場合は空文字）",
  "influencedBy": ["MELCHIOR", "BALTHASAR", "CASPAR のうち影響を受けたユニット（なければ空配列）"]
}`;

      const messages = [
        { role: 'system' as const, content: `${fullSystemPrompt}${sessionIsolationDirective}` },
        { role: 'user' as const, content: debatePrompt }
      ];

      try {
        const rawRes = await sendChatCompletion(settings, messages, personality.modelOverride);
        const parsed = extractJsonFromResponse<{
          revisedVote?: DecisionVote;
          revisedStanceLabel?: string;
          refinements?: string;
          finalArgument?: string;
          shiftReason?: string;
          influencedBy?: MagiId[];
        }>(rawRes, {
          revisedVote: previousStances[id].vote,
          revisedStanceLabel: previousStances[id].stanceLabel,
          refinements: rawRes,
          finalArgument: rawRes,
          shiftReason: '',
          influencedBy: []
        });

        const vote: DecisionVote = parsed.revisedVote || previousStances[id].vote;
        const stanceLabel = parsed.revisedStanceLabel || previousStances[id].stanceLabel || (vote === 'APPROVAL' ? '可決' : vote === 'DENIED' ? '否決' : '条件付可決');

        const output: MagiDeliberationOutput = {
          magiId: id,
          roundIndex: turn,
          refinements: parsed.refinements || rawRes,
          revisedVote: vote,
          revisedStanceLabel: stanceLabel,
          finalArgument: parsed.finalArgument || rawRes,
          shiftReason: parsed.shiftReason,
          influencedBy: parsed.influencedBy,
          rawResponse: rawRes
        };

        currentRoundOutputs[id] = output;
        callbacks.onMagiStatusChange(id, 'DONE');

        const prev = previousStances[id];
        const hasShifted = prev.vote !== vote || prev.stanceLabel !== stanceLabel;

        if (hasShifted) {
          const shiftInfo: OpinionShift = {
            magiId: id,
            turn,
            fromVote: prev.vote,
            toVote: vote,
            fromStanceLabel: prev.stanceLabel,
            toStanceLabel: stanceLabel,
            hasShifted: true,
            reasonForShift: parsed.shiftReason || parsed.refinements || '議論を通じて立ち位置を修正',
            influencedBy: parsed.influencedBy
          };
          opinionShifts.push(shiftInfo);

          callbacks.onLog({
            source: id,
            phase: `CODE: 407 - OPINION SHIFT (TURN ${turn})`,
            text: `【見解変節】${personality.name} が主張を変更 [${prev.stanceLabel}] ➔ [${stanceLabel} (${vote})]\n理由: ${shiftInfo.reasonForShift}`,
            type: 'vote'
          });
        } else {
          callbacks.onLog({
            source: id,
            phase: `CODE: 407 - TURN ${turn} COMPLETE`,
            text: `【主張維持: ${stanceLabel} (${vote})】\n${output.refinements}`,
            type: vote === 'APPROVAL' ? 'success' : vote === 'DENIED' ? 'warn' : 'info'
          });
        }
      } catch (err: any) {
        callbacks.onMagiStatusChange(id, 'ERROR');
        currentRoundOutputs[id] = {
          magiId: id,
          roundIndex: turn,
          refinements: `熟議エラー: ${err.message}`,
          revisedVote: previousStances[id].vote,
          revisedStanceLabel: previousStances[id].stanceLabel,
          finalArgument: initialOutputs[id].reasoning,
          rawResponse: ''
        };
      }
    });

    await Promise.all(promises);

    const completeRoundOutputs = currentRoundOutputs as Record<MagiId, MagiDeliberationOutput>;
    allRounds.push(completeRoundOutputs);

    magiIds.forEach(id => {
      previousStances[id] = {
        vote: completeRoundOutputs[id].revisedVote,
        stanceLabel: completeRoundOutputs[id].revisedStanceLabel || completeRoundOutputs[id].revisedVote
      };
    });

    if (onRoundComplete) {
      onRoundComplete(turn, completeRoundOutputs, opinionShifts);
    }
  }

  const finalDeliberationOutputs = allRounds[allRounds.length - 1];
  return {
    finalDeliberationOutputs,
    allRounds,
    opinionShifts
  };
}

// Phase 3: 最終集計と合意統合
export async function runPhase3Consensus(
  query: string,
  initialOutputs: Record<MagiId, MagiInitialOutput>,
  deliberationOutputs: Record<MagiId, MagiDeliberationOutput> | undefined,
  settings: Settings,
  callbacks: MagiEngineCallbacks,
  deliberationId: string = `SESSION-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  activeMode: DeliberationMode = 'AUTO',
  parentConsensusSummary?: string,
  allRounds?: Array<Record<MagiId, MagiDeliberationOutput>>,
  extractedOpinionShifts?: OpinionShift[]
): Promise<ConsensusResult> {
  const coreSessionId = `${deliberationId}-CORE-P3`;

  callbacks.onLog({
    source: 'MAGI_CORE',
    phase: 'CODE: 601 - CONSENSUS SYNTHESIS',
    text: `MAGI SYSTEM 最終統合決議プロトコル起動 (SESSION: ${coreSessionId})...`,
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
- 初案主張: ${init.stanceLabel || init.initialVote} (${init.initialVote})
- 初案根拠: ${init.reasoning}
${delib ? `- 最終熟議後主張: ${delib.revisedStanceLabel || delib.revisedVote} (${delib.revisedVote})\n- 熟議論点: ${delib.refinements}\n- 最終主張: ${delib.finalArgument}${delib.shiftReason ? `\n- 変節理由: ${delib.shiftReason}` : ''}` : ''}`;
  }).join('\n\n');

  const turnsSummaryText = allRounds && allRounds.length > 0
    ? `\n\n【全熟議ターン数: ${allRounds.length}】\n` + allRounds.map((round, idx) => {
        return `[Turn ${idx + 1}] ` + (['MELCHIOR', 'BALTHASAR', 'CASPAR'] as MagiId[]).map(id => `${id}: ${round[id].revisedStanceLabel || round[id].revisedVote}`).join(' | ');
      }).join('\n')
    : '';

  const parentContext = parentConsensusSummary
    ? `\n\n【前提知識 / 直前の合議結果 (継続審議コンテキスト)】\n${parentConsensusSummary}\n`
    : '';

  const sessionIsolationDirective = parentConsensusSummary
    ? `\n\n【継続審議統合プロトコル指示 / UNIT_SESSION_ID: ${coreSessionId}】\n- 本統合決議は直前の合議を踏まえた継続審議プロセスです。\n- 上記【前提知識 / 直前の合議結果】を踏まえて最終統合レポートを作成してください。`
    : `\n\n【セッション隔離指示 / UNIT_SESSION_ID: ${coreSessionId}】\n- 本決議統合は完全独立プロセス (SESSION: ${coreSessionId}) 内で行われます。\n- 提示された【議題】および【各MAGIの個別決議と熟議内容】のみに基づいて最終統合レポートを作成してください。`;

  const synthesizerMessages = [
    { role: 'system' as const, content: `${SYSTEM_CONSENSUS_PROMPT}${sessionIsolationDirective}` },
    {
      role: 'user' as const,
      content: `【議題】
${query}${parentContext}

【各MAGIの個別決議と熟議内容】
${summaryOfDeliberation}${turnsSummaryText}

【集計結果】
APPROVAL: ${voteCounts.APPROVAL}, DENIED: ${voteCounts.DENIED}, CONDITIONAL: ${voteCounts.CONDITIONAL}

上記のデータを統合し、各ユニットの見解の変節（opinionShifts）や相互説得関係（persuasionLinks）も含めて指定されたJSON構造で最高精度の最終決議レポートを出力してください。`
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

    const opinionShiftsToUse = (extractedOpinionShifts && extractedOpinionShifts.length > 0)
      ? extractedOpinionShifts
      : (parsed.opinionShifts || []);

    const consensusResult: ConsensusResult = {
      mode: activeMode,
      finalDecision: parsed.finalDecision || finalDecision,
      finalStanceLabel: parsed.finalStanceLabel || (typeof parsed.finalDecision === 'string' ? parsed.finalDecision : finalDecision),
      voteCounts: parsed.voteCounts || voteCounts,
      executiveSummary: parsed.executiveSummary || '決議の要約が作成されました。',
      synthesisDetails: parsed.synthesisDetails || rawRes,
      keyDisagreements: parsed.keyDisagreements || [],
      actionableRecommendation: parsed.actionableRecommendation || '状況に応じた対応を推奨します。',
      opinionShifts: opinionShiftsToUse,
      persuasionLinks: parsed.persuasionLinks || [],
      rawSynthesis: rawRes
    };

    callbacks.onLog({
      source: 'MAGI_CORE',
      phase: 'CODE: 601 - JUDGMENT RENDERED',
      text: `MAGI 決議完了: 【${consensusResult.finalStanceLabel || consensusResult.finalDecision}】 (APPROVAL:${voteCounts.APPROVAL} DENIED:${voteCounts.DENIED} CONDITIONAL:${voteCounts.CONDITIONAL})${opinionShiftsToUse.length > 0 ? ` [見解変節 ${opinionShiftsToUse.length}件を検出]` : ''}`,
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
      mode: activeMode,
      finalDecision: voteCounts.APPROVAL >= 2 ? 'APPROVAL' : voteCounts.DENIED >= 2 ? 'DENIED' : 'CONDITIONAL',
      finalStanceLabel: voteCounts.APPROVAL >= 2 ? '可決' : voteCounts.DENIED >= 2 ? '否決' : '条件付可決',
      voteCounts,
      executiveSummary: 'MAGIシステム統合処理中に通信障害が発生しましたが、個別得票率により自動決定されました。',
      synthesisDetails: '自動統合結果',
      keyDisagreements: [],
      actionableRecommendation: '通信状態を確認の上、必要に応じて再熟議を行ってください。',
      opinionShifts: extractedOpinionShifts || [],
      persuasionLinks: [],
      rawSynthesis: ''
    };
  }
}
