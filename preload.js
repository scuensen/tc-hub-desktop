const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: ipcRenderer.sendSync('get-version-sync'),
  checkForUpdates: () => ipcRenderer.invoke('check-update'),
  onUpdateStatus: (cb) => {
    ipcRenderer.on('update-status', (_event, status) => cb(status));
  },
});
