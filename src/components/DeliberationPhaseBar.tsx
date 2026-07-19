import React from 'react';
import { DeliberationStep } from '../types';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface DeliberationPhaseBarProps {
  step: DeliberationStep;
  enableDeliberation: boolean;
}

export const DeliberationPhaseBar: React.FC<DeliberationPhaseBarProps> = ({
  step,
  enableDeliberation
}) => {
  if (step === 'IDLE') return null;

  const phases = [
    {
      key: 'PHASE_1_INITIAL',
      code: 'PHASE 1',
      title: '独立分析 (INITIAL ANALYSIS)',
      desc: '3ユニット個別の初案構築'
    },
    ...(enableDeliberation ? [{
      key: 'PHASE_2_DEBATE',
      code: 'PHASE 2',
      title: '相互熟議 (CROSS DEBATE)',
      desc: '他者提案への反論・検証'
    }] : []),
    {
      key: 'PHASE_3_CONSENSUS',
      code: 'PHASE 3',
      title: '最終合議 (SYNTHESIS & VOTE)',
      desc: '判定可決と統合レポート生成'
    }
  ];

  const getStepIndex = (currentStep: DeliberationStep) => {
    switch (currentStep) {
      case 'PHASE_1_INITIAL': return 0;
      case 'PHASE_2_DEBATE': return enableDeliberation ? 1 : 0;
      case 'PHASE_3_CONSENSUS': return enableDeliberation ? 2 : 1;
      case 'COMPLETED': return 99;
      default: return -1;
    }
  };

  const currentIndex = getStepIndex(step);

  return (
    <div className="w-full bg-black/60 border-b border-magi-orange/20 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {phases.map((p, idx) => {
          const isDone = currentIndex > idx || step === 'COMPLETED';
          const isCurrent = currentIndex === idx;

          return (
            <React.Fragment key={p.key}>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center font-mono-nerv text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-magi-green/20 text-magi-green border border-magi-green'
                      : isCurrent
                      ? 'bg-magi-orange/20 text-magi-orange border border-magi-orange animate-magi-pulse glow-orange'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> : idx + 1}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono-nerv text-magi-orange font-bold uppercase tracking-wider">{p.code}</span>
                    <span className={`text-xs font-mono-nerv font-bold ${isCurrent ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                      {p.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono-nerv">{p.desc}</p>
                </div>
              </div>

              {idx < phases.length - 1 && (
                <ArrowRight className={`w-4 h-4 hidden sm:block ${isDone ? 'text-magi-green' : 'text-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
