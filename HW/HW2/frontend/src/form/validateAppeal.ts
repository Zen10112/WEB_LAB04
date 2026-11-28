export const appealGrounds = [
  { value: 'PROCEDURAL_ERROR', label: 'Procedural error' },
  { value: 'DISPROPORTIONATE_SANCTION', label: 'Disproportionate sanction' },
  { value: 'NEW_EVIDENCE', label: 'New evidence' },
] as const;

export type AppealDraft = { ground: string; statement: string; evidenceUrl: string };
export type AppealField = keyof AppealDraft;
export type AppealErrors = Partial<Record<AppealField, string>>;

export function normalizeAppeal({ ground, statement, evidenceUrl }: AppealDraft) {
  const link = evidenceUrl.trim();
  return { ground, statement: statement.trim(), ...(link ? { evidenceUrl: link } : {}) };
}

function isWebUrl(link: string) {
  if (!/^https?:\/\/[^/\s\\]/i.test(link) || /[\s\\]/.test(link)) return false;

  try {
    return Boolean(new URL(link).hostname);
  } catch {
    return false;
  }
}

export function validateAppeal(draft: AppealDraft): AppealErrors {
  const { ground, statement, evidenceUrl } = normalizeAppeal(draft);
  const errors: AppealErrors = {};

  if (!appealGrounds.some((option) => option.value === ground)) errors.ground = 'Choose an appeal ground.';
  if (!statement) errors.statement = 'Enter a statement.';
  else if (statement.length < 20 || statement.length > 2000) errors.statement = 'Use 20–2,000 characters in your statement.';

  if (!evidenceUrl && ground === 'NEW_EVIDENCE') errors.evidenceUrl = 'An evidence link is required for New evidence.';
  else if (evidenceUrl && !isWebUrl(evidenceUrl)) errors.evidenceUrl = 'Enter a complete HTTP or HTTPS URL.';

  return errors;
}
