const { app, BrowserWindow, Menu, shell, dialog, nativeTheme } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const APP_URL = 'https://tc-hub-kanzlei.vercel.app';

let mainWindow;

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
          click: () => autoUpdater.checkForUpdatesAndNotify(),
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Auto-updater events (only active in production build)
autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update verfügbar',
    message: 'Ein neues Update ist verfügbar und wird heruntergeladen.',
    buttons: ['OK'],
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update bereit',
    message: 'Update heruntergeladen. TC Hub wird nach dem Neustart aktualisiert.',
    buttons: ['Jetzt neu starten', 'Später'],
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});
