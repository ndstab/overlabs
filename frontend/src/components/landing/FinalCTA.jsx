import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 py-28 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-cream-300/70 bg-white px-8 sm:px-14 py-16 sm:py-20 text-center shadow-lift overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-[280px] w-[280px] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(217,119,87,0.45), transparent)",
            }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-[280px] w-[280px] rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(99,102,241,0.4), transparent)",
            }}
          />

          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900 text-balance leading-tight">
              The professor you want to work with deserves a{" "}
              <span className="italic text-accent">real</span> email.
            </h2>
            <p className="mt-6 max-w-xl mx-auto text-ink-600 leading-relaxed">
              Takes about 30 seconds. No account, no setup, just your CV and a
              Semantic Scholar link.
            </p>
            <Link
              to="/generate"
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-8 py-4 text-sm font-semibold text-cream-50 hover:bg-accent-deep transition-all shadow-lift"
            >
              Write my email
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M13 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
