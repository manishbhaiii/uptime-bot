import https from 'https';
import http from 'http';

export class PingScheduler {
  constructor(urlManager) {
    this.urlManager = urlManager;
    this.interval = null;
    this.stats = new Map();
    this.PING_INTERVAL = 10 * 60 * 1000;
    this.cyclesCompleted = 0;
  }

  start() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.pingAll();

    this.interval = setInterval(() => {
      this.pingAll();
    }, this.PING_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async pingAll() {
    const allURLs = this.urlManager.getAllURLs();
    
    if (allURLs.length === 0) {
      console.log('[INFO] No URLs to ping');
      return;
    }

    let totalURLs = 0;
    for (const [, urls] of allURLs) {
      totalURLs += urls.length;
    }

    console.log(`[INFO] Pinging ${totalURLs} URLs...`);

    const promises = [];
    for (const [userId, urls] of allURLs) {
      for (const url of urls) {
        promises.push(this.pingURL(userId, url));
      }
    }

    await Promise.allSettled(promises);
    this.cyclesCompleted++;
    console.log('[INFO] Ping cycle completed');
  }

  async pingURL(userId, url) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const req = protocol.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'OnlinerBot/1.0 (Discord Keep-Alive Bot)'
        }
      }, (res) => {
        const duration = Date.now() - startTime;
        this.recordSuccess(userId, url, duration);
        console.log(`[SUCCESS] [${res.statusCode}] ${url} (${duration}ms)`);
        
        res.resume();
        resolve();
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        this.recordFailure(userId, url, error.message);
        console.error(`[FAILURE] ${url} - ${error.message} (${duration}ms)`);
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        this.recordFailure(userId, url, 'Request timeout');
        console.error(`[FAILURE] ${url} - Timeout`);
        resolve();
      });
    });
  }

  getStatsKey(userId, url) {
    return `${userId}:${url}`;
  }

  recordSuccess(userId, url, duration) {
    const key = this.getStatsKey(userId, url);
    
    if (!this.stats.has(key)) {
      this.stats.set(key, {
        totalPings: 0,
        successCount: 0,
        failureCount: 0,
        lastSuccess: null,
        lastFailure: null
      });
    }

    const stats = this.stats.get(key);
    stats.totalPings++;
    stats.successCount++;
    stats.lastSuccess = Date.now();
  }

  recordFailure(userId, url, errorMessage) {
    const key = this.getStatsKey(userId, url);
    
    if (!this.stats.has(key)) {
      this.stats.set(key, {
        totalPings: 0,
        successCount: 0,
        failureCount: 0,
        lastSuccess: null,
        lastFailure: null
      });
    }

    const stats = this.stats.get(key);
    stats.totalPings++;
    stats.failureCount++;
    stats.lastFailure = Date.now();
    stats.lastError = errorMessage;
  }

  getStats(userId, url) {
    const key = this.getStatsKey(userId, url);
    return this.stats.get(key);
  }

  getCyclesCompleted() {
    return this.cyclesCompleted;
  }
}
