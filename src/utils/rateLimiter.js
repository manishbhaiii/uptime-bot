export class RateLimiter {
  constructor(cooldownMs = 60000) {
    this.cooldownMs = cooldownMs;
    this.lastModification = new Map();
  }

  canModify(userId) {
    const lastTime = this.lastModification.get(userId);
    if (!lastTime) return true;

    const timeSince = Date.now() - lastTime;
    return timeSince >= this.cooldownMs;
  }

  recordModification(userId) {
    this.lastModification.set(userId, Date.now());
  }

  getTimeUntilReset(userId) {
    const lastTime = this.lastModification.get(userId);
    if (!lastTime) return 0;

    const timeSince = Date.now() - lastTime;
    return Math.max(0, this.cooldownMs - timeSince);
  }
}
