// Threat intelligence provider base

export const THREAT_VERDICTS = Object.freeze({
  CLEAN: 'clean',
  SUSPICIOUS: 'suspicious',
  MALICIOUS: 'malicious',
  UNKNOWN: 'unknown',
  UNAVAILABLE: 'unavailable',
  RATE_LIMITED: 'rate_limited',
  ERROR: 'error'
});

export class BaseThreatIntelProvider {
  constructor(name, config = {}) {
    if (!name) throw new Error('Threat intelligence provider must have a name.');
    this.name = name;
    this.config = config;
    this.timeoutMs = config.timeoutMs || 5000;
  }

  // Check IP reputation
  async checkIP(ip) {
    throw new Error(`checkIP not implemented in provider "${this.name}".`);
  }

  // Check URL reputation
  async checkURL(url) {
    throw new Error(`checkURL not implemented in provider "${this.name}".`);
  }

  // Check domain reputation
  async checkDomain(domain) {
    throw new Error(`checkDomain not implemented in provider "${this.name}".`);
  }
}
