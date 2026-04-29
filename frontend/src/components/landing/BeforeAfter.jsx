import { motion } from "framer-motion";

export function BeforeAfter() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent mb-4">
            Before vs after
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 text-balance leading-tight">
            Most cold emails sound the same. Overlabs does not.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            title="Before (generic)"
            body="I'm interested in your work on generative models. Would love to discuss opportunities."
          />
          <Card
            title="After (Overlabs)"
            body="Your work on Recycle-GAN highlights how reconstruction loss can cause perceptual mode collapse. In my project, I address a similar failure mode using cross-attention-based style injection, which decouples style from reconstruction."
          />
        </div>
      </div>
    </section>
  );
}

function Card({ title, body }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-cream-300/70 bg-cream-50 p-7 shadow-soft"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink-900">
          {title}
        </h3>
        <span className="h-2 w-2 rounded-full bg-rust-400/60" />
      </div>
      <p className="text-sm leading-relaxed text-ink-700">{body}</p>
    </motion.div>
  );
}

