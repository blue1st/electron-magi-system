import React from 'react';
import { Settings, MagiId, DeliberationState, DecisionVote } from '../types';
import { ArrowRight, GitCommit, Zap, MessageSquare, Cpu, Loader2, Sparkles } from 'lucide-react';

interface DeliberationFlowGraphProps {
  settings: Settings;
  state: DeliberationState;
}

export const DeliberationFlowGraph: React.FC<DeliberationFlowGraphProps> = ({ settings, state }) => {
  const magiIds: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];
  const shifts = state.consensus?.opinionShifts || [];
  const links = state.consensus?.persuasionLinks || [];

  const isDebatingNow = state.step === 'PHASE_2_DEBATE';
  const isCompleted = state.step === 'PHASE_3_CONSENSUS' || state.step === 'COMPLETED';

  const getVoteBadge = (vote: DecisionVote) => {
    switch (vote) {
      case 'APPROVAL':
        return (
          <span className="px-2 py-0.5 rounded bg-magi-green/20 text-magi-green border border-magi-green/60 text-[11px] font-mono-nerv font-bold">
            APPROVAL (可決)
          </span>
        );
      case 'DENIED':
        return (
          <span className="px-2 py-0.5 rounded bg-magi-red/20 text-magi-red border border-magi-red/60 text-[11px] font-mono-nerv font-bold">
            DENIED (否決)
          </span>
        );
      case 'CONDITIONAL':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-magi-yellow/20 text-magi-yellow border border-magi-yellow/60 text-[11px] font-mono-nerv font-bold">
            CONDITIONAL (条件付)
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-magi-card/90 border border-slate-700/80 rounded-lg p-6 my-6 shadow-xl space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Zap className={`w-5 h-5 ${isDebatingNow ? 'text-magi-orange animate-bounce' : 'text-magi-orange'}`} />
          <h3 className="text-sm font-bold font-mono-nerv text-white uppercase tracking-wider">
            DELIBERATION FLOW & PERSUASION DYNAMICS (熟議・意見変節 & 相互説得フロー)
          </h3>
        </div>
        <span className="text-[11px] font-mono-nerv text-slate-500">
          {isDebatingNow ? 'CODE: 407 IN PROGRESS...' : 'CODE: 407 COMPLETED'}
        </span>
      </div>

      {/* 1. Opinion Shift Timelines per MAGI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono-nerv text-magi-orange font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <GitCommit className="w-4 h-4" />
            <span>1. INDIVIDUAL OPINION EVOLUTION TIMELINE (各MAGIの判定変節プロセス)</span>
          </h4>
          {isDebatingNow && (
            <span className="text-[11px] font-mono-nerv text-magi-orange animate-pulse flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>現在相手の主張を吟味・反論中 (判定変化の可能性あり)</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {magiIds.map((id) => {
            const p = settings.personalities[id];
            const initVote = state.initialOutputs[id]?.initialVote || 'CONDITIONAL';
            const delibOutput = state.deliberationOutputs[id];
            const magiStatus = state.activeMagiStatus[id];
            const shiftData = shifts.find((s) => s.magiId === id);

            const isThisMagiThinking = magiStatus === 'THINKING';
            const hasShifted = isCompleted && (initVote !== delibOutput?.revisedVote || shiftData?.hasShifted);

            return (
              <div
                key={id}
                className={`p-4 rounded-lg border bg-black/60 transition-all duration-300 ${
                  isThisMagiThinking
                    ? 'border-magi-orange shadow-lg glow-orange animate-magi-pulse bg-magi-orange/5'
                    : hasShifted
                    ? 'border-magi-orange/70 glow-orange bg-magi-orange/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* MAGI Header */}
                  <div className="flex items-center space-x-3 min-w-[200px]">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
                    />
                    <div>
                      <div className="font-mono-nerv font-bold text-xs text-white">{p.name}</div>
                      <div className="text-[10px] font-mono-nerv text-slate-400">{p.role}</div>
                    </div>
                  </div>

                  {/* Flow Steps (Phase 1 -> Phase 2) */}
                  <div className="flex-1 flex items-center justify-center space-x-3 bg-black/40 p-2.5 rounded border border-slate-800/80">
                    <div className="text-center">
                      <div className="text-[10px] font-mono-nerv text-slate-500 mb-1">PHASE 1 (初案)</div>
                      {getVoteBadge(initVote)}
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <ArrowRight
                        className={`w-4 h-4 ${
                          isThisMagiThinking
                            ? 'text-magi-orange animate-ping'
                            : hasShifted
                            ? 'text-magi-orange'
                            : 'text-slate-600'
                        }`}
                      />
                      {isThisMagiThinking ? (
                        <span className="text-[9px] font-mono-nerv font-bold text-magi-orange animate-pulse uppercase">
                          DEBATING
                        </span>
                      ) : hasShifted ? (
                        <span className="text-[9px] font-mono-nerv font-bold text-magi-orange uppercase tracking-tight">
                          SHIFTED!
                        </span>
                      ) : null}
                    </div>

                    {/* Phase 2 Badge Representation */}
                    <div className="text-center">
                      <div className="text-[10px] font-mono-nerv text-slate-500 mb-1">PHASE 2 (熟議後)</div>
                      {isThisMagiThinking || (isDebatingNow && !delibOutput) ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-magi-orange/20 text-magi-orange border border-magi-orange/60 text-[11px] font-mono-nerv font-bold animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>DEBATING...</span>
                        </div>
                      ) : delibOutput ? (
                        getVoteBadge(delibOutput.revisedVote)
                      ) : (
                        <span className="text-xs font-mono-nerv text-slate-600">WAITING...</span>
                      )}
                    </div>
                  </div>

                  {/* Shift Badge & Rationale Status */}
                  <div className="md:max-w-xs text-xs font-sans">
                    {isThisMagiThinking || (isDebatingNow && !delibOutput) ? (
                      <div className="p-2 rounded bg-magi-orange/10 border border-magi-orange/40 text-magi-orange flex items-center space-x-2">
                        <Cpu className="w-4 h-4 animate-spin shrink-0" />
                        <div>
                          <span className="font-mono-nerv font-bold text-[10px] block uppercase">
                            ⚡ 他ユニットの意見を検証中:
                          </span>
                          <p className="text-[11px] text-slate-300">説得や反論により立場が変化する可能性があります。</p>
                        </div>
                      </div>
                    ) : hasShifted ? (
                      <div className="p-2 rounded bg-magi-orange/10 border border-magi-orange/40 text-magi-orange">
                        <span className="font-mono-nerv font-bold text-[10px] block mb-0.5 uppercase">
                          ⚡ 熟議による説得・意見変化:
                        </span>
                        <p className="text-[11px] leading-tight text-slate-200">
                          {shiftData?.reasonForShift || delibOutput?.refinements.slice(0, 80) || '他マギの説得を受け入れ判定を変更。'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono-nerv text-[11px]">
                        {isCompleted ? '立場維持 (PERSISTED IN INITIAL POSITION)' : '熟議結果反映完了 (PENDING FINAL CONSENSUS)'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Inter-MAGI Persuasion & Critique Vectors */}
      {links.length > 0 ? (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-mono-nerv text-magi-cyan font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>2. INTER-MAGI PERSUASION & CRITIQUE VECTORS (相互説得・反論マトリクス)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {links.map((link, idx) => {
              const fromP = settings.personalities[link.fromMagi];
              const toP = settings.personalities[link.toMagi];

              const isPersuade = link.type === 'PERSUADE';
              const isAgree = link.type === 'AGREE';

              const badgeColor = isAgree
                ? 'border-magi-green/50 text-magi-green bg-magi-green/10'
                : isPersuade
                ? 'border-magi-orange/50 text-magi-orange bg-magi-orange/10'
                : 'border-magi-red/50 text-magi-red bg-magi-red/10';

              return (
                <div key={idx} className="p-3 bg-black/60 border border-slate-800 rounded-lg text-xs font-mono-nerv space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <span style={{ color: fromP?.color }}>{fromP?.name.split('-')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span style={{ color: toP?.color }}>{toP?.name.split('-')[0]}</span>
                    </div>

                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${badgeColor}`}>
                      {link.type}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {link.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : isDebatingNow ? (
        <div className="p-4 bg-black/40 border border-dashed border-slate-800 rounded text-center">
          <div className="flex items-center justify-center space-x-2 text-xs font-mono-nerv text-magi-orange">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>INTER-MAGI DEBATE IN PROGRESS (ユニット間で相互議論・説得を送信中...)</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
