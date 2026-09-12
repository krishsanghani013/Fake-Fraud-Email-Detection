// AbuseIPDB v2 threat intel adapter

import { BaseThreatIntelProvider, THREAT_VERDICTS } from './provider.js';

export class AbuseIpdbAdapter extends BaseThreatIntelProvider {
  constructor(config = {}) {
    super('AbuseIPDB', config);
    this.apiKey = config.apiKey || process.env.ABUSEIPDB_API_KEY || '';
    this.baseUrl = 'https://api.abuseipdb.com/api/v2';
  }

  async checkIP(ip) {
    if (!this.apiKey) {
      return {
        status: THREAT_VERDICTS.UNAVAILABLE,
        score: null,
        confidence: null,
        evidence: {
          reason: 'No AbuseIPDB API key configured.',
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Key': this.apiKey,
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
            reason: 'AbuseIPDB rate limit exceeded.',
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
            reason: 'AbuseIPDB API authentication failed.',
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
            reason: `AbuseIPDB returned HTTP status ${response.status}.`,
            provider: this.name,
            checkedAt: new Date().toISOString()
          }
        };
      }

      const body = await response.json();
      return this.normalizeResponse(body, ip);
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

  normalizeResponse(body, artifact) {
    if (!body || typeof body !== 'object' || !body.data || typeof body.data !== 'object') {
      return {
        status: THREAT_VERDICTS.UNKNOWN,
        score: 0,
        confidence: null,
        evidence: {
          reason: 'Malformed or missing response payload from AbuseIPDB.',
          provider: this.name,
          checkedAt: new Date().toISOString()
        }
      };
    }

    const data = body.data;
    const score = typeof data.abuseConfidenceScore === 'number' ? data.abuseConfidenceScore : 0;
    const totalReports = data.totalReports || 0;

    let status = THREAT_VERDICTS.CLEAN;
    if (score >= 50 || totalReports >= 10) {
      status = THREAT_VERDICTS.MALICIOUS;
    } else if (score > 0 || totalReports > 0) {
      status = THREAT_VERDICTS.SUSPICIOUS;
    }

    return {
      status,
      score,
      confidence: score,
      evidence: {
        provider: this.name,
        abuseConfidenceScore: score,
        totalReports,
        countryCode: data.countryCode || null,
        isp: data.isp || null,
        domain: data.domain || null,
        lastReportedAt: data.lastReportedAt || null,
        checkedAt: new Date().toISOString()
      }
    };
  }

  async checkURL(url) {
    // AbuseIPDB only specializes in IP lookups
    return {
      status: THREAT_VERDICTS.UNAVAILABLE,
      score: null,
      confidence: null,
      evidence: {
        reason: 'AbuseIPDB provider does not support URL reputation checks.',
        provider: this.name,
        checkedAt: new Date().toISOString()
      }
    };
  }

  async checkDomain(domain) {
    // AbuseIPDB only specializes in IP lookups
    return {
      status: THREAT_VERDICTS.UNAVAILABLE,
      score: null,
      confidence: null,
      evidence: {
        reason: 'AbuseIPDB provider does not support direct domain reputation checks.',
        provider: this.name,
        checkedAt: new Date().toISOString()
      }
    };
  }
}
