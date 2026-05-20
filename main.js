const { app, BrowserWindow, Menu, shell, dialog, nativeTheme, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const APP_URL = 'https://tc-hub-kanzlei.vercel.app';

let mainWindow;
let manualUpdateCheck = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'TC Hub',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false,
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser, not in app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') && !url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: 'Über TC Hub' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'TC Hub ausblenden' },
        { role: 'hideOthers', label: 'Andere ausblenden' },
        { role: 'unhide', label: 'Alle anzeigen' },
        { type: 'separator' },
        { role: 'quit', label: 'TC Hub beenden' },
      ],
    }] : []),
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Im Browser öffnen',
          accelerator: isMac ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
          click: () => shell.openExternal(APP_URL),
        },
        { type: 'separator' },
        {
          label: 'Seite neu laden',
          accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Fenster schließen' } : { role: 'quit', label: 'Beenden' },
      ],
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo', label: 'Rückgängig' },
        { role: 'redo', label: 'Wiederholen' },
        { type: 'separator' },
        { role: 'cut', label: 'Ausschneiden' },
        { role: 'copy', label: 'Kopieren' },
        { role: 'paste', label: 'Einfügen' },
        { role: 'selectAll', label: 'Alles auswählen' },
      ],
    },
    {
      label: 'Ansicht',
      submenu: [
        {
          label: 'Zoom zurücksetzen',
          accelerator: isMac ? 'Cmd+0' : 'Ctrl+0',
          click: () => mainWindow?.webContents.setZoomLevel(0),
        },
        {
          label: 'Vergrößern',
          accelerator: isMac ? 'Cmd+Plus' : 'Ctrl+Plus',
          click: () => {
            const level = mainWindow?.webContents.getZoomLevel() ?? 0;
            mainWindow?.webContents.setZoomLevel(Math.min(level + 0.5, 3));
          },
        },
        {
          label: 'Verkleinern',
          accelerator: isMac ? 'Cmd+-' : 'Ctrl+-',
          click: () => {
            const level = mainWindow?.webContents.getZoomLevel() ?? 0;
            mainWindow?.webContents.setZoomLevel(Math.max(level - 0.5, -3));
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Vollbild' },
        { type: 'separator' },
        {
          label: 'Entwicklertools',
          accelerator: isMac ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Fenster',
      submenu: [
        { role: 'minimize', label: 'Minimieren' },
        { role: 'zoom', label: 'Zoomen' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front', label: 'Alle nach vorne' }] : []),
      ],
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Nach Updates suchen',
          click: () => {
            manualUpdateCheck = true;
            if (app.isPackaged) {
              autoUpdater.checkForUpdates();
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Entwicklungsmodus',
                message: 'Update-Check nur in der gebauten App verfügbar.',
                buttons: ['OK'],
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'TC Hub Version',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'TC Hub',
            message: `TC Hub v${app.getVersion()}`,
            detail: APP_URL,
          }),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Check for updates 5s after start (only in packaged app, not dev)
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(status) {
  mainWindow?.webContents.send('update-status', status);
}

ipcMain.on('get-version-sync', (event) => { event.returnValue = app.getVersion(); });

ipcMain.handle('check-update', () => {
  manualUpdateCheck = true;
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  } else {
    sendUpdateStatus({ type: 'not-available', version: app.getVersion() });
  }
});

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus({ type: 'checking' });
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus({ type: 'not-available', version: app.getVersion() });
  if (manualUpdateCheck) {
    manualUpdateCheck = false;
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Kein Update',
      message: `TC Hub v${app.getVersion()} ist aktuell.`,
      buttons: ['OK'],
    });
  }
});

autoUpdater.on('update-available', (info) => {
  manualUpdateCheck = false;
  sendUpdateStatus({ type: 'available', version: info.version });
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update verfügbar',
    message: `TC Hub v${info.version} wird heruntergeladen…`,
    detail: 'Das Update wird im Hintergrund installiert. Sie werden benachrichtigt sobald es bereit ist.',
    buttons: ['OK'],
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus({ type: 'downloading', percent: Math.round(progress.percent) });
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus({ type: 'downloaded', version: info.version });
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update bereit',
    message: 'Update heruntergeladen.',
    detail: 'TC Hub wird nach dem Neustart aktualisiert.',
    buttons: ['Jetzt neu starten', 'Später'],
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (err) => {
  sendUpdateStatus({ type: 'error', message: err.message });
  if (manualUpdateCheck) {
    manualUpdateCheck = false;
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Update-Fehler',
      message: 'Update konnte nicht geprüft werden.',
      detail: err.message,
      buttons: ['OK'],
    });
  }
});
