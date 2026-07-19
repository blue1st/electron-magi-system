import React from 'react';
import { Settings, MagiId, DeliberationState, DecisionVote } from '../types';
import { Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

interface MagiTriadViewProps {
  settings: Settings;
  state: DeliberationState;
}

export const MagiTriadView: React.FC<MagiTriadViewProps> = ({ settings, state }) => {
  const magiOrder: MagiId[] = ['MELCHIOR', 'BALTHASAR', 'CASPAR'];

  const getVoteBadge = (vote?: DecisionVote) => {
    if (!vote) return null;
    switch (vote) {
      case 'APPROVAL':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-mono-nerv px-2 py-0.5 rounded bg-magi-green/20 text-magi-green border border-magi-green/60 glow-green">
            <CheckCircle2 className="w-3 h-3" />
            <span>APPROVAL (可決)</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-mono-nerv px-2 py-0.5 rounded bg-magi-red/20 text-magi-red border border-magi-red/60 glow-red">
            <ShieldAlert className="w-3 h-3" />
            <span>DENIED (否決)</span>
          </span>
        );
      case 'CONDITIONAL':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-mono-nerv px-2 py-0.5 rounded bg-magi-yellow/20 text-magi-yellow border border-magi-yellow/60">
            <AlertTriangle className="w-3 h-3" />
            <span>CONDITIONAL (保留/条件可決)</span>
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

        const isThinking = status === 'THINKING';
        const isDone = status === 'DONE';
        const isError = status === 'ERROR';

        const currentVote = delibOutput?.revisedVote || initOutput?.initialVote;

        return (
          <div
            key={id}
            className={`relative flex flex-col rounded-lg border bg-magi-card/90 transition-all duration-300 overflow-hidden ${
              isThinking
                ? 'border-magi-orange shadow-lg glow-orange animate-magi-pulse'
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
              <span className="text-[10px] font-mono-nerv px-1.5 py-0.5 rounded bg-black/50 text-slate-300 border border-slate-700">
                {personality.role}
              </span>
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
                  getVoteBadge(currentVote)
                ) : (
                  <span className="text-xs font-mono-nerv text-slate-500">STANDBY</span>
                )}
              </div>

              {/* Content Body */}
              {initOutput ? (
                <div className="space-y-4 text-xs">
                  {/* Initial Analysis */}
                  <div className="bg-black/40 p-3 rounded border border-slate-800/80">
                    <div className="flex items-center space-x-1 text-[11px] font-mono-nerv text-magi-orange mb-1 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>1st Phase: 独立理由</span>
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

                  {/* Phase 2 Debate Refinement if present */}
                  {delibOutput && (
                    <div className="bg-black/60 p-3 rounded border border-slate-700/80">
                      <div className="flex items-center space-x-1 text-[11px] font-mono-nerv text-magi-cyan mb-1 font-semibold">
                        <MessageSquare className="w-3 h-3" />
                        <span>2nd Phase: 熟議・反論コメント</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {delibOutput.refinements}
                      </p>
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
