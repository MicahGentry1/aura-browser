const { app, BrowserWindow, ipcMain, shell, Menu, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle Squirrel installer startup events
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;

function registerStartMenuShortcut() {
  if (process.platform !== 'win32') return;
  try {
    const appData = app.getPath('appData');
    const startMenuDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const shortcutPath = path.join(startMenuDir, 'Aura Browser.lnk');

    // Always ensure shortcut exists in Start Menu Programs for Windows Search
    shell.writeShortcutLink(shortcutPath, 'create', {
      target: process.execPath,
      description: 'Aura Browser - Desktop Web Browser powered by Chromium',
      workingDirectory: path.dirname(process.execPath)
    });
  } catch (err) {
    console.warn('Start Menu shortcut registration note:', err.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 800,
    minHeight: 600,
    title: 'Aura Browser (Chromium)',
    frame: true, // Native titlebar with maximize/minimize/close
    autoHideMenuBar: true,
    backgroundColor: '#0f141c',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Enables Chromium webview tag for embedding web content
      spellcheck: true
    }
  });

  mainWindow.loadFile('index.html');

  // Configure DevTools for webviews and handle permissions
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Grant standard security permissions to Chromium webviews
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.allowRunningInsecureContent = false;
  });

  // Ad & Tracker Shield - WebRequest Interception
  const filterUrls = [
    '*://*.doubleclick.net/*',
    '*://*.google-analytics.com/*',
    '*://*.adservice.google.com/*',
    '*://*.googlesyndication.com/*',
    '*://*.adnxs.com/*',
    '*://*.scorecardresearch.com/*',
    '*://*.outbrain.com/*',
    '*://*.taboola.com/*',
    '*://*.popads.net/*',
    '*://*.amazon-adsystem.com/*'
  ];

  let shieldEnabled = true;
  ipcMain.on('toggle-shield', (event, enabled) => {
    shieldEnabled = enabled;
  });

  mainWindow.webContents.session.webRequest.onBeforeRequest({ urls: filterUrls }, (details, callback) => {
    if (shieldEnabled && details.resourceType !== 'mainFrame') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tracker-blocked', details.url);
      }
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });

  // Handle file downloads
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    const filename = item.getFilename();
    const totalBytes = item.getTotalBytes();
    const downloadId = Date.now().toString();

    // Send download started event to renderer UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-started', {
        id: downloadId,
        filename: filename,
        totalBytes: totalBytes,
        savePath: item.getSavePath()
      });
    }

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('download-updated', {
            id: downloadId,
            state: 'interrupted',
            receivedBytes: item.getReceivedBytes(),
            totalBytes: totalBytes
          });
        }
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          // Paused
        } else {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('download-updated', {
              id: downloadId,
              state: 'progressing',
              receivedBytes: item.getReceivedBytes(),
              totalBytes: totalBytes
            });
          }
        }
      }
    });

    item.once('done', (event, state) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-completed', {
          id: downloadId,
          state: state, // 'completed', 'cancelled', or 'interrupted'
          filename: filename,
          path: item.getSavePath()
        });
      }
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerStartMenuShortcut();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler to open Chromium DevTools for target webview
ipcMain.on('open-devtools', (event, webContentsId) => {
  const { webContents } = require('electron');
  const targetWebContents = webContents.fromId(webContentsId);
  if (targetWebContents) {
    targetWebContents.openDevTools({ mode: 'detach' });
  }
});

// IPC Handlers for Chromium Extensions
ipcMain.handle('select-extension-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Unpacked Chrome Extension Folder (with manifest.json)'
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const extPath = result.filePaths[0];
  try {
    const ext = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
    return {
      success: true,
      id: ext.id,
      name: ext.name,
      version: ext.version,
      path: extPath
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-extension-by-path', async (event, extPath) => {
  try {
    const ext = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
    return {
      success: true,
      id: ext.id,
      name: ext.name,
      version: ext.version,
      path: extPath
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('remove-extension', async (event, extId) => {
  try {
    session.defaultSession.removeExtension(extId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler to open external link / file location
ipcMain.on('open-external', (event, targetUrl) => {
  shell.openExternal(targetUrl);
});

ipcMain.on('show-item-in-folder', (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// --- AUTO UPDATER INTEGRATION ---
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

ipcMain.on('check-for-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(err => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-error', err ? err.message : 'Update check failed');
      }
    });
  } else {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available', { version: app.getVersion(), isDev: true });
    }
  }
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('restart-and-install', () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('checking-for-update', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('checking-for-update');
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', err ? err.message : 'Update error');
  }
});
