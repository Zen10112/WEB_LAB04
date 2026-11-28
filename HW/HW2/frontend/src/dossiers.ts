import type useAppealSlaTimer from './useAppealSlaTimer';
import type { useAppealSubmission } from './form/useAppealSubmission';

export type DossierSummary = { playerID: string; displayName: string };
export type Dossier = DossierSummary & { reference: string; topic: string; summary: string; deadlineAt: string };
export type DossierOutletContext = {
  dossier: Dossier;
  sla: ReturnType<typeof useAppealSlaTimer>;
  submission: ReturnType<typeof useAppealSubmission>;
};
