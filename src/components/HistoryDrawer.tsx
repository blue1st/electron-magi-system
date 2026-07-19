import React, { useState } from 'react';
import {
  X,
  History,
  Trash2,
  CornerDownRight,
  Eye,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitCommit,
  Layers,
  Zap,
  Download
} from 'lucide-react';
import { DeliberationSession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: DeliberationSession[];
  currentSessionId?: string;
  onSelectSession: (session: DeliberationSession) => void;
  onStartFollowUp: (session: DeliberationSession) => void;
  onExportMarkdown: (session: DeliberationSession) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onStartFollowUp,
  onExportMarkdown,
  onDeleteSession,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(
    (s) =>
      s.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.consensus?.executiveSummary &&
        s.consensus.executiveSummary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDecisionBadge = (session: DeliberationSession) => {
    const decision = session.consensus?.finalStanceLabel || session.consensus?.finalDecision;
    if (!decision) return null;

    if (decision === 'APPROVAL' || decision.includes('可決') || decision.includes('推奨')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono-nerv bg-magi-green/20 text-magi-green border border-magi-green/40">
          <CheckCircle2 className="w-3 h-3" />
          <span>{decision}</span>
        </span>
      );
    }
    if (decision === 'DENIED' || decision.includes('否決') || decision.includes('不可')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono-nerv bg-magi-red/20 text-magi-red border border-magi-red/40">
          <XCircle className="w-3 h-3" />
          <span>{decision}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono-nerv bg-magi-yellow/20 text-magi-yellow border border-magi-yellow/40">
        <AlertTriangle className="w-3 h-3" />
        <span>{decision}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-magi-card/95 border-l border-magi-orange/30 shadow-2xl flex flex-col backdrop-blur-md">
          {/* Drawer Header */}
          <div className="p-4 border-b border-magi-orange/30 flex items-center justify-between bg-black/40">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded border border-magi-orange/50 bg-magi-orange/10 text-magi-orange">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono-nerv tracking-wider text-white uppercase flex items-center space-x-2">
                  <span>DELIBERATION ARCHIVES</span>
                  <span className="text-[10px] bg-magi-orange/20 text-magi-orange border border-magi-orange/40 px-1.5 py-0.2 rounded">
                    {sessions.length} LOGS
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400 font-mono-nerv">
                  過去の合議履歴および継続審議ハブ
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Bulk Operations */}
          <div className="p-3 border-b border-slate-800/80 bg-black/20 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="議題または結論から検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/60 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-magi-orange/60"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {sessions.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (confirm('すべての合議履歴を削除しますか？この操作は取り消せません。')) {
                      onClearAll();
                    }
                  }}
                  className="text-[10px] font-mono-nerv text-slate-500 hover:text-magi-red transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>CLEAR ALL LOGS</span>
                </button>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-mono-nerv text-slate-500">
                  {searchTerm ? '一致する合議履歴が見つかりません' : '合議履歴はありません'}
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = session.id === currentSessionId;

                return (
                  <div
                    key={session.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-magi-orange/10 border-magi-orange/60 shadow-[0_0_15px_rgba(255,153,0,0.15)]'
                        : 'bg-black/40 border-slate-800 hover:border-slate-700 hover:bg-black/60'
                    }`}
                  >
                    {/* Header line: ID, mode, date */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-[10px] font-mono-nerv text-slate-400">
                        <span className="text-magi-orange font-bold">{session.id}</span>
                        <span>•</span>
                        <span>{session.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {session.parentSessionId && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-magi-cyan/20 border border-magi-cyan/40 text-magi-cyan text-[10px] font-mono-nerv flex items-center space-x-1"
                            title={`親合議 (SESSION: ${session.parentSessionId}) からの継続審議`}
                          >
                            <GitCommit className="w-2.5 h-2.5" />
                            <span>継続審議</span>
                          </span>
                        )}
                        {getDecisionBadge(session)}
                      </div>
                    </div>

                    {/* Query */}
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-2 mb-2 leading-relaxed">
                      {session.query}
                    </h3>

                    {/* Executive summary snippet */}
                    {session.consensus?.executiveSummary && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 bg-black/40 p-2 rounded border border-slate-900/80 leading-relaxed font-sans">
                        {session.consensus.executiveSummary}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono-nerv">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            onSelectSession(session);
                            onClose();
                          }}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1 text-[11px]"
                          title="この合議を画面に復元表示"
                        >
                          <Eye className="w-3 h-3 text-magi-cyan" />
                          <span>表示</span>
                        </button>

                        <button
                          onClick={() => {
                            onStartFollowUp(session);
                            onClose();
                          }}
                          className="px-2 py-1 rounded bg-magi-orange/15 text-magi-orange hover:bg-magi-orange/25 border border-magi-orange/50 transition-colors flex items-center space-x-1 text-[11px] font-bold"
                          title="この合議結果を引き継いで新たな議題を質問"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>継続審議</span>
                        </button>

                        <button
                          onClick={() => onExportMarkdown(session)}
                          className="px-2 py-1 rounded bg-black/60 text-slate-300 hover:text-magi-orange hover:border-magi-orange/50 border border-slate-800 transition-colors flex items-center space-x-1 text-[11px]"
                          title="Markdownレポートを出力"
                        >
                          <Download className="w-3 h-3" />
                          <span>MD</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`履歴 [${session.id}] を削除しますか？`)) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1 rounded text-slate-500 hover:text-magi-red hover:bg-magi-red/10 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
