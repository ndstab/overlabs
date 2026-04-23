const BASE = "/api";

/**
 * Calls POST /generate and returns { subject_line, email_body }.
 * Throws an Error with a user-facing message on failure.
 *
 * @param {Object} payload
 * @param {string} payload.cv_text
 * @param {string} payload.extra_context
 * @param {string} payload.professor_name
 * @param {string} payload.university
 * @param {string} payload.semantic_scholar_id
 * @returns {Promise<{ subject_line: string, email_body: string }>}
 */
export async function generateEmail(payload) {
  const response = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
