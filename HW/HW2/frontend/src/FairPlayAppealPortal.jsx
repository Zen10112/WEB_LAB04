// @ts-check
import { Link, NavLink, Outlet, Route, Routes, useMatch, useParams } from 'react-router';
import DossierView, { DossierNotFound } from './DossierView.jsx';
import { dossiers } from './dossiers';
import AppealForm from './form/AppealForm.jsx';
import { FormProvider } from './form/FormContext';
import useAppealSlaTimer from './useAppealSlaTimer.js';

function PortalLayout() {
  const appealRoute = useMatch({ path: '/dossier/:playerID/appeal', caseSensitive: true });
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
        <Outlet />
      </main>
    </>
  );
}

/** @param {{ dossier: import('./dossiers').DossierFixture }} props */
function ActiveDossier({ dossier }) {
  const sla = useAppealSlaTimer(dossier.deadlineAt);

  return (
    <FormProvider key={dossier.playerID}>
      <Outlet context={{ dossier, sla }} />
    </FormProvider>
  );
}

function DossierLayout() {
  const { playerID } = useParams();
  const dossier = dossiers.find((entry) => entry.playerID === playerID);
  return dossier ? <ActiveDossier dossier={dossier} /> : <DossierNotFound />;
}

function DossierIndex() {
  return (
    <section className="portal-panel">
      <h1>Case study dossiers</h1>
      <p className="sample-notice">Illustrative case studies for classroom use.</p>
      <ul className="dossier-index">
        {dossiers.map(({ playerID, displayName, topic }) => (
          <li key={playerID}>
            <Link to={`/dossier/${playerID}`} className="dossier-link">
              <span>{displayName}</span>
              <span>{topic}</span>
            </Link>
          </li>
        ))}
      </ul>
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
