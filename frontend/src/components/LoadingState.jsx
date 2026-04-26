import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STAGES = [
  { at: 0, label: "Fetching the professor's papers" },
  { at: 4000, label: "Selecting the most relevant papers" },
  { at: 12000, label: "Reading the full papers" },
  { at: 22000, label: "Finding overlaps and writing the email" },
];

export function LoadingState() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      let next = 0;
      for (let i = 0; i < STAGES.length; i++) {
        if (elapsed >= STAGES[i].at) next = i;
      }
      setStageIndex(next);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-cream-300 bg-white p-10 sm:p-14 shadow-soft"
    >
      <div className="flex flex-col items-center text-center">
        <PaperScanAnimation />

        <div className="mt-8 max-w-md">
          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="font-display text-xl text-ink-900 font-medium tracking-tight"
            >
              {STAGES[stageIndex].label}
            </motion.p>
          </AnimatePresence>
          <p className="mt-3 text-xs text-ink-500 leading-relaxed">
            Reading up to 7 of the professor's papers in full. This usually
            takes 25 to 45 seconds.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-700 ${
                i <= stageIndex
                  ? "w-10 bg-ink-800"
                  : "w-6 bg-cream-300"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PaperScanAnimation() {
  return (
    <div className="relative h-24 w-24">
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-cream-300 bg-white"
        animate={{ rotate: [0, 1, -1, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="p-2.5 space-y-1.5">
          <div className="h-1 w-12 rounded-full bg-ink-500/30" />
          <div className="h-1 w-16 rounded-full bg-ink-500/25" />
          <div className="h-1 w-10 rounded-full bg-ink-500/30" />
          <div className="h-1 w-14 rounded-full bg-ink-500/25" />
          <div className="h-1 w-12 rounded-full bg-ink-500/30" />
        </div>
      </motion.div>

      <motion.div
        className="absolute left-0 right-0 h-[2px] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(217,119,87,0.95), transparent)",
          boxShadow: "0 0 10px rgba(217,119,87,0.6)",
        }}
        initial={{ top: "10%" }}
        animate={{ top: ["10%", "85%", "10%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
