// @ts-check
import { Link, useOutletContext } from 'react-router';

export function DossierNotFound() {
  return (
    <section className="portal-panel">
      <h1>404 · Dossier not found</h1>
      <p>Available dossiers are listed in the case study index.</p>
      <Link className="portal-text-link" to="/">Back to dossier index</Link>
    </section>
  );
}

export default function DossierView() {
  const dossier = /** @type {import('./dossiers').DossierFixture} */ (useOutletContext());

  return (
    <article className="portal-panel" aria-labelledby="dossier-title">
      <header>
        <h1 id="dossier-title">{dossier.displayName} dossier</h1>
        <p className="sample-notice">Illustrative case study for classroom use.</p>
      </header>
      <dl className="dossier-details">
        <div><dt>Player ID</dt><dd>{dossier.playerID}</dd></div>
        <div><dt>Case reference</dt><dd>{dossier.reference}</dd></div>
        <div><dt>Practice topic</dt><dd>{dossier.topic}</dd></div>
      </dl>
      <section className="dossier-summary">
        <h2>Case summary</h2>
        <p>{dossier.summary}</p>
      </section>
      <Link className="portal-action" to="appeal">Open appeal form</Link>
    </article>
  );
}
