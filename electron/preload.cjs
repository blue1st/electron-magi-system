const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  updateDockIcon: (dataUrl, step) => ipcRenderer.send('update-dock-icon', { dataUrl, step }),
  bounceDock: (type) => ipcRenderer.send('bounce-dock', { type }),
  setBadge: (text) => ipcRenderer.send('set-badge', { text }),
  toggleFullScreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullScreen: () => ipcRenderer.invoke('is-fullscreen'),
  onFullScreenChange: (callback) => {
    const listener = (event, isFullScreen) => callback(isFullScreen);
    ipcRenderer.on('fullscreen-change', listener);
    return () => {
      ipcRenderer.removeListener('fullscreen-change', listener);
    };
  }
});
