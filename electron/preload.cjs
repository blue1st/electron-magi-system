const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  updateDockIcon: (dataUrl, step) => ipcRenderer.send('update-dock-icon', { dataUrl, step }),
});
