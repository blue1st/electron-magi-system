import React from 'react';
import { ConsensusResult } from '../types';
import { CheckCircle2, ShieldAlert, AlertTriangle, FileText, Check, ListChecks } from 'lucide-react';

interface ConsensusReportViewProps {
  consensus: ConsensusResult;
}

export const ConsensusReportView: React.FC<ConsensusReportViewProps> = ({ consensus }) => {
  const getDecisionHeader = () => {
    switch (consensus.finalDecision) {
      case 'APPROVAL':
        return {
          title: 'MAGI SYSTEM JUDGMENT: APPROVED (全会/多数可決)',
          bg: 'bg-magi-green/10 border-magi-green/50 text-magi-green glow-green',
          icon: <CheckCircle2 className="w-8 h-8 text-magi-green" />
        };
      case 'DENIED':
        return {
          title: 'MAGI SYSTEM JUDGMENT: REJECTED (否決)',
          bg: 'bg-magi-red/10 border-magi-red/50 text-magi-red glow-red',
          icon: <ShieldAlert className="w-8 h-8 text-magi-red" />
        };
      case 'SPLIT_DECISION':
        return {
          title: 'MAGI SYSTEM JUDGMENT: SPLIT DECISION (三者対立/決裂)',
          bg: 'bg-magi-orange/10 border-magi-orange/50 text-magi-orange glow-orange',
          icon: <AlertTriangle className="w-8 h-8 text-magi-orange" />
        };
      case 'CONDITIONAL':
      default:
        return {
          title: 'MAGI SYSTEM JUDGMENT: CONDITIONAL APPROVAL (条件付可決)',
          bg: 'bg-magi-yellow/10 border-magi-yellow/50 text-magi-yellow',
          icon: <AlertTriangle className="w-8 h-8 text-magi-yellow" />
        };
    }
  };

  const header = getDecisionHeader();
  const displayTitle = consensus.finalStanceLabel 
    ? `MAGI SYSTEM JUDGMENT: ${consensus.finalStanceLabel.toUpperCase()}`
    : header.title;

  return (
    <div className="w-full my-6 bg-magi-card/90 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      {/* Header Banner */}
      <div className={`p-6 border-b flex items-center justify-between ${header.bg}`}>
        <div className="flex items-center space-x-4">
          {header.icon}
          <div>
            <span className="text-xs font-mono-nerv uppercase tracking-widest text-slate-300">
              CODE: 601 • FINAL CONSENSUS {consensus.mode && consensus.mode !== 'AUTO' ? `[${consensus.mode} MODE]` : ''}
            </span>
            <h2 className="text-xl font-bold font-mono-nerv tracking-wide">{displayTitle}</h2>
          </div>
        </div>

        {/* Tally Stats */}
        {consensus.voteCounts && (
          <div className="flex items-center space-x-3 text-xs font-mono-nerv">
            <div className="px-3 py-1.5 rounded bg-black/60 border border-magi-green/40 text-magi-green">
              APPROVAL: <span className="font-bold">{consensus.voteCounts.APPROVAL}</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-black/60 border border-magi-red/40 text-magi-red">
              DENIED: <span className="font-bold">{consensus.voteCounts.DENIED}</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-black/60 border border-magi-yellow/40 text-magi-yellow">
              CONDITIONAL: <span className="font-bold">{consensus.voteCounts.CONDITIONAL}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="text-xs font-mono-nerv text-magi-orange font-bold uppercase tracking-wider mb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>EXECUTIVE SUMMARY (最終統括要約)</span>
          </h4>
          <div className="p-4 rounded bg-black/50 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {consensus.executiveSummary}
          </div>
        </div>

        {/* Synthesis Details */}
        <div>
          <h4 className="text-xs font-mono-nerv text-magi-cyan font-bold uppercase tracking-wider mb-2 flex items-center space-x-2">
            <ListChecks className="w-4 h-4" />
            <span>CONSENSUS & DELIBERATION SYNTHESIS (熟議統合詳細)</span>
          </h4>
          <div className="p-4 rounded bg-black/50 border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {consensus.synthesisDetails}
          </div>
        </div>

        {/* Disagreements if any */}
        {consensus.keyDisagreements && consensus.keyDisagreements.length > 0 && (
          <div>
            <h4 className="text-xs font-mono-nerv text-magi-red font-bold uppercase tracking-wider mb-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>KEY DISAGREEMENTS & RISKS (主な論点・リスク)</span>
            </h4>
            <ul className="space-y-1.5 p-4 rounded bg-black/50 border border-magi-red/20 text-slate-300 text-sm font-sans">
              {consensus.keyDisagreements.map((dis, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-magi-red font-bold">•</span>
                  <span>{dis}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable Recommendation */}
        <div>
          <h4 className="text-xs font-mono-nerv text-magi-green font-bold uppercase tracking-wider mb-2 flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>ACTIONABLE RECOMMENDATION (推進行動指針)</span>
          </h4>
          <div className="p-4 rounded bg-magi-green/5 border border-magi-green/30 text-slate-100 text-sm font-medium leading-relaxed">
            {consensus.actionableRecommendation}
          </div>
        </div>
      </div>
    </div>
  );
};
