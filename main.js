const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const  Dashboard = require('./src/dashboard.js');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
  // Opzionale: apre il DevTools per il debug
  win.webContents.openDevTools()
}

// Aggiungiamo il gestore per l'evento 'ping'


const dashboard = new Dashboard();
ipcMain.handle('ping', () => 'pong')

ipcMain.handle('start-monitoring', async () => {
  await dashboard.initialize();
});

ipcMain.handle('get-bucket-stats', async (_, bucketName) => {
  return dashboard.getBucketStats(bucketName);
});

ipcMain.handle('get-all-stats', () => {
  return dashboard.getAllStats();
});

// Aggiungiamo un listener per l'evento bucket-stats-updated
ipcMain.on('bucket-stats-updated', (event, data) => {
  // Invia l'aggiornamento a tutte le finestre
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('bucket-stats-updated', data);
  });
});

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})