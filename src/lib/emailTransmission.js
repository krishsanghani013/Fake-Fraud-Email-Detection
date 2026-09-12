// Header transmission and hop forensics

import { isValidIpv4, isValidIpv6 } from './emailArtifacts.js';

// Classify IP address
export function classifyIp(ip, version = 4) {
  if (!ip || typeof ip !== 'string') return 'unspecified';

  const clean = ip.trim();

  if (version === 4) {
    if (clean === '0.0.0.0') return 'unspecified';
    if (/^127\./.test(clean)) return 'loopback';
    if (/^10\./.test(clean)) return 'private';
    if (/^192\.168\./.test(clean)) return 'private';
    if (/^169\.254\./.test(clean)) return 'link-local';

    // 172.16.0.0 - 172.31.255.255
    const match172 = clean.match(/^172\.(\d{1,3})\./);
    if (match172) {
      const secondOctet = parseInt(match172[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return 'private';
      }
    }

    return 'public';
  }

  if (version === 6) {
    let lower = clean.toLowerCase();
    if (lower.startsWith('[') && lower.endsWith(']')) {
      lower = lower.slice(1, -1);
    }

    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return 'unspecified';
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return 'loopback';
    if (lower.startsWith('fe80:') || lower === 'fe80::') return 'link-local';
    if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
      return 'private';
    }

    return 'public';
  }

  return 'public';
}

// Extract IP addresses from header text
export function extractIpsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const found = [];
  const seen = new Set();

  // 1. IPv4 candidates
  const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ipv4Matches = text.match(IPV4_REGEX) || [];
  for (const cand of ipv4Matches) {
    if (isValidIpv4(cand) && !seen.has(cand)) {
      seen.add(cand);
      found.push({
        address: cand,
        version: 4,
        type: classifyIp(cand, 4)
      });
    }
  }

  // 2. Bracketed IPv6 candidates e.g. [2001:db8::1]
  const IPV6_BRACKET_REGEX = /\[([0-9a-fA-F:]+)\]/g;
  let bracketMatch;
  while ((bracketMatch = IPV6_BRACKET_REGEX.exec(text)) !== null) {
    const cand = bracketMatch[1];
    if (isValidIpv6(cand) && !seen.has(cand)) {
      seen.add(cand);
      found.push({
        address: cand,
        version: 6,
        type: classifyIp(cand, 6)
      });
    }
  }

  // 3. Standalone IPv6 candidates
  const IPV6_STANDALONE_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g;
  const ipv6Matches = text.match(IPV6_STANDALONE_REGEX) || [];
  for (const cand of ipv6Matches) {
    if (isValidIpv6(cand) && !seen.has(cand)) {
      seen.add(cand);
      found.push({
        address: cand,
        version: 6,
        type: classifyIp(cand, 6)
      });
    }
  }

  return found;
}

// Normalize hostname
export function cleanHostname(hostStr) {
  if (!hostStr || typeof hostStr !== 'string') return null;
  let clean = hostStr.trim();

  // Remove surrounding parentheses, quotes, or brackets
  clean = clean.replace(/^[<"'(]+|[>"')]+$/g, '').trim();

  // Strip trailing dot
  if (clean.endsWith('.')) {
    clean = clean.slice(0, -1);
  }

  return clean.toLowerCase() || null;
}

// Parse single Received header
export function parseReceivedHeader(rawHeader, headerIndex = 0, totalReceived = 1) {
  const cleanRaw = (rawHeader || '').trim();

  // Chronological index: top is newest (index 0 in header order),
  // bottom is oldest (index totalReceived - 1).
  // Chronological index 0 = oldest, totalReceived - 1 = newest.
  const chronologicalIndex = totalReceived > 0 ? (totalReceived - 1 - headerIndex) : 0;

  // Split clauses and timestamp by the last semicolon
  const semiIndex = cleanRaw.lastIndexOf(';');
  let clauseBody = cleanRaw;
  let rawTimestamp = null;
  let normalizedTimestamp = null;
  let timestampParseError = false;

  if (semiIndex !== -1) {
    clauseBody = cleanRaw.slice(0, semiIndex).trim();
    const tsCandidate = cleanRaw.slice(semiIndex + 1).trim();
    if (tsCandidate) {
      rawTimestamp = tsCandidate;
      const parsedTime = Date.parse(tsCandidate);
      if (!isNaN(parsedTime)) {
        normalizedTimestamp = new Date(parsedTime).toISOString();
      } else {
        timestampParseError = true;
      }
    }
  }

  // Extract all IPs present across this entire Received header
  const hopIps = extractIpsFromText(cleanRaw);

  // 1. "from" clause
  let fromHost = null;
  let fromIp = null;
  let fromRaw = null;
  const fromMatch = clauseBody.match(/\bfrom\s+(.+?)(?=\s+by\s+|\s+with\s+|\s+id\s+|\s+for\s+|$)/i);
  if (fromMatch) {
    fromRaw = fromMatch[1].trim();
    // First token is usually the hostname or bracketed IP
    const tokens = fromRaw.split(/\s+/);
    const firstToken = tokens[0];
    if (firstToken) {
      fromHost = cleanHostname(firstToken);
    }

    // Check for IP inside parentheses or brackets in the from clause
    const fromIps = extractIpsFromText(fromRaw);
    if (fromIps.length > 0) {
      fromIp = fromIps[0].address;
    }
  }

  // 2. "by" clause
  let byHost = null;
  let byIp = null;
  let byRaw = null;
  const byMatch = clauseBody.match(/\bby\s+(.+?)(?=\s+from\s+|\s+with\s+|\s+id\s+|\s+for\s+|$)/i);
  if (byMatch) {
    byRaw = byMatch[1].trim();
    const tokens = byRaw.split(/\s+/);
    const firstToken = tokens[0];
    if (firstToken) {
      byHost = cleanHostname(firstToken);
    }

    const byIps = extractIpsFromText(byRaw);
    if (byIps.length > 0) {
      byIp = byIps[0].address;
    }
  }

  // 3. "with" clause (protocol)
  let withProtocol = null;
  const withMatch = clauseBody.match(/\bwith\s+([A-Za-z0-9_.-]+)/i);
  if (withMatch) {
    withProtocol = withMatch[1].trim();
  }

  // 4. "id" clause (message/queue ID)
  let idVal = null;
  const idMatch = clauseBody.match(/\bid\s+(<[^>]+>|[^\s;]+)/i);
  if (idMatch) {
    idVal = idMatch[1].trim();
  }

  // 5. "for" clause (recipient)
  let forRecipient = null;
  const forMatch = clauseBody.match(/\bfor\s+(<[^>]+>|[^\s;]+)/i);
  if (forMatch) {
    forRecipient = forMatch[1].trim();
  }

  return {
    headerIndex,
    chronologicalIndex,
    raw: cleanRaw,
    from: {
      host: fromHost,
      ip: fromIp,
      raw: fromRaw
    },
    by: {
      host: byHost,
      ip: byIp,
      raw: byRaw
    },
    with: withProtocol,
    id: idVal,
    for: forRecipient,
    timestamp: {
      raw: rawTimestamp,
      normalized: normalizedTimestamp
    },
    ips: hopIps,
    _timestampParseError: timestampParseError
  };
}

// Calculate hop latencies
export function calculateHopLatencies(chronologicalHops) {
  const latencies = [];
  const findings = [];

  for (let i = 0; i < chronologicalHops.length - 1; i++) {
    const hopA = chronologicalHops[i];     // Earlier (older) hop
    const hopB = chronologicalHops[i + 1]; // Later (newer) hop

    const tsA = hopA.timestamp?.normalized;
    const tsB = hopB.timestamp?.normalized;

    if (tsA && tsB) {
      const timeA = new Date(tsA).getTime();
      const timeB = new Date(tsB).getTime();
      const diffSeconds = Math.round((timeB - timeA) / 1000);

      const latencyItem = {
        fromHopIndex: hopA.chronologicalIndex,
        toHopIndex: hopB.chronologicalIndex,
        fromHeaderIndex: hopA.headerIndex,
        toHeaderIndex: hopB.headerIndex,
        fromTimestamp: tsA,
        toTimestamp: tsB,
        seconds: diffSeconds,
        status: diffSeconds >= 0 ? 'valid' : 'negative'
      };

      latencies.push(latencyItem);

      if (diffSeconds < 0) {
        findings.push({
          id: 'NEGATIVE_TRANSMISSION_LATENCY',
          type: 'transmission_anomaly',
          detected: true,
          fromHop: hopA.chronologicalIndex,
          toHop: hopB.chronologicalIndex,
          evidence: {
            olderHopIndex: hopA.chronologicalIndex,
            newerHopIndex: hopB.chronologicalIndex,
            olderTimestamp: hopA.timestamp.raw,
            newerTimestamp: hopB.timestamp.raw,
            olderNormalized: tsA,
            newerNormalized: tsB,
            latencySeconds: diffSeconds,
            olderRaw: hopA.raw,
            newerRaw: hopB.raw
          },
          message: `Received timestamps are not chronologically consistent: hop ${hopB.chronologicalIndex} reports a timestamp earlier than prior hop ${hopA.chronologicalIndex} (negative latency of ${diffSeconds} seconds).`
        });
      }
    } else {
      latencies.push({
        fromHopIndex: hopA.chronologicalIndex,
        toHopIndex: hopB.chronologicalIndex,
        fromHeaderIndex: hopA.headerIndex,
        toHeaderIndex: hopB.headerIndex,
        fromTimestamp: tsA || null,
        toTimestamp: tsB || null,
        seconds: null,
        status: 'unavailable'
      });
    }
  }

  return { latencies, findings };
}

// Analyze hop continuity
export function analyzeHopContinuity(chronologicalHops) {
  const findings = [];

  for (let i = 0; i < chronologicalHops.length - 1; i++) {
    const hopA = chronologicalHops[i];     // Prior receiving MTA
    const hopB = chronologicalHops[i + 1]; // Next hop reporting who it received from

    const priorByHost = hopA.by?.host;
    const nextFromHost = hopB.from?.host;

    // Both hostnames must be explicitly present to evaluate continuity
    if (priorByHost && nextFromHost) {
      const normA = priorByHost.toLowerCase();
      const normB = nextFromHost.toLowerCase();

      // Check if hosts match exactly or if one is a direct parent/subdomain of the other
      const isConsistent = normA === normB || normA.endsWith('.' + normB) || normB.endsWith('.' + normA);

      if (!isConsistent) {
        findings.push({
          id: 'RECEIVED_HOP_HOST_MISMATCH',
          type: 'transmission_continuity_mismatch',
          detected: true,
          fromHop: hopA.chronologicalIndex,
          toHop: hopB.chronologicalIndex,
          evidence: {
            priorHopIndex: hopA.chronologicalIndex,
            nextHopIndex: hopB.chronologicalIndex,
            priorByHost: hopA.by.host,
            nextFromHost: hopB.from.host,
            priorRaw: hopA.raw,
            nextRaw: hopB.raw
          },
          message: `Handoff host discrepancy: hop ${hopA.chronologicalIndex} received by "${hopA.by.host}", but subsequent hop ${hopB.chronologicalIndex} reports receiving from "${hopB.from.host}".`
        });
      }
    }
  }

  return findings;
}

// Master transmission analysis
export function analyzeEmailTransmission(emailData) {
  const allHeaders = emailData?.headers?.all || [];
  const rawReceivedHeaders = allHeaders.filter(
    (h) => (h.name || '').toLowerCase() === 'received'
  );

  const totalReceived = rawReceivedHeaders.length;
  const received = [];
  const parseErrorFindings = [];

  // Parse each Received header in original header order (top to bottom = newest to oldest)
  for (let i = 0; i < totalReceived; i++) {
    const rawVal = rawReceivedHeaders[i].value;
    const hop = parseReceivedHeader(rawVal, i, totalReceived);

    if (hop._timestampParseError) {
      parseErrorFindings.push({
        id: 'RECEIVED_TIMESTAMP_PARSE_ERROR',
        type: 'transmission_parse_error',
        detected: true,
        hopIndex: hop.chronologicalIndex,
        headerIndex: hop.headerIndex,
        evidence: {
          rawTimestamp: hop.timestamp.raw,
          rawHeader: hop.raw
        },
        message: `Failed to parse date/timestamp "${hop.timestamp.raw}" in Received header (hop ${hop.chronologicalIndex}).`
      });
    }

    delete hop._timestampParseError;
    received.push(hop);
  }

  // Construct chronological hop chain: reverse raw header order (oldest to newest)
  const hops = [...received].reverse();

  // Calculate latencies across chronological hops
  const { latencies, findings: latencyFindings } = calculateHopLatencies(hops);

  // Check continuity across consecutive hops
  const continuityFindings = analyzeHopContinuity(hops);

  // Combine all findings
  const findings = [
    ...parseErrorFindings,
    ...latencyFindings,
    ...continuityFindings
  ];

  // Unique IP addresses observed across all hops
  const uniqueIps = new Set();
  let validTimestampsCount = 0;

  for (const hop of hops) {
    if (hop.timestamp?.normalized) {
      validTimestampsCount++;
    }
    for (const ipObj of hop.ips) {
      uniqueIps.add(ipObj.address);
    }
  }

  // Calculate total delivery duration across the entire chain if first and last hops have timestamps
  let totalLatencySeconds = null;
  if (hops.length >= 2) {
    const firstTs = hops[0].timestamp?.normalized;
    const lastTs = hops[hops.length - 1].timestamp?.normalized;
    if (firstTs && lastTs) {
      const start = new Date(firstTs).getTime();
      const end = new Date(lastTs).getTime();
      const diff = Math.round((end - start) / 1000);
      if (diff >= 0) {
        totalLatencySeconds = diff;
      }
    }
  }

  return {
    received,
    hops,
    latencies,
    findings,
    summary: {
      hopCount: hops.length,
      ipCount: uniqueIps.size,
      timestampCount: validTimestampsCount,
      totalLatencySeconds
    }
  };
}
