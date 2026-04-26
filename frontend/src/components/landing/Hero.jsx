import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <BackgroundDecor />

      <div className="relative mx-auto max-w-5xl px-6 pt-28 pb-32 sm:pt-36 sm:pb-40">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
          className="text-center"
        >
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-ink-900 text-balance leading-[1.05]"
          >
            The cold email professors{" "}
            <span className="italic text-accent" style={{ fontVariationSettings: "'SOFT' 100" }}>
              actually
            </span>{" "}
            read.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-7 max-w-2xl text-lg text-ink-600 leading-relaxed text-balance"
          >
            Overlabs reads the professor's papers, finds the non-obvious
            connections to your work, and drafts a concise email that earns a
            reply.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center"
          >
            <Link
              to="/generate"
              className="group inline-flex items-center gap-2 rounded-xl bg-ink-900 px-6 py-3.5 text-sm font-semibold text-cream-50 hover:bg-accent-deep transition-all shadow-lift hover:shadow-soft"
            >
              Write my email
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#example"
              className="inline-flex items-center gap-2 rounded-xl border border-cream-300 bg-white/60 px-6 py-3.5 text-sm font-medium text-ink-700 hover:bg-white hover:border-ink-500/30 transition-all backdrop-blur"
            >
              See an example
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217, 119, 87, 0.55), transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-20 -left-20 h-[380px] w-[380px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99, 102, 241, 0.4), transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(26,24,20,1) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </>
  );
}
