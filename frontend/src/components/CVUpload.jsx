import { useRef, useState } from "react";

export function CVUpload({ onFile, fileName }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") onFile(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-ink-800">
        Your CV <span className="text-rust-500">*</span>
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-accent bg-accent/5 scale-[1.01]"
            : "border-cream-300 bg-cream-50/60 hover:border-accent/50 hover:bg-cream-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
        />

        {fileName ? (
          <div className="text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 mb-2">
              <svg
                className="h-5 w-5 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink-900">{fileName}</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Click or drop to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto mb-3 h-9 w-9 text-ink-500/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16v-8m0 0-3 3m3-3 3 3M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1"
              />
            </svg>
            <p className="text-sm text-ink-700">
              <span className="font-medium text-accent">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-ink-500 mt-1">PDF only</p>
          </div>
        )}
      </div>
    </div>
  );
}
