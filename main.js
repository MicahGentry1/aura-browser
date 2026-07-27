const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

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

// IPC Handler to open external link / file location
ipcMain.on('open-external', (event, targetUrl) => {
  shell.openExternal(targetUrl);
});

ipcMain.on('show-item-in-folder', (event, filePath) => {
  shell.showItemInFolder(filePath);
});
