/**
 * Phase 7 — Threat Intelligence Service
 * 
 * Master enrichment orchestrator for email forensic artifacts.
 * 
 * FORENSIC PRINCIPLES:
 * 1. Threat Intelligence is external enrichment, NOT infallible ground truth.
 * 2. Unknown/Unavailable ≠ Malicious: provider failures, rate limits, or missing keys
 *    never elevate fraud risk scores.
 * 3. Privacy Preservation: Private, loopback, link-local, and unspecified IPs are
 *    strictly filtered and never leaked to third-party providers.
 * 4. Minimal Artifact Exposure: Only IPs, normalized URLs, and domains are sent.
 *    Full headers, body content, and attachments are never shared.
 * 5. Deterministic Normalization: Multi-provider responses are mapped into a stable,
 *    reproducible intelligence model.
 */

import { classifyIp } from './emailTransmission.js';
import { THREAT_VERDICTS, BaseThreatIntelProvider } from './threat-intel/provider.js';
import { MockThreatIntelProvider } from './threat-intel/mockProvider.js';
import { VirusTotalAdapter } from './threat-intel/virusTotalAdapter.js';
import { AbuseIpdbAdapter } from './threat-intel/abuseIpdbAdapter.js';

export { THREAT_VERDICTS, BaseThreatIntelProvider };

/**
 * Instantiates a threat intelligence provider based on name or environment variable.
 * 
 * @param {string} providerName 
 * @param {object} config 
 * @returns {BaseThreatIntelProvider}
 */
export function createThreatIntelProvider(providerName, config = {}) {
  const name = (providerName || process.env.THREAT_INTEL_PROVIDER || 'mock').toLowerCase();

  switch (name) {
    case 'virustotal':
      return new VirusTotalAdapter(config);
    case 'abuseipdb':
      return new AbuseIpdbAdapter(config);
    case 'mock':
    default:
      return new MockThreatIntelProvider(config);
  }
}

/**
 * Evaluates whether an IP address is safe to query externally.
 * Excludes private RFC 1918, loopback, link-local, and unspecified addresses.
 * 
 * @param {string} ipAddress 
 * @param {number} version 
 * @returns {{ isPublic: boolean, ipType: string }}
 */
export function evaluateIpRoutability(ipAddress, version = 4) {
  const ipType = classifyIp(ipAddress, version);
  const isPublic = ipType === 'public';
  return { isPublic, ipType };
}

/**
 * Enriches email artifacts with threat intelligence observations.
 * 
 * @param {object} artifacts Extracted artifacts from Phase 2 / Phase 5
 * @param {Array} artifacts.ips Array of IP objects or strings
 * @param {Array} artifacts.urls Array of URL objects or strings
 * @param {Array} artifacts.domains Array of Domain objects or strings
 * @param {object} options
 * @param {BaseThreatIntelProvider|Array<BaseThreatIntelProvider>} [options.provider]
 * @param {string} [options.providerName]
 * @param {object} [options.providerConfig]
 * @returns {Promise<object>} Canonical data.threatIntel structure
 */
export async function enrichThreatIntel(artifacts = {}, options = {}) {
  const lookedUpAt = new Date().toISOString();

  // Resolve provider instance(s)
  let providers = [];
  if (Array.isArray(options.providers) && options.providers.length > 0) {
    providers = options.providers;
  } else if (options.provider instanceof BaseThreatIntelProvider) {
    providers = [options.provider];
  } else {
    providers = [createThreatIntelProvider(options.providerName, options.providerConfig)];
  }

  const primaryProviderName = providers.map((p) => p.name).join(' + ');

  const ipResults = [];
  const urlResults = [];
  const domainResults = [];
  const findings = [];

  let maliciousCount = 0;
  let suspiciousCount = 0;
  let cleanCount = 0;
  let skippedCount = 0;
  let unknownCount = 0;
  let hasOperationalIssue = false;

  // Deduplication sets to prevent duplicate queries on the same artifact
  const seenIps = new Set();
  const seenUrls = new Set();
  const seenDomains = new Set();

  // ---------------------------------------------------------------------------
  // 1. IP Reputation Enrichment
  // ---------------------------------------------------------------------------
  const rawIps = Array.isArray(artifacts.ips) ? artifacts.ips : [];
  for (const item of rawIps) {
    const address = typeof item === 'string' ? item : item?.address;
    const version = typeof item === 'object' && item?.version ? item.version : 4;

    if (!address || seenIps.has(address)) continue;
    seenIps.add(address);

    const { isPublic, ipType } = evaluateIpRoutability(address, version);

    // Privacy & internal infrastructure protection:
    // Skip non-public IPs (RFC 1918, loopback, link-local, unspecified)
    if (!isPublic) {
      skippedCount++;
      ipResults.push({
        artifact: address,
        artifactType: 'ip',
        version,
        ipType,
        isPrivate: true,
        status: 'skipped',
        provider: 'local_policy',
        providerResults: [],
        evidence: {
          reason: `Internal/non-routable IP address (${ipType}) was skipped from third-party reputation query to preserve network privacy.`,
          checkedAt: lookedUpAt
        }
      });
      continue;
    }

    // Query provider(s) for public IP
    const providerObservations = [];
    let finalStatus = THREAT_VERDICTS.CLEAN;
    let maxScore = 0;

    for (const p of providers) {
      try {
        const res = await p.checkIP(address);
        providerObservations.push({ provider: p.name, ...res });

        if (res.status === THREAT_VERDICTS.MALICIOUS) {
          finalStatus = THREAT_VERDICTS.MALICIOUS;
        } else if (res.status === THREAT_VERDICTS.SUSPICIOUS && finalStatus !== THREAT_VERDICTS.MALICIOUS) {
          finalStatus = THREAT_VERDICTS.SUSPICIOUS;
        } else if (res.status === THREAT_VERDICTS.RATE_LIMITED || res.status === THREAT_VERDICTS.UNAVAILABLE || res.status === THREAT_VERDICTS.ERROR) {
          hasOperationalIssue = true;
          if (finalStatus === THREAT_VERDICTS.CLEAN) finalStatus = res.status;
        } else if (res.status === THREAT_VERDICTS.UNKNOWN && finalStatus === THREAT_VERDICTS.CLEAN) {
          finalStatus = THREAT_VERDICTS.UNKNOWN;
        }

        if (typeof res.score === 'number' && res.score > maxScore) {
          maxScore = res.score;
        }
      } catch (err) {
        hasOperationalIssue = true;
        if (finalStatus === THREAT_VERDICTS.CLEAN) {
          finalStatus = THREAT_VERDICTS.ERROR;
        }
        providerObservations.push({
          provider: p.name,
          status: THREAT_VERDICTS.ERROR,
          evidence: { reason: err.message, checkedAt: lookedUpAt }
        });
      }
    }

    if (finalStatus === THREAT_VERDICTS.MALICIOUS) maliciousCount++;
    else if (finalStatus === THREAT_VERDICTS.SUSPICIOUS) suspiciousCount++;
    else if (finalStatus === THREAT_VERDICTS.CLEAN) cleanCount++;
    else unknownCount++;

    const ipRecord = {
      artifact: address,
      artifactType: 'ip',
      version,
      ipType: 'public',
      isPrivate: false,
      status: finalStatus,
      score: maxScore,
      provider: primaryProviderName,
      providerResults: providerObservations,
      evidence: providerObservations[0]?.evidence || { checkedAt: lookedUpAt }
    };
    ipResults.push(ipRecord);

    // Findings generation
    if (finalStatus === THREAT_VERDICTS.MALICIOUS) {
      findings.push({
        id: 'IP_REPUTATION_MALICIOUS',
        type: 'threat_intel_ip',
        artifact: address,
        status: finalStatus,
        provider: primaryProviderName,
        evidence: ipRecord.evidence,
        message: `External threat intelligence provider reported IP address "${address}" as MALICIOUS.`
      });
    } else if (finalStatus === THREAT_VERDICTS.SUSPICIOUS) {
      findings.push({
        id: 'IP_REPUTATION_SUSPICIOUS',
        type: 'threat_intel_ip',
        artifact: address,
        status: finalStatus,
        provider: primaryProviderName,
        evidence: ipRecord.evidence,
        message: `External threat intelligence provider reported IP address "${address}" as SUSPICIOUS.`
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 2. URL Reputation Enrichment
  // ---------------------------------------------------------------------------
  const rawUrls = Array.isArray(artifacts.urls) ? artifacts.urls : [];
  for (const item of rawUrls) {
    const targetUrl = typeof item === 'string' ? item : item?.normalized || item?.original;
    if (!targetUrl || seenUrls.has(targetUrl)) continue;
    seenUrls.add(targetUrl);

    const providerObservations = [];
    let finalStatus = THREAT_VERDICTS.CLEAN;
    let maxScore = 0;

    for (const p of providers) {
      try {
        const res = await p.checkURL(targetUrl);
        providerObservations.push({ provider: p.name, ...res });

        if (res.status === THREAT_VERDICTS.MALICIOUS) {
          finalStatus = THREAT_VERDICTS.MALICIOUS;
        } else if (res.status === THREAT_VERDICTS.SUSPICIOUS && finalStatus !== THREAT_VERDICTS.MALICIOUS) {
          finalStatus = THREAT_VERDICTS.SUSPICIOUS;
        } else if (res.status === THREAT_VERDICTS.RATE_LIMITED || res.status === THREAT_VERDICTS.UNAVAILABLE || res.status === THREAT_VERDICTS.ERROR) {
          hasOperationalIssue = true;
          if (finalStatus === THREAT_VERDICTS.CLEAN) finalStatus = res.status;
        } else if (res.status === THREAT_VERDICTS.UNKNOWN && finalStatus === THREAT_VERDICTS.CLEAN) {
          finalStatus = THREAT_VERDICTS.UNKNOWN;
        }

        if (typeof res.score === 'number' && res.score > maxScore) {
          maxScore = res.score;
        }
      } catch (err) {
        hasOperationalIssue = true;
        if (finalStatus === THREAT_VERDICTS.CLEAN) {
          finalStatus = THREAT_VERDICTS.ERROR;
        }
        providerObservations.push({
          provider: p.name,
          status: THREAT_VERDICTS.ERROR,
          evidence: { reason: err.message, checkedAt: lookedUpAt }
        });
      }
    }

    if (finalStatus === THREAT_VERDICTS.MALICIOUS) maliciousCount++;
    else if (finalStatus === THREAT_VERDICTS.SUSPICIOUS) suspiciousCount++;
    else if (finalStatus === THREAT_VERDICTS.CLEAN) cleanCount++;
    else unknownCount++;

    const urlRecord = {
      artifact: targetUrl,
      originalUrl: typeof item === 'object' ? item.original : targetUrl,
      normalizedUrl: targetUrl,
      artifactType: 'url',
      status: finalStatus,
      score: maxScore,
      provider: primaryProviderName,
      providerResults: providerObservations,
      evidence: providerObservations[0]?.evidence || { checkedAt: lookedUpAt }
    };
    urlResults.push(urlRecord);

    // Findings generation
    if (finalStatus === THREAT_VERDICTS.MALICIOUS) {
      findings.push({
        id: 'URL_REPUTATION_MALICIOUS',
        type: 'threat_intel_url',
        artifact: targetUrl,
        status: finalStatus,
        provider: primaryProviderName,
        evidence: urlRecord.evidence,
        message: `External threat intelligence provider reported URL "${targetUrl}" as MALICIOUS.`
      });
    } else if (finalStatus === THREAT_VERDICTS.SUSPICIOUS) {
      findings.push({
        id: 'URL_REPUTATION_SUSPICIOUS',
        type: 'threat_intel_url',
        artifact: targetUrl,
        status: finalStatus,
        provider: primaryProviderName,
        evidence: urlRecord.evidence,
        message: `External threat intelligence provider reported URL "${targetUrl}" as SUSPICIOUS.`
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Domain Reputation Enrichment
  // ---------------------------------------------------------------------------
  const rawDomains = Array.isArray(artifacts.domains) ? artifacts.domains : [];
  for (const item of rawDomains) {
    const targetDomain = typeof item === 'string' ? item : item?.normalized || item?.original;
    if (!targetDomain || seenDomains.has(targetDomain)) continue;
    seenDomains.add(targetDomain);

    const providerObservations = [];
    let finalStatus = THREAT_VERDICTS.CLEAN;
    let maxScore = 0;

    for (const p of providers) {
      try {
        const res = await p.checkDomain(targetDomain);
        providerObservations.push({ provider: p.name, ...res });

        if (res.status === THREAT_VERDICTS.MALICIOUS) {
          finalStatus = THREAT_VERDICTS.MALICIOUS;
        } else if (res.status === THREAT_VERDICTS.SUSPICIOUS && finalStatus !== THREAT_VERDICTS.MALICIOUS) {
          finalStatus = THREAT_VERDICTS.SUSPICIOUS;
        } else if (res.status === THREAT_VERDICTS.RATE_LIMITED || res.status === THREAT_VERDICTS.UNAVAILABLE || res.status === THREAT_VERDICTS.ERROR) {
          hasOperationalIssue = true;
          if (finalStatus === THREAT_VERDICTS.CLEAN) finalStatus = res.status;
        } else if (res.status === THREAT_VERDICTS.UNKNOWN && finalStatus === THREAT_VERDICTS.CLEAN) {
          finalStatus = THREAT_VERDICTS.UNKNOWN;
        }

        if (typeof res.score === 'number' && res.score > maxScore) {
          maxScore = res.score;
        }
      } catch (err) {
        hasOperationalIssue = true;
        if (finalStatus === THREAT_VERDICTS.CLEAN) {
          finalStatus = THREAT_VERDICTS.ERROR;
        }
        providerObservations.push({
          provider: p.name,
          status: THREAT_VERDICTS.ERROR,
          evidence: { reason: err.message, checkedAt: lookedUpAt }
        });
      }
    }

    if (finalStatus === THREAT_VERDICTS.MALICIOUS) maliciousCount++;
    else if (finalStatus === THREAT_VERDICTS.SUSPICIOUS) suspiciousCount++;
    else if (finalStatus === THREAT_VERDICTS.CLEAN) cleanCount++;
    else unknownCount++;

    const domainRecord = {
      artifact: targetDomain,
      artifactType: 'domain',
      status: finalStatus,
      score: maxScore,
      provider: primaryProviderName,
      providerResults: providerObservations,
      evidence: providerObservations[0]?.evidence || { checkedAt: lookedUpAt }
    };
    domainResults.push(domainRecord);

    // Findings generation
    if (finalStatus === THREAT_VERDICTS.MALICIOUS) {
      findings.push({
        id: 'DOMAIN_REPUTATION_MALICIOUS',
        type: 'threat_intel_domain',
        artifact: targetDomain,
        status: finalStatus,
        provider: primaryProviderName,
        evidence: domainRecord.evidence,
        message: `External threat intelligence provider reported domain "${targetDomain}" as MALICIOUS.`
      });
    } else if (finalStatus === THREAT_VERDICTS.SUSPICIOUS) {
      findings.push({
        id: 'DOMAIN_REPUTATION_SUSPICIOUS',
        type: 'threat_intel_domain',
        artifact: targetDomain,
        status: finalStatus,
        provider: primaryProviderName,
        evidence: domainRecord.evidence,
        message: `External threat intelligence provider reported domain "${targetDomain}" as SUSPICIOUS.`
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Overall Service Status
  // ---------------------------------------------------------------------------
  const totalChecked = (ipResults.length - skippedCount) + urlResults.length + domainResults.length;
  let overallStatus = 'available';

  if (providers.some((p) => p.missingApiKey)) {
    overallStatus = 'unavailable';
    findings.push({
      id: 'THREAT_INTEL_UNAVAILABLE',
      type: 'operational_status',
      provider: primaryProviderName,
      message: 'Threat intelligence provider is unavailable (missing API credentials).'
    });
  } else if (providers.some((p) => p.forceStatus === THREAT_VERDICTS.RATE_LIMITED)) {
    overallStatus = 'rate_limited';
    findings.push({
      id: 'THREAT_INTEL_RATE_LIMITED',
      type: 'operational_status',
      provider: primaryProviderName,
      message: 'Threat intelligence provider lookup was rate-limited.'
    });
  } else if (hasOperationalIssue && totalChecked > 0) {
    overallStatus = 'partial';
  } else if (totalChecked === 0 && skippedCount > 0) {
    overallStatus = 'available';
  }

  return {
    status: overallStatus,
    provider: primaryProviderName,
    lookedUpAt,
    ips: ipResults,
    urls: urlResults,
    domains: domainResults,
    findings,
    summary: {
      totalArtifacts: ipResults.length + urlResults.length + domainResults.length,
      totalChecked,
      skippedCount,
      maliciousCount,
      suspiciousCount,
      cleanCount,
      unknownCount
    }
  };
}
