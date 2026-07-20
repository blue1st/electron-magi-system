import React from 'react';
import { Settings, MagiId, DeliberationState, DecisionVote } from '../types';
import { Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, MessageSquare, RefreshCw, ArrowRight } from 'lucide-react';

interface MagiTriadViewProps {
  settings: Settings;
  state: DeliberationState;
}

export const MagiTriadView: React.FC<MagiTriadViewProps> = ({ settings, state }) => {
  const magiOrder: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];

  const getVoteBadge = (vote?: DecisionVote, stanceLabel?: string) => {
    if (!vote) return null;
    const labelText = stanceLabel ? `${stanceLabel}` : vote === 'APPROVAL' ? 'APPROVAL (可決)' : vote === 'DENIED' ? 'DENIED (否決)' : 'CONDITIONAL (条件可決)';
    switch (vote) {
      case 'APPROVAL':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-mono-nerv px-2 py-0.5 rounded bg-magi-green/20 text-magi-green border border-magi-green/60 glow-green">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[200px]">{labelText}</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-mono-nerv px-2 py-0.5 rounded bg-magi-red/20 text-magi-red border border-magi-red/60 glow-red">
            <ShieldAlert className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[200px]">{labelText}</span>
          </span>
        );
      case 'CONDITIONAL':
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-mono-nerv px-2 py-0.5 rounded bg-magi-yellow/20 text-magi-yellow border border-magi-yellow/60">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[200px]">{labelText}</span>
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
      {magiOrder.map((id) => {
        const personality = settings.personalities[id];
        const status = state.activeMagiStatus[id];
        const initOutput = state.initialOutputs[id];
        const delibOutput = state.deliberationOutputs[id];
        const rounds = state.deliberationRounds || [];

        const isThinking = status === 'THINKING';
        const isDone = status === 'DONE';

        const currentVote = delibOutput?.revisedVote || initOutput?.initialVote;

        // 立場変節の判定 (初案から判定や主張が変わったか)
        const initialVote = initOutput?.initialVote;
        const initialStance = initOutput?.stanceLabel;
        const finalVote = delibOutput?.revisedVote;
        const finalStance = delibOutput?.revisedStanceLabel;

        const hasShifted = Boolean(
          delibOutput &&
          (initialVote !== finalVote || (initialStance && finalStance && initialStance !== finalStance))
        );

        // 立場推移履歴の作成
        const stanceHistory: Array<{ label: string; vote: DecisionVote; stepName: string }> = [];
        if (initOutput) {
          stanceHistory.push({
            stepName: '初案',
            vote: initOutput.initialVote,
            label: initOutput.stanceLabel || initOutput.initialVote
          });
        }
        if (rounds.length > 0) {
          rounds.forEach((round, rIdx) => {
            const rOutput = round[id];
            if (rOutput) {
              stanceHistory.push({
                stepName: `T${rIdx + 1}`,
                vote: rOutput.revisedVote,
                label: rOutput.revisedStanceLabel || rOutput.revisedVote
              });
            }
          });
        } else if (delibOutput) {
          stanceHistory.push({
            stepName: '熟議',
            vote: delibOutput.revisedVote,
            label: delibOutput.revisedStanceLabel || delibOutput.revisedVote
          });
        }

        return (
          <div
            key={id}
            className={`relative flex flex-col rounded-lg border bg-magi-card/90 transition-all duration-300 overflow-hidden ${
              isThinking
                ? 'border-magi-orange shadow-lg glow-orange animate-magi-pulse'
                : hasShifted
                ? 'border-magi-cyan/70 shadow-lg glow-cyan'
                : isDone
                ? 'border-slate-700 hover:border-magi-orange/50'
                : 'border-slate-800 opacity-80'
            }`}
          >
            {/* Header / Title Bar */}
            <div
              className="px-4 py-3 border-b border-slate-800 flex items-center justify-between"
              style={{ backgroundColor: `${personality.color}15` }}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: personality.color, boxShadow: `0 0 8px ${personality.color}` }}
                />
                <h3 className="font-mono-nerv font-bold text-sm text-white tracking-wider">
                  {personality.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {hasShifted && (
                  <span className="text-[10px] font-mono-nerv font-bold px-2 py-0.5 rounded bg-magi-cyan/20 border border-magi-cyan text-magi-cyan flex items-center space-x-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>変節 (SHIFTED)</span>
                  </span>
                )}
                <span className="text-[10px] font-mono-nerv px-1.5 py-0.5 rounded bg-black/50 text-slate-300 border border-slate-700">
                  {personality.role}
                </span>
              </div>
            </div>

            {/* Status & Decision Banner */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3 min-h-[28px]">
                {isThinking ? (
                  <div className="flex items-center space-x-2 text-magi-orange text-xs font-mono-nerv">
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>ANALYZING QUERY...</span>
                  </div>
                ) : currentVote ? (
                  getVoteBadge(currentVote, delibOutput?.revisedStanceLabel || initOutput?.stanceLabel)
                ) : (
                  <span className="text-xs font-mono-nerv text-slate-500">STANDBY</span>
                )}
              </div>

              {/* 立場推移ステッパー (Stance Tracker) */}
              {stanceHistory.length > 1 && (
                <div className="mb-4 p-2.5 rounded bg-black/60 border border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[11px] font-mono-nerv">
                  <span className="text-slate-400 font-semibold shrink-0">推移:</span>
                  {stanceHistory.map((step, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                      <div className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap border ${
                        step.vote === 'APPROVAL'
                          ? 'bg-magi-green/10 border-magi-green/40 text-magi-green'
                          : step.vote === 'DENIED'
                          ? 'bg-magi-red/10 border-magi-red/40 text-magi-red'
                          : 'bg-magi-yellow/10 border-magi-yellow/40 text-magi-yellow'
                      }`}>
                        <span className="text-slate-400 mr-1">{step.stepName}:</span>
                        <span className="font-bold">{step.label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Content Body */}
              {initOutput ? (
                <div className="space-y-4 text-xs">
                  {/* Initial Analysis */}
                  <div className="bg-black/40 p-3 rounded border border-slate-800/80">
                    <div className="flex items-center space-x-1 text-[11px] font-mono-nerv text-magi-orange mb-1 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>1st Phase: 独立初案</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {initOutput.reasoning}
                    </p>
                    {initOutput.conditions && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 text-magi-yellow text-[11px]">
                        <span className="font-semibold">【条件】:</span> {initOutput.conditions}
                      </div>
                    )}
                  </div>

                  {/* Phase 2 Debate Refinements */}
                  {delibOutput && (
                    <div className="bg-black/60 p-3 rounded border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-[11px] font-mono-nerv text-magi-cyan font-semibold">
                          <MessageSquare className="w-3 h-3" />
                          <span>2nd Phase: 熟議・反論 {delibOutput.roundIndex ? `[Turn ${delibOutput.roundIndex}]` : ''}</span>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {delibOutput.refinements}
                      </p>

                      {/* 変節理由ハイライト */}
                      {delibOutput.shiftReason && (
                        <div className="mt-2 p-2 rounded bg-magi-cyan/10 border border-magi-cyan/40 text-magi-cyan text-[11px]">
                          <span className="font-bold flex items-center space-x-1 mb-0.5">
                            <RefreshCw className="w-3 h-3" />
                            <span>見解の変節理由:</span>
                          </span>
                          <p className="text-slate-200 leading-relaxed">{delibOutput.shiftReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-[140px] border border-dashed border-slate-800 rounded">
                  <p className="text-xs font-mono-nerv text-slate-600 text-center">
                    AWAITING AGENDA...
                  </p>
                </div>
              )}
            </div>

            {/* Footer Status Code */}
            <div className="px-4 py-1.5 bg-black/60 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono-nerv text-slate-500">
              <span>{personality.code}</span>
              <span>{isDone ? 'COMPLETE' : isThinking ? 'PROCESSING' : 'READY'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
