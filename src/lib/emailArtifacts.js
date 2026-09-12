/**
 * Phase 2 — Email Artifact Extraction & Normalization
 * 
 * Deterministic extraction and normalization layer operating on top of
 * the Phase 1 canonical normalized email object.
 * 
 * Extracts:
 * 1. URLs (text, HTML, HTML <a href="...">, headers)
 * 2. IP addresses (IPv4 and IPv6 with strict octet/format validation)
 * 3. Domains (from URLs and sender headers, preserving subdomains)
 * 4. Normalized URLs (lowercased protocol/host, default port removal)
 * 5. Sender domains (From, Reply-To, Return-Path)
 * 
 * Strictly local, offline, deterministic, and evidence-preserving.
 * Does NOT execute AI analysis, threat intelligence, DNS queries, or risk scoring.
 */

// Regex for extracting candidate URLs
const URL_CANDIDATE_REGEX = /\bhttps?:\/\/[^\s<>"'`]+/gi;
// Regex for HTML <a href="...">
const HTML_HREF_REGEX = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;

/**
 * Strips surrounding punctuation, brackets, and trailing sentence punctuation.
 * E.g., "(https://example.com/login)." -> "https://example.com/login"
 * 
 * @param {string} rawUrl 
 * @returns {string}
 */
export function cleanUrlPunctuation(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let cleaned = rawUrl.trim();

  // Strip wrapping quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');

  // Strip wrapping angle brackets or parentheses if present at both ends
  if (cleaned.startsWith('<') && cleaned.endsWith('>')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = cleaned.slice(1, -1);
  }

  // Strip trailing sentence punctuation: . , ; ! ?
  // Also strip trailing closing parenthesis or brackets if unmatched
  while (/[.,;:!?]$/.test(cleaned)) {
    cleaned = cleaned.slice(0, -1);
  }

  if (cleaned.endsWith(')') && !cleaned.includes('(')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.endsWith(']') && !cleaned.includes('[')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.endsWith('>') && !cleaned.includes('<')) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned.trim();
}

/**
 * Normalizes a URL deterministically:
 * - Lowercase protocol
 * - Lowercase hostname
 * - Remove default port :80 for HTTP
 * - Remove default port :443 for HTTPS
 * - Remove trailing dot from hostname
 * - Preserve path, query string, and fragment
 * - Remove surrounding whitespace
 * 
 * @param {string} rawUrl 
 * @returns {string}
 */
export function normalizeUrl(rawUrl) {
  const cleaned = cleanUrlPunctuation(rawUrl);
  if (!cleaned) return '';

  try {
    const parsed = new URL(cleaned);

    // Protocol in lowercase
    const protocol = parsed.protocol.toLowerCase();

    // Hostname in lowercase without trailing dot
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith('.')) {
      hostname = hostname.slice(0, -1);
    }

    // Determine port representation (standard URL constructor omits :80 on http and :443 on https)
    let port = parsed.port;
    if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
      port = '';
    }

    const host = port ? `${hostname}:${port}` : hostname;
    const pathname = parsed.pathname;
    const search = parsed.search;
    const hash = parsed.hash;

    return `${protocol}//${host}${pathname}${search}${hash}`;
  } catch {
    // Fallback normalization for edge cases or non-standard URLs
    return cleaned.replace(/^(https?:\/\/)([^\/:]+)(?::(80|443))?/i, (match, proto, host, port) => {
      const lowerProto = proto.toLowerCase();
      let lowerHost = host.toLowerCase();
      if (lowerHost.endsWith('.')) lowerHost = lowerHost.slice(0, -1);
      if ((lowerProto === 'http://' && port === '80') || (lowerProto === 'https://' && port === '443')) {
        return `${lowerProto}${lowerHost}`;
      }
      return `${lowerProto}${lowerHost}${port ? `:${port}` : ''}`;
    });
  }
}

/**
 * Extracts the domain/hostname from a URL string.
 * 
 * @param {string} urlString 
 * @returns {string|null}
 */
export function extractDomainFromUrl(urlString) {
  if (!urlString) return null;
  try {
    const parsed = new URL(urlString);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith('.')) {
      hostname = hostname.slice(0, -1);
    }
    return hostname || null;
  } catch {
    const match = urlString.match(/^https?:\/\/([^\/?#:]+)/i);
    if (match) {
      let h = match[1].toLowerCase();
      if (h.endsWith('.')) h = h.slice(0, -1);
      return h;
    }
    return null;
  }
}

/**
 * Extracts and deduplicates URLs from plain text, HTML body, and HTML href attributes.
 * 
 * @param {object} parsedEmail 
 * @returns {Array<{ original: string, normalized: string, domain: string, source: string }>}
 */
export function extractUrls(parsedEmail) {
  if (!parsedEmail) return [];

  const textBody = parsedEmail.body?.text || '';
  const htmlBody = parsedEmail.body?.html || '';
  const candidateMap = new Map(); // normalizedUrl -> artifact object

  // 1. Extract from HTML href attributes
  if (htmlBody) {
    let match;
    const hrefRegex = new RegExp(HTML_HREF_REGEX);
    while ((match = hrefRegex.exec(htmlBody)) !== null) {
      const hrefVal = match[1];
      if (/^https?:\/\//i.test(hrefVal)) {
        const cleaned = cleanUrlPunctuation(hrefVal);
        const normalized = normalizeUrl(cleaned);
        const domain = extractDomainFromUrl(normalized);

        if (normalized && domain && !candidateMap.has(normalized)) {
          candidateMap.set(normalized, {
            original: cleaned,
            normalized,
            domain,
            source: 'html_href'
          });
        }
      }
    }
  }

  // 2. Extract from plain-text body
  if (textBody) {
    const textMatches = textBody.match(URL_CANDIDATE_REGEX) || [];
    for (const raw of textMatches) {
      const cleaned = cleanUrlPunctuation(raw);
      const normalized = normalizeUrl(cleaned);
      const domain = extractDomainFromUrl(normalized);

      if (normalized && domain && !candidateMap.has(normalized)) {
        candidateMap.set(normalized, {
          original: cleaned,
          normalized,
          domain,
          source: 'body'
        });
      }
    }
  }

  // 3. Extract text URLs appearing in HTML body (outside or inside tags)
  if (htmlBody) {
    const htmlMatches = htmlBody.match(URL_CANDIDATE_REGEX) || [];
    for (const raw of htmlMatches) {
      const cleaned = cleanUrlPunctuation(raw);
      const normalized = normalizeUrl(cleaned);
      const domain = extractDomainFromUrl(normalized);

      if (normalized && domain && !candidateMap.has(normalized)) {
        candidateMap.set(normalized, {
          original: cleaned,
          normalized,
          domain,
          source: 'body'
        });
      }
    }
  }

  return Array.from(candidateMap.values());
}

/**
 * Validates IPv4 format and octet ranges (0 - 255).
 * Rejects invalid strings like 999.999.999.999.
 * 
 * @param {string} ip 
 * @returns {boolean}
 */
export function isValidIpv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;

  for (let i = 1; i <= 4; i++) {
    const num = Number(match[i]);
    if (num < 0 || num > 255) return false;
    // Check leading zeros for numbers > 0 (e.g. 01.02.03.04 is non-standard)
    if (match[i].length > 1 && match[i].startsWith('0')) return false;
  }

  return true;
}

/**
 * Validates IPv6 addresses.
 * Rejects false positives like ordinary timestamps (10:30:45).
 * 
 * @param {string} ip 
 * @returns {boolean}
 */
export function isValidIpv6(ip) {
  if (!ip || typeof ip !== 'string') return false;

  // Trim wrapping brackets if present
  let clean = ip.trim();
  if (clean.startsWith('[') && clean.endsWith(']')) {
    clean = clean.slice(1, -1);
  }

  // False positive check: plain timestamps like 10:30:45 or 12:00:00
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(clean)) {
    return false;
  }

  // Must contain at least two colons and only hex chars and colons
  if (!/^[0-9a-fA-F:]+$/.test(clean) || !clean.includes(':')) {
    return false;
  }

  const parts = clean.split(':');
  // Maximum 8 parts for IPv6, minimum 3 if not compressed
  if (parts.length > 8) return false;

  const hasCompression = clean.includes('::');
  if (!hasCompression && parts.length !== 8) return false;
  if ((clean.match(/::/g) || []).length > 1) return false;

  for (const part of parts) {
    if (part.length > 4) return false;
  }

  return true;
}

/**
 * Extracts and validates IPv4 and IPv6 addresses from Received headers.
 * 
 * @param {object} parsedEmail 
 * @returns {Array<{ address: string, version: number, source: string }>}
 */
export function extractIps(parsedEmail) {
  if (!parsedEmail) return [];

  const headers = parsedEmail.headers?.all || [];
  const receivedHeaders = headers.filter((h) => h.name.toLowerCase() === 'received');
  const ipMap = new Map(); // address -> { address, version, source }

  // Regex patterns
  const IPV4_CANDIDATE_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  // Matches IPv6 inside brackets e.g. [2001:db8::1] or standalone IPv6 with multiple colons
  const IPV6_BRACKET_REGEX = /\[([0-9a-fA-F:]+)\]/g;
  const IPV6_STANDALONE_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g;

  for (const h of receivedHeaders) {
    const text = h.value || '';

    // 1. Check IPv4 candidates
    const ipv4Matches = text.match(IPV4_CANDIDATE_REGEX) || [];
    for (const candidate of ipv4Matches) {
      if (isValidIpv4(candidate) && !ipMap.has(candidate)) {
        ipMap.set(candidate, {
          address: candidate,
          version: 4,
          source: 'received_header'
        });
      }
    }

    // 2. Check bracketed IPv6 candidates
    let bracketMatch;
    const bracketRegex = new RegExp(IPV6_BRACKET_REGEX);
    while ((bracketMatch = bracketRegex.exec(text)) !== null) {
      const candidate = bracketMatch[1];
      if (isValidIpv6(candidate) && !ipMap.has(candidate)) {
        ipMap.set(candidate, {
          address: candidate,
          version: 6,
          source: 'received_header'
        });
      }
    }

    // 3. Check standalone IPv6 candidates
    const ipv6Matches = text.match(IPV6_STANDALONE_REGEX) || [];
    for (const candidate of ipv6Matches) {
      if (isValidIpv6(candidate) && !ipMap.has(candidate)) {
        ipMap.set(candidate, {
          address: candidate,
          version: 6,
          source: 'received_header'
        });
      }
    }
  }

  return Array.from(ipMap.values());
}

/**
 * Parses the domain portion of an email address string.
 * Supports: "Display Name <user@example.com>", "<user@example.com>", or "user@example.com".
 * 
 * @param {string} emailStr 
 * @returns {string|null}
 */
export function extractDomainFromEmailAddress(emailStr) {
  if (!emailStr || typeof emailStr !== 'string') return null;

  // Extract address portion within angle brackets if present
  const angleMatch = emailStr.match(/<([^>]+)>/);
  const target = (angleMatch ? angleMatch[1] : emailStr).trim();

  const atIndex = target.lastIndexOf('@');
  if (atIndex === -1 || atIndex === target.length - 1) return null;

  let domain = target.slice(atIndex + 1).trim().toLowerCase();
  if (domain.endsWith('.')) {
    domain = domain.slice(0, -1);
  }

  return domain || null;
}

/**
 * Extracts sender-related domains from From, Reply-To, and Return-Path.
 * Does NOT infer Reply-To or Return-Path from From.
 * 
 * @param {object} parsedEmail 
 * @returns {{ from: string[], replyTo: string[], returnPath: string[] }}
 */
export function extractSenderDomains(parsedEmail) {
  const result = {
    from: [],
    replyTo: [],
    returnPath: []
  };

  if (!parsedEmail || !parsedEmail.metadata) return result;

  // From
  const fromHeader = parsedEmail.metadata.from;
  if (fromHeader) {
    const domain = extractDomainFromEmailAddress(fromHeader);
    if (domain && !result.from.includes(domain)) {
      result.from.push(domain);
    }
  }

  // Reply-To (array in normalized email object)
  const replyToArray = Array.isArray(parsedEmail.metadata.replyTo)
    ? parsedEmail.metadata.replyTo
    : (parsedEmail.metadata.replyTo ? [parsedEmail.metadata.replyTo] : []);

  for (const addr of replyToArray) {
    const domain = extractDomainFromEmailAddress(addr);
    if (domain && !result.replyTo.includes(domain)) {
      result.replyTo.push(domain);
    }
  }

  // Return-Path
  const returnPathHeader = parsedEmail.metadata.returnPath;
  if (returnPathHeader) {
    const domain = extractDomainFromEmailAddress(returnPathHeader);
    if (domain && !result.returnPath.includes(domain)) {
      result.returnPath.push(domain);
    }
  }

  return result;
}

/**
 * Extracts and deduplicates domains from URLs and sender headers.
 * Preserves complete subdomains (e.g. login.example.com).
 * 
 * @param {object} parsedEmail 
 * @param {Array} extractedUrls 
 * @param {object} senderDomains 
 * @returns {Array<{ original: string, normalized: string, source: string }>}
 */
export function extractDomains(parsedEmail, extractedUrls = [], senderDomains = { from: [], replyTo: [], returnPath: [] }) {
  const domainMap = new Map(); // normalizedDomain -> { original, normalized, source }

  // 1. Domains from URLs
  for (const u of extractedUrls) {
    if (u.domain) {
      const normalized = u.domain.toLowerCase();
      if (!domainMap.has(normalized)) {
        domainMap.set(normalized, {
          original: u.domain,
          normalized,
          source: 'url'
        });
      }
    }
  }

  // 2. Domains from Sender headers
  const allSenderDomains = [
    ...senderDomains.from,
    ...senderDomains.replyTo,
    ...senderDomains.returnPath
  ];

  for (const sDomain of allSenderDomains) {
    const normalized = sDomain.toLowerCase();
    if (!domainMap.has(normalized)) {
      domainMap.set(normalized, {
        original: sDomain,
        normalized,
        source: 'sender'
      });
    }
  }

  return Array.from(domainMap.values());
}

/**
 * Master Artifact Extraction Function.
 * Orchestrates URL extraction, URL normalization, IP extraction,
 * sender-domain extraction, and domain extraction.
 * 
 * @param {object} parsedEmail 
 * @returns {{ urls: Array, ips: Array, domains: Array, senderDomains: object }}
 */
export function extractArtifacts(parsedEmail) {
  if (!parsedEmail) {
    return {
      urls: [],
      ips: [],
      domains: [],
      senderDomains: { from: [], replyTo: [], returnPath: [] }
    };
  }

  const urls = extractUrls(parsedEmail);
  const ips = extractIps(parsedEmail);
  const senderDomains = extractSenderDomains(parsedEmail);
  const domains = extractDomains(parsedEmail, urls, senderDomains);

  return {
    urls,
    ips,
    domains,
    senderDomains
  };
}
