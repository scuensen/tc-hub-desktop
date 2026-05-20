const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: process.env.npm_package_version,
  checkForUpdates: () => ipcRenderer.invoke('check-update'),
  onUpdateStatus: (cb) => {
    ipcRenderer.on('update-status', (_event, status) => cb(status));
  },
});
