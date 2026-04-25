const OPTIONS = [
  { value: "general", label: "General research inquiry" },
  { value: "phd", label: "PhD supervision" },
  { value: "internship", label: "Research internship" },
  { value: "ra", label: "Research assistant (RA)" },
  { value: "visiting", label: "Visiting researcher / collaboration" },
];

/**
 * Required dropdown: what the student is reaching out for.
 * Props:
 *   value: string
 *   onChange(value: string)
 */
export function PurposeDropdown({ value, onChange }) {
  return (
    <div>
      <label
        htmlFor="purpose"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        What are you reaching out for? <span className="text-red-500">*</span>
      </label>
      <select
        id="purpose"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
