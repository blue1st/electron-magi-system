import React, { useState, useEffect } from 'react';
import {
  Settings,
  DeliberationState,
  ProtocolLog,
  MagiId
} from './types';
import { DEFAULT_PERSONALITIES } from './config/defaultPrompts';
import { runPhase1Initial, runPhase2Debate, runPhase3Consensus } from './services/magiEngine';
import { fetchDocumentFromUrl, extractUrls, FetchedDocument } from './services/docFetcher';
import { updateAppDynamicIcon } from './services/dynamicIconService';
import { MagiHeader } from './components/MagiHeader';
import { DeliberationPhaseBar } from './components/DeliberationPhaseBar';
import { MagiTriadView } from './components/MagiTriadView';
import { DeliberationFlowGraph } from './components/DeliberationFlowGraph';
import { ConsensusReportView } from './components/ConsensusReportView';
import { ProtocolLogsInspector } from './components/ProtocolLogsInspector';
import { SettingsModal } from './components/SettingsModal';
import { Send, Terminal, HelpCircle, Link as LinkIcon, FileText, X, Globe, Loader2 } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'MAGI_SETTINGS_V1';

const INITIAL_SETTINGS: Settings = {
  baseUrl: 'http://localhost:11434/v1',
  apiKey: '',
  defaultModel: 'gpt-4o',
  enableDeliberation: true,
  soundEffects: true,
  personalities: DEFAULT_PERSONALITIES,
};

const PRESET_QUERIES = [
  '既存プロダクトの大規模リファクタリングを即座に開始すべきか？',
  '新AI機能の導入にあたり、倫理ガイドラインを厳格化してリリースを延期すべきか？',
  '競合他社に勝利するため、未検証の実験的アルゴリズムを商用本番に緊急投入すべきか？'
];

export const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return INITIAL_SETTINGS;
  });

  const [queryInput, setQueryInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [attachedDoc, setAttachedDoc] = useState<FetchedDocument | null>(null);
  const [isFetchingDoc, setIsFetchingDoc] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [state, setState] = useState<DeliberationState>({
    step: 'IDLE',
    query: '',
    activeMagiStatus: { MELCHIOR: 'IDLE', BALTHASAR: 'IDLE', CASPAR: 'IDLE' },
    initialOutputs: {},
    deliberationOutputs: {},
  });

  const [logs, setLogs] = useState<ProtocolLog[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    updateAppDynamicIcon(state.step);
  }, [state.step]);

  const addLog = (log: Omit<ProtocolLog, 'id' | 'timestamp'>) => {
    const newLog: ProtocolLog = {
      ...log,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleFetchDocumentUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsFetchingDoc(true);
    addLog({
      source: 'SYSTEM',
      phase: 'HTTP FETCH',
      text: `外部ドキュメント取得開始: ${targetUrl}`,
      type: 'info'
    });

    try {
      const doc = await fetchDocumentFromUrl(targetUrl);
      setAttachedDoc(doc);
      addLog({
        source: 'SYSTEM',
        phase: 'HTTP SUCCESS',
        text: `ドキュメント取得完了 [${doc.title}] (${doc.length} 文字)`,
        type: 'success'
      });
    } catch (err: any) {
      addLog({
        source: 'SYSTEM',
        phase: 'HTTP ERROR',
        text: `ドキュメント取得失敗: ${err.message}`,
        type: 'warn'
      });
      alert(err.message);
    } finally {
      setIsFetchingDoc(false);
    }
  };

  const handleMagiStatusChange = (magiId: MagiId, status: 'THINKING' | 'DONE' | 'ERROR') => {
    setState((prev) => ({
      ...prev,
      activeMagiStatus: {
        ...prev.activeMagiStatus,
        [magiId]: status,
      },
    }));
  };

  const handleStartDeliberation = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      if ((e.nativeEvent as any)?.isComposing) return;
    }
    if (!queryInput.trim() || (state.step !== 'IDLE' && state.step !== 'COMPLETED' && state.step !== 'ERROR')) return;

    const query = queryInput.trim();
    setLogs([]);

    // Check if query contains an unattached URL
    let currentDoc = attachedDoc;
    const detectedUrls = extractUrls(query);

    if (!currentDoc && detectedUrls.length > 0) {
      const targetUrl = detectedUrls[0];
      try {
        setIsFetchingDoc(true);
        addLog({
          source: 'SYSTEM',
          phase: 'HTTP FETCH',
          text: `議題内のURLから自動ドキュメント取得開始: ${targetUrl}`,
          type: 'info'
        });
        currentDoc = await fetchDocumentFromUrl(targetUrl);
        setAttachedDoc(currentDoc);
        addLog({
          source: 'SYSTEM',
          phase: 'HTTP SUCCESS',
          text: `自動ドキュメント取得完了 [${currentDoc.title}] (${currentDoc.length} 文字)`,
          type: 'success'
        });
      } catch (err: any) {
        addLog({
          source: 'SYSTEM',
          phase: 'HTTP WARN',
          text: `URL取得エラー (無効化して進行): ${err.message}`,
          type: 'warn'
        });
      } finally {
        setIsFetchingDoc(false);
      }
    }

    addLog({
      source: 'SYSTEM',
      phase: 'INITIATE',
      text: `議題受信: "${query.slice(0, 50)}..."${currentDoc ? ` (参照ドキュメント: ${currentDoc.title})` : ''}`,
      type: 'info',
    });

    setState({
      step: 'PHASE_1_INITIAL',
      query: query,
      attachedDoc: currentDoc || undefined,
      activeMagiStatus: { MELCHIOR: 'IDLE', BALTHASAR: 'IDLE', CASPAR: 'IDLE' },
      initialOutputs: {},
      deliberationOutputs: {},
    });

    try {
      // PHASE 1: Initial Proposals
      const initial = await runPhase1Initial(query, settings, {
        onLog: addLog,
        onMagiStatusChange: handleMagiStatusChange,
      }, currentDoc || undefined);

      setState((prev) => ({ ...prev, initialOutputs: initial }));

      let delibOutputs: Partial<Record<MagiId, any>> | undefined = undefined;

      // PHASE 2: Cross Debate (If Enabled)
      if (settings.enableDeliberation) {
        setState((prev) => ({ ...prev, step: 'PHASE_2_DEBATE' }));
        const debateResults = await runPhase2Debate(query, initial, settings, {
          onLog: addLog,
          onMagiStatusChange: handleMagiStatusChange,
        }, currentDoc || undefined);
        delibOutputs = debateResults;
        setState((prev) => ({ ...prev, deliberationOutputs: debateResults }));
      }

      // PHASE 3: Synthesis & Vote
      setState((prev) => ({ ...prev, step: 'PHASE_3_CONSENSUS' }));
      const consensus = await runPhase3Consensus(query, initial, delibOutputs as any, settings, {
        onLog: addLog,
        onMagiStatusChange: handleMagiStatusChange,
      });

      setState((prev) => ({
        ...prev,
        step: 'COMPLETED',
        consensus: consensus,
      }));

    } catch (err: any) {
      addLog({
        source: 'SYSTEM',
        phase: 'CRITICAL ERROR',
        text: `システムエラー: ${err.message}`,
        type: 'warn',
      });
      setState((prev) => ({
        ...prev,
        step: 'ERROR',
        error: err.message,
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: 'IDLE',
      query: '',
      activeMagiStatus: { MELCHIOR: 'IDLE', BALTHASAR: 'IDLE', CASPAR: 'IDLE' },
      initialOutputs: {},
      deliberationOutputs: {},
    });
    setAttachedDoc(null);
    setUrlInput('');
    setLogs([]);
  };

  const isBusy = state.step !== 'IDLE' && state.step !== 'COMPLETED' && state.step !== 'ERROR';

  return (
    <div className="h-screen overflow-hidden bg-magi-bg text-slate-100 flex flex-col relative bg-hex-grid">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanline-overlay z-10 pointer-events-none" />

      {/* Header (Fixed at top) */}
      <MagiHeader
        settings={settings}
        step={state.step}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        onToggleDeliberationMode={() =>
          setSettings((prev) => ({ ...prev, enableDeliberation: !prev.enableDeliberation }))
        }
      />

      {/* Progress Step Bar (Fixed below header) */}
      <DeliberationPhaseBar step={state.step} enableDeliberation={settings.enableDeliberation} />

      {/* Main Content Scrollable Container */}
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-6 flex flex-col z-20">
        {/* Input Query Bar */}
        <div className="bg-magi-card/90 border border-slate-700/80 rounded-lg p-5 mb-6 shadow-xl space-y-4">
          <form onSubmit={handleStartDeliberation} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-mono-nerv text-magi-orange font-bold tracking-wider uppercase">
                <Terminal className="w-4 h-4" />
                <span>MAGI SYSTEM AGENDA INPUT (審議題目の入力)</span>
              </label>
              <span className="text-[11px] font-mono-nerv text-slate-500">CODE: 39 READY</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="マギシステムに可否の判断・合議を仰ぎたい議題を入力してください... (URLを含めることも可能です)"
                disabled={isBusy}
                className="flex-1 bg-black/60 border border-slate-700 rounded-lg px-4 py-3 text-sm font-sans text-white placeholder-slate-500 focus:border-magi-orange focus:outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) {
                    e.stopPropagation();
                  }
                }}
              />

              <button
                type="submit"
                disabled={isBusy || (!queryInput.trim() && !attachedDoc)}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-magi-orange text-black font-mono-nerv font-bold hover:bg-orange-500 transition-all glow-orange disabled:opacity-50 shrink-0"
              >
                <Send className={`w-4 h-4 ${isBusy ? 'animate-bounce' : ''}`} />
                <span>{isBusy ? 'DELIBERATING...' : 'INITIATE CONSENSUS'}</span>
              </button>
            </div>

            {/* URL Document Attachment Input Bar */}
            <div className="flex items-center space-x-2 bg-black/40 p-2 rounded border border-slate-800">
              <Globe className="w-4 h-4 text-magi-cyan shrink-0 ml-1" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/spec.html (外部ドキュメントURLを追加)"
                disabled={isBusy || isFetchingDoc}
                className="flex-1 bg-transparent text-xs font-mono-nerv text-slate-200 placeholder-slate-600 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetchDocumentUrl(urlInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleFetchDocumentUrl(urlInput)}
                disabled={isBusy || isFetchingDoc || !urlInput.trim()}
                className="flex items-center space-x-1 text-xs font-mono-nerv px-3 py-1 rounded bg-magi-cyan/20 text-magi-cyan border border-magi-cyan/50 hover:bg-magi-cyan/30 disabled:opacity-40 shrink-0"
              >
                {isFetchingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>FETCH DOC</span>
              </button>
            </div>

            {/* Attached Document Preview Badge */}
            {attachedDoc && (
              <div className="p-3 bg-magi-cyan/10 border border-magi-cyan/40 rounded flex items-center justify-between text-xs font-mono-nerv">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="w-4 h-4 text-magi-cyan shrink-0" />
                  <span className="text-slate-400">ATTACHED CONTEXT:</span>
                  <span className="text-white font-bold truncate">{attachedDoc.title}</span>
                  <span className="text-magi-cyan font-mono text-[11px]">({attachedDoc.length} chars)</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowDocPreview(!showDocPreview)}
                    className="text-magi-cyan hover:underline text-[11px]"
                  >
                    {showDocPreview ? 'HIDE PREVIEW' : 'PREVIEW CONTENT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachedDoc(null)}
                    className="p-0.5 text-slate-400 hover:text-magi-red"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Document Full Text Preview Drawer */}
            {attachedDoc && showDocPreview && (
              <div className="p-4 bg-black/80 border border-slate-700 rounded text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                <div className="text-magi-orange font-bold font-mono-nerv mb-2 border-b border-slate-800 pb-1">
                  EXTERNAL DOCUMENT CONTENT: {attachedDoc.url}
                </div>
                {attachedDoc.content}
              </div>
            )}

            {/* Presets */}
            <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
              <span className="text-[11px] font-mono-nerv text-slate-500 shrink-0 flex items-center space-x-1">
                <HelpCircle className="w-3 h-3" />
                <span>SAMPLE AGENDAS:</span>
              </span>
              {PRESET_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQueryInput(q)}
                  disabled={isBusy}
                  className="text-[11px] font-mono-nerv px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-magi-orange hover:border-magi-orange/50 transition-all whitespace-nowrap"
                >
                  {q.slice(0, 28)}...
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* 3 MAGI Triad Panels */}
        <MagiTriadView settings={settings} state={state} />

        {/* Deliberation Flow & Opinion Shifts Graph */}
        {(state.step === 'PHASE_2_DEBATE' || state.step === 'PHASE_3_CONSENSUS' || state.step === 'COMPLETED') && (
          <DeliberationFlowGraph settings={settings} state={state} />
        )}

        {/* Final Consensus Report */}
        {state.consensus && <ConsensusReportView consensus={state.consensus} />}

        {/* Protocol Logs */}
        <ProtocolLogsInspector logs={logs} />
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings) => setSettings(newSettings)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
export default App;
