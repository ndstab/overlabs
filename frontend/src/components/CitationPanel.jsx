import { AnimatePresence, motion } from "framer-motion";

export function CitationPanel({ citation, onClose }) {
  return (
    <AnimatePresence>
      {citation ? (
        <>
          <motion.button
            type="button"
            aria-label="Close citation"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-[2px]"
          />

          <motion.aside
            key="panel"
            initial={{ opacity: 0, x: 24, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="
              hidden lg:block
              fixed top-24 right-6 z-40
              w-[340px] xl:w-[360px] max-h-[calc(100vh-8rem)]
              overflow-y-auto
              rounded-2xl border border-cream-300 bg-white shadow-lift
            "
          >
            <PanelContent citation={citation} onClose={onClose} />
          </motion.aside>

          <motion.aside
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="
              lg:hidden
              fixed bottom-0 left-0 right-0 z-40
              max-h-[80vh] overflow-y-auto
              rounded-t-2xl border-t border-cream-300 bg-white shadow-lift
            "
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-cream-300" />
            </div>
            <PanelContent citation={citation} onClose={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function PanelContent({ citation, onClose }) {
  return (
    <motion.div
      key={`${citation.paper_index}:${citation.phrase}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="px-6 py-6"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rust-500">
          Why this is highlighted
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100 hover:text-ink-900 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500 mb-1">
        From paper
      </p>
      <h3 className="font-display text-lg leading-snug font-semibold text-ink-900 tracking-tight">
        {citation.paper_title}
        {citation.paper_year ? (
          <span className="ml-1.5 text-ink-500 font-normal text-base">
            ({citation.paper_year})
          </span>
        ) : null}
      </h3>

      <div className="mt-5 rounded-lg bg-cream-100/70 border border-cream-300/60 px-3.5 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 mb-1">
          Highlighted phrase
        </p>
        <p className="text-sm text-ink-800 leading-snug">
          &ldquo;{citation.phrase}&rdquo;
        </p>
      </div>

      <p className="mt-5 text-[14px] leading-relaxed text-ink-800 whitespace-pre-wrap">
        {citation.explanation}
      </p>
    </motion.div>
  );
}
