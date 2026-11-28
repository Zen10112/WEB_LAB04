import type useAppealSlaTimer from './useAppealSlaTimer';

export const dossiers = [
  {
    playerID: 'himass',
    displayName: 'Himass',
    reference: 'LAB4-HIMASS',
    topic: 'Review workflow',
    deadlineAt: '2027-12-01T12:00:00.000Z',
    summary: 'A classroom exercise in organizing a case summary and preparing a review timeline.',
  },
  {
    playerID: 'tanvuu',
    displayName: 'TanVuu',
    reference: 'LAB4-TANVUU',
    topic: 'Evidence intake',
    deadlineAt: '2027-12-02T12:00:00.000Z',
    summary: 'A classroom exercise in cataloging sample materials and preparing questions for review.',
  },
] as const;

export type DossierFixture = (typeof dossiers)[number];
export type DossierOutletContext = { dossier: DossierFixture; sla: ReturnType<typeof useAppealSlaTimer> };
