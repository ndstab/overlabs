import { useState } from "react";

/**
 * Displays the generated subject line and email body.
 * Props:
 *   subjectLine: string
 *   emailBody: string
 *   onReset() — called when the user wants to start over
 */
export function EmailOutput({ subjectLine, emailBody, onReset }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const full = `Subject: ${subjectLine}\n\n${emailBody}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your email is ready</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy all
              </>
            )}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Generate another
          </button>
        </div>
      </div>

      {/* Subject line */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Subject</p>
        <p className="text-sm text-gray-900">{subjectLine}</p>
      </div>

      {/* Email body */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email body</p>
        </div>
        <div className="px-4 py-4">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
            {emailBody}
          </pre>
        </div>
      </div>
    </div>
  );
}
