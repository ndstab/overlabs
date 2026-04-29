import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "You upload your CV",
    body: "And paste the professor's Semantic Scholar profile. Optionally add background that isn't on your CV: what you actually care about.",
  },
  {
    n: "02",
    title: "We read their papers",
    body: "Up to 50 abstracts go to a paper-selection model that picks 7, including method-level domain matches you'd miss scrolling their page manually.",
  },
  {
    n: "03",
    title: "We draft the email",
    body: "A second model reads the full text of those 7 papers, finds the method-level overlap to your work, and writes a draft you'd be proud to send.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function HowItWorks() {
  return (
    <section id="how" className="relative">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
          }}
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-4">
              How it works
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 text-balance">
              A two-stage research-compatibility matcher, not a template-filler.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-7">
            {STEPS.map((step) => (
              <motion.div
                key={step.n}
                variants={fadeUp}
                className="group relative rounded-2xl border border-cream-300/70 bg-white p-7 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-baseline justify-between mb-5">
                  <span className="font-mono text-xs text-ink-500 tracking-widest">
                    {step.n}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-rust-400/50 group-hover:bg-rust-500 transition-colors" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink-900 mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-600">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
