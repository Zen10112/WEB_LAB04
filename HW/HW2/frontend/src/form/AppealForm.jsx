// @ts-check
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { useFormContext } from './FormContext';
import InputField from './InputField.jsx';
import { appealGrounds, normalizeAppeal } from './validateAppeal';

/** @param {{ data: ReturnType<typeof normalizeAppeal> | null }} props */
function ShowData({ data }) {
  return (
    <figure className="appeal-inspector">
      <figcaption>Live JSON inspector</figcaption>
      {data ? <pre><code>{JSON.stringify(data, null, 2)}</code></pre> : <p>Complete the form to preview its JSON.</p>}
    </figure>
  );
}

export default function AppealForm() {
  const dossier = /** @type {import('../dossiers').DossierFixture} */ (useOutletContext());
  const { values, errors, isValid, markAttempted } = useFormContext();
  const [validatedDraft, setValidatedDraft] = useState(/** @type {import('./validateAppeal').AppealDraft | null} */ (null));
  const needsEvidence = values.ground === 'NEW_EVIDENCE';

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  function handleSubmit(event) {
    event.preventDefault();
    markAttempted();
    if (!isValid) {
      const firstInvalidControl = event.currentTarget.elements.namedItem(Object.keys(errors)[0]);
      if (firstInvalidControl instanceof HTMLElement) firstInvalidControl.focus();
      return;
    }
    setValidatedDraft(values);
  }

  return (
    <section className="portal-panel" aria-labelledby="appeal-title">
      <header>
        <h1 id="appeal-title">{dossier.displayName} appeal</h1>
        <p className="sample-notice">Illustrative case study. This practice form validates the draft locally.</p>
      </header>
      <div className="appeal-layout">
        <form className="appeal-form" aria-label="Appeal draft" noValidate onSubmit={handleSubmit}>
          <InputField name="ground" label="Appeal ground" kind="select" options={appealGrounds} required />
          <InputField name="statement" label="Statement" kind="textarea" required hint="Use 20–2,000 characters." />
          <InputField
            name="evidenceUrl" label="Evidence link" kind="url" required={needsEvidence} revealError={needsEvidence}
            hint={needsEvidence ? 'Required for New evidence. Use a complete HTTP or HTTPS URL.' : 'Optional. Use a complete HTTP or HTTPS URL.'}
          />
          <div className="appeal-actions">
            <button type="submit" className="portal-action">Validate draft</button>
            <Link className="portal-text-link" to={`/dossier/${dossier.playerID}`}>Back to dossier</Link>
          </div>
          <p className="appeal-status" role="status">{isValid && validatedDraft === values ? 'Draft passed validation.' : ''}</p>
        </form>
        <ShowData data={isValid ? normalizeAppeal(values) : null} />
      </div>
    </section>
  );
}
