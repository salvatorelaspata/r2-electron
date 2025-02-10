const { getBucketStats, listBuckets } = require('./api.js');
const { log } = require('./util.js');
const { ipcMain } = require('electron');

class Dashboard {
  constructor() {
    this.updateInterval = 30000; // Aggiorna ogni 30 secondi
    this.stats = new Map();
  }

  async initialize() {
    try {
      const buckets = await listBuckets();
      for (const bucket of buckets) {
        await this.updateBucketStats(bucket.Name);
      }
      this.startMonitoring();
    } catch (error) {
      log.error(`Errore nell'inizializzazione della dashboard: ${error.message}`);
    }
  }

  async updateBucketStats(bucketName) {
    try {
      const stats = await getBucketStats(bucketName);
      this.stats.set(bucketName, {
        ...stats,
        lastUpdate: new Date()
      });
      this.emitUpdate(bucketName);
    } catch (error) {
      log.error(`Errore nell'aggiornamento delle statistiche per ${bucketName}: ${error.message}`);
    }
  }

  startMonitoring() {
    setInterval(() => {
      this.stats.forEach((_, bucketName) => {
        this.updateBucketStats(bucketName);
      });
    }, this.updateInterval);
  }

  getBucketStats(bucketName) {
    return this.stats.get(bucketName);
  }

  getAllStats() {
    return Object.fromEntries(this.stats);
  }

  emitUpdate(bucketName) {
    const stats = this.getBucketStats(bucketName);
    ipcMain.emit('bucket-stats-updated', {
      bucketName,
      stats
    });
  }
} 

module.exports = Dashboard;