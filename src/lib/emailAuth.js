// Email authentication forensics

// Parse semicolon tag-value pairs
function parseTagValues(text) {
  if (!text) return {};
  const tags = {};
  const parts = text.split(';');

  for (const part of parts) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
      const val = trimmed.slice(eqIdx + 1).trim();
      tags[key] = val;
    }
  }

  return tags;
}

// Parse canonicalization header/body tag
function parseCanonicalization(cVal) {
  if (!cVal) return null;
  const clean = cVal.trim().toLowerCase();
  if (clean.includes('/')) {
    const [h, b] = clean.split('/');
    return { header: h.trim(), body: b.trim() };
  }
  return { header: clean, body: 'simple' };
}

// Extract domain from string
function extractDomain(str) {
  if (!str) return null;
  const clean = str.replace(/[<>]/g, '').trim().toLowerCase();
  const atIdx = clean.lastIndexOf('@');
  if (atIdx !== -1) {
    return clean.slice(atIdx + 1).trim() || null;
  }
  return clean || null;
}

// Parse Authentication-Results headers
export function parseAuthenticationResults(headers = []) {
  const matching = headers.filter((h) => h.name.toLowerCase() === 'authentication-results');
  const results = [];

  for (const h of matching) {
    const rawVal = h.value || '';
    const cleanVal = rawVal.replace(/\r?\n\s+/g, ' ').trim();

    // The first part before semicolon is the auth server
    const firstSemi = cleanVal.indexOf(';');
    let server = cleanVal;
    let subClauses = '';

    if (firstSemi !== -1) {
      server = cleanVal.slice(0, firstSemi).trim();
      subClauses = cleanVal.slice(firstSemi + 1);
    }

    const clauses = subClauses.split(';').map((c) => c.trim()).filter(Boolean);

    let spfInfo = null;
    let dkimInfo = null;
    let dmarcInfo = null;
    let arcInfo = null;

    for (const clause of clauses) {
      // SPF section e.g. "spf=pass smtp.mailfrom=example.com"
      if (/^spf\s*=/i.test(clause)) {
        const match = clause.match(/^spf\s*=\s*([a-zA-Z0-9_-]+)/i);
        const res = match ? match[1].toLowerCase() : null;

        const mailfromMatch = clause.match(/smtp\.mailfrom\s*=\s*([^\s;]+)/i) ||
                              clause.match(/mailfrom\s*=\s*([^\s;]+)/i);
        const mailFrom = mailfromMatch ? mailfromMatch[1].trim() : null;
        const domain = extractDomain(mailFrom);

        spfInfo = {
          result: res,
          rawResult: match ? match[1] : null,
          mailFrom: mailFrom || null,
          domain: domain || null
        };
      }

      // DKIM section e.g. "dkim=pass header.d=example.com header.s=selector1"
      else if (/^dkim\s*=/i.test(clause)) {
        const match = clause.match(/^dkim\s*=\s*([a-zA-Z0-9_-]+)/i);
        const res = match ? match[1].toLowerCase() : null;

        const dMatch = clause.match(/header\.d\s*=\s*([^\s;]+)/i);
        const sMatch = clause.match(/header\.s\s*=\s*([^\s;]+)/i);
        const iMatch = clause.match(/header\.i\s*=\s*([^\s;]+)/i);

        dkimInfo = {
          result: res,
          rawResult: match ? match[1] : null,
          domain: dMatch ? dMatch[1].trim().toLowerCase() : null,
          selector: sMatch ? sMatch[1].trim() : null,
          identity: iMatch ? iMatch[1].trim() : null
        };
      }

      // DMARC section e.g. "dmarc=fail header.from=example.com policy=reject"
      else if (/^dmarc\s*=/i.test(clause)) {
        const match = clause.match(/^dmarc\s*=\s*([a-zA-Z0-9_-]+)/i);
        const res = match ? match[1].toLowerCase() : null;

        const fromMatch = clause.match(/header\.from\s*=\s*([^\s;]+)/i);
        const policyMatch = clause.match(/(?:policy|p)\s*=\s*([a-zA-Z0-9_-]+)/i);

        dmarcInfo = {
          result: res,
          rawResult: match ? match[1] : null,
          domain: fromMatch ? fromMatch[1].trim().toLowerCase() : null,
          headerFrom: fromMatch ? fromMatch[1].trim().toLowerCase() : null,
          policy: policyMatch ? policyMatch[1].trim().toLowerCase() : null
        };
      }

      // ARC section e.g. "arc=pass"
      else if (/^arc\s*=/i.test(clause)) {
        const match = clause.match(/^arc\s*=\s*([a-zA-Z0-9_-]+)/i);
        arcInfo = {
          result: match ? match[1].toLowerCase() : null,
          raw: clause
        };
      }
    }

    results.push({
      server: server || null,
      raw: cleanVal,
      spf: spfInfo,
      dkim: dkimInfo,
      dmarc: dmarcInfo,
      arc: arcInfo
    });
  }

  return results;
}

// Parse Received-SPF headers
export function parseReceivedSpf(headers = []) {
  const matching = headers.filter((h) => h.name.toLowerCase() === 'received-spf');
  const results = [];

  for (const h of matching) {
    const rawVal = h.value || '';
    const cleanVal = rawVal.replace(/\r?\n\s+/g, ' ').trim();

    // Result is the first word (pass, fail, softfail, neutral, none, temperror, permerror)
    const firstWordMatch = cleanVal.match(/^([a-zA-Z0-9_-]+)/);
    const result = firstWordMatch ? firstWordMatch[1].toLowerCase() : null;

    // Client IP e.g. client-ip=203.0.113.10
    const ipMatch = cleanVal.match(/client-ip\s*=\s*([^\s;]+)/i);
    const clientIp = ipMatch ? ipMatch[1].trim() : null;

    // Domain e.g. "domain of sender@example.com" or "envelope-from=sender@example.com"
    const domainOfMatch = cleanVal.match(/domain\s+of\s+([^\s;)]+)/i);
    const envelopeFromMatch = cleanVal.match(/envelope-from\s*=\s*([^\s;]+)/i);
    const domainCandidate = domainOfMatch ? domainOfMatch[1] : (envelopeFromMatch ? envelopeFromMatch[1] : null);
    const domain = extractDomain(domainCandidate);

    // Receiver e.g. receiver=mx.example.com
    const receiverMatch = cleanVal.match(/receiver\s*=\s*([^\s;]+)/i);
    const receiver = receiverMatch ? receiverMatch[1].trim() : null;

    results.push({
      result,
      rawResult: firstWordMatch ? firstWordMatch[1] : null,
      clientIp,
      domain,
      receiver,
      raw: cleanVal
    });
  }

  return results;
}

// Parse DKIM-Signature headers
export function parseDkimSignatures(headers = []) {
  const matching = headers.filter((h) => h.name.toLowerCase() === 'dkim-signature');
  const signatures = [];

  for (const h of matching) {
    const rawVal = h.value || '';
    const cleanVal = rawVal.replace(/\r?\n\s+/g, ' ').trim();
    const tags = parseTagValues(cleanVal);

    const version = tags['v'] || null;
    const algorithm = tags['a'] || null;
    const canonicalization = parseCanonicalization(tags['c']);
    const domain = tags['d'] ? tags['d'].toLowerCase() : null;
    const selector = tags['s'] || null;
    const signedHeaders = tags['h']
      ? tags['h'].split(':').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];
    const bodyHash = tags['bh'] || null;
    const signature = tags['b'] ? tags['b'].replace(/\s+/g, '') : null;

    signatures.push({
      version,
      algorithm,
      canonicalization,
      domain,
      selector,
      signedHeaders,
      bodyHash,
      signature,
      raw: cleanVal
    });
  }

  return signatures;
}

// Parse ARC headers
export function parseArcHeaders(headers = []) {
  const seals = [];
  const messageSignatures = [];
  const authenticationResults = [];

  for (const h of headers) {
    const lowerName = h.name.toLowerCase();
    const cleanVal = (h.value || '').replace(/\r?\n\s+/g, ' ').trim();

    if (lowerName === 'arc-seal') {
      const tags = parseTagValues(cleanVal);
      const instance = tags['i'] ? parseInt(tags['i'], 10) : null;

      seals.push({
        instance,
        algorithm: tags['a'] || null,
        cv: tags['cv'] ? tags['cv'].toLowerCase() : null,
        domain: tags['d'] ? tags['d'].toLowerCase() : null,
        selector: tags['s'] || null,
        signature: tags['b'] ? tags['b'].replace(/\s+/g, '') : null,
        raw: cleanVal
      });
    } else if (lowerName === 'arc-message-signature') {
      const tags = parseTagValues(cleanVal);
      const instance = tags['i'] ? parseInt(tags['i'], 10) : null;

      messageSignatures.push({
        instance,
        algorithm: tags['a'] || null,
        domain: tags['d'] ? tags['d'].toLowerCase() : null,
        selector: tags['s'] || null,
        canonicalization: parseCanonicalization(tags['c']),
        signedHeaders: tags['h']
          ? tags['h'].split(':').map((s) => s.trim().toLowerCase()).filter(Boolean)
          : [],
        bodyHash: tags['bh'] || null,
        signature: tags['b'] ? tags['b'].replace(/\s+/g, '') : null,
        raw: cleanVal
      });
    } else if (lowerName === 'arc-authentication-results') {
      // Instance number e.g. "i=1; mx.example.com; ..."
      const iMatch = cleanVal.match(/i\s*=\s*(\d+)/i);
      const instance = iMatch ? parseInt(iMatch[1], 10) : null;

      const semiIdx = cleanVal.indexOf(';');
      const remaining = semiIdx !== -1 ? cleanVal.slice(semiIdx + 1).trim() : cleanVal;

      authenticationResults.push({
        instance,
        raw: cleanVal,
        content: remaining
      });
    }
  }

  return {
    seals,
    messageSignatures,
    authenticationResults
  };
}

// Reconcile SPF results
function reconcileSpfResults(authResults, recSpf) {
  const results = [];

  for (const ar of authResults) {
    if (ar.spf && ar.spf.result) {
      results.push({
        source: 'Authentication-Results',
        result: ar.spf.result,
        domain: ar.spf.domain,
        mailFrom: ar.spf.mailFrom,
        raw: ar.raw
      });
    }
  }

  for (const rs of recSpf) {
    if (rs.result) {
      results.push({
        source: 'Received-SPF',
        result: rs.result,
        clientIp: rs.clientIp,
        domain: rs.domain,
        receiver: rs.receiver,
        raw: rs.raw
      });
    }
  }

  return results;
}

// Collect DKIM results
function collectDkimResults(authResults) {
  const results = [];

  for (const ar of authResults) {
    if (ar.dkim && ar.dkim.result) {
      results.push({
        source: 'Authentication-Results',
        result: ar.dkim.result,
        domain: ar.dkim.domain,
        selector: ar.dkim.selector,
        identity: ar.dkim.identity,
        raw: ar.raw
      });
    }
  }

  return results;
}

// Collect DMARC results
function collectDmarcResults(authResults) {
  const results = [];

  for (const ar of authResults) {
    if (ar.dmarc && ar.dmarc.result) {
      results.push({
        source: 'Authentication-Results',
        result: ar.dmarc.result,
        domain: ar.dmarc.domain,
        headerFrom: ar.dmarc.headerFrom,
        policy: ar.dmarc.policy,
        raw: ar.raw
      });
    }
  }

  return results;
}

// Master authentication forensics extraction
export function extractAuthenticationEvidence(parsedEmail) {
  const headers = parsedEmail?.headers?.all || [];

  const authenticationResults = parseAuthenticationResults(headers);
  const receivedSpf = parseReceivedSpf(headers);
  const dkimSignatures = parseDkimSignatures(headers);
  const arc = parseArcHeaders(headers);

  const spfResults = reconcileSpfResults(authenticationResults, receivedSpf);
  const dkimResults = collectDkimResults(authenticationResults);
  const dmarcResults = collectDmarcResults(authenticationResults);

  return {
    authenticationResults,
    receivedSpf,
    spf: {
      results: spfResults
    },
    dkim: {
      signatures: dkimSignatures,
      results: dkimResults
    },
    dmarc: {
      results: dmarcResults
    },
    arc
  };
}
