import { motion } from "framer-motion";

export function Problem() {
  return (
    <section className="relative border-y border-cream-300/60 bg-cream-50">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-2 gap-12 md:gap-16 items-start"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust-500 mb-4">
              The problem
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 text-balance leading-tight">
              Most cold emails to professors get ignored, and for good reason.
            </h2>
          </div>
          <div className="space-y-5 text-ink-700 leading-relaxed">
            <p>
              Professors get dozens a week. The ones that work look the same:
              they reference a specific paper, draw a credible technical
              connection to the student's prior work, and ask one clear
              question.
            </p>
            <p>
              Writing one of those takes hours of paper-skimming per professor.
              So most students send generic templates instead, and never hear
              back.
            </p>
            <p className="text-ink-900 font-medium">
              Overlabs does the paper-skimming for you. The whole pipeline runs
              on the professor's actual papers, not vibes.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
