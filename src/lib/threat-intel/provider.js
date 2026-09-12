/**
 * Phase 7 — Threat Intelligence Provider Abstraction
 * 
 * Base class and standard normalization constants for external threat-intelligence providers.
 * 
 * FORENSIC PRINCIPLE:
 * Threat intelligence is external enrichment.
 * Provider results are recorded as observed third-party claims, not absolute ground truth.
 * An unavailable or unknown result is NEVER treated as malicious.
 */

export const THREAT_VERDICTS = Object.freeze({
  CLEAN: 'clean',
  SUSPICIOUS: 'suspicious',
  MALICIOUS: 'malicious',
  UNKNOWN: 'unknown',
  UNAVAILABLE: 'unavailable',
  RATE_LIMITED: 'rate_limited',
  ERROR: 'error'
});

/**
 * Abstract Base Class for Threat Intelligence Adapters.
 */
export class BaseThreatIntelProvider {
  /**
   * @param {string} name Provider identifier
   * @param {object} config Provider configuration (apiKey, timeout, etc.)
   */
  constructor(name, config = {}) {
    if (!name) throw new Error('Threat intelligence provider must have a name.');
    this.name = name;
    this.config = config;
    this.timeoutMs = config.timeoutMs || 5000;
  }

  /**
   * Checks IP address reputation.
   * 
   * @param {string} ip 
   * @returns {Promise<{ status: string, score: number|null, confidence: number|null, evidence: object }>}
   */
  async checkIP(ip) {
    throw new Error(`checkIP not implemented in provider "${this.name}".`);
  }

  /**
   * Checks URL reputation.
   * 
   * @param {string} url Normalized URL
   * @returns {Promise<{ status: string, score: number|null, confidence: number|null, evidence: object }>}
   */
  async checkURL(url) {
    throw new Error(`checkURL not implemented in provider "${this.name}".`);
  }

  /**
   * Checks Domain reputation.
   * 
   * @param {string} domain Normalized domain
   * @returns {Promise<{ status: string, score: number|null, confidence: number|null, evidence: object }>}
   */
  async checkDomain(domain) {
    throw new Error(`checkDomain not implemented in provider "${this.name}".`);
  }
}
