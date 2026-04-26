import { motion } from "framer-motion";

export function ExampleEmail() {
  return (
    <section id="example" className="relative bg-cream-50 border-y border-cream-300/60">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-14 items-start"
        >
          <div className="md:sticky md:top-24">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust-500 mb-4">
              A real generation
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 text-balance leading-tight mb-5">
              Civil Engineering undergrad → CMU computer-vision PI.
            </h2>
            <p className="text-ink-600 leading-relaxed mb-4">
              The pipeline picked two papers: one methodological (Recycle-GAN)
              and one domain-proximate (pix2pix3D). For each, it found a
              concrete mechanism that the student's own GENESIS project engages
              with.
            </p>
            <p className="text-sm text-ink-500 leading-relaxed">
              Notice what it doesn't do: no "deeply inspired", no praise of
              "groundbreaking work", no apology for the degree mismatch.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl border border-cream-300/70 bg-white shadow-lift overflow-hidden"
          >
            <div className="border-b border-cream-300/60 bg-cream-50/70 px-6 py-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rust-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-rust-400/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-rust-400/20" />
              <span className="ml-3 font-mono text-xs text-ink-500">
                draft.eml
              </span>
            </div>

            <div className="px-6 sm:px-8 py-7 space-y-5 text-[15px] leading-relaxed text-ink-800">
              <div className="pb-4 border-b border-cream-300/50">
                <p className="font-mono text-xs text-ink-500 mb-1">SUBJECT</p>
                <p className="font-medium text-ink-900">
                  Research inquiry: spatiotemporal style transfer and video
                  synthesis
                </p>
              </div>

              <p>Dear Prof. Ramanan,</p>

              <p>
                I am a Civil Engineering undergraduate at IIT Bombay pursuing
                a minor in Machine Intelligence and Data Science, working
                primarily in computer vision and generative modeling.
              </p>

              <p>
                For a course project in IE 643, I developed{" "}
                <Highlight>GENESIS</Highlight>, a hybrid diffusion framework
                that integrates ControlNet with IP-Adapter for adverse weather
                synthesis. The central contribution was a High-Frequency Style
                Abstraction technique that prevents geometric content leakage
                from the style image, achieving{" "}
                <Highlight>0.44 LPIPS</Highlight>, outperforming both
                StyleGAN and Neural Style Transfer baselines.
              </p>

              <p>
                In <Highlight>Recycle-GAN</Highlight>, spatiotemporal
                constraints overcome perceptual mode collapse that pure
                cycle-consistency losses produce. GENESIS faces a structurally
                related failure mode: without explicit high-frequency
                disentanglement, IP-Adapter's style injection corrupts the
                ControlNet structural signal. I want to understand whether
                temporal predictors analogous to Recycle-GAN's spatiotemporal
                formulation could enforce style consistency across frames
                without sacrificing structural guidance.
              </p>

              <p className="text-ink-500 italic">
                ...and so on for the pix2pix3D bridge and the ask.
              </p>

              <p>Best regards,<br />Sajjad Nakhwa</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Highlight({ children }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[6px] bg-rust-400/30 rounded-sm -z-0"
      />
    </span>
  );
}
