'use client';

import React, { useState } from 'react';
import {
  FileText,
  Mail,
  Send,
  CornerDownRight,
  Clock,
  Layers,
  Paperclip,
  Code,
  Copy,
  Check,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export function EmailForensicPreview({ emailData }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('metadata'); // 'metadata' | 'body' | 'mime' | 'attachments' | 'headers'
  const [copied, setCopied] = useState(false);
  const [headerFilter, setHeaderFilter] = useState('');

  if (!emailData) return null;

  const {
    metadata = {},
    headers = { all: [] },
    body = { text: '', html: '' },
    mime = { contentType: null, parts: [] },
    attachments = [],
    raw = { size: 0 }
  } = emailData;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Copied', `${label} copied to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHeaders = headers.all.filter(
    (h) =>
      h.name.toLowerCase().includes(headerFilter.toLowerCase()) ||
      h.value.toLowerCase().includes(headerFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div className="glass-card p-6 border border-white/10 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primaryBlue/10 border border-primaryBlue/30 text-primaryBlue text-xs font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-successGreen" /> Normalized RFC 5322 Object
            </span>
            <span className="text-xs font-mono text-textSecondary">
              Raw Size: {(raw.size / 1024).toFixed(2)} KB ({raw.size} bytes)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-textSecondary">
            <span>{headers.all.length} Headers</span>
            <span>•</span>
            <span>{mime.parts.length} MIME Parts</span>
            <span>•</span>
            <span>{attachments.length} Attachments</span>
          </div>
        </div>

        {/* Email Core Subject & Sender */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-textPrimary leading-snug">
            {metadata.subject || '(No Subject Header)'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-textSecondary">
            <div>
              From: <strong className="text-textPrimary">{metadata.from || 'null'}</strong>
            </div>
            {metadata.date && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primaryBlue" /> {metadata.date}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-borderSubtle pb-1">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'metadata'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Mail className="w-4 h-4" /> Email Metadata
        </button>

        <button
          onClick={() => setActiveTab('body')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'body'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <FileText className="w-4 h-4" /> Body (Text & HTML)
        </button>

        <button
          onClick={() => setActiveTab('mime')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'mime'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Layers className="w-4 h-4" /> MIME Structure ({mime.parts.length})
        </button>

        <button
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'attachments'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'headers'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Code className="w-4 h-4" /> All Headers ({headers.all.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* TAB 1: EMAIL METADATA */}
        {activeTab === 'metadata' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textSecondary pb-2 border-b border-borderSubtle">
              Extracted RFC 5322 Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">From:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.from || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">To ({metadata.to.length}):</span>
                <div className="font-semibold text-textPrimary break-all">
                  {metadata.to.length > 0 ? metadata.to.join(', ') : '[]'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Subject:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.subject || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Date:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.date || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Reply-To ({metadata.replyTo.length}):</span>
                <div className="font-semibold text-textPrimary break-all">
                  {metadata.replyTo.length > 0 ? metadata.replyTo.join(', ') : '[]'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Return-Path:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.returnPath || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1 md:col-span-2">
                <span className="text-textSecondary">Message-ID:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.messageId || 'null'}</div>
              </div>

              {metadata.cc.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">Cc:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.cc.join(', ')}</div>
                </div>
              )}

              {metadata.bcc.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">Bcc:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.bcc.join(', ')}</div>
                </div>
              )}

              {metadata.inReplyTo && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">In-Reply-To:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.inReplyTo}</div>
                </div>
              )}

              {metadata.references.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1 md:col-span-2">
                  <span className="text-textSecondary">References:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.references.join(' ')}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* TAB 2: BODY (TEXT & HTML) */}
        {activeTab === 'body' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="text-xs font-bold font-mono text-textPrimary">Plain Text Body</div>
                <div className="text-xs font-mono text-textSecondary">{body.text.length} characters</div>
              </div>

              {body.text ? (
                <pre className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle font-mono text-xs text-textPrimary leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {body.text}
                </pre>
              ) : (
                <p className="text-xs text-textSecondary italic">No plain-text body content extracted.</p>
              )}
            </Card>

            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="text-xs font-bold font-mono text-textPrimary">HTML Body Indicator & Source</div>
                <div className="text-xs font-mono text-textSecondary">
                  {body.html ? `${body.html.length} characters (HTML present)` : 'No HTML body present'}
                </div>
              </div>

              {body.html ? (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-purpleAccent/10 border border-purpleAccent/30 text-xs text-purpleAccent font-mono">
                    Note: Untrusted HTML source displayed for inspection. Scripts are never executed.
                  </div>
                  <pre className="p-4 rounded-2xl bg-black/80 border border-white/5 font-mono text-xs text-cyanAccent/90 leading-relaxed overflow-x-auto max-h-80 overflow-y-auto">
                    {body.html}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-textSecondary italic">No HTML body part present in email.</p>
              )}
            </Card>
          </div>
        )}

        {/* TAB 3: MIME STRUCTURE */}
        {activeTab === 'mime' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-borderSubtle text-xs font-mono">
              <span className="text-textSecondary">
                Top-Level Content-Type: <strong className="text-textPrimary">{mime.contentType || 'text/plain'}</strong>
              </span>
              <span className="text-textSecondary">Total Parts: {mime.parts.length}</span>
            </div>

            {mime.parts.length === 0 ? (
              <p className="text-xs text-textSecondary italic">No MIME parts extracted.</p>
            ) : (
              <div className="space-y-3">
                {mime.parts.map((part, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between font-bold text-textPrimary">
                      <span className="text-primaryBlue">Part #{idx + 1}: {part.contentType}</span>
                      {part.filename && (
                        <span className="text-purpleAccent">{part.filename}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-textSecondary">
                      <div>Disposition: {part.contentDisposition || 'inline'}</div>
                      <div>Encoding: {part.contentTransferEncoding || '7bit'}</div>
                      <div>File: {part.filename || 'none'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: ATTACHMENTS */}
        {activeTab === 'attachments' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-borderSubtle text-xs font-mono text-textSecondary">
              <span>Detected Attachments ({attachments.length})</span>
              <span>Metadata extraction foundation</span>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-textSecondary italic">No attachments detected in this message.</p>
            ) : (
              <div className="space-y-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold text-textPrimary">
                      <span className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-purpleAccent" />
                        {att.filename}
                      </span>
                      <span className="text-textSecondary text-[11px]">
                        {att.size !== null ? `${att.size} bytes` : 'Size Unknown (null)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-textSecondary">
                      <div>Content-Type: {att.contentType}</div>
                      <div>Disposition: {att.contentDisposition}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 5: ALL HEADERS */}
        {activeTab === 'headers' && (
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                <input
                  type="text"
                  value={headerFilter}
                  onChange={(e) => setHeaderFilter(e.target.value)}
                  placeholder="Filter headers..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-primaryBlue"
                />
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    headers.all.map((h) => `${h.name}: ${h.value}`).join('\n'),
                    'All Headers'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono text-textPrimary hover:border-primaryBlue transition-all self-start sm:self-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-successGreen" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Headers</span>
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredHeaders.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No headers match filter.</p>
              ) : (
                filteredHeaders.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1 hover:border-white/20 transition-colors"
                  >
                    <div className="text-primaryBlue font-bold select-all">{h.name}:</div>
                    <div className="text-textPrimary break-all leading-relaxed select-all pl-2">
                      {h.value}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
