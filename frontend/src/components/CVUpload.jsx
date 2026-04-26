import { useRef } from "react";

/**
 * Drag-and-drop + click-to-upload CV PDF component.
 * Props:
 *   onFile(file: File) — called when a PDF is selected
 *   fileName: string | null — name of the currently loaded file
 */
export function CVUpload({ onFile, fileName }) {
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") onFile(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Your CV <span className="text-red-500">*</span>
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
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
            <p className="text-sm font-medium text-gray-800">{fileName}</p>
            <p className="text-xs text-gray-500 mt-1">Click or drop to replace</p>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto mb-2 h-10 w-10 text-gray-400"
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
            <p className="text-sm text-gray-600">
              <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF only</p>
          </div>
        )}
      </div>
    </div>
  );
}
