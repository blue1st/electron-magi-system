import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  DeliberationState,
  DeliberationMode,
  ProtocolLog,
  MagiId,
  DeliberationSession,
  OpinionShift
} from './types';
import { DEFAULT_PERSONALITIES, detectDeliberationMode } from './config/defaultPrompts';
import { runPhase1Initial, runPhase2Debate, runPhase3Consensus } from './services/magiEngine';
import { fetchDocumentFromUrl, extractUrls, FetchedDocument } from './services/docFetcher';
import { updateAppDynamicIcon } from './services/dynamicIconService';
import {
  loadSessions,
  saveSession,
  deleteSession,
  clearSessions,
  formatConsensusSummary,
  exportSessionToMarkdown,
  downloadMarkdownFile
} from './services/historyService';
import { MagiHeader } from './components/MagiHeader';
import { DeliberationPhaseBar } from './components/DeliberationPhaseBar';
import { MagiTriadView } from './components/MagiTriadView';
import { DeliberationFlowGraph } from './components/DeliberationFlowGraph';
import { ConsensusReportView } from './components/ConsensusReportView';
import { ProtocolLogsInspector } from './components/ProtocolLogsInspector';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Send, Terminal, HelpCircle, Link as LinkIcon, FileText, X, Globe, Loader2, RotateCcw, GitCommit } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'MAGI_SETTINGS_V2';

const INITIAL_SETTINGS: Settings = {
  baseUrl: 'http://localhost:11434/v1',
  apiKey: '',
  defaultModel: 'gpt-4o',
  enableDeliberation: true,
  maxDebateTurns: 2,
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
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          maxDebateTurns: parsed.maxDebateTurns || 2
        };
      } catch (e) { }
    }
    return INITIAL_SETTINGS;
  });

  const [queryInput, setQueryInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [attachedDoc, setAttachedDoc] = useState<FetchedDocument | null>(null);
  const [isFetchingDoc, setIsFetchingDoc] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // History & Follow-up States
  const [sessions, setSessions] = useState<DeliberationSession[]>(() => loadSessions());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [parentSession, setParentSession] = useState<DeliberationSession | null>(null);

  const [selectedMode, setSelectedMode] = useState<DeliberationMode>('AUTO');

  const [state, setState] = useState<DeliberationState>({
    step: 'IDLE',
    mode: 'AUTO',
    query: '',
    activeMagiStatus: { MELCHIOR: 'IDLE', BALTHASAR: 'IDLE', CASPAR: 'IDLE' },
    initialOutputs: {},
    deliberationOutputs: {},
  });

  const [logs, setLogs] = useState<ProtocolLog[]>([]);
  const consensusRef = useRef<HTMLDivElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    updateAppDynamicIcon(state.step);
  }, [state.step]);

  useEffect(() => {
    if (state.consensus && consensusRef.current) {
      consensusRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.consensus]);

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

    const deliberationId = `DELIB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const resolvedMode = selectedMode === 'AUTO' ? detectDeliberationMode(query) : selectedMode;

    const parentConsensusSummary = parentSession ? formatConsensusSummary(parentSession) : undefined;

    let currentDoc: FetchedDocument | null = null;
    const detectedUrls = extractUrls(query);

    if (detectedUrls.length > 0) {
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
    } else if (attachedDoc && urlInput.trim() && attachedDoc.url === urlInput.trim()) {
      currentDoc = attachedDoc;
    } else {
      currentDoc = null;
      setAttachedDoc(null);
    }

    addLog({
      source: 'SYSTEM',
      phase: 'INITIATE',
      text: `新合議プロトコル起動 (${deliberationId}) [MODE: ${resolvedMode}]${parentSession ? ` [継続審議 FROM: ${parentSession.id}]` : ''} - 議題: "${query.slice(0, 50)}..."${currentDoc ? ` (参照ドキュメント: ${currentDoc.title})` : ''}`,
      type: 'info',
    });

    setState({
      step: 'PHASE_1_INITIAL',
      mode: selectedMode,
      resolvedMode: resolvedMode,
      query: query,
      attachedDoc: currentDoc || undefined,
      activeMagiStatus: { MELCHIOR: 'IDLE', BALTHASAR: 'IDLE', CASPAR: 'IDLE' },
      initialOutputs: {},
      deliberationOutputs: {},
      parentSessionId: parentSession?.id,
      parentConsensusSummary: parentConsensusSummary,
    });

    try {
      // PHASE 1: Initial Proposals
      const initial = await runPhase1Initial(
        query,
        settings,
        {
          onLog: addLog,
          onMagiStatusChange: handleMagiStatusChange,
        },
        currentDoc || undefined,
        deliberationId,
        parentConsensusSummary
      );

      setState((prev) => ({ ...prev, initialOutputs: initial }));

      let delibOutputs: Partial<Record<MagiId, any>> | undefined = undefined;
      let allRounds: Array<Record<MagiId, any>> | undefined = undefined;
      let opinionShifts: OpinionShift[] = [];

      // PHASE 2: Cross Debate (If Enabled)
      if (settings.enableDeliberation) {
        const maxTurns = settings.maxDebateTurns || 2;
        setState((prev) => ({ ...prev, step: 'PHASE_2_DEBATE', maxTurns, currentTurn: 1 }));
        const debateResults = await runPhase2Debate(
          query,
          initial,
          settings,
          {
            onLog: addLog,
            onMagiStatusChange: handleMagiStatusChange,
          },
          currentDoc || undefined,
          deliberationId,
          parentConsensusSummary,
          (roundIndex, roundOutputs, currentShifts) => {
            setState((prev) => ({
              ...prev,
              currentTurn: roundIndex,
              deliberationOutputs: roundOutputs,
              deliberationRounds: [...(prev.deliberationRounds || []), roundOutputs]
            }));
          }
        );
        delibOutputs = debateResults.finalDeliberationOutputs;
        allRounds = debateResults.allRounds;
        opinionShifts = debateResults.opinionShifts;

        setState((prev) => ({
          ...prev,
          deliberationOutputs: debateResults.finalDeliberationOutputs,
          deliberationRounds: debateResults.allRounds
        }));
      }

      // PHASE 3: Synthesis & Vote
      setState((prev) => ({ ...prev, step: 'PHASE_3_CONSENSUS' }));
      const consensus = await runPhase3Consensus(
        query,
        initial,
        delibOutputs as any,
        settings,
        {
          onLog: addLog,
          onMagiStatusChange: handleMagiStatusChange,
        },
        deliberationId,
        resolvedMode,
        parentConsensusSummary,
        allRounds,
        opinionShifts
      );

      setState((prev) => ({
        ...prev,
        step: 'COMPLETED',
        consensus: consensus,
      }));

      // Save to Deliberation Archives
      const newSession: DeliberationSession = {
        id: deliberationId,
        timestamp: new Date().toLocaleString(),
        query: query,
        mode: selectedMode,
        attachedDoc: currentDoc || undefined,
        initialOutputs: initial,
        deliberationOutputs: delibOutputs as any,
        consensus: consensus,
        logs: [],
        parentSessionId: parentSession?.id,
        parentConsensusSummary: parentConsensusSummary,
      };
      const updated = saveSession(newSession);
      setSessions(updated);
      setCurrentSessionId(deliberationId);
      setParentSession(null);

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

  const handleExportSessionMarkdown = (session: DeliberationSession) => {
    const md = exportSessionToMarkdown(session);
    const safeTitle = session.query.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 30);
    const filename = `MAGI_REPORT_${session.id}_${safeTitle}.md`;
    downloadMarkdownFile(filename, md);
  };

  const handleSelectSessionFromHistory = (session: DeliberationSession) => {
    setState({
      step: 'COMPLETED',
      mode: session.mode,
      query: session.query,
      attachedDoc: session.attachedDoc,
      activeMagiStatus: { MELCHIOR: 'DONE', BALTHASAR: 'DONE', CASPAR: 'DONE' },
      initialOutputs: session.initialOutputs,
      deliberationOutputs: session.deliberationOutputs,
      consensus: session.consensus,
    });
    setLogs(session.logs || []);
    setQueryInput(session.query);
    setCurrentSessionId(session.id);
    setParentSession(null);
  };

  const handleStartFollowUpFromSession = (session: DeliberationSession) => {
    setParentSession(session);
    setQueryInput('');
    if (queryInputRef.current) {
      queryInputRef.current.focus();
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = deleteSession(id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(undefined);
    }
  };

  const handleClearAllSessions = () => {
    clearSessions();
    setSessions([]);
    setCurrentSessionId(undefined);
  };

  const getCurrentOrActiveSession = (): DeliberationSession => {
    return sessions.find(s => s.id === currentSessionId) || {
      id: currentSessionId || `DELIB-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      query: state.query,
      mode: state.mode,
      attachedDoc: state.attachedDoc,
      initialOutputs: state.initialOutputs,
      deliberationOutputs: state.deliberationOutputs,
      consensus: state.consensus!,
      logs: logs
    };
  };

  const handleReset = () => {
    setState({
      step: 'IDLE',
      mode: selectedMode,
      query: '',
      activeMagiStatus: { MELCHIOR: 'IDLE', BALTHASAR: 'IDLE', CASPAR: 'IDLE' },
      initialOutputs: {},
      deliberationOutputs: {},
    });
    setAttachedDoc(null);
    setUrlInput('');
    setLogs([]);
    setParentSession(null);
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
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
        onToggleDeliberationMode={() =>
          setSettings((prev) => ({ ...prev, enableDeliberation: !prev.enableDeliberation }))
        }
      />

      {/* Progress Step Bar (Fixed below header) */}
      <DeliberationPhaseBar step={state.step} enableDeliberation={settings.enableDeliberation} />

      {/* Main Content Scrollable Container */}
      <main className="flex-1 min-h-0 overflow-y-auto max-w-7xl w-full mx-auto p-6 flex flex-col z-20">
        {/* Input Query Bar */}
        <div className="bg-magi-card/90 border border-slate-700/80 rounded-lg p-5 mb-6 shadow-xl space-y-4">
          <form onSubmit={handleStartDeliberation} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center space-x-2 text-xs font-mono-nerv text-magi-orange font-bold tracking-wider uppercase">
                <Terminal className="w-4 h-4" />
                <span>MAGI SYSTEM AGENDA INPUT (審議題目の入力)</span>
              </label>

              {/* Protocol Mode Switcher */}
              <div className="flex items-center space-x-1.5 bg-black/60 p-1 rounded border border-slate-800 text-xs font-mono-nerv">
                <span className="text-slate-500 px-1 text-[10px] hidden sm:inline">PROTOCOL MODE:</span>
                {(['AUTO', 'DECISION', 'COMPARISON', 'STRATEGY'] as DeliberationMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    disabled={isBusy}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                      selectedMode === mode
                        ? 'bg-magi-orange text-black glow-orange'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'AUTO' ? '🤖 自動判別' : mode === 'DECISION' ? '⚖️ 可否判定' : mode === 'COMPARISON' ? '🔀 選択肢比較' : '💡 自由提案'}
                  </button>
                ))}
              </div>
            </div>

            {/* Parent Session Follow-up Banner */}
            {parentSession && (
              <div className="p-3 bg-magi-orange/15 border border-magi-orange/50 rounded flex items-center justify-between text-xs font-mono-nerv animate-in fade-in">
                <div className="flex items-center space-x-2 truncate">
                  <GitCommit className="w-4 h-4 text-magi-orange shrink-0" />
                  <span className="text-magi-orange font-bold">継続審議コンテキスト適用中:</span>
                  <span className="text-white font-semibold truncate">{parentSession.query}</span>
                  <span className="text-slate-400 text-[10px]">({parentSession.id})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setParentSession(null)}
                  className="p-1 text-slate-400 hover:text-magi-red transition-colors"
                  title="継続審議コンテキストを解除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={queryInputRef}
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={parentSession ? "前回の合議結果を踏まえた、追加の質問・アジェンダを入力..." : "マギシステムに可否の判断・合議を仰ぎたい議題を入力してください... (URLを含めることも可能です)"}
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
                <span>{isBusy ? 'DELIBERATING...' : parentSession ? 'CONTINUE CONSENSUS' : 'INITIATE CONSENSUS'}</span>
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
                  onClick={() => {
                    setQueryInput(q);
                    setAttachedDoc(null);
                    setUrlInput('');
                  }}
                  disabled={isBusy}
                  className="text-[11px] font-mono-nerv px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-magi-orange hover:border-magi-orange/50 transition-all whitespace-nowrap"
                >
                  {q.slice(0, 28)}...
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Final Consensus Report (rendered prominently at top when completed) */}
        {state.consensus && (
          <div ref={consensusRef} className="animate-in fade-in slide-in-from-top-4 duration-500">
            <ConsensusReportView
              consensus={state.consensus}
              onStartFollowUp={() => handleStartFollowUpFromSession(getCurrentOrActiveSession())}
              onExportMarkdown={() => handleExportSessionMarkdown(getCurrentOrActiveSession())}
            />
          </div>
        )}

        {/* 3 MAGI Triad Panels */}
        <MagiTriadView settings={settings} state={state} />

        {/* Deliberation Flow & Opinion Shifts Graph */}
        {(state.step === 'PHASE_2_DEBATE' || state.step === 'PHASE_3_CONSENSUS' || state.step === 'COMPLETED') && (
          <DeliberationFlowGraph settings={settings} state={state} />
        )}

      </main>

      {/* Protocol Logs */}
      {logs.length > 0 && (
        <div className="px-6 pb-6 w-full max-w-7xl mx-auto z-20 shrink-0">
          <ProtocolLogsInspector logs={logs} />
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings) => setSettings(newSettings)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Deliberation History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSessionFromHistory}
        onStartFollowUp={handleStartFollowUpFromSession}
        onExportMarkdown={handleExportSessionMarkdown}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />
    </div>
  );
};
export default App;
