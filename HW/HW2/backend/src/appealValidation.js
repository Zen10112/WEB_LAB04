export const appealGrounds = ['PROCEDURAL_ERROR', 'DISPROPORTIONATE_SANCTION', 'NEW_EVIDENCE'];

const allowedFields = new Set(['ground', 'statement', 'evidenceUrl', 'operationId']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isWebUrl(link) {
  if (!/^https?:\/\/[^/\s\\]/i.test(link) || /[\s\\]/.test(link)) return false;
  try {
    return Boolean(new URL(link).hostname);
  } catch {
    return false;
  }
}

export function validateAppealPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowedFields.has(key))) {
    return { message: 'Supply a JSON object with only the supported appeal fields.' };
  }

  const { ground, operationId } = body;
  const statement = typeof body.statement === 'string' ? body.statement.trim() : '';
  const evidenceUrl = typeof body.evidenceUrl === 'string' ? body.evidenceUrl.trim() : '';
  const fields = {};

  if (!appealGrounds.includes(ground)) fields.ground = 'Choose an appeal ground.';
  if (statement.length < 20 || statement.length > 2000) fields.statement = 'Use 20–2,000 characters in your statement.';
  if (typeof operationId !== 'string' || !uuid.test(operationId)) fields.operationId = 'Supply a valid UUID.';

  if (body.evidenceUrl !== undefined && typeof body.evidenceUrl !== 'string') {
    fields.evidenceUrl = 'An evidence link must be a string.';
  } else if (!evidenceUrl && ground === 'NEW_EVIDENCE') {
    fields.evidenceUrl = 'An evidence link is required for New evidence.';
  } else if (evidenceUrl && !isWebUrl(evidenceUrl)) {
    fields.evidenceUrl = 'Enter a complete HTTP or HTTPS URL.';
  }

  if (Object.keys(fields).length) return { message: 'Correct the invalid appeal fields.', fields };
  return { payload: { ground, statement, operationId: operationId.toLowerCase(), ...(evidenceUrl && { evidenceUrl }) } };
}
