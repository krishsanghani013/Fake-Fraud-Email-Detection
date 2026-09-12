/**
 * Phase 7 — Mock Threat Intelligence Provider
 * 
 * Deterministic, offline provider adapter for unit testing, CI/CD, and offline development.
 * Never makes external network calls.
 */

import { BaseThreatIntelProvider, THREAT_VERDICTS } from './provider.js';

export class MockThreatIntelProvider extends BaseThreatIntelProvider {
  /**
   * @param {object} config 
   * @param {object} config.mockRules Explicit fixtures: { ips: {}, urls: {}, domains: {} }
   * @param {string} config.forceStatus Force all queries to return this status ('rate_limited', 'error', 'unavailable')
   * @param {boolean} config.simulateTimeout If true, simulates a lookup timeout
   * @param {boolean} config.missingApiKey If true, simulates missing credentials
   */
  constructor(config = {}) {
    super('MockThreatIntel', config);
    this.mockRules = config.mockRules || config.fixtures || { ips: {}, urls: {}, domains: {} };
    this.forceStatus = config.forceStatus || null;
    this.simulateTimeout = Boolean(config.simulateTimeout);
    this.simulateHttpError = config.simulateHttpError || null;
    this.missingApiKey = Boolean(config.missingApiKey);
    this.queryHistory = [];
  }

  _evaluateArtifact(type, artifact) {
    this.queryHistory.push({ type, artifact });

    if (this.missingApiKey) {
      return {
        status: THREAT_VERDICTS.UNAVAILABLE,
        score: null,
        confidence: null,
        evidence: {
          reason: 'Missing API credentials for threat intelligence provider.',
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }

    if (this.simulateTimeout) {
      throw new Error(`Request timed out after ${this.timeoutMs}ms.`);
    }

    if (this.simulateHttpError) {
      throw new Error(`HTTP Error ${this.simulateHttpError}: Simulated Provider Failure`);
    }

    if (this.forceStatus) {
      return {
        status: this.forceStatus,
        score: null,
        confidence: null,
        evidence: {
          reason: `Provider returned status "${this.forceStatus}".`,
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }

    const rulesForType = this.mockRules[type] || {};
    const matched = rulesForType[artifact];

    if (matched) {
      return {
        status: matched.status || THREAT_VERDICTS.UNKNOWN,
        score: matched.score !== undefined ? matched.score : null,
        confidence: matched.confidence !== undefined ? matched.confidence : null,
        evidence: {
          matchedRule: true,
          providerVerdict: matched.status,
          score: matched.score,
          category: matched.category || 'general_threat',
          provider: this.name,
          checkedAt: new Date().toISOString(),
          ...(matched.evidence || {})
        }
      };
    }

    // Default: Clean
    return {
      status: THREAT_VERDICTS.CLEAN,
      score: 0,
      confidence: 100,
      evidence: {
        providerVerdict: 'clean',
        score: 0,
        provider: this.name,
        checkedAt: new Date().toISOString()
      }
    };
  }

  async checkIP(ip) {
    return this._evaluateArtifact('ips', ip);
  }

  async checkURL(url) {
    return this._evaluateArtifact('urls', url);
  }

  async checkDomain(domain) {
    return this._evaluateArtifact('domains', domain);
  }
}
