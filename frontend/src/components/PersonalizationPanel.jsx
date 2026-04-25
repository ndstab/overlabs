import { useState } from "react";

/**
 * Collapsible panel containing optional fields that improve email personalization:
 *   - Student's Semantic Scholar ID (for students with publications)
 *   - Writing sample (for voice matching)
 *
 * Props:
 *   studentS2Id: string
 *   writingSample: string
 *   onChange(field: 'studentS2Id' | 'writingSample', value: string)
 */
export function PersonalizationPanel({ studentS2Id, writingSample, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <span>Improve personalization (optional)</span>
        <span className="text-gray-400 text-xs">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-200 px-4 py-4">
          <div>
            <label
              htmlFor="student-s2-id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Semantic Scholar profile{" "}
              <span className="text-gray-400 font-normal">
                (only if you have publications)
              </span>
            </label>
            <input
              id="student-s2-id"
              type="text"
              value={studentS2Id}
              onChange={(e) => onChange("studentS2Id", e.target.value)}
              placeholder="https://www.semanticscholar.org/author/... or 1234567"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              We'll read your papers in full and use them to find sharper
              overlaps with the professor's work.
            </p>
          </div>

          <div>
            <label
              htmlFor="writing-sample"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Writing sample{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="writing-sample"
              rows={3}
              maxLength={2000}
              value={writingSample}
              onChange={(e) => onChange("writingSample", e.target.value)}
              placeholder="Paste 2–3 sentences from something you've written — an email, a project description, a paper intro. The email will match your voice."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
