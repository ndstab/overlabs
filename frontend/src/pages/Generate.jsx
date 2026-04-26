import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CVUpload } from "../components/CVUpload";
import { ProfessorForm } from "../components/ProfessorForm";
import { ExtraContext } from "../components/ExtraContext";
import { PurposeDropdown } from "../components/PurposeDropdown";
import { PersonalizationPanel } from "../components/PersonalizationPanel";
import { EmailOutput } from "../components/EmailOutput";
import { LoadingState } from "../components/LoadingState";
import { generateEmail } from "../utils/api";

const INITIAL_PROFESSOR = {
  professorName: "",
  university: "",
  semanticScholarId: "",
};

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export function Generate() {
  const [cvFile, setCvFile] = useState(null);
  const [extraContext, setExtraContext] = useState("");
  const [professor, setProfessor] = useState(INITIAL_PROFESSOR);
  const [purpose, setPurpose] = useState("general");
  const [studentS2Id, setStudentS2Id] = useState("");
  const [writingSample, setWritingSample] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [result, setResult] = useState(null);

  function handleProfessorChange(field, value) {
    setProfessor((prev) => ({ ...prev, [field]: value }));
  }

  function handlePersonalizationChange(field, value) {
    if (field === "studentS2Id") setStudentS2Id(value);
    if (field === "writingSample") setWritingSample(value);
  }

  function isFormValid() {
    return (
      cvFile &&
      professor.professorName.trim() &&
      professor.university.trim() &&
      professor.semanticScholarId.trim() &&
      purpose
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
        cv_file: cvFile,
        extra_context: extraContext,
        professor_name: professor.professorName,
        university: professor.university,
        semantic_scholar_id: professor.semanticScholarId,
        purpose,
        student_s2_id: studentS2Id.trim() || undefined,
        writing_sample: writingSample.trim() || undefined,
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
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-10 border-b border-cream-300/40 bg-cream-100/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-xl font-semibold text-ink-900 tracking-tight hover:text-accent transition-colors"
          >
            Overlabs
          </Link>
          <Link
            to="/"
            className="text-sm text-ink-600 hover:text-ink-900 transition-colors"
          >
            ← Back home
          </Link>
        </div>
      </header>

      <BackgroundDecor />

      <div className="relative mx-auto max-w-2xl px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust-500 mb-3">
            Step into the lab
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink-900 tracking-tight leading-tight">
            Write your email.
          </h1>
          <p className="mt-3 text-ink-600 leading-relaxed">
            Upload your CV, point to a professor, and get a draft grounded in
            their actual papers.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <EmailOutput
                subjectLine={result.subject_line}
                emailBody={result.email_body}
                onReset={handleReset}
              />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
              }}
              className="space-y-5 rounded-2xl border border-cream-300/70 bg-white p-7 sm:p-8 shadow-soft"
            >
              <motion.div variants={fieldVariants}>
                <CVUpload onFile={setCvFile} fileName={cvFile?.name ?? null} />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <ExtraContext value={extraContext} onChange={setExtraContext} />
              </motion.div>

              <motion.hr variants={fieldVariants} className="border-cream-300/60" />

              <motion.div variants={fieldVariants}>
                <ProfessorForm values={professor} onChange={handleProfessorChange} />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <PurposeDropdown value={purpose} onChange={setPurpose} />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <PersonalizationPanel
                  studentS2Id={studentS2Id}
                  writingSample={writingSample}
                  onChange={handlePersonalizationChange}
                />
              </motion.div>

              {generateError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-rust-400/10 border border-rust-400/30 px-4 py-3 text-sm text-rust-600"
                >
                  {generateError}
                </motion.div>
              )}

              <motion.button
                variants={fieldVariants}
                whileHover={{ scale: isFormValid() ? 1.01 : 1 }}
                whileTap={{ scale: isFormValid() ? 0.99 : 1 }}
                type="submit"
                disabled={!isFormValid()}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-3.5 text-sm font-semibold text-cream-50 hover:bg-accent-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-soft"
              >
                Generate email
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(217, 119, 87, 0.5), transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute top-40 left-0 h-[260px] w-[260px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99, 102, 241, 0.35), transparent)",
        }}
      />
    </>
  );
}
