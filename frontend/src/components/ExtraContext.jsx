/**
 * Optional free-text field for background context beyond the CV.
 * Props:
 *   value: string
 *   onChange(value: string)
 */
export function ExtraContext({ value, onChange }) {
  return (
    <div>
      <label htmlFor="extra-context" className="block text-sm font-medium text-gray-700 mb-1">
        Additional context{" "}
        <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        id="extra-context"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Anything relevant that isn't in your CV — e.g. specific papers of theirs you've read, a project you're currently working on, why this lab specifically, preferred start date..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
      />
    </div>
  );
}
