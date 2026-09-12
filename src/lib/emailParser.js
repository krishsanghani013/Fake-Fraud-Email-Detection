/**
 * Phase 1 — Core Email Ingestion & RFC 5322 Parser
 * 
 * Standards-compliant, deterministic parser for RFC 5322 and basic MIME messages.
 * Does NOT invent data, does NOT execute AI/risk scoring/threat intelligence.
 * Produces a single canonical normalized email structure.
 */

/**
 * Validates raw email input before parsing.
 * Rejects empty content or inputs that clearly lack email headers.
 * 
 * @param {string} rawInput 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmailInput(rawInput) {
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      valid: false,
      error: 'No email content was provided.'
    };
  }

  // An email must contain at least one colon in header format or header/body boundary
  const trimmed = rawInput.trim();
  const firstLine = trimmed.split(/\r?\n/)[0];
  const hasHeaderPattern = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]+:\s*.+/m.test(trimmed);

  if (!hasHeaderPattern && !trimmed.includes(':')) {
    return {
      valid: false,
      error: 'Input does not contain recognizable RFC 5322 email headers.'
    };
  }

  return { valid: true };
}

/**
 * Unfolds RFC 5322 folded multiline headers.
 * Continuation lines begin with a SPACE (0x20) or TAB (0x09).
 * 
 * @param {string} headerBlock 
 * @returns {string}
 */
export function unfoldHeaders(headerBlock) {
  if (!headerBlock) return '';
  return headerBlock.replace(/\r?\n([ \t]+)/g, ' $1').replace(/[ \t]+/g, ' ');
}

/**
 * Parses raw header block into an array of { name, value } pairs.
 * Preserves duplicate headers (e.g. multiple Received headers) and original order.
 * 
 * @param {string} headerBlock 
 * @returns {Array<{ name: string, value: string }>}
 */
export function parseHeaderLines(headerBlock) {
  if (!headerBlock) return [];

  const lines = headerBlock.split(/\r?\n/);
  const unfoldedLines = [];
  let currentHeader = '';

  for (const line of lines) {
    if (/^[ \t]/.test(line)) {
      // Continuation line
      if (currentHeader) {
        currentHeader += ' ' + line.trim();
      }
    } else {
      if (currentHeader) {
        unfoldedLines.push(currentHeader);
      }
      currentHeader = line;
    }
  }
  if (currentHeader) {
    unfoldedLines.push(currentHeader);
  }

  const allHeaders = [];

  for (const line of unfoldedLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const name = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      allHeaders.push({ name, value });
    }
  }

  return allHeaders;
}

/**
 * Splits comma-separated address lists (e.g. "a@b.com, Name <c@d.com>")
 * 
 * @param {string} headerValue 
 * @returns {string[]}
 */
export function parseAddressList(headerValue) {
  if (!headerValue || !headerValue.trim()) return [];

  const addresses = [];
  let current = '';
  let inQuotes = false;
  let inAngle = false;

  for (let i = 0; i < headerValue.length; i++) {
    const char = headerValue[i];

    if (char === '"' && (i === 0 || headerValue[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === '<' && !inQuotes) {
      inAngle = true;
    } else if (char === '>' && !inQuotes) {
      inAngle = false;
    } else if (char === ',' && !inQuotes && !inAngle) {
      const trimmed = current.trim();
      if (trimmed) addresses.push(trimmed);
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) addresses.push(trimmed);

  return addresses;
}

/**
 * Splits space-separated message IDs (e.g. for References header)
 * 
 * @param {string} headerValue 
 * @returns {string[]}
 */
export function parseReferencesList(headerValue) {
  if (!headerValue || !headerValue.trim()) return [];
  const matches = headerValue.match(/<[^>]+>/g);
  if (matches && matches.length > 0) {
    return matches.map((m) => m.trim());
  }
  return headerValue.split(/\s+/).map((v) => v.trim()).filter(Boolean);
}

/**
 * Parses MIME header parameter values like: boundary="----=_Part_123" or filename="doc.pdf"
 * 
 * @param {string} headerValue 
 * @param {string} paramName 
 * @returns {string|null}
 */
export function getMimeParameter(headerValue, paramName) {
  if (!headerValue) return null;
  const regex = new RegExp(`${paramName}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^;\\s]+))`, 'i');
  const match = headerValue.match(regex);
  if (!match) return null;
  return match[1] || match[2] || match[3] || null;
}

/**
 * Parses MIME body and extracts text, html, MIME parts, and attachment metadata.
 * Handles nested multiparts (multipart/mixed, multipart/alternative, multipart/related).
 */
export function parseMimeStructure(contentTypeHeader, bodyContent, warnings = []) {
  const parts = [];
  const attachments = [];
  let textBody = '';
  let htmlBody = '';

  const cleanContentType = contentTypeHeader ? contentTypeHeader.split(';')[0].trim().toLowerCase() : 'text/plain';
  const boundary = getMimeParameter(contentTypeHeader, 'boundary');

  if (cleanContentType.startsWith('multipart/') && boundary) {
    const boundaryMarker = `--${boundary}`;
    const endMarker = `--${boundary}--`;

    const rawParts = bodyContent.split(boundaryMarker);

    for (let i = 1; i < rawParts.length; i++) {
      let rawPart = rawParts[i];
      if (rawPart.startsWith('--') || rawPart.trim() === '--') {
        // End of multipart container
        continue;
      }

      // Separate part headers and body
      const separatorMatch = rawPart.search(/\r?\n\r?\n/);
      let partHeaderBlock = '';
      let partBody = '';

      if (separatorMatch !== -1) {
        partHeaderBlock = rawPart.slice(0, separatorMatch);
        partBody = rawPart.slice(separatorMatch).replace(/^\r?\n\r?\n/, '');
      } else {
        partBody = rawPart;
      }

      // Trim trailing CRLF/LF from boundary
      partBody = partBody.replace(/\r?\n$/, '');

      const partHeaders = parseHeaderLines(partHeaderBlock);
      const getHeader = (name) => {
        const h = partHeaders.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return h ? h.value : null;
      };

      const partContentType = getHeader('Content-Type') || 'text/plain';
      const partContentDisposition = getHeader('Content-Disposition');
      const partContentTransferEncoding = getHeader('Content-Transfer-Encoding');

      const filename =
        getMimeParameter(partContentDisposition, 'filename') ||
        getMimeParameter(partContentType, 'name') ||
        null;

      const cleanPartType = partContentType.split(';')[0].trim().toLowerCase();

      // Record MIME part metadata
      const partMeta = {
        contentType: cleanPartType || 'text/plain',
        contentDisposition: partContentDisposition ? partContentDisposition.split(';')[0].trim().toLowerCase() : null,
        contentTransferEncoding: partContentTransferEncoding ? partContentTransferEncoding.trim().toLowerCase() : null,
        filename: filename || null
      };
      parts.push(partMeta);

      // Check if this is an attachment
      const isAttachment =
        (partContentDisposition && partContentDisposition.toLowerCase().includes('attachment')) ||
        Boolean(filename);

      if (isAttachment) {
        let decodedSize = null;
        if (partContentTransferEncoding && partContentTransferEncoding.toLowerCase() === 'base64') {
          // Calculate exact base64 decoded size if possible
          const cleanB64 = partBody.replace(/[^A-Za-z0-9+/=]/g, '');
          if (cleanB64.length > 0) {
            let padding = 0;
            if (cleanB64.endsWith('==')) padding = 2;
            else if (cleanB64.endsWith('=')) padding = 1;
            decodedSize = Math.max(0, Math.floor((cleanB64.length * 3) / 4) - padding);
          }
        }

        attachments.push({
          filename: filename || 'unnamed-attachment',
          contentType: cleanPartType || 'application/octet-stream',
          size: decodedSize, // null when size cannot be deterministically computed
          contentDisposition: partMeta.contentDisposition || 'attachment'
        });
      } else if (cleanPartType.startsWith('multipart/')) {
        // Recursive parsing for nested multipart (e.g. multipart/related inside multipart/mixed)
        const nested = parseMimeStructure(partContentType, partBody, warnings);
        parts.push(...nested.parts);
        attachments.push(...nested.attachments);
        if (!textBody && nested.textBody) textBody = nested.textBody;
        if (!htmlBody && nested.htmlBody) htmlBody = nested.htmlBody;
      } else if (cleanPartType === 'text/html') {
        htmlBody += (htmlBody ? '\n' : '') + partBody;
      } else if (cleanPartType === 'text/plain') {
        textBody += (textBody ? '\n' : '') + partBody;
      }
    }

    if (parts.length === 0) {
      warnings.push('MIME multipart declared with boundary but no child parts could be extracted.');
    }
  } else {
    // Single-part message
    if (cleanContentType === 'text/html') {
      htmlBody = bodyContent;
    } else {
      textBody = bodyContent;
    }

    parts.push({
      contentType: cleanContentType,
      contentDisposition: null,
      contentTransferEncoding: null,
      filename: null
    });
  }

  return {
    parts,
    attachments,
    textBody,
    htmlBody
  };
}

/**
 * Canonical RFC 5322 & MIME Email Parser
 * Converts raw email text or .eml content into ONE canonical Normalized Email Object.
 * 
 * @param {string} rawInput 
 * @returns {{ success: boolean, data?: object, error?: string, warnings?: string[] }}
 */
export function parseRawEmail(rawInput) {
  const validation = validateEmailInput(rawInput);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      warnings: []
    };
  }

  const warnings = [];

  try {
    // Detect header / body boundary (first double newline)
    const boundaryIndex = rawInput.search(/\r?\n\r?\n/);
    let rawHeaders = '';
    let rawBody = '';

    if (boundaryIndex !== -1) {
      rawHeaders = rawInput.slice(0, boundaryIndex);
      // Skip the double newline delimiter
      rawBody = rawInput.slice(boundaryIndex).replace(/^\r?\n\r?\n/, '');
    } else {
      // Entire message appears to be headers without a body delimiter
      rawHeaders = rawInput;
      rawBody = '';
      warnings.push('No header/body boundary separator found; parsed entire input as headers.');
    }

    // Parse all raw headers
    const allHeaders = parseHeaderLines(rawHeaders);

    if (allHeaders.length === 0) {
      return {
        success: false,
        error: 'Unable to extract any valid RFC 5322 headers from input.',
        warnings
      };
    }

    // Helper to find header case-insensitively
    const findHeader = (name) => {
      const match = allHeaders.find((h) => h.name.toLowerCase() === name.toLowerCase());
      return match ? match.value : null;
    };

    // Helper to find all occurrences of a header
    const findAllHeaders = (name) => {
      return allHeaders
        .filter((h) => h.name.toLowerCase() === name.toLowerCase())
        .map((h) => h.value);
    };

    // Extract common RFC 5322 headers
    const from = findHeader('From');
    const to = parseAddressList(findHeader('To'));
    const cc = parseAddressList(findHeader('Cc'));
    const bcc = parseAddressList(findHeader('Bcc'));
    const replyTo = parseAddressList(findHeader('Reply-To'));
    const returnPath = findHeader('Return-Path');
    const subject = findHeader('Subject');
    const date = findHeader('Date');
    const messageId = findHeader('Message-ID');
    const inReplyTo = findHeader('In-Reply-To');
    const references = parseReferencesList(findHeader('References'));
    const mimeVersion = findHeader('MIME-Version');
    const contentType = findHeader('Content-Type');
    const contentTransferEncoding = findHeader('Content-Transfer-Encoding');

    // Basic MIME Parsing & Body Extraction
    const { parts, attachments, textBody, htmlBody } = parseMimeStructure(
      contentType,
      rawBody,
      warnings
    );

    // Canonical Normalized Email Object
    const normalizedEmail = {
      metadata: {
        from: from || null,
        to: to || [],
        cc: cc || [],
        bcc: bcc || [],
        replyTo: replyTo || [],
        returnPath: returnPath || null,
        subject: subject || null,
        date: date || null,
        messageId: messageId || null,
        inReplyTo: inReplyTo || null,
        references: references || [],
        mimeVersion: mimeVersion || null,
        contentType: contentType || null,
        contentTransferEncoding: contentTransferEncoding || null
      },
      headers: {
        all: allHeaders
      },
      body: {
        text: textBody || '',
        html: htmlBody || ''
      },
      mime: {
        contentType: contentType ? contentType.split(';')[0].trim().toLowerCase() : null,
        parts: parts || []
      },
      attachments: attachments || [],
      raw: {
        size: rawInput.length
      }
    };

    return {
      success: true,
      data: normalizedEmail,
      warnings
    };
  } catch (err) {
    // Robust error handling: do not expose stack trace
    return {
      success: false,
      error: 'An error occurred while parsing the RFC 5322 email structure.',
      warnings: [err.message]
    };
  }
}
