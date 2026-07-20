import { Settings, ConsensusResult, HumanInterventionRequest } from '../types';
import { playAlertSound, playCompletionSound } from './soundService';

/**
 * Request Notification permission if needed
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      console.warn('Could not request notification permission:', e);
    }
  }
}

/**
 * Notify user when human intervention is required
 */
export function notifyHumanInterventionRequired(request: HumanInterventionRequest, settings: Settings) {
  // 1. Sound Alert
  if (settings.soundEffects) {
    playAlertSound();
  }

  // 2. Notifications & Dock Bounce
  if (settings.enableNotifications !== false) {
    requestNotificationPermission();

    // OS Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('【MAGI SYSTEM】緊急人間介入要求', {
          body: `[CODE: 999] 最高統括官（人間）の判断・指示が要請されています:\n「${request.question}」`,
          silent: true // sound is handled by Web Audio
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }

    // Electron Dock Bounce & Badge
    if (window.electronAPI) {
      if (typeof window.electronAPI.bounceDock === 'function') {
        window.electronAPI.bounceDock('critical');
      }
      if (typeof window.electronAPI.setBadge === 'function') {
        window.electronAPI.setBadge('!');
      }
    }
  }
}

/**
 * Notify user when consensus deliberation is completed
 */
export function notifyConsensusCompleted(consensus: ConsensusResult, settings: Settings) {
  // 1. Sound Chime
  if (settings.soundEffects) {
    playCompletionSound();
  }

  // 2. Notifications & Dock Bounce
  if (settings.enableNotifications !== false) {
    requestNotificationPermission();

    const decisionText = consensus.finalStanceLabel || consensus.finalDecision;

    // OS Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('【MAGI SYSTEM】最終決議完了', {
          body: `議題の熟議および最終統合決議が完了しました。\n【判定】: ${decisionText}`,
          silent: true
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }

    // Electron Dock Bounce & Badge
    if (window.electronAPI) {
      if (typeof window.electronAPI.bounceDock === 'function') {
        window.electronAPI.bounceDock('informational');
      }
      if (typeof window.electronAPI.setBadge === 'function') {
        window.electronAPI.setBadge('OK');
      }
    }
  }
}
