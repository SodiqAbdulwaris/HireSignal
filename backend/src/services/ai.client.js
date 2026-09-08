const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/env');

const client = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: config.aiServiceTimeoutMs,
  headers: config.aiServiceApiKey ? { 'X-Service-Key': config.aiServiceApiKey } : {},
});

/**
 * Send a resume file buffer to the AI parse endpoint.
 * @param {Buffer} fileBuffer  Raw file bytes
 * @param {string} fileName    Original filename (used to set Content-Disposition)
 * @param {string} mimeType    MIME type of the file
 * @returns {Promise<object>}  ParsedCandidate object from AI service
 */
async function parseResume(fileBuffer, fileName, mimeType) {
  const form = new FormData();
  form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

  try {
    const response = await client.post('/parse/', form, {
      headers: form.getHeaders(),
    });
    return response.data;
  } catch (err) {
    throw buildAiError(err, 'parse');
  }
}

/**
 * Send a job + candidate list to the AI match endpoint.
 * @param {object} aiJobInput         AI-shaped job payload
 * @param {object[]} aiCandidateInputs AI-shaped candidate array
 * @returns {Promise<object>}          AI match response
 */
async function matchCandidates(aiJobInput, aiCandidateInputs) {
  try {
    const response = await client.post('/match/', {
      job: aiJobInput,
      candidates: aiCandidateInputs,
    });
    return response.data;
  } catch (err) {
    throw buildAiError(err, 'match');
  }
}

/**
 * Convert an axios error into a structured backend error object.
 */
function buildAiError(err, operation) {
  if (err.response) {
    // AI service returned a non-2xx response
    const status = err.response.status;
    const body = err.response.data || {};
    const message = body.message || body.detail || `AI service ${operation} failed with status ${status}`;
    console.error(`[AI Service] ${operation} failed`, {
      baseURL: config.aiServiceUrl,
      status,
      body,
    });
    const error = new Error(message);
    error.aiStatus = status;
    error.aiErrorCode = body.error_code || null;
    error.isAiError = true;
    return error;
  }
  if (err.code === 'ECONNABORTED') {
    console.error(`[AI Service] ${operation} timed out`, {
      baseURL: config.aiServiceUrl,
      timeoutMs: config.aiServiceTimeoutMs,
    });
    // Internal details (base URL, operation name) stay server-side in the log above —
    // the user-facing message should read like a normal transient failure, not an infra report.
    const error = new Error('This is taking longer than expected. Please try again in a moment.');
    error.isAiTimeout = true;
    return error;
  }
  // Network error or unexpected failure
  console.error(`[AI Service] ${operation} request failed`, {
    baseURL: config.aiServiceUrl,
    code: err.code,
    message: err.message,
  });
  const error = new Error('Our processing service is temporarily unavailable. Please try again shortly.');
  error.isAiError = true;
  error.cause = err;
  return error;
}

module.exports = { parseResume, matchCandidates };
