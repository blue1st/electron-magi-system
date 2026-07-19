import React, { useRef, useEffect, useState } from 'react';
import { ProtocolLog } from '../types';
import { Terminal, X, Copy, Check } from 'lucide-react';

interface ProtocolLogsInspectorProps {
  logs: ProtocolLog[];
}

export const ProtocolLogsInspector: React.FC<ProtocolLogsInspectorProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedLog, setSelectedLog] = useState<ProtocolLog | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (logs.length === 0) return null;

  return (
    <div className="w-full bg-black/80 border border-slate-800 rounded-lg overflow-hidden my-4">
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono-nerv text-slate-400">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-magi-orange" />
          <span className="text-slate-200 font-bold">MAGI PROTOCOL LOG INSPECTOR</span>
          <span className="text-[10px] text-slate-500">(Click log entry to view full text)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-magi-green animate-ping" />
          <span>REALTIME TELEMETRY</span>
        </div>
      </div>

      <div className="p-4 max-h-48 overflow-y-auto space-y-1.5 font-mono-nerv text-xs select-text">
        {logs.map((log) => {
          const isSystem = log.source === 'SYSTEM' || log.source === 'MAGI_CORE';
          const colorClass =
            log.type === 'success'
              ? 'text-magi-green'
              : log.type === 'warn'
              ? 'text-magi-red'
              : isSystem
              ? 'text-magi-cyan'
              : 'text-magi-orange';

          return (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="flex items-start space-x-3 leading-relaxed hover:bg-slate-900/80 px-2 py-1 rounded cursor-pointer border border-transparent hover:border-slate-700/80 transition-all"
              title="クリックで全文を表示"
            >
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={`font-bold shrink-0 w-24 ${colorClass}`}>{log.source}</span>
              <span className="text-slate-500 shrink-0">[{log.phase}]</span>
              <span className="text-slate-300 truncate">{log.text}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Full Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-magi-card border border-magi-orange/60 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="px-5 py-3 bg-black/80 border-b border-magi-orange/30 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono-nerv text-magi-orange font-bold">
                <Terminal className="w-4 h-4" />
                <span>MAGI TELEMETRY PROTOCOL DETAIL</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto font-mono-nerv">
              {/* Meta Stats */}
              <div className="flex flex-wrap gap-3 text-xs bg-black/50 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-500">TIMESTAMP: </span>
                  <span className="text-slate-200 font-bold">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500">SOURCE: </span>
                  <span className="text-magi-orange font-bold">{selectedLog.source}</span>
                </div>
                <div>
                  <span className="text-slate-500">PHASE: </span>
                  <span className="text-magi-cyan font-bold">{selectedLog.phase}</span>
                </div>
              </div>

              {/* Log Message Full Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400 font-bold">LOG FULL PAYLOAD:</span>
                  <button
                    onClick={() => handleCopy(selectedLog.text)}
                    className="flex items-center space-x-1 text-[11px] text-magi-orange hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="p-4 bg-black/80 border border-slate-700/80 rounded text-xs text-slate-100 leading-relaxed font-sans whitespace-pre-wrap select-text max-h-96 overflow-y-auto">
                  {selectedLog.text}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-black/80 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-mono-nerv rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

