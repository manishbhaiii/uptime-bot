import fs from 'fs/promises';
import path from 'path';

export class URLManager {
  constructor(filePath = './data/urls.json') {
    this.filePath = filePath;
    this.urls = new Map();
    this.load();
  }

  async load() {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      for (const [userId, urls] of Object.entries(parsed)) {
        this.urls.set(userId, Array.isArray(urls) ? urls : [urls]);
      }
      
      console.log(`[INFO] Loaded ${this.getTotalURLCount()} URLs from storage`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[INFO] No existing URL data, starting fresh');
        await this.save();
      } else {
        console.error('[ERROR] Failed to load URLs:', error);
      }
    }
  }

  async save() {
    try {
      const data = {};
      for (const [userId, urls] of this.urls.entries()) {
        data[userId] = urls;
      }
      
      await fs.writeFile(
        this.filePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('[ERROR] Failed to save URLs:', error);
    }
  }

  addURL(userId, url) {
    if (!this.urls.has(userId)) {
      this.urls.set(userId, []);
    }
    
    const userURLs = this.urls.get(userId);
    if (!userURLs.includes(url)) {
      userURLs.push(url);
      this.save();
    }
  }

  removeSpecificURL(userId, url) {
    if (!this.urls.has(userId)) return false;
    
    const userURLs = this.urls.get(userId);
    const index = userURLs.indexOf(url);
    
    if (index === -1) return false;
    
    userURLs.splice(index, 1);
    
    if (userURLs.length === 0) {
      this.urls.delete(userId);
    }
    
    this.save();
    return true;
  }

  removeAllUserURLs(userId) {
    this.urls.delete(userId);
    this.save();
  }

  getUserURLs(userId) {
    return this.urls.get(userId) || [];
  }

  getUserURLCount(userId) {
    return this.getUserURLs(userId).length;
  }

  hasURL(userId) {
    return this.urls.has(userId) && this.urls.get(userId).length > 0;
  }

  getURL(userId) {
    const urls = this.getUserURLs(userId);
    return urls.length > 0 ? urls[0] : null;
  }

  getAllURLs() {
    return Array.from(this.urls.entries());
  }

  getTotalURLCount() {
    let count = 0;
    for (const urls of this.urls.values()) {
      count += urls.length;
    }
    return count;
  }

  getURLCount() {
    return this.urls.size;
  }

  findUserByURL(url) {
    for (const [userId, urls] of this.urls.entries()) {
      if (urls.includes(url)) {
        return userId;
      }
    }
    return null;
  }
}
