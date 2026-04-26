export function ExtraContext({ value, onChange }) {
  return (
    <div>
      <label
        htmlFor="extra-context"
        className="block text-sm font-medium text-ink-800 mb-1.5"
      >
        Additional context{" "}
        <span className="text-ink-500/70 font-normal">(optional)</span>
      </label>
      <textarea
        id="extra-context"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Anything relevant that isn't on your CV. Specific papers of theirs you've read, a project you're currently working on, why this lab specifically, expected graduation date, preferred start date..."
        className="w-full rounded-lg border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-500/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 resize-none transition-all"
      />
    </div>
  );
}
