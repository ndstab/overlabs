/**
 * Professor details form fields.
 * Props:
 *   values: { professorName, university, semanticScholarId }
 *   onChange(field, value)
 */
export function ProfessorForm({ values, onChange }) {
  const fields = [
    {
      id: "professorName",
      label: "Professor's Name",
      placeholder: "e.g. Yoshua Bengio",
      required: true,
    },
    {
      id: "university",
      label: "University / Institution",
      placeholder: "e.g. Université de Montréal",
      required: true,
    },
    {
      id: "semanticScholarId",
      label: "Semantic Scholar Profile URL or Author ID",
      placeholder: "e.g. https://www.semanticscholar.org/author/... or 1234567",
      required: true,
    },
  ];

  return (
    <div className="space-y-4">
      {fields.map(({ id, label, placeholder, required }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            id={id}
            type="text"
            value={values[id] || ""}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      ))}
    </div>
  );
}
