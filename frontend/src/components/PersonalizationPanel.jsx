import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function PersonalizationPanel({ studentS2Id, writingSample, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-cream-300 bg-cream-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-ink-800 hover:bg-cream-100/60 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg
            className={`h-4 w-4 text-ink-500 transition-transform ${open ? "rotate-90" : ""}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6l4 4-4 4" />
          </svg>
          Improve personalization{" "}
          <span className="text-ink-500/70 font-normal">(optional)</span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-cream-300 px-4 py-4 bg-white">
              <div>
                <label
                  htmlFor="student-s2-id"
                  className="block text-sm font-medium text-ink-800 mb-1.5"
                >
                  Your Semantic Scholar profile{" "}
                  <span className="text-ink-500/70 font-normal">
                    (only if you have publications)
                  </span>
                </label>
                <input
                  id="student-s2-id"
                  type="text"
                  value={studentS2Id}
                  onChange={(e) => onChange("studentS2Id", e.target.value)}
                  placeholder="https://www.semanticscholar.org/author/..."
                  className="w-full rounded-lg border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-500/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
                />
                <p className="mt-1.5 text-xs text-ink-500">
                  We'll read your papers in full and use them to find sharper
                  overlaps with the professor's work.
                </p>
              </div>

              <div>
                <label
                  htmlFor="writing-sample"
                  className="block text-sm font-medium text-ink-800 mb-1.5"
                >
                  Writing sample{" "}
                  <span className="text-ink-500/70 font-normal">(optional)</span>
                </label>
                <textarea
                  id="writing-sample"
                  rows={3}
                  maxLength={2000}
                  value={writingSample}
                  onChange={(e) => onChange("writingSample", e.target.value)}
                  placeholder="Paste 2 to 3 sentences from something you've written. The email will match your voice."
                  className="w-full rounded-lg border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-500/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 resize-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
