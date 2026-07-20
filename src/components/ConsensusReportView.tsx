import React from 'react';
import { ConsensusResult } from '../types';
import { CheckCircle2, ShieldAlert, AlertTriangle, FileText, Check, ListChecks, RotateCcw, Download, RefreshCw } from 'lucide-react';

interface ConsensusReportViewProps {
  consensus: ConsensusResult;
  onStartFollowUp?: () => void;
  onExportMarkdown?: () => void;
}

export const ConsensusReportView: React.FC<ConsensusReportViewProps> = ({
  consensus,
  onStartFollowUp,
  onExportMarkdown,
}) => {
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
      <div className={`p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${header.bg}`}>
        <div className="flex items-center space-x-4">
          {header.icon}
          <div>
            <span className="text-xs font-mono-nerv uppercase tracking-widest text-slate-300">
              CODE: 601 • FINAL CONSENSUS {consensus.mode && consensus.mode !== 'AUTO' ? `[${consensus.mode} MODE]` : ''}
            </span>
            <h2 className="text-xl font-bold font-mono-nerv tracking-wide">{displayTitle}</h2>
          </div>
        </div>

        {/* Tally Stats & Export */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-nerv">
          {consensus.voteCounts && (
            <div className="flex items-center space-x-2">
              <div className="px-2.5 py-1 rounded bg-black/60 border border-magi-green/40 text-magi-green">
                APPROVAL: <span className="font-bold">{consensus.voteCounts.APPROVAL}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-black/60 border border-magi-red/40 text-magi-red">
                DENIED: <span className="font-bold">{consensus.voteCounts.DENIED}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-black/60 border border-magi-yellow/40 text-magi-yellow">
                CONDITIONAL: <span className="font-bold">{consensus.voteCounts.CONDITIONAL}</span>
              </div>
            </div>
          )}

          {onExportMarkdown && (
            <button
              onClick={onExportMarkdown}
              className="px-3 py-1.5 rounded bg-black/70 hover:bg-black text-slate-200 border border-slate-600 hover:border-magi-orange hover:text-magi-orange transition-all flex items-center space-x-1.5 text-xs font-bold"
              title="この合議レポートをMarkdownファイルとしてダウンロード"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT MD</span>
            </button>
          )}
        </div>
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

        {/* Stance Evolution & Persuasion Section */}
        {consensus.opinionShifts && consensus.opinionShifts.length > 0 && (
          <div>
            <h4 className="text-xs font-mono-nerv text-magi-cyan font-bold uppercase tracking-wider mb-2 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-magi-cyan animate-pulse" />
              <span>STANCE EVOLUTION & PERSUASION (見解の変節と説得プロセス)</span>
            </h4>
            <div className="p-4 rounded bg-black/60 border border-magi-cyan/30 space-y-3">
              <p className="text-xs text-slate-400 font-sans">
                熟議プロセスにおいて、以下のMAGIユニットが他ユニットの反論や視点を受け入れて立場・意見を変更しました：
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {consensus.opinionShifts.map((shift, idx) => (
                  <div key={idx} className="p-3 rounded bg-black/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono-nerv font-bold px-2 py-1 rounded bg-slate-800 text-white border border-slate-700">
                        {shift.magiId}
                      </span>
                      <div className="flex items-center space-x-2 font-mono-nerv">
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                          {shift.fromStanceLabel || shift.fromVote}
                        </span>
                        <span className="text-magi-cyan font-bold">➔</span>
                        <span className="px-2 py-0.5 rounded bg-magi-cyan/20 text-magi-cyan border border-magi-cyan/60 font-bold glow-cyan">
                          {shift.toStanceLabel || shift.toVote}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 text-slate-300 text-xs font-sans pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0">
                      <p><span className="text-slate-400 font-semibold">理由:</span> {shift.reasonForShift}</p>
                      {shift.influencedBy && shift.influencedBy.length > 0 && (
                        <div className="mt-1 flex items-center space-x-1 text-[11px] text-magi-yellow">
                          <span>💡 影響要因:</span>
                          <span className="font-bold">{shift.influencedBy.join(', ')} の指摘</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* Action Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            {onExportMarkdown && (
              <button
                onClick={onExportMarkdown}
                className="px-3.5 py-2 rounded bg-black/50 text-slate-300 border border-slate-700 hover:border-magi-orange hover:text-magi-orange font-mono-nerv text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>レポートをMarkdown出力</span>
              </button>
            )}
          </div>

          {onStartFollowUp && (
            <button
              onClick={onStartFollowUp}
              className="px-4 py-2.5 rounded bg-magi-orange/15 border border-magi-orange/60 text-magi-orange hover:bg-magi-orange/25 font-mono-nerv text-xs font-bold transition-all glow-orange flex items-center space-x-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>この合議結果を踏まえて追加審議（継続質問）</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
