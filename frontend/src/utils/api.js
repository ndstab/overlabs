const BASE = "/api";

/**
 * Calls POST /generate with multipart/form-data and returns { subject_line, email_body }.
 * Throws an Error with a user-facing message on failure.
 *
 * @param {Object} payload
 * @param {File}   payload.cv_file
 * @param {string} payload.extra_context
 * @param {string} payload.professor_name
 * @param {string} payload.university
 * @param {string} payload.semantic_scholar_id
 * @param {string} payload.invite_code
 * @param {string} payload.purpose
 * @param {string} [payload.student_s2_id]
 * @param {string} [payload.writing_sample]
 * @returns {Promise<{
 *   subject_line: string,
 *   email_body: string,
 *   paragraphs: Array<{
 *     text: string,
 *     citations: Array<{
 *       phrase: string,
 *       paper_index: number,
 *       paper_title: string,
 *       paper_year: number | null,
 *       explanation: string,
 *     }>
 *   }>
 * }>}
 */
export async function generateEmail(payload) {
  const form = new FormData();
  form.append("cv_file", payload.cv_file);
  form.append("professor_name", payload.professor_name);
  form.append("university", payload.university);
  form.append("semantic_scholar_id", payload.semantic_scholar_id);
  form.append("invite_code", payload.invite_code);
  form.append("purpose", payload.purpose);
  form.append("extra_context", payload.extra_context ?? "");
  if (payload.student_s2_id) form.append("student_s2_id", payload.student_s2_id);
  if (payload.writing_sample) form.append("writing_sample", payload.writing_sample);

  const response = await fetch(`${BASE}/generate`, {
    method: "POST",
    body: form,
    // Do NOT set Content-Type — browser sets it with the correct boundary automatically
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail) message = data.detail;
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(message);
  }

  return response.json();
}
