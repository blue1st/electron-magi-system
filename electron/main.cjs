const { app, BrowserWindow, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    title: 'MAGI SYSTEM - Tripartite Consensus Engine',
    backgroundColor: '#08090c',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// Dynamic Dock Icon IPC Listener
ipcMain.on('update-dock-icon', (event, { dataUrl }) => {
  try {
    if (dataUrl) {
      const img = nativeImage.createFromDataURL(dataUrl);
      if (process.platform === 'darwin' && app.dock) {
        app.dock.setIcon(img);
      }
      if (mainWindow) {
        mainWindow.setIcon(img);
      }
    }
  } catch (err) {
    console.error('Failed to update dynamic dock icon:', err);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
