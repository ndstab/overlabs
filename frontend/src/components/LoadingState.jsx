import { useEffect, useState } from "react";

const STAGES = [
  { at: 0, label: "Fetching the professor's papers..." },
  { at: 4000, label: "Selecting the most relevant papers..." },
  { at: 12000, label: "Reading the full papers..." },
  { at: 20000, label: "Finding overlaps and writing the email..." },
];

/**
 * Sequential descriptive loading states for the two-stage pipeline.
 * The timing approximates the real backend latency since the API is not streaming.
 */
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
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-5">
      <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      <div className="text-center space-y-1 max-w-sm">
        <p className="text-sm font-medium text-gray-700">
          {STAGES[stageIndex].label}
        </p>
        <p className="text-xs text-gray-400">
          Reading 7 papers in full and writing a grounded email. This usually
          takes 25–45 seconds.
        </p>
      </div>
    </div>
  );
}
