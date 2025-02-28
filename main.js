const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Dashboard = require("./src/dashboard.js");
const {
  listBuckets,
  getBucketStats,
  deleteObject,
  getSignedUrl,
  putObject,
  createFolder // Import the new function
} = require("./src/api.js");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
  // Opzionale: apre il DevTools per il debug
  win.webContents.openDevTools();
};

// Aggiungiamo il gestore per l'evento 'ping'

const dashboard = new Dashboard();

// Aggiungi questi handler
ipcMain.handle("ping", () => "pong");

ipcMain.handle("start-monitoring", async () => {
  await dashboard.initialize();
});

ipcMain.handle("get-bucket-stats", async (_, bucketName) => {
  const stats = await getBucketStats(bucketName); // Ottieni stats fresche
  dashboard.stats.set(bucketName, {
    ...stats,
    lastUpdate: new Date(),
  });
  return stats;
});

ipcMain.handle("get-all-stats", async () => {
  // Aggiorna tutte le statistiche prima di restituirle
  const buckets = await listBuckets();
  for (const bucket of buckets) {
    const stats = await getBucketStats(bucket.Name);
    dashboard.stats.set(bucket.Name, {
      ...stats,
      lastUpdate: new Date(),
    });
  }
  return dashboard.getAllStats();
});

ipcMain.handle("delete-object", async (_, bucketName, objectKey) => {
  const response = await deleteObject(bucketName, objectKey);
  return response;
});

ipcMain.handle("get-signed-url", async (_, bucketName, objectKey) => {
  const signedUrl = await getSignedUrl(bucketName, objectKey);
  return signedUrl;
});

ipcMain.handle("put-object", async (_, bucketName, objectKey, body) => {
  const response = await putObject(bucketName, objectKey, body);
  return response;
});

ipcMain.handle("create-folder", async (_, bucketName, folderName) => {
  const response = await createFolder(bucketName, folderName);
  return response;
});

// Aggiungiamo un listener per l'evento bucket-stats-updated
ipcMain.on("bucket-stats-updated", (event, data) => {
  // Invia l'aggiornamento a tutte le finestre
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("bucket-stats-updated", data);
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
