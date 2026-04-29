import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export function EmailOutput({
  subjectLine,
  emailBody,
  paragraphs,
  onReset,
  activeCitation,
  onCitationChange,
}) {
  const [copied, setCopied] = useState(false);

  const renderedParagraphs = useMemo(() => {
    if (paragraphs && paragraphs.length > 0) return paragraphs;
    return emailBody
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((text) => ({ text, citations: [] }));
  }, [paragraphs, emailBody]);

  const totalCitations = useMemo(
    () => renderedParagraphs.reduce((acc, p) => acc + (p.citations?.length || 0), 0),
    [renderedParagraphs]
  );

  function handleCopy() {
    const full = `Subject: ${subjectLine}\n\n${emailBody}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function isActive(citation) {
    if (!activeCitation) return false;
    return (
      activeCitation.phrase === citation.phrase &&
      activeCitation.paper_index === citation.paper_index
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-5"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust-500">
            Ready to send
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mt-1 tracking-tight">
            Your email
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-cream-50 hover:border-ink-500/30 transition-all"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4 text-rust-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy all
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-medium text-cream-50 hover:bg-accent-deep transition-colors"
          >
            New email
          </button>
        </div>
      </motion.div>

      {totalCitations > 0 ? (
        <motion.p
          variants={fadeUp}
          className="text-xs text-ink-500 leading-relaxed"
        >
          <span className="inline-block align-middle h-1.5 w-1.5 rounded-full bg-rust-400/70 mr-2" />
          Highlighted phrases trace back to the professor's papers. Tap one
          to see the connection.
        </motion.p>
      ) : null}

      <motion.div
        variants={fadeUp}
        className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-lift"
      >
        <div className="border-b border-cream-300/70 bg-cream-50/70 px-6 py-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rust-400/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-rust-400/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-rust-400/20" />
          <span className="ml-3 font-mono text-xs text-ink-500">
            draft.eml
          </span>
        </div>

        <div className="px-6 sm:px-8 py-7 space-y-5">
          <motion.div variants={fadeUp} className="pb-4 border-b border-cream-300/50">
            <p className="font-mono text-xs text-ink-500 mb-1">SUBJECT</p>
            <p className="font-medium text-ink-900 text-[15px]">
              {subjectLine}
            </p>
          </motion.div>

          {renderedParagraphs.map((para, i) => (
            <motion.p
              key={i}
              variants={fadeUp}
              className="text-[15px] leading-relaxed text-ink-800 whitespace-pre-wrap"
            >
              {renderParagraph(para, {
                onCitationClick: onCitationChange,
                isActive,
              })}
            </motion.p>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function renderParagraph(paragraph, { onCitationClick, isActive }) {
  const text = paragraph.text;
  const citations = paragraph.citations || [];
  if (!citations.length) return text;

  const matches = [];
  for (const citation of citations) {
    const pos = text.indexOf(citation.phrase);
    if (pos === -1) continue;
    matches.push({ start: pos, end: pos + citation.phrase.length, citation });
  }
  matches.sort((a, b) => a.start - b.start);

  // Drop overlapping spans (keep the earlier match).
  const filtered = [];
  for (const m of matches) {
    const last = filtered[filtered.length - 1];
    if (!last || m.start >= last.end) filtered.push(m);
  }
  if (!filtered.length) return text;

  const out = [];
  let cursor = 0;
  filtered.forEach((m, idx) => {
    if (m.start > cursor) {
      out.push(text.slice(cursor, m.start));
    }
    out.push(
      <CitationHighlight
        key={`h-${idx}`}
        text={text.slice(m.start, m.end)}
        active={isActive(m.citation)}
        onClick={() => onCitationClick(m.citation)}
      />
    );
    cursor = m.end;
  });
  if (cursor < text.length) {
    out.push(text.slice(cursor));
  }
  return out;
}

function CitationHighlight({ text, active, onClick }) {
  function handleKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      className={`citation-mark${active ? " is-active" : ""}`}
    >
      {text}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
