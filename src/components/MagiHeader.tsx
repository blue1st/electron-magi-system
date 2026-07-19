import React from 'react';
import { Settings as SettingsIcon, Cpu, RefreshCw, Zap, Layers, Activity, History } from 'lucide-react';
import { Settings, DeliberationStep } from '../types';
import pkg from '../../package.json';

interface MagiHeaderProps {
  settings: Settings;
  step: DeliberationStep;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onReset: () => void;
  onToggleDeliberationMode: () => void;
}

export const MagiHeader: React.FC<MagiHeaderProps> = ({
  settings,
  step,
  onOpenSettings,
  onOpenHistory,
  onReset,
  onToggleDeliberationMode,
}) => {
  const isBusy = step !== 'IDLE' && step !== 'COMPLETED' && step !== 'ERROR';
  const appVersion = pkg.version || '1.1.0';

  return (
    <header className="h-16 border-b border-magi-orange/30 bg-magi-card/90 backdrop-blur-md pl-20 sm:pl-24 pr-6 flex items-center justify-between select-none shrink-0 z-30 app-drag-region">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3 app-no-drag">
        <div className="relative flex items-center justify-center w-9 h-9 rounded border border-magi-orange bg-magi-orange/10 text-magi-orange font-bold font-mono-nerv text-xl glow-orange shrink-0">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-widest text-white font-mono-nerv uppercase">
              MAGI SYSTEM <span className="text-[10px] text-magi-orange border border-magi-orange/50 px-1.5 py-0.5 rounded">CODE: 39</span>
            </h1>
            <span className="text-[10px] font-mono-nerv text-slate-400 bg-black/60 border border-slate-800 px-1.5 py-0.5 rounded">
              v{appVersion}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono-nerv tracking-tight hidden lg:block">
            NERV SUPERCOMPUTER SYSTEM 01 • TRIPARTITE CONSENSUS ENGINE
          </p>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="hidden md:flex items-center space-x-3.5 app-no-drag">
        {/* Active System Phase Badge */}
        <div className="flex items-center space-x-1.5 font-mono-nerv">
          {step === 'IDLE' && (
            <span className="px-2.5 py-1 rounded bg-black/60 border border-slate-800 text-slate-500 text-xs">
              STATUS: STANDBY
            </span>
          )}
          {step === 'PHASE_1_INITIAL' && (
            <span className="px-2.5 py-1 rounded bg-magi-orange/20 border border-magi-orange text-magi-orange text-xs font-bold animate-pulse glow-orange flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-magi-orange animate-ping" />
              <span>PHASE 1: 独立分析中</span>
            </span>
          )}
          {step === 'PHASE_2_DEBATE' && (
            <span className="px-2.5 py-1 rounded bg-magi-cyan/20 border border-magi-cyan text-magi-cyan text-xs font-bold animate-pulse glow-cyan flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-magi-cyan animate-ping" />
              <span>PHASE 2: 相互熟議中</span>
            </span>
          )}
          {step === 'PHASE_3_CONSENSUS' && (
            <span className="px-2.5 py-1 rounded bg-magi-yellow/20 border border-magi-yellow text-magi-yellow text-xs font-bold animate-pulse flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-magi-yellow animate-ping" />
              <span>PHASE 3: 最終合議中</span>
            </span>
          )}
          {step === 'COMPLETED' && (
            <span className="px-2.5 py-1 rounded bg-magi-green/20 border border-magi-green text-magi-green text-xs font-bold glow-green flex items-center space-x-1">
              <span>CODE 601: 決議完了</span>
            </span>
          )}
          {step === 'ERROR' && (
            <span className="px-2.5 py-1 rounded bg-magi-red/20 border border-magi-red text-magi-red text-xs font-bold glow-red">
              ERROR: SYSTEM FAILURE
            </span>
          )}
        </div>

        {/* Endpoint Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono-nerv bg-black/40 px-3 py-1.5 rounded border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-magi-green" />
          <span className="text-slate-400">ENDPOINT:</span>
          <span className="text-magi-green font-semibold truncate max-w-[140px]">
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
          onClick={onOpenHistory}
          className="flex items-center space-x-1.5 text-xs font-mono-nerv px-3 py-2 rounded bg-black/50 text-slate-300 border border-slate-800 hover:border-magi-orange/50 hover:text-magi-orange hover:bg-black/80 transition-all"
          title="合議セッション履歴（アーカイブ）を開く"
        >
          <History className="w-4 h-4 text-magi-orange" />
          <span className="hidden sm:inline">HISTORIES</span>
        </button>

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
