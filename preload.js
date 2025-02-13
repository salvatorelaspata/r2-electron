const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke("ping"),
  // we can also expose variables, not just functions
});

contextBridge.exposeInMainWorld("api", {
  startMonitoring: () => ipcRenderer.invoke("start-monitoring"),
  getBucketStats: (bucketName) =>
    ipcRenderer.invoke("get-bucket-stats", bucketName),
  getAllStats: () => ipcRenderer.invoke("get-all-stats"),
  onBucketStatsUpdated: (callback) =>
    ipcRenderer.on("bucket-stats-updated", callback),
  deleteObject: (bucketName, objectKey) =>
    ipcRenderer.invoke("delete-object", bucketName, objectKey),
  getSignedUrl: (bucketName, objectKey) =>
    ipcRenderer.invoke("get-signed-url", bucketName, objectKey),
});
