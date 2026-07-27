const electronInstaller = require('electron-winstaller');
const path = require('path');

async function buildInstaller() {
  console.log('Building Windows Setup Installer (AuraBrowserSetup.exe)...');
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: path.join(__dirname, 'dist', 'Aura Browser-win32-x64'),
      outputDirectory: path.join(__dirname, 'dist-installer'),
      authors: 'Antigravity AI',
      exe: 'Aura Browser.exe',
      setupExe: 'AuraBrowserSetup.exe',
      setupMsi: 'AuraBrowserSetup.msi',
      title: 'Aura Browser',
      shortcutName: 'Aura Browser',
      description: 'Modern desktop web browser powered by the Chromium engine',
      noMsi: true
    });
    console.log('BUILD SUCCESS: Windows installer created at dist-installer/AuraBrowserSetup.exe');
  } catch (e) {
    console.error('Build Error:', e.message);
    process.exit(1);
  }
}

buildInstaller();
