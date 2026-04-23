import { useState } from "react";
import { CVUpload } from "./components/CVUpload";
import { ProfessorForm } from "./components/ProfessorForm";
import { ExtraContext } from "./components/ExtraContext";
import { EmailOutput } from "./components/EmailOutput";
import { LoadingState } from "./components/LoadingState";
import { usePDFParser } from "./hooks/usePDFParser";
import { generateEmail } from "./utils/api";

const INITIAL_PROFESSOR = {
  professorName: "",
  university: "",
  semanticScholarId: "",
};

function App() {
  const { parsePDF, isParsing, parseError } = usePDFParser();

  const [cvFile, setCvFile] = useState(null);       // File object
  const [cvText, setCvText] = useState("");          // Extracted plain text
  const [extraContext, setExtraContext] = useState("");
  const [professor, setProfessor] = useState(INITIAL_PROFESSOR);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [result, setResult] = useState(null);        // { subject_line, email_body }

  async function handleFileSelected(file) {
    setCvFile(file);
    setCvText("");
    try {
      const text = await parsePDF(file);
      setCvText(text);
    } catch {
      // parseError is set by usePDFParser
    }
  }

  function handleProfessorChange(field, value) {
    setProfessor((prev) => ({ ...prev, [field]: value }));
  }

  function isFormValid() {
    return (
      cvText.trim() &&
      professor.professorName.trim() &&
      professor.university.trim() &&
      professor.semanticScholarId.trim()
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsGenerating(true);
    setGenerateError(null);
    setResult(null);

    try {
      const data = await generateEmail({
        cv_text: cvText,
        extra_context: extraContext,
        professor_name: professor.professorName,
        university: professor.university,
        semantic_scholar_id: professor.semanticScholarId,
      });
      setResult(data);
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    setResult(null);
    setGenerateError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            FreeSearch
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Generate a personalized cold email to a professor — specific, technical, and actually worth reading.
          </p>
        </div>

        {isGenerating ? (
          <LoadingState />
        ) : result ? (
          <EmailOutput
            subjectLine={result.subject_line}
            emailBody={result.email_body}
            onReset={handleReset}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <CVUpload
              onFile={handleFileSelected}
              fileName={cvFile?.name ?? null}
              isParsing={isParsing}
              parseError={parseError}
            />

            <ExtraContext value={extraContext} onChange={setExtraContext} />

            <hr className="border-gray-100" />

            <ProfessorForm values={professor} onChange={handleProfessorChange} />

            {generateError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {generateError}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid() || isParsing}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Generate email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
