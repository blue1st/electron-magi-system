import { FetchedDocument } from '../services/docFetcher';

export type MagiId = 'MELCHIOR' | 'BALTHASAR' | 'CASPAR';

export type DecisionVote = 'APPROVAL' | 'DENIED' | 'CONDITIONAL';

export type DeliberationMode = 'AUTO' | 'DECISION' | 'COMPARISON' | 'STRATEGY';

export interface MagiPersonality {
  id: MagiId;
  name: string;
  code: string;
  role: string;
  color: string; // Hex color code
  personaMode?: 'TEMPLATE' | 'CUSTOM'; // TEMPLATE: Auto-inject JSON rules + editable persona, CUSTOM: Raw system prompt
  personaDescription: string; // Persona & role guidance text
  systemPrompt: string; // Compiled or custom raw system prompt
  modelOverride?: string; // Optional per-MAGI model override
}

export interface Settings {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  enableDeliberation: boolean; // false = Fast Mode (Single Phase), true = Deliberation Mode (3-Phase)
  maxDebateTurns?: number; // 熟議ターン数 (デフォルト: 2)
  soundEffects: boolean;
  personalities: Record<MagiId, MagiPersonality>;
}

export interface MagiInitialOutput {
  magiId: MagiId;
  reasoning: string;
  initialVote: DecisionVote;
  stanceLabel?: string; // Flexible stance label e.g. "React (推奨)" or "技術刷新案"
  conditions?: string;
  rawResponse: string;
}

export interface MagiDeliberationOutput {
  magiId: MagiId;
  roundIndex?: number; // 何ラウンド目の熟議か (1-indexed)
  refinements: string; // Comments on other MAGIs' points
  revisedVote: DecisionVote;
  revisedStanceLabel?: string;
  finalArgument: string;
  shiftReason?: string; // 前ターンからの立場変更の理由（もし変更があれば）
  influencedBy?: MagiId[]; // 説得に寄与した他のMAGI
  rawResponse: string;
}

export interface OpinionShift {
  magiId: MagiId;
  turn?: number; // どのターンで発生したか
  fromVote: DecisionVote;
  toVote: DecisionVote;
  fromStanceLabel?: string;
  toStanceLabel?: string;
  hasShifted: boolean;
  reasonForShift: string;
  influencedBy?: MagiId[];
}

export interface PersuasionLink {
  fromMagi: MagiId;
  toMagi: MagiId;
  type: 'PERSUADE' | 'CRITICISE' | 'AGREE';
  summary: string;
}

export interface ConsensusResult {
  mode: DeliberationMode;
  finalDecision: DecisionVote | 'SPLIT_DECISION' | string;
  finalStanceLabel?: string;
  voteCounts?: {
    APPROVAL: number;
    DENIED: number;
    CONDITIONAL: number;
  };
  executiveSummary: string;
  synthesisDetails: string;
  keyDisagreements: string[];
  actionableRecommendation: string;
  opinionShifts?: OpinionShift[];
  persuasionLinks?: PersuasionLink[];
  rawSynthesis: string;
}

export type DeliberationStep = 'IDLE' | 'PHASE_1_INITIAL' | 'PHASE_2_DEBATE' | 'PHASE_3_CONSENSUS' | 'COMPLETED' | 'ERROR';

export interface DeliberationState {
  step: DeliberationStep;
  mode: DeliberationMode;
  resolvedMode?: 'DECISION' | 'COMPARISON' | 'STRATEGY';
  query: string;
  attachedDoc?: FetchedDocument;
  activeMagiStatus: Record<MagiId, 'IDLE' | 'THINKING' | 'DONE' | 'ERROR'>;
  initialOutputs: Partial<Record<MagiId, MagiInitialOutput>>;
  deliberationOutputs: Partial<Record<MagiId, MagiDeliberationOutput>>;
  deliberationRounds?: Array<Record<MagiId, MagiDeliberationOutput>>; // ラウンドごとの熟議結果
  currentTurn?: number;
  maxTurns?: number;
  consensus?: ConsensusResult;
  error?: string;
  parentSessionId?: string;
  parentConsensusSummary?: string;
}

export interface DeliberationSession {
  id: string;
  timestamp: string;
  query: string;
  mode: DeliberationMode;
  attachedDoc?: FetchedDocument;
  initialOutputs: Partial<Record<MagiId, MagiInitialOutput>>;
  deliberationOutputs: Partial<Record<MagiId, MagiDeliberationOutput>>;
  deliberationRounds?: Array<Record<MagiId, MagiDeliberationOutput>>;
  consensus: ConsensusResult;
  logs: ProtocolLog[];
  parentSessionId?: string;
  parentConsensusSummary?: string;
}

export interface ProtocolLog {
  id: string;
  timestamp: string;
  source: MagiId | 'SYSTEM' | 'MAGI_CORE';
  phase: string;
  text: string;
  type: 'info' | 'vote' | 'warn' | 'success';
}
