const { ipcRenderer } = require('electron');

class AuraBrowser {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.bookmarks = JSON.parse(localStorage.getItem('aura_bookmarks') || '[]');
    this.history = JSON.parse(localStorage.getItem('aura_history') || '[]');
    this.downloads = [];
    this.loadedExtensions = JSON.parse(localStorage.getItem('aura_extensions') || '[]');
    this.blockedCount = 0;
    this.shieldEnabled = true;

    this.initDOM();
    this.initEventListeners();
    this.initIPC();
    this.renderBookmarksBar();
    this.loadSavedExtensions();

    // Create initial tab
    this.createTab();
  }

  initDOM() {
    this.tabBar = document.getElementById('tabBar');
    this.newTabBtn = document.getElementById('newTabBtn');
    this.backBtn = document.getElementById('backBtn');
    this.forwardBtn = document.getElementById('forwardBtn');
    this.reloadBtn = document.getElementById('reloadBtn');
    this.homeBtn = document.getElementById('homeBtn');
    this.urlForm = document.getElementById('urlForm');
    this.urlInput = document.getElementById('urlInput');
    this.securityBadge = document.getElementById('securityBadge');
    this.bookmarkToggleBtn = document.getElementById('bookmarkToggleBtn');
    this.bookmarksBar = document.getElementById('bookmarksBar');
    this.progressBar = document.getElementById('progressBar');
    this.webviewContainer = document.getElementById('webviewContainer');

    // Shield Elements
    this.shieldBtn = document.getElementById('shieldBtn');
    this.shieldCount = document.getElementById('shieldCount');

    // Zoom Elements
    this.zoomOutBtn = document.getElementById('zoomOutBtn');
    this.zoomInBtn = document.getElementById('zoomInBtn');
    this.zoomVal = document.getElementById('zoomVal');

    // Find in Page Elements
    this.findInPageBtn = document.getElementById('findInPageBtn');
    this.findBar = document.getElementById('findBar');
    this.findInput = document.getElementById('findInput');
    this.findCount = document.getElementById('findCount');
    this.findPrevBtn = document.getElementById('findPrevBtn');
    this.findNextBtn = document.getElementById('findNextBtn');
    this.closeFindBtn = document.getElementById('closeFindBtn');

    // Action Drawers & Buttons
    this.pipBtn = document.getElementById('pipBtn');
    this.readerModeBtn = document.getElementById('readerModeBtn');
    this.toggleBookmarksBarBtn = document.getElementById('toggleBookmarksBarBtn');
    this.historyDrawerBtn = document.getElementById('historyDrawerBtn');
    this.downloadsDrawerBtn = document.getElementById('downloadsDrawerBtn');
    this.extensionsDrawerBtn = document.getElementById('extensionsDrawerBtn');
    this.checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
    this.screenshotBtn = document.getElementById('screenshotBtn');
    this.devToolsBtn = document.getElementById('devToolsBtn');

    // Updater Banner Elements
    this.updateBanner = document.getElementById('updateBanner');
    this.updateMsg = document.getElementById('updateMsg');
    this.startDownloadUpdateBtn = document.getElementById('startDownloadUpdateBtn');
    this.restartAppUpdateBtn = document.getElementById('restartAppUpdateBtn');
    this.closeUpdateBannerBtn = document.getElementById('closeUpdateBannerBtn');

    this.historyDrawer = document.getElementById('historyDrawer');
    this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.historySearchInput = document.getElementById('historySearchInput');
    this.historyList = document.getElementById('historyList');

    this.downloadsDrawer = document.getElementById('downloadsDrawer');
    this.closeDownloadsBtn = document.getElementById('closeDownloadsBtn');
    this.downloadsList = document.getElementById('downloadsList');
    this.downloadBadge = document.getElementById('downloadBadge');

    this.extensionsDrawer = document.getElementById('extensionsDrawer');
    this.closeExtensionsBtn = document.getElementById('closeExtensionsBtn');
    this.loadUnpackedBtn = document.getElementById('loadUnpackedBtn');
    this.extensionsList = document.getElementById('extensionsList');
  }

  initEventListeners() {
    // New tab button
    this.newTabBtn.addEventListener('click', () => this.createTab());

    // Updater controls
    this.checkUpdatesBtn.addEventListener('click', () => {
      ipcRenderer.send('check-for-updates');
    });

    this.startDownloadUpdateBtn.addEventListener('click', () => {
      ipcRenderer.send('download-update');
    });

    this.restartAppUpdateBtn.addEventListener('click', () => {
      ipcRenderer.send('restart-and-install');
    });

    this.closeUpdateBannerBtn.addEventListener('click', () => {
      this.updateBanner.style.display = 'none';
    });

    // Screenshot
    this.screenshotBtn.addEventListener('click', () => this.captureScreenshot());

    // Navigation buttons
    this.backBtn.addEventListener('click', () => {
      const activeTab = this.getActiveTab();
      if (activeTab && activeTab.webview.canGoBack()) {
        activeTab.webview.goBack();
      }
    });

    this.forwardBtn.addEventListener('click', () => {
      const activeTab = this.getActiveTab();
      if (activeTab && activeTab.webview.canGoForward()) {
        activeTab.webview.goForward();
      }
    });

    this.reloadBtn.addEventListener('click', () => {
      const activeTab = this.getActiveTab();
      if (!activeTab) return;
      if (activeTab.isLoading) {
        activeTab.webview.stop();
      } else {
        activeTab.webview.reload();
      }
    });

    this.homeBtn.addEventListener('click', () => {
      const activeTab = this.getActiveTab();
      if (activeTab) {
        activeTab.webview.loadURL(`file://${__dirname}/newtab.html`);
      }
    });

    // URL Form submission
    this.urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = this.urlInput.value.trim();
      if (!input) return;

      const targetUrl = this.formatUrl(input);
      const activeTab = this.getActiveTab();
      if (activeTab) {
        activeTab.webview.loadURL(targetUrl);
      }
    });

    // Auto-select text on URL bar focus
    this.urlInput.addEventListener('focus', () => this.urlInput.select());

    // Bookmarks toggle button
    this.bookmarkToggleBtn.addEventListener('click', () => this.toggleCurrentBookmark());
    this.toggleBookmarksBarBtn.addEventListener('click', () => {
      this.bookmarksBar.style.display = this.bookmarksBar.style.display === 'none' ? 'flex' : 'none';
    });

    // History Drawer
    this.historyDrawerBtn.addEventListener('click', () => {
      this.downloadsDrawer.classList.remove('open');
      this.historyDrawer.classList.toggle('open');
      this.renderHistoryList();
    });

    this.closeHistoryBtn.addEventListener('click', () => {
      this.historyDrawer.classList.remove('open');
    });

    this.clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Clear all browsing history?')) {
        this.history = [];
        localStorage.setItem('aura_history', JSON.stringify([]));
        this.renderHistoryList();
      }
    });

    this.historySearchInput.addEventListener('input', (e) => {
      this.renderHistoryList(e.target.value.trim());
    });

    // Downloads Drawer
    this.downloadsDrawerBtn.addEventListener('click', () => {
      this.historyDrawer.classList.remove('open');
      this.extensionsDrawer.classList.remove('open');
      this.downloadsDrawer.classList.toggle('open');
      this.downloadBadge.style.display = 'none';
    });

    this.closeDownloadsBtn.addEventListener('click', () => {
      this.downloadsDrawer.classList.remove('open');
    });

    // Extensions Drawer
    this.extensionsDrawerBtn.addEventListener('click', () => {
      this.historyDrawer.classList.remove('open');
      this.downloadsDrawer.classList.remove('open');
      this.extensionsDrawer.classList.toggle('open');
      this.renderExtensionsList();
    });

    this.closeExtensionsBtn.addEventListener('click', () => {
      this.extensionsDrawer.classList.remove('open');
    });

    this.loadUnpackedBtn.addEventListener('click', async () => {
      const res = await ipcRenderer.invoke('select-extension-folder');
      if (res && res.success) {
        this.addExtensionEntry(res);
        this.renderExtensionsList();
      } else if (res && res.error) {
        alert('Failed to load extension: ' + res.error);
      }
    });

    // Privacy & Ad Shield Toggle
    this.shieldBtn.addEventListener('click', () => {
      this.shieldEnabled = !this.shieldEnabled;
      if (this.shieldEnabled) {
        this.shieldBtn.classList.add('active');
        this.shieldBtn.title = 'Privacy & Ad Shield (Active)';
      } else {
        this.shieldBtn.classList.remove('active');
        this.shieldBtn.title = 'Privacy & Ad Shield (Disabled)';
      }
      ipcRenderer.send('toggle-shield', this.shieldEnabled);
    });

    // Zoom Controls
    this.zoomInBtn.addEventListener('click', () => this.adjustZoom(0.1));
    this.zoomOutBtn.addEventListener('click', () => this.adjustZoom(-0.1));
    this.zoomVal.addEventListener('click', () => this.resetZoom());

    // Picture-in-Picture
    this.pipBtn.addEventListener('click', () => this.togglePiP());

    // Reader Mode
    this.readerModeBtn.addEventListener('click', () => this.toggleReaderMode());

    // Find in Page Bar
    this.findInPageBtn.addEventListener('click', () => this.toggleFindBar());
    this.closeFindBtn.addEventListener('click', () => this.hideFindBar());

    this.findInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const activeTab = this.getActiveTab();
      if (!activeTab || !activeTab.webview) return;

      if (query.trim() === '') {
        activeTab.webview.stopFindInPage('clearSelection');
        this.findCount.textContent = '0 / 0';
      } else {
        activeTab.webview.findInPage(query, { forward: true, findNext: false });
      }
    });

    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.webview && this.findInput.value.trim()) {
          activeTab.webview.findInPage(this.findInput.value.trim(), { forward: !e.shiftKey, findNext: true });
        }
      } else if (e.key === 'Escape') {
        this.hideFindBar();
      }
    });

    this.findNextBtn.addEventListener('click', () => {
      const activeTab = this.getActiveTab();
      if (activeTab && activeTab.webview && this.findInput.value.trim()) {
        activeTab.webview.findInPage(this.findInput.value.trim(), { forward: true, findNext: true });
      }
    });

    this.findPrevBtn.addEventListener('click', () => {
      const activeTab = this.getActiveTab();
      if (activeTab && activeTab.webview && this.findInput.value.trim()) {
        activeTab.webview.findInPage(this.findInput.value.trim(), { forward: false, findNext: true });
      }
    });

    // DevTools Button
    this.devToolsBtn.addEventListener('click', () => this.openDevToolsForActiveTab());

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          this.toggleFindBar();
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          this.adjustZoom(0.1);
        } else if (e.key === '-') {
          e.preventDefault();
          this.adjustZoom(-0.1);
        } else if (e.key === '0') {
          e.preventDefault();
          this.resetZoom();
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          this.createTab();
        } else if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          if (this.activeTabId) this.closeTab(this.activeTabId);
        } else if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          this.urlInput.focus();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          const activeTab = this.getActiveTab();
          if (activeTab) activeTab.webview.reload();
        } else if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          this.historyDrawerBtn.click();
        } else if (e.key.toLowerCase() === 'b' && e.shiftKey) {
          e.preventDefault();
          this.toggleBookmarksBarBtn.click();
        } else if (e.key.toLowerCase() === 's' && e.shiftKey) {
          e.preventDefault();
          this.captureScreenshot();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.switchNextTab();
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        this.openDevToolsForActiveTab();
      } else if (e.key === 'Escape') {
        if (this.findBar.style.display !== 'none') {
          this.hideFindBar();
        }
      }
    });
  }

  initIPC() {
    ipcRenderer.on('tracker-blocked', (event, url) => {
      this.blockedCount++;
      this.shieldCount.textContent = this.blockedCount;
    });

    ipcRenderer.on('download-started', (event, data) => {
      this.downloads.unshift({
        id: data.id,
        filename: data.filename,
        totalBytes: data.totalBytes,
        receivedBytes: 0,
        state: 'progressing',
        path: data.savePath
      });
      this.downloadBadge.style.display = 'block';
      this.renderDownloadsList();
    });

    ipcRenderer.on('download-updated', (event, data) => {
      const item = this.downloads.find(d => d.id === data.id);
      if (item) {
        item.receivedBytes = data.receivedBytes;
        item.state = data.state;
        this.renderDownloadsList();
      }
    });

    ipcRenderer.on('download-completed', (event, data) => {
      const item = this.downloads.find(d => d.id === data.id);
      if (item) {
        item.state = data.state;
        item.path = data.path;
        this.renderDownloadsList();
      }
    });

    // Auto Updater IPC Listeners
    ipcRenderer.on('checking-for-update', () => {
      this.updateBanner.style.display = 'flex';
      this.updateMsg.textContent = '🔍 Checking GitHub for new releases...';
      this.startDownloadUpdateBtn.style.display = 'none';
      this.restartAppUpdateBtn.style.display = 'none';
    });

    ipcRenderer.on('update-available', (event, info) => {
      this.updateBanner.style.display = 'flex';
      this.updateMsg.textContent = `🚀 Aura Browser v${info.version} is available!`;
      this.startDownloadUpdateBtn.style.display = 'inline-block';
      this.restartAppUpdateBtn.style.display = 'none';
    });

    ipcRenderer.on('update-not-available', (event, info) => {
      this.updateBanner.style.display = 'flex';
      this.updateMsg.textContent = info && info.isDev ? '✅ Running latest source (Dev Mode)' : `✅ Aura Browser is up to date!`;
      this.startDownloadUpdateBtn.style.display = 'none';
      this.restartAppUpdateBtn.style.display = 'none';
      setTimeout(() => {
        this.updateBanner.style.display = 'none';
      }, 3500);
    });

    ipcRenderer.on('update-download-progress', (event, progressObj) => {
      this.updateBanner.style.display = 'flex';
      this.updateMsg.textContent = `⏳ Downloading update... ${Math.round(progressObj.percent)}%`;
    });

    ipcRenderer.on('update-downloaded', (event, info) => {
      this.updateBanner.style.display = 'flex';
      this.updateMsg.textContent = `✨ Update v${info.version} downloaded! Ready to install.`;
      this.startDownloadUpdateBtn.style.display = 'none';
      this.restartAppUpdateBtn.style.display = 'inline-block';
    });

    ipcRenderer.on('update-error', (event, message) => {
      this.updateBanner.style.display = 'flex';
      this.updateMsg.textContent = `ℹ️ Up to date (or checked GitHub Releases)`;
      this.startDownloadUpdateBtn.style.display = 'none';
      this.restartAppUpdateBtn.style.display = 'none';
      setTimeout(() => {
        this.updateBanner.style.display = 'none';
      }, 3500);
    });
  }

  adjustZoom(delta) {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;

    activeTab.zoomFactor = Math.min(3.0, Math.max(0.3, Math.round((activeTab.zoomFactor + delta) * 10) / 10));
    activeTab.webview.setZoomFactor(activeTab.zoomFactor);
    this.zoomVal.textContent = Math.round(activeTab.zoomFactor * 100) + '%';
  }

  resetZoom() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;

    activeTab.zoomFactor = 1.0;
    activeTab.webview.setZoomFactor(1.0);
    this.zoomVal.textContent = '100%';
  }

  toggleFindBar() {
    if (this.findBar.style.display === 'none') {
      this.findBar.style.display = 'flex';
      this.findInput.focus();
      this.findInput.select();
    } else {
      this.hideFindBar();
    }
  }

  hideFindBar() {
    this.findBar.style.display = 'none';
    const activeTab = this.getActiveTab();
    if (activeTab && activeTab.webview) {
      activeTab.webview.stopFindInPage('clearSelection');
    }
  }

  formatUrl(input) {
    if (input.match(/^(https?:\/\/|[a-z0-9]+[a-z0-9-\.]*\.[a-z]{2,})/i)) {
      return input.startsWith('http') ? input : 'https://' + input;
    } else {
      return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
  }

  createTab(url = `file://${__dirname}/newtab.html`) {
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    // Create Webview Element
    const webview = document.createElement('webview');
    webview.id = 'webview_' + tabId;
    webview.setAttribute('src', url);
    webview.setAttribute('allowpopups', 'true');
    webview.setAttribute('webpreferences', 'allowRunningInsecureContent=no');

    this.webviewContainer.appendChild(webview);

    const tabData = {
      id: tabId,
      title: 'New Tab',
      url: url,
      favicon: null,
      isLoading: false,
      zoomFactor: 1.0,
      isPlayingAudio: false,
      isMuted: false,
      isPinned: false,
      webview: webview
    };

    this.tabs.push(tabData);

    // Attach Webview Event Listeners
    this.attachWebviewEvents(tabData);

    // Render Tab UI
    this.renderTabElement(tabData);

    // Switch to new tab
    this.switchTab(tabId);
  }

  attachWebviewEvents(tab) {
    const wv = tab.webview;

    wv.addEventListener('did-start-loading', () => {
      tab.isLoading = true;
      if (tab.id === this.activeTabId) {
        this.updateNavState();
        this.progressBar.style.width = '35%';
        this.progressBar.style.opacity = '1';
      }
    });

    wv.addEventListener('did-stop-loading', () => {
      tab.isLoading = false;
      if (tab.id === this.activeTabId) {
        this.updateNavState();
        this.progressBar.style.width = '100%';
        setTimeout(() => {
          if (!tab.isLoading) this.progressBar.style.opacity = '0';
        }, 300);
      }
    });

    wv.addEventListener('page-title-updated', (e) => {
      tab.title = e.title || 'Untitled Page';
      this.updateTabUI(tab);
    });

    wv.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        tab.favicon = e.favicons[0];
        this.updateTabUI(tab);
      }
    });

    wv.addEventListener('media-started-playing', () => {
      tab.isPlayingAudio = true;
      this.updateTabAudioUI(tab);
    });

    wv.addEventListener('media-paused', () => {
      tab.isPlayingAudio = false;
      this.updateTabAudioUI(tab);
    });

    wv.addEventListener('found-in-page', (e) => {
      if (tab.id === this.activeTabId) {
        this.findCount.textContent = `${e.result.activeMatchOrdinal} / ${e.result.matches}`;
      }
    });

    wv.addEventListener('did-navigate', (e) => {
      tab.url = e.url;
      this.onNavigationOccurred(tab, e.url);
    });

    wv.addEventListener('did-navigate-in-page', (e) => {
      tab.url = e.url;
      this.onNavigationOccurred(tab, e.url);
    });

    // Handle target="_blank" links inside webview
    wv.addEventListener('new-window', (e) => {
      e.preventDefault();
      this.createTab(e.url);
    });
  }

  onNavigationOccurred(tab, url) {
    if (tab.id === this.activeTabId) {
      this.updateAddressBar(url);
      this.updateSecurityBadge(url);
      this.updateBookmarkButtonState(url);
      this.updateNavButtons();
    }

    // Save history entry (skip internal newtab pages)
    if (url && !url.includes('newtab.html') && !url.startsWith('file://')) {
      this.addHistoryEntry(tab.title || url, url);
    }
  }

  renderTabElement(tab) {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.id = 'tab_el_' + tab.id;

    if (tab.isPinned) {
      tabEl.classList.add('pinned');
    }

    const faviconEl = document.createElement('img');
    faviconEl.className = 'tab-favicon';
    faviconEl.id = `favicon_${tab.id}`;
    faviconEl.src = this.getFaviconSrc(tab);

    const titleEl = document.createElement('span');
    titleEl.className = 'tab-title';
    titleEl.id = `title_${tab.id}`;
    titleEl.textContent = tab.title;

    const audioBtn = document.createElement('button');
    audioBtn.className = 'tab-audio-btn';
    audioBtn.id = `audio_${tab.id}`;
    audioBtn.style.display = 'none';
    audioBtn.innerHTML = '🔊';

    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tab.isMuted = !tab.isMuted;
      if (tab.webview && tab.webview.setAudioMuted) {
        tab.webview.setAudioMuted(tab.isMuted);
      }
      this.updateTabAudioUI(tab);
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.id = `close_${tab.id}`;
    closeBtn.innerHTML = '&times;';

    tabEl.appendChild(faviconEl);
    tabEl.appendChild(titleEl);
    tabEl.appendChild(audioBtn);
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close-btn') && !e.target.classList.contains('tab-audio-btn')) {
        this.switchTab(tab.id);
      }
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });

    tabEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      tab.isPinned = !tab.isPinned;
      this.renderAllTabs();
      this.savePinnedTabs();
    });

    if (this.newTabBtn && this.newTabBtn.parentNode === this.tabBar) {
      this.tabBar.insertBefore(tabEl, this.newTabBtn);
    } else {
      this.tabBar.appendChild(tabEl);
    }
  }

  getFaviconSrc(tab) {
    if (tab.favicon) return tab.favicon;
    if (tab.url && tab.url.includes('newtab.html')) {
      return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/></svg>";
    }
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>";
  }

  updateTabUI(tab) {
    const titleEl = document.getElementById(`title_${tab.id}`);
    const faviconEl = document.getElementById(`favicon_${tab.id}`);

    if (titleEl) titleEl.textContent = tab.title;
    if (faviconEl) faviconEl.src = this.getFaviconSrc(tab);
  }

  updateTabAudioUI(tab) {
    const audioBtn = document.getElementById(`audio_${tab.id}`);
    if (!audioBtn) return;

    if (tab.isPlayingAudio || tab.isMuted) {
      audioBtn.style.display = 'flex';
      if (tab.isMuted) {
        audioBtn.classList.add('muted');
        audioBtn.innerHTML = '🔇';
        audioBtn.title = 'Unmute Tab';
      } else {
        audioBtn.classList.remove('muted');
        audioBtn.innerHTML = '🔊';
        audioBtn.title = 'Mute Tab';
      }
    } else {
      audioBtn.style.display = 'none';
    }
  }

  switchTab(tabId) {
    const tabToActivate = this.tabs.find(t => t.id === tabId);
    if (!tabToActivate) return;

    this.activeTabId = tabId;

    // Update Tab UI Classes
    this.tabs.forEach(tab => {
      const el = document.getElementById(`tab_el_${tab.id}`);
      if (el) {
        if (tab.id === tabId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }

      if (tab.webview) {
        if (tab.id === tabId) {
          tab.webview.classList.add('active');
        } else {
          tab.webview.classList.remove('active');
        }
      }
    });

    // Sync chrome controls for activated tab
    this.updateAddressBar(tabToActivate.url);
    this.updateSecurityBadge(tabToActivate.url);
    this.updateBookmarkButtonState(tabToActivate.url);
    this.updateNavButtons();
  }

  switchNextTab() {
    if (this.tabs.length <= 1) return;
    const currentIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    this.switchTab(this.tabs[nextIndex].id);
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const tab = this.tabs[index];

    // Remove DOM elements
    if (tab.webview && tab.webview.parentNode) {
      tab.webview.parentNode.removeChild(tab.webview);
    }
    const tabEl = document.getElementById(`tab_el_${tabId}`);
    if (tabEl && tabEl.parentNode) {
      tabEl.parentNode.removeChild(tabEl);
    }

    this.tabs.splice(index, 1);

    if (this.tabs.length === 0) {
      this.createTab();
    } else if (this.activeTabId === tabId) {
      const newActiveIndex = Math.max(0, index - 1);
      this.switchTab(this.tabs[newActiveIndex].id);
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  updateAddressBar(url) {
    if (!url) return;
    if (url.includes('newtab.html') || url.startsWith('file://')) {
      this.urlInput.value = '';
    } else {
      this.urlInput.value = url;
    }
  }

  updateSecurityBadge(url) {
    if (!url || url.includes('newtab.html')) {
      this.securityBadge.className = 'security-badge';
      return;
    }

    if (url.startsWith('https://')) {
      this.securityBadge.className = 'security-badge secure';
      this.securityBadge.title = 'Secure connection (HTTPS)';
    } else if (url.startsWith('http://')) {
      this.securityBadge.className = 'security-badge insecure';
      this.securityBadge.title = 'Insecure connection (HTTP)';
    } else {
      this.securityBadge.className = 'security-badge';
    }
  }

  updateNavButtons() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;

    try {
      this.backBtn.disabled = !activeTab.webview.canGoBack();
      this.forwardBtn.disabled = !activeTab.webview.canGoForward();
    } catch (e) {
      // Ignore initial webview setup state
    }
  }

  updateNavState() {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    const reloadSvg = this.reloadBtn.querySelector('svg');
    if (activeTab.isLoading) {
      reloadSvg.classList.add('spinning');
    } else {
      reloadSvg.classList.remove('spinning');
    }
  }

  // --- BOOKMARKS MANAGEMENT ---
  toggleCurrentBookmark() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.url || activeTab.url.includes('newtab.html')) return;

    const existingIndex = this.bookmarks.findIndex(b => b.url === activeTab.url);

    if (existingIndex >= 0) {
      this.bookmarks.splice(existingIndex, 1);
    } else {
      this.bookmarks.push({
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        favicon: activeTab.favicon
      });
    }

    localStorage.setItem('aura_bookmarks', JSON.stringify(this.bookmarks));
    this.updateBookmarkButtonState(activeTab.url);
    this.renderBookmarksBar();
  }

  updateBookmarkButtonState(url) {
    const isBookmarked = this.bookmarks.some(b => b.url === url);
    if (isBookmarked) {
      this.bookmarkToggleBtn.classList.add('bookmarked');
    } else {
      this.bookmarkToggleBtn.classList.remove('bookmarked');
    }
  }

  renderBookmarksBar() {
    this.bookmarksBar.innerHTML = '';
    this.bookmarks.forEach(bm => {
      const bmEl = document.createElement('div');
      bmEl.className = 'bookmark-item';

      const iconSrc = bm.favicon || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

      bmEl.innerHTML = `
        <img class="bookmark-item-icon" src="${iconSrc}" />
        <span>${bm.title}</span>
      `;

      bmEl.addEventListener('click', () => {
        const activeTab = this.getActiveTab();
        if (activeTab) activeTab.webview.loadURL(bm.url);
      });

      this.bookmarksBar.appendChild(bmEl);
    });
  }

  // --- HISTORY MANAGEMENT ---
  addHistoryEntry(title, url) {
    // Avoid duplicate immediate entries
    if (this.history.length > 0 && this.history[0].url === url) return;

    const entry = {
      id: Date.now(),
      title: title,
      url: url,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };

    this.history.unshift(entry);
    // Keep max 500 history entries
    if (this.history.length > 500) this.history.pop();
    localStorage.setItem('aura_history', JSON.stringify(this.history));
  }

  renderHistoryList(filter = '') {
    this.historyList.innerHTML = '';

    const filtered = this.history.filter(h =>
      h.title.toLowerCase().includes(filter.toLowerCase()) ||
      h.url.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
      this.historyList.innerHTML = '<div class="empty-state">No history items found</div>';
      return;
    }

    filtered.forEach(h => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="item-info">
          <div class="item-title">${h.title}</div>
          <div class="item-sub">${h.url} • ${h.timestamp}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        const activeTab = this.getActiveTab();
        if (activeTab) activeTab.webview.loadURL(h.url);
        this.historyDrawer.classList.remove('open');
      });

      this.historyList.appendChild(item);
    });
  }

  // --- DOWNLOADS MANAGEMENT ---
  renderDownloadsList() {
    this.downloadsList.innerHTML = '';

    if (this.downloads.length === 0) {
      this.downloadsList.innerHTML = '<div class="empty-state">No active or past downloads</div>';
      return;
    }

    this.downloads.forEach(d => {
      const item = document.createElement('div');
      item.className = 'download-item';

      const progressPercent = d.totalBytes > 0 ? Math.round((d.receivedBytes / d.totalBytes) * 100) : 0;
      let statusText = `${progressPercent}%`;
      if (d.state === 'completed') statusText = 'Completed';
      else if (d.state === 'cancelled') statusText = 'Cancelled';
      else if (d.state === 'interrupted') statusText = 'Interrupted';

      item.innerHTML = `
        <div class="item-info">
          <div class="item-title">${d.filename}</div>
          <div class="item-sub">${statusText}</div>
        </div>
      `;

      if (d.state === 'completed') {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          if (d.path) {
            ipcRenderer.send('show-item-in-folder', d.path);
          }
        });
      }

      this.downloadsList.appendChild(item);
    });
  }

  // --- EXTENSIONS MANAGEMENT ---
  async loadSavedExtensions() {
    try {
      if (this.loadedExtensions.length === 0) {
        const path = require('path');
        const samplePath = path.join(__dirname, 'extensions', 'sample-aura-extension');
        const res = await ipcRenderer.invoke('load-extension-by-path', samplePath);
        if (res && res.success) {
          this.addExtensionEntry(res);
        }
      } else {
        for (const ext of this.loadedExtensions) {
          await ipcRenderer.invoke('load-extension-by-path', ext.path);
        }
      }
    } catch (err) {
      console.warn('Extension load note:', err.message);
    }
  }

  addExtensionEntry(ext) {
    if (!this.loadedExtensions.some(e => e.path === ext.path)) {
      this.loadedExtensions.push({
        id: ext.id,
        name: ext.name,
        version: ext.version,
        path: ext.path
      });
      localStorage.setItem('aura_extensions', JSON.stringify(this.loadedExtensions));
    }
  }

  async removeExtension(extId) {
    await ipcRenderer.invoke('remove-extension', extId);
    this.loadedExtensions = this.loadedExtensions.filter(e => e.id !== extId);
    localStorage.setItem('aura_extensions', JSON.stringify(this.loadedExtensions));
    this.renderExtensionsList();
  }

  renderExtensionsList() {
    this.extensionsList.innerHTML = '';
    if (this.loadedExtensions.length === 0) {
      this.extensionsList.innerHTML = '<div class="empty-state">No extensions loaded yet.<br>Click <b>+ Load Unpacked</b> to add an unpacked Chrome Extension folder.</div>';
      return;
    }

    this.loadedExtensions.forEach(ext => {
      const item = document.createElement('div');
      item.className = 'extension-item';
      item.innerHTML = `
        <div class="item-info">
          <div class="item-title">${ext.name} <span class="extension-badge">v${ext.version}</span></div>
          <div class="item-sub">${ext.path}</div>
        </div>
        <button class="text-btn danger">Remove</button>
      `;

      item.querySelector('.text-btn.danger').addEventListener('click', () => {
        this.removeExtension(ext.id);
      });

      this.extensionsList.appendChild(item);
    });
  }

  // --- PICTURE-IN-PICTURE ---
  async togglePiP() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;
    try {
      await activeTab.webview.executeJavaScript(`
        (async () => {
          const video = document.querySelector('video');
          if (video) {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            } else {
              await video.requestPictureInPicture();
            }
          } else {
            alert('No video found on this page.');
          }
        })()
      `);
    } catch (err) {
      console.warn('PiP failed:', err.message);
    }
  }

  // --- READER MODE ---
  async toggleReaderMode() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;
    try {
      await activeTab.webview.executeJavaScript(`
        (function() {
          if (document.getElementById('aura-reader-overlay')) {
            document.getElementById('aura-reader-overlay').remove();
            return;
          }
          const article = document.querySelector('article') || document.querySelector('[role=main]') || document.querySelector('.post-content, .article-body, .entry-content, main') || document.body;
          const title = document.querySelector('h1')?.textContent || document.title;
          const content = article.innerHTML;
          const overlay = document.createElement('div');
          overlay.id = 'aura-reader-overlay';
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;background:#0f172a;overflow-y:auto;padding:3rem 1rem;';
          overlay.innerHTML = '<div style="max-width:700px;margin:0 auto;font-family:Georgia,serif;color:#e2e8f0;line-height:1.8;font-size:1.15rem;"><button id="aura-reader-close" style="position:fixed;top:1rem;right:1.5rem;background:#6366f1;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:8px;cursor:pointer;font-size:0.9rem;font-family:sans-serif;z-index:1000000;">Exit Reader</button><h1 style="font-size:2rem;margin-bottom:1.5rem;color:#f8fafc;font-family:sans-serif;line-height:1.3;">' + title.replace(/</g,'&lt;') + '</h1>' + content + '</div>';
          document.body.appendChild(overlay);
          document.getElementById('aura-reader-close').addEventListener('click', function() { overlay.remove(); });
        })()
      `);
    } catch (err) {
      console.warn('Reader mode failed:', err.message);
    }
  }

  // --- TAB PINNING ---
  renderAllTabs() {
    // Remove all tab elements (but not the new tab button)
    const tabEls = this.tabBar.querySelectorAll('.tab');
    tabEls.forEach(el => el.remove());
    
    // Sort: pinned tabs first
    const sorted = [...this.tabs].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    sorted.forEach(tab => this.renderTabElement(tab));
  }

  savePinnedTabs() {
    const pinned = this.tabs.filter(t => t.isPinned).map(t => ({ url: t.url, title: t.title }));
    localStorage.setItem('aura_pinned_tabs', JSON.stringify(pinned));
  }

  // --- SCREENSHOT ---
  async captureScreenshot() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;
    try {
      const nativeImage = await activeTab.webview.capturePage();
      const dataUrl = nativeImage.toDataURL();
      const link = document.createElement('a');
      link.download = `aura-screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Flash feedback
      activeTab.webview.style.opacity = '0.5';
      setTimeout(() => { activeTab.webview.style.opacity = '1'; }, 150);
    } catch (err) {
      console.warn('Screenshot failed:', err.message);
    }
  }

  // --- DEVTOOLS INTEGRATION ---
  openDevToolsForActiveTab() {
    const activeTab = this.getActiveTab();
    if (!activeTab || !activeTab.webview) return;

    const webContentsId = activeTab.webview.getWebContentsId();
    if (webContentsId) {
      ipcRenderer.send('open-devtools', webContentsId);
    } else {
      console.warn('Webview webContents not ready yet');
    }
  }
}

// Initialize Application when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.auraBrowser = new AuraBrowser();
});
