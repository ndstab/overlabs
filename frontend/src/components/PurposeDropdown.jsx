const OPTIONS = [
  { value: "general", label: "General research inquiry" },
  { value: "phd", label: "PhD supervision" },
  { value: "internship", label: "Research internship" },
  { value: "ra", label: "Research assistant (RA)" },
  { value: "visiting", label: "Visiting researcher / collaboration" },
];

export function PurposeDropdown({ value, onChange }) {
  return (
    <div>
      <label
        htmlFor="purpose"
        className="block text-sm font-medium text-ink-800 mb-1.5"
      >
        What are you reaching out for? <span className="text-rust-500">*</span>
      </label>
      <div className="relative">
        <select
          id="purpose"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full rounded-lg border border-cream-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-ink-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
        </svg>
      </div>
    </div>
  );
}
