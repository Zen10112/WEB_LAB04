// @ts-check
import { Link, NavLink, Outlet, Route, Routes, useMatch, useOutletContext, useParams } from 'react-router';
import DossierView, { DossierNotFound } from './DossierView.jsx';
import { ApiError } from './api';
import { useDossier, useDossierList } from './useDossier';
import AppealForm from './form/AppealForm.jsx';
import { FormProvider } from './form/FormContext';
import useAppealSlaTimer from './useAppealSlaTimer.js';
import { useAppealSubmission } from './form/useAppealSubmission';

function PortalLayout() {
  const appealRoute = useMatch({ path: '/dossier/:playerID/appeal', caseSensitive: true });
  const list = useDossierList();
  const dossiers = list.data?.payload.dossiers ?? [];
  return (
    <>
      <header className="portal-header">
        <div className="portal-header-inner">
          <p className="portal-name">Esports Fair-Play Appeal Tribunal</p>
          <nav className="portal-nav" aria-label="Dossier navigation">
            <NavLink to="/" end>Overview</NavLink>
            {dossiers.map(({ playerID, displayName }) => (
              <NavLink key={playerID} to={`/dossier/${playerID}`} caseSensitive end={!appealRoute}>{displayName}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="portal-content">
        <Outlet context={list} />
      </main>
    </>
  );
}

/** @param {{ dossier: import('./dossiers').Dossier, serverNow: string, clientReceivedAtMs: number, refresh: () => void }} props */
function ActiveDossier({ dossier, serverNow, clientReceivedAtMs, refresh }) {
  const sla = useAppealSlaTimer(dossier.deadlineAt, { serverNow, clientReceivedAtMs });
  const submission = useAppealSubmission(dossier.playerID, refresh);

  return (
    <FormProvider>
      <Outlet context={{ dossier, sla, submission }} />
    </FormProvider>
  );
}

function DossierLayout() {
  const { playerID } = useParams();
  const { data, error, reload } = useDossier(playerID);
  if (!playerID || (error instanceof ApiError && error.status === 404)) return <DossierNotFound />;
  if (!data) {
    return (
      <section className="portal-panel">
        <h1>{error ? 'Dossier unavailable' : 'Loading dossier…'}</h1>
        {error ? <LoadError message="The dossier could not be loaded." retry={reload} /> : <p role="status">Retrieving the latest case information.</p>}
      </section>
    );
  }

  return (
    <>
      {error && <LoadError message="The latest SLA information could not be refreshed." retry={reload} />}
      <ActiveDossier key={playerID} {...data.payload} clientReceivedAtMs={data.clientReceivedAtMs} refresh={reload} />
    </>
  );
}

/** @param {{ message: string, retry: () => void }} props */
function LoadError({ message, retry }) {
  return (
    <div className="portal-request-error">
      <p role="alert">{message}</p>
      <button type="button" className="portal-action" onClick={retry}>Retry</button>
    </div>
  );
}

function DossierIndex() {
  const { data, pending, error, reload } = /** @type {ReturnType<typeof useDossierList>} */ (useOutletContext());
  const dossiers = data?.payload.dossiers ?? [];
  return (
    <section className="portal-panel">
      <h1>Case study dossiers</h1>
      <p className="sample-notice">Illustrative case studies for classroom use.</p>
      {pending && <p role="status">Loading dossiers…</p>}
      {error && <LoadError message="The dossier list could not be loaded." retry={reload} />}
      {!pending && !error && dossiers.length === 0 && <p>No dossiers are available.</p>}
      {dossiers.length > 0 && <ul className="dossier-index">
        {dossiers.map(({ playerID, displayName }) => (
          <li key={playerID}>
            <Link to={`/dossier/${playerID}`} className="dossier-link">
              <strong>{displayName}</strong>
            </Link>
          </li>
        ))}
      </ul>}
    </section>
  );
}

export default function FairPlayAppealPortal() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<DossierIndex />} />
        <Route path="dossier/:playerID" caseSensitive element={<DossierLayout />}>
          <Route index element={<DossierView />} />
          <Route path="appeal" caseSensitive element={<AppealForm />} />
        </Route>
        <Route path="*" element={<DossierNotFound />} />
      </Route>
    </Routes>
  );
}
