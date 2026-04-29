import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PAPERS = [
  {
    title: "Recycle-GAN: Unsupervised Video Retargeting",
    year: 2018,
  },
  {
    title: "3D-aware Conditional Image Synthesis (pix2pix3D)",
    year: 2023,
  },
];

const PARAGRAPHS = [
  { text: "Dear Prof. Ramanan,", citations: [] },
  {
    text:
      "I am a third-year BTech student in Civil Engineering at IIT Bombay, pursuing a minor in Machine Intelligence and Data Science, focused on diffusion-based image and video synthesis.",
    citations: [],
  },
  {
    text:
      "My most directly relevant project is GENESIS, a hybrid diffusion framework that combines ControlNet (Canny edges) with IP-Adapter for adverse-weather image synthesis. Its central contribution is High-Frequency Style Abstraction, which suppresses geometric content leakage from the style reference while preserving structure-guided modulation, achieving 0.44 LPIPS (lower is better) and outperforming StyleGAN and neural style transfer baselines on photorealism and structural fidelity.",
    citations: [],
  },
  {
    text:
      "Recycle-GAN shows unpaired spatial cycle consistency can fail because the reconstruction loss can push the generator toward small pixel-level differences rather than target-domain style, a failure mode you call perceptual mode collapse. In GENESIS, IP-Adapter injects style through cross-attention on CLIP embeddings rather than through a pixel reconstruction path, decoupling the style signal from the content reconstruction objective. What I want to understand is whether that decoupling is sufficient across video frames, since the spatiotemporal predictor in Recycle-GAN provides additional optimization constraints precisely to avoid that collapse in the temporal dimension.",
    citations: [
      {
        phrase: "perceptual mode collapse",
        paper_index: 1,
        paper_title: PAPERS[0].title,
        paper_year: PAPERS[0].year,
        explanation:
          "Recycle-GAN describes \"Perceptual Mode Collapse\" as a spatial cycle-consistency failure: different inputs can yield perceptually similar outputs because small pixel differences satisfy reconstruction. GENESIS avoids that by routing style through IP-Adapter cross-attention instead of the reconstruction-loss path.",
      },
      {
        phrase:
          "spatiotemporal predictor in Recycle-GAN provides additional optimization constraints precisely to avoid that collapse in the temporal dimension",
        paper_index: 1,
        paper_title: PAPERS[0].title,
        paper_year: PAPERS[0].year,
        explanation:
          "Recycle-GAN argues that temporal predictors P_X and P_Y add constraints that help escape spatial-only cycle-consistency local minima. This is the mechanism worth testing when extending GENESIS-style reference injection to video, where temporal consistency is not guaranteed by a static-image architecture.",
      },
    ],
  },
  {
    text:
      "In pix2pix3D, you encode both a 2D label map and a random latent code into style vectors, where the label map controls the first seven layers (geometry) and the latent code controls appearance through a separate MLP mapping network. In GENESIS, ControlNet Canny edges and IP-Adapter occupy structurally analogous roles, but operate in 2D and without a volumetrically consistent 3D field. I want to investigate whether a video pipeline can separate structure and appearance in a pix2pix3D-like way while enforcing frame-to-frame geometric consistency.",
    citations: [
      {
        phrase:
          "you encode both a 2D label map and a random latent code into style vectors, where the label map controls the first seven layers (geometry) and the latent code controls appearance through a separate MLP mapping network",
        paper_index: 2,
        paper_title: PAPERS[1].title,
        paper_year: PAPERS[1].year,
        explanation:
          "pix2pix3D maps the label map into early style vectors (geometry) and uses a separate MLP mapping for the latent code that drives the remaining appearance vectors. This is the architectural separation the student is using as a reference for splitting structure vs appearance in reference-guided video.",
      },
      {
        phrase:
          "ControlNet Canny edges and IP-Adapter occupy structurally analogous roles, but operate in 2D and without a volumetrically consistent 3D field",
        paper_index: 2,
        paper_title: PAPERS[1].title,
        paper_year: PAPERS[1].year,
        explanation:
          "pix2pix3D achieves cross-view geometric consistency by encoding semantic structure into a 3D volumetric tri-plane representation that can be rendered from any viewpoint. GENESIS lacks that shared 3D field because ControlNet and IP-Adapter are purely 2D operators.",
      },
    ],
  },
  {
    text:
      "I'd like to discuss potential research directions at the intersection of reference-guided video generation and the structured scene representations your group works with. Would you have 20 minutes for a call in the next few weeks?",
    citations: [],
  },
  { text: "Best regards,\nSajjad Nakhwa", citations: [] },
];

const SUBJECT =
  "Research inquiry: reference-guided video synthesis and dynamic scene generation";

export function ExampleEmail() {
  const [active, setActive] = useState(null);

  function isActive(citation) {
    if (!active) return false;
    return (
      active.phrase === citation.phrase &&
      active.paper_index === citation.paper_index
    );
  }

  return (
    <section
      id="example"
      className="relative bg-cream-50 border-y border-cream-300/60"
    >
      <div className="mx-auto max-w-5xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-14 items-start"
        >
          <div className="md:sticky md:top-24">
            <AnimatePresence mode="wait">
              {active ? (
                <ActiveCitationCard
                  key={`${active.paper_index}:${active.phrase}`}
                  citation={active}
                  onClose={() => setActive(null)}
                />
              ) : (
                <DefaultDescription key="default" />
              )}
            </AnimatePresence>
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
                <p className="font-medium text-ink-900">{SUBJECT}</p>
              </div>

              {PARAGRAPHS.map((para, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed text-ink-800 whitespace-pre-wrap"
                >
                  {renderParagraph(para, {
                    onCitationClick: setActive,
                    isActive,
                  })}
                </p>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function DefaultDescription() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
    >
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust-500 mb-4">
        A real generation
      </p>
      <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 text-balance leading-tight mb-5">
        Civil Engg undergrad to CMU computer-vision PI.
      </h2>
      <p className="text-ink-600 leading-relaxed mb-5">
        Two papers drive the overlap: one methodological (Recycle-GAN) and
        one domain-proximate (pix2pix3D). Tap a highlighted phrase to see the
        exact paper mechanism behind it.
      </p>
      <div className="rounded-xl border border-cream-300/70 bg-white px-4 py-3.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 mb-1.5">
          Try it
        </p>
        <p className="text-sm text-ink-700 leading-snug">
          Tap any{" "}
          <span className="citation-mark cursor-default">
            highlighted phrase
          </span>{" "}
          in the email to see the exact paper detail it came from.
        </p>
      </div>
    </motion.div>
  );
}

function ActiveCitationCard({ citation, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-cream-300 bg-white shadow-lift px-5 sm:px-6 py-6"
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
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6l12 12M6 18L18 6"
            />
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
