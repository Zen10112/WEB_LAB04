// @ts-check
import { Link, NavLink, Outlet, Route, Routes } from 'react-router';
import DossierView, { DossierNotFound } from './DossierView.jsx';
import { dossiers } from './dossiers';

function PortalLayout() {
  return (
    <>
      <header className="portal-header">
        <div className="portal-header-inner">
          <p className="portal-name">Esports Fair-Play Appeal Tribunal</p>
          <nav className="portal-nav" aria-label="Dossier navigation">
            <NavLink to="/" end>Overview</NavLink>
            {dossiers.map(({ playerID, displayName }) => (
              <NavLink key={playerID} to={`/dossier/${playerID}`} caseSensitive end>{displayName}</NavLink>
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
        <Route path="dossier/:playerID" caseSensitive element={<DossierView />} />
        <Route path="*" element={<DossierNotFound />} />
      </Route>
    </Routes>
  );
}
