const FIELDS = [
  {
    id: "professorName",
    label: "Professor's name",
    placeholder: "e.g. Yoshua Bengio",
    required: true,
  },
  {
    id: "university",
    label: "University / institution",
    placeholder: "e.g. Université de Montréal",
    required: true,
  },
  {
    id: "semanticScholarId",
    label: "Semantic Scholar profile URL or author ID",
    placeholder: "https://www.semanticscholar.org/author/...",
    required: true,
  },
];

export function ProfessorForm({ values, onChange }) {
  return (
    <div className="space-y-4">
      {FIELDS.map(({ id, label, placeholder, required }) => (
        <div key={id}>
          <label
            htmlFor={id}
            className="block text-sm font-medium text-ink-800 mb-1.5"
          >
            {label}{" "}
            {required && <span className="text-rust-500">*</span>}
          </label>
          <input
            id={id}
            type="text"
            value={values[id] || ""}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-500/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
          />
        </div>
      ))}
    </div>
  );
}
