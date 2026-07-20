import React, { useState } from 'react';
import { HumanInterventionRequest, Settings } from '../types';
import { ShieldAlert, Send, ArrowRight } from 'lucide-react';

interface InterventionModalProps {
  request: HumanInterventionRequest;
  settings: Settings;
  onSubmitDirective: (userDirective: string) => void;
  onSkip: () => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  request,
  settings,
  onSubmitDirective,
  onSkip
}) => {
  const [inputText, setInputText] = useState('');
  const sourcePersonality = request.source !== 'MAGI_CORE' ? settings.personalities[request.source] : null;

  const handleSelectOption = (option: string) => {
    setInputText(option);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitDirective(inputText.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-magi-card border-2 border-magi-red rounded-lg shadow-2xl overflow-hidden glow-red">
        {/* Urgent Header */}
        <div className="px-6 py-4 bg-magi-red/20 border-b border-magi-red/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-magi-red animate-pulse" />
            <div>
              <span className="text-[10px] font-mono-nerv uppercase tracking-widest text-magi-red font-bold">
                EMERGENCY PROTOCOL • CODE: 999
              </span>
              <h2 className="text-base font-bold font-mono-nerv text-white tracking-wider">
                HUMAN INTERVENTION REQUIRED (最高統括官・緊急介入要請)
              </h2>
            </div>
          </div>
          {sourcePersonality && (
            <span
              className="text-xs font-mono-nerv font-bold px-2.5 py-1 rounded border"
              style={{
                backgroundColor: `${sourcePersonality.color}20`,
                borderColor: sourcePersonality.color,
                color: sourcePersonality.color
              }}
            >
              {sourcePersonality.name} より問いかけ
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Reason & Question */}
          <div className="p-4 rounded bg-black/60 border border-slate-800 space-y-2 font-sans">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-magi-orange">【要請理由】:</span> {request.reason}
            </div>
            <div className="pt-2 border-t border-slate-800 text-sm font-bold text-slate-100 flex items-start space-x-2">
              <ArrowRight className="w-4 h-4 text-magi-red shrink-0 mt-0.5" />
              <p className="leading-relaxed">{request.question}</p>
            </div>
          </div>

          {/* Suggested Options if available */}
          {request.suggestedOptions && request.suggestedOptions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono-nerv text-slate-400 font-semibold block">
                推奨指示オプショントリガー (選択して入力補完):
              </span>
              <div className="flex flex-wrap gap-2">
                {request.suggestedOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className="px-3 py-1.5 rounded bg-black/70 hover:bg-magi-cyan/20 border border-slate-700 hover:border-magi-cyan text-slate-200 text-xs font-mono-nerv transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Directive Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono-nerv text-magi-cyan font-bold mb-1.5 flex items-center justify-between">
                <span>最高統括官（人間）の補足指示・前提入力</span>
                <span className="text-slate-500 font-normal">※回答は全MAGIに最高指示として伝達されます</span>
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例: 予算は1000万円以内、本番環境の安全性を最優先して段階リリースを行うこと。"
                rows={3}
                className="w-full bg-black/80 border border-slate-700 focus:border-magi-cyan rounded p-3 text-xs font-sans text-slate-100 focus:outline-none leading-relaxed"
                required
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 rounded bg-black/50 hover:bg-slate-800 text-slate-400 text-xs font-mono-nerv border border-slate-800 transition-all"
              >
                介入をスキップ（MAGI自身に判断させる）
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded bg-magi-cyan/20 border border-magi-cyan text-magi-cyan hover:bg-magi-cyan/30 font-mono-nerv font-bold text-xs transition-all glow-cyan flex items-center space-x-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>指示を送信し、審議を再開</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
