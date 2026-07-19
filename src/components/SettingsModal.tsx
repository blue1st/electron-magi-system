import React, { useState } from 'react';
import { Settings, MagiId, MagiPersonality } from '../types';
import { X, Save, RefreshCw, Server, Cpu, Check, AlertCircle, Sparkles, Sliders, FileText, Wand2 } from 'lucide-react';
import { fetchAvailableModels } from '../services/apiClient';
import { generatePersonaWithAI } from '../services/personaGenerator';
import { FIXED_OUTPUT_FORMAT_RULE } from '../config/defaultPrompts';

interface SettingsModalProps {
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<Settings>(() => {
    // Migration check for template mode
    const personalities = { ...settings.personalities };
    (Object.keys(personalities) as MagiId[]).forEach((id) => {
      if (!personalities[id].personaMode) {
        personalities[id].personaMode = 'TEMPLATE';
      }
      if (!personalities[id].personaDescription && personalities[id].systemPrompt) {
        personalities[id].personaDescription = personalities[id].systemPrompt;
      }
    });
    return { ...settings, personalities };
  });

  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string }>({});
  const [activeTab, setActiveTab] = useState<'API' | 'MELCHIOR' | 'BALTHASAR' | 'CASPAR'>('API');

  // AI Persona Assistant State
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);

  const handleFetchModels = async () => {
    setLoadingModels(true);
    setTestStatus({});
    try {
      const fetched = await fetchAvailableModels(formData.baseUrl, formData.apiKey);
      setModels(fetched);
      if (fetched.length > 0) {
        setTestStatus({ success: true, message: `${fetched.length} 個のモデルを取得しました` });
        if (!fetched.includes(formData.defaultModel)) {
          setFormData((prev) => ({ ...prev, defaultModel: fetched[0] }));
        }
      } else {
        setTestStatus({ success: false, message: 'モデル一覧が空です。' });
      }
    } catch (err: any) {
      setTestStatus({ success: false, message: `疎通エラー: ${err.message}` });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleGeneratePersona = async (targetMagiId: MagiId) => {
    if (!aiPromptInput.trim()) return;
    setIsGeneratingPersona(true);
    try {
      const p = formData.personalities[targetMagiId];
      const result = await generatePersonaWithAI(aiPromptInput, p.role, formData);

      setFormData((prev) => {
        const updated = { ...prev.personalities };
        updated[targetMagiId] = {
          ...updated[targetMagiId],
          role: result.suggestedRole,
          personaDescription: result.personaDescription,
        };
        return { ...prev, personalities: updated };
      });

      setAiAssistantOpen(false);
      setAiPromptInput('');
    } catch (err: any) {
      alert(`AI生成に失敗しました: ${err.message}`);
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-magi-card border border-magi-orange/50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-magi-orange/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-magi-orange" />
            <h2 className="text-lg font-bold font-mono-nerv text-white tracking-wider">
              MAGI SYSTEM CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-black/40 px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('API')}
            className={`px-4 py-2 text-xs font-mono-nerv font-bold rounded-t border-t border-x transition-all ${
              activeTab === 'API'
                ? 'bg-magi-card text-magi-orange border-magi-orange/50 border-b-transparent'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            API & ENDPOINT
          </button>

          {(['MELCHIOR', 'BALTHASAR', 'CASPAR'] as MagiId[]).map((id) => {
            const p = formData.personalities[id];
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 text-xs font-mono-nerv font-bold rounded-t border-t border-x transition-all ${
                  activeTab === id
                    ? 'bg-magi-card text-white border-slate-700 border-b-transparent'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'API' && (
            <div className="space-y-5">
              {/* Base URL */}
              <div>
                <label className="block text-xs font-mono-nerv text-slate-300 font-bold mb-1.5">
                  OPENAI-COMPATIBLE API BASE URL
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-black/60 border border-slate-700 rounded px-3 py-2 pl-9 text-xs font-mono-nerv text-slate-100 focus:border-magi-orange focus:outline-none"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400 font-mono-nerv">
                  * Ollama: <code className="text-magi-orange">http://localhost:11434/v1</code> / LM Studio: <code className="text-magi-orange">http://localhost:1234/v1</code> / OpenAI: <code className="text-magi-orange">https://api.openai.com/v1</code>
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-mono-nerv text-slate-300 font-bold mb-1.5">
                  API KEY (LOCAL LLMの場合は任意/ollamaで可)
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-black/60 border border-slate-700 rounded px-3 py-2 text-xs font-mono-nerv text-slate-100 focus:border-magi-orange focus:outline-none"
                />
              </div>

              {/* Model & Fetch */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono-nerv text-slate-300 font-bold">
                    DEFAULT MODEL NAME
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={loadingModels}
                    className="flex items-center space-x-1.5 text-[11px] font-mono-nerv px-2 py-1 rounded bg-magi-orange/10 text-magi-orange border border-magi-orange/40 hover:bg-magi-orange/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
                    <span>FETCH MODELS</span>
                  </button>
                </div>

                {models.length > 0 ? (
                  <select
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    className="w-full bg-black/60 border border-slate-700 rounded px-3 py-2 text-xs font-mono-nerv text-slate-100 focus:border-magi-orange focus:outline-none"
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    placeholder="gpt-4o or llama3"
                    className="w-full bg-black/60 border border-slate-700 rounded px-3 py-2 text-xs font-mono-nerv text-slate-100 focus:border-magi-orange focus:outline-none"
                    required
                  />
                )}

                {testStatus.message && (
                  <div
                    className={`mt-2 p-2 rounded text-xs font-mono-nerv flex items-center space-x-2 ${
                      testStatus.success
                        ? 'bg-magi-green/10 text-magi-green border border-magi-green/30'
                        : 'bg-magi-red/10 text-magi-red border border-magi-red/30'
                    }`}
                  >
                    {testStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{testStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAGI Individual Personality Prompt Settings */}
          {activeTab !== 'API' && (
            <div className="space-y-5">
              {/* Mode Selector */}
              <div className="flex items-center justify-between p-3 rounded bg-black/50 border border-slate-800">
                <div>
                  <span className="text-xs font-mono-nerv text-slate-200 font-bold block">
                    プロンプト設定モード
                  </span>
                  <span className="text-[11px] text-slate-400">
                    固定JSONルール自動挿入＋性格定義の併用、または完全自由記述を選択
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newP = { ...formData.personalities };
                      newP[activeTab] = { ...newP[activeTab], personaMode: 'TEMPLATE' };
                      setFormData({ ...formData, personalities: newP });
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-mono-nerv font-bold border transition-all ${
                      (formData.personalities[activeTab].personaMode || 'TEMPLATE') === 'TEMPLATE'
                        ? 'bg-magi-orange/20 border-magi-orange text-magi-orange glow-orange'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    ✨ テンプレート＋性格定義 (推奨)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newP = { ...formData.personalities };
                      newP[activeTab] = { ...newP[activeTab], personaMode: 'CUSTOM' };
                      setFormData({ ...formData, personalities: newP });
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-mono-nerv font-bold border transition-all ${
                      formData.personalities[activeTab].personaMode === 'CUSTOM'
                        ? 'bg-magi-cyan/20 border-magi-cyan text-magi-cyan glow-cyan'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    ⚙️ 完全自由記述 (カスタム)
                  </button>
                </div>
              </div>

              {/* Role Title */}
              <div>
                <label className="block text-xs font-mono-nerv text-slate-300 font-bold mb-1.5">
                  UNIT ROLE TITLE (役割・肩書)
                </label>
                <input
                  type="text"
                  value={formData.personalities[activeTab].role}
                  onChange={(e) => {
                    const newP = { ...formData.personalities };
                    newP[activeTab] = { ...newP[activeTab], role: e.target.value };
                    setFormData({ ...formData, personalities: newP });
                  }}
                  placeholder="e.g. SCIENTIST (科学者) / LEGAL ADVISOR (法務顧問)"
                  className="w-full bg-black/60 border border-slate-700 rounded px-3 py-2 text-xs font-mono-nerv text-slate-100 focus:border-magi-orange focus:outline-none"
                />
              </div>

              {/* TEMPLATE MODE BODY */}
              {(formData.personalities[activeTab].personaMode || 'TEMPLATE') === 'TEMPLATE' ? (
                <div className="space-y-4">
                  {/* Fixed Rules Preview */}
                  <details className="bg-black/40 border border-slate-800 rounded p-3 text-xs">
                    <summary className="font-mono-nerv text-slate-400 cursor-pointer hover:text-slate-200 flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-magi-orange" />
                      <span>【システム自動固定】JSON構造出力ルールを表示（クリックで開閉）</span>
                    </summary>
                    <pre className="mt-2 p-3 bg-black/80 rounded border border-slate-900 text-slate-400 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto">
                      {FIXED_OUTPUT_FORMAT_RULE}
                    </pre>
                  </details>

                  {/* Editable Persona Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-mono-nerv text-slate-300 font-bold">
                        PERSONA & THOUGHT GUIDANCE (性格・価値観・視点の設定)
                      </label>

                      {/* AI Generator Trigger */}
                      <button
                        type="button"
                        onClick={() => setAiAssistantOpen(true)}
                        className="flex items-center space-x-1.5 text-xs font-mono-nerv px-2.5 py-1 rounded bg-magi-orange text-black font-bold hover:bg-orange-500 transition-all glow-orange"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>✨ AIで性格を自動生成</span>
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={formData.personalities[activeTab].personaDescription || ''}
                      onChange={(e) => {
                        const newP = { ...formData.personalities };
                        newP[activeTab] = { ...newP[activeTab], personaDescription: e.target.value };
                        setFormData({ ...formData, personalities: newP });
                      }}
                      placeholder="- どのような行動方針や価値観を持たせるかを記述してください..."
                      className="w-full bg-black/60 border border-slate-700 rounded p-3 text-xs font-mono text-slate-100 focus:border-magi-orange focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                /* CUSTOM RAW MODE */
                <div>
                  <label className="block text-xs font-mono-nerv text-slate-300 font-bold mb-1.5">
                    RAW SYSTEM PROMPT (完全手動記述)
                  </label>
                  <textarea
                    rows={10}
                    value={formData.personalities[activeTab].systemPrompt || ''}
                    onChange={(e) => {
                      const newP = { ...formData.personalities };
                      newP[activeTab] = { ...newP[activeTab], systemPrompt: e.target.value };
                      setFormData({ ...formData, personalities: newP });
                    }}
                    placeholder="JSON出力ルール等を含む全プロンプトを直接記述してください..."
                    className="w-full bg-black/60 border border-slate-700 rounded p-3 text-xs font-mono text-slate-100 focus:border-magi-orange focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* Individual Model Override */}
              <div>
                <label className="block text-xs font-mono-nerv text-slate-300 font-bold mb-1.5">
                  INDIVIDUAL MODEL OVERRIDE (空欄の場合はデフォルトモデルを使用)
                </label>
                <input
                  type="text"
                  value={formData.personalities[activeTab].modelOverride || ''}
                  onChange={(e) => {
                    const newP = { ...formData.personalities };
                    newP[activeTab] = { ...newP[activeTab], modelOverride: e.target.value };
                    setFormData({ ...formData, personalities: newP });
                  }}
                  placeholder="e.g. deepseek-r1 / claude-3-5-sonnet"
                  className="w-full bg-black/60 border border-slate-700 rounded px-3 py-2 text-xs font-mono-nerv text-slate-100 focus:border-magi-orange focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono-nerv rounded border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 text-xs font-mono-nerv rounded bg-magi-orange text-black font-bold hover:bg-orange-500 transition-all glow-orange"
            >
              <Save className="w-4 h-4" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI Persona Assistant Modal Popup */}
      {aiAssistantOpen && activeTab !== 'API' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-magi-card border border-magi-orange/80 rounded-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-magi-orange font-bold font-mono-nerv text-sm">
                <Wand2 className="w-4 h-4" />
                <span>AI PERSONA GENERATOR ({formData.personalities[activeTab].name})</span>
              </div>
              <button onClick={() => setAiAssistantOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono-nerv">
              作成したいAIの性格や役割、特徴を短く入力してください。LLMがマギシステムに適合した明確な行動プロンプトを自動作成します。
            </p>

            <div>
              <label className="block text-xs font-mono-nerv text-slate-400 mb-1">
                【例】「超慎重なサイバーセキュリティの専門家」「皮肉屋な投資家」「倫理を最優先する哲学者」
              </label>
              <input
                type="text"
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="希望する性格・役割・特徴を入力..."
                className="w-full bg-black/80 border border-slate-700 rounded px-3 py-2 text-xs font-sans text-white focus:border-magi-orange focus:outline-none"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGeneratePersona(activeTab);
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAiAssistantOpen(false)}
                className="px-3 py-1.5 text-xs font-mono-nerv rounded border border-slate-700 text-slate-400 hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleGeneratePersona(activeTab)}
                disabled={isGeneratingPersona || !aiPromptInput.trim()}
                className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-mono-nerv rounded bg-magi-orange text-black font-bold hover:bg-orange-500 disabled:opacity-50 glow-orange"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingPersona ? 'animate-spin' : ''}`} />
                <span>{isGeneratingPersona ? 'GENERATING...' : 'GENERATE PERSONA'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
