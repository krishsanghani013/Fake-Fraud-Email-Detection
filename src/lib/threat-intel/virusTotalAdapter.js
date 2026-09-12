/**
 * Phase 7 — VirusTotal v3 Threat Intelligence Adapter
 * 
 * Server-side adapter for VirusTotal v3 API.
 * 
 * SECURITY:
 * - Runs strictly server-side; API keys are never exposed to clients.
 * - Does not navigate or fetch target URLs.
 * - Enforces request timeouts via AbortController.
 */

import { BaseThreatIntelProvider, THREAT_VERDICTS } from './provider.js';

export class VirusTotalAdapter extends BaseThreatIntelProvider {
  /**
   * @param {object} config 
   * @param {string} config.apiKey 
   * @param {number} config.timeoutMs 
   */
  constructor(config = {}) {
    super('VirusTotal', config);
    this.apiKey = config.apiKey || process.env.VIRUSTOTAL_API_KEY || '';
    this.baseUrl = 'https://www.virustotal.com/api/v3';
  }

  _getUrlId(url) {
    // VirusTotal v3 URL identifier is base64 without padding (=)
    return Buffer.from(url).toString('base64').replace(/=/g, '');
  }

  async _fetchVt(endpoint) {
    if (!this.apiKey) {
      return {
        status: THREAT_VERDICTS.UNAVAILABLE,
        score: null,
        confidence: null,
        evidence: {
          reason: 'No VirusTotal API key configured.',
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'GET',
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        return {
          status: THREAT_VERDICTS.RATE_LIMITED,
          score: null,
          confidence: null,
          evidence: {
            statusCode: 429,
            reason: 'VirusTotal rate limit exceeded.',
            provider: this.name,
            checkedAt: new Date().toISOString()
          }
        };
      }

      if (response.status === 404) {
        return {
          status: THREAT_VERDICTS.UNKNOWN,
          score: 0,
          confidence: null,
          evidence: {
            statusCode: 404,
            reason: 'Artifact not found in VirusTotal dataset.',
            provider: this.name,
            checkedAt: new Date().toISOString()
          }
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          status: THREAT_VERDICTS.UNAVAILABLE,
          score: null,
          confidence: null,
          evidence: {
            statusCode: response.status,
            reason: 'VirusTotal API authentication failed.',
            provider: this.name,
            checkedAt: new Date().toISOString()
          }
        };
      }

      if (!response.ok) {
        return {
          status: THREAT_VERDICTS.ERROR,
          score: null,
          confidence: null,
          evidence: {
            statusCode: response.status,
            reason: `VirusTotal returned HTTP status ${response.status}.`,
            provider: this.name,
            checkedAt: new Date().toISOString()
          }
        };
      }

      const body = await response.json();
      return this.normalizeResponse(body, endpoint);
    } catch (err) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === 'AbortError';
      return {
        status: isTimeout ? THREAT_VERDICTS.UNAVAILABLE : THREAT_VERDICTS.ERROR,
        score: null,
        confidence: null,
        evidence: {
          reason: isTimeout ? `Request timed out after ${this.timeoutMs}ms.` : err.message,
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }
  }

  async checkIP(ip) {
    return this._fetchVt(`ip_addresses/${encodeURIComponent(ip)}`);
  }

  async checkURL(url) {
    const urlId = this._getUrlId(url);
    return this._fetchVt(`urls/${urlId}`);
  }

  async checkDomain(domain) {
    return this._fetchVt(`domains/${encodeURIComponent(domain)}`);
  }

  normalizeResponse(body, artifact) {
    if (!body || typeof body !== 'object' || !body.data) {
      return {
        status: THREAT_VERDICTS.UNKNOWN,
        score: 0,
        confidence: null,
        evidence: {
          reason: 'Malformed or missing response payload from VirusTotal.',
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }

    const stats = body.data.attributes?.last_analysis_stats || {};
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const harmless = stats.harmless || 0;
    const undetected = stats.undetected || 0;
    const totalScanners = malicious + suspicious + harmless + undetected;

    let status = THREAT_VERDICTS.CLEAN;
    if (malicious > 0) {
      status = THREAT_VERDICTS.MALICIOUS;
    } else if (suspicious > 0) {
      status = THREAT_VERDICTS.SUSPICIOUS;
    } else if (totalScanners === 0) {
      status = THREAT_VERDICTS.UNKNOWN;
    }

    const score = totalScanners > 0 ? Math.round(((malicious + suspicious * 0.5) / totalScanners) * 100) : 0;

    return {
      status,
      score,
      confidence: totalScanners,
      evidence: {
        provider: this.name,
        stats,
        reputation: body.data.attributes?.reputation ?? null,
        lastAnalysisDate: body.data.attributes?.last_analysis_date
          ? new Date(body.data.attributes.last_analysis_date * 1000).toISOString()
          : null,
        checkedAt: new Date().toISOString()
      }
    };
  }

  normalizeIpResponse(body, artifact) {
    return this.normalizeResponse(body, artifact);
  }
}
