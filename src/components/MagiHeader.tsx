import React from 'react';
import { Settings as SettingsIcon, Cpu, RefreshCw, Zap, Layers, Activity } from 'lucide-react';
import { Settings, DeliberationStep } from '../types';

interface MagiHeaderProps {
  settings: Settings;
  step: DeliberationStep;
  onOpenSettings: () => void;
  onReset: () => void;
  onToggleDeliberationMode: () => void;
}

export const MagiHeader: React.FC<MagiHeaderProps> = ({
  settings,
  step,
  onOpenSettings,
  onReset,
  onToggleDeliberationMode,
}) => {
  const isBusy = step !== 'IDLE' && step !== 'COMPLETED' && step !== 'ERROR';

  return (
    <header className="h-16 border-b border-magi-orange/30 bg-magi-card/90 backdrop-blur-md pl-20 sm:pl-24 pr-6 flex items-center justify-between select-none z-30 app-drag-region">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3 app-no-drag">
        <div className="relative flex items-center justify-center w-9 h-9 rounded border border-magi-orange bg-magi-orange/10 text-magi-orange font-bold font-mono-nerv text-xl glow-orange shrink-0">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-widest text-white font-mono-nerv uppercase">
              MAGI SYSTEM <span className="text-[10px] text-magi-orange border border-magi-orange/50 px-1 py-0.5 rounded">CODE: 39</span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-mono-nerv tracking-tight hidden lg:block">
            NERV SUPERCOMPUTER SYSTEM 01 • TRIPARTITE CONSENSUS ENGINE
          </p>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="hidden md:flex items-center space-x-4 app-no-drag">
        {/* Endpoint Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono-nerv bg-black/40 px-3 py-1.5 rounded border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-magi-green" />
          <span className="text-slate-400">ENDPOINT:</span>
          <span className="text-magi-green font-semibold truncate max-w-[160px]">
            {settings.baseUrl.replace(/^https?:\/\//, '')}
          </span>
        </div>

        {/* Model Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono-nerv bg-black/40 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-slate-400">MODEL:</span>
          <span className="text-magi-orange font-semibold">{settings.defaultModel}</span>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={onToggleDeliberationMode}
          disabled={isBusy}
          className={`flex items-center space-x-2 text-xs font-mono-nerv px-3 py-1.5 rounded border transition-all ${
            settings.enableDeliberation
              ? 'border-magi-orange text-magi-orange bg-magi-orange/10 glow-orange'
              : 'border-slate-700 text-slate-400 bg-slate-800/50 hover:border-slate-600'
          }`}
          title="熟議モード (3フェーズ詳細議論) と 高速合議モード (1フェーズ即時可決) の切替"
        >
          {settings.enableDeliberation ? (
            <>
              <Layers className="w-3.5 h-3.5" />
              <span>3-PHASE DELIBERATION</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>FAST CONSENSUS</span>
            </>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2.5 app-no-drag">
        <button
          onClick={onReset}
          disabled={isBusy}
          className="p-2 rounded border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all disabled:opacity-50"
          title="新規アジェンダ（クリア）"
        >
          <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 text-xs font-mono-nerv px-3 py-2 rounded bg-magi-orange/10 text-magi-orange border border-magi-orange/50 hover:bg-magi-orange/20 hover:border-magi-orange transition-all glow-orange"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">SETTINGS</span>
        </button>
      </div>
    </header>
  );
};
