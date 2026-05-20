const { contextBridge } = require('electron');

// No APIs exposed — pure shell wrapper, web app runs as-is
contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: process.env.npm_package_version,
});
