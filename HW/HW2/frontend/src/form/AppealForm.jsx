// @ts-check
import { Link, useOutletContext } from 'react-router';
import { useFormContext } from './FormContext';
import InputField from './InputField.jsx';
import { appealGrounds, normalizeAppeal } from './validateAppeal';
import AppealSlaStatus from '../AppealSlaStatus.jsx';

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
  const { dossier, sla, submission } = /** @type {import('../dossiers').DossierOutletContext} */ (useOutletContext());
  const { values, errors, isValid, markAttempted } = useFormContext();
  const needsEvidence = values.ground === 'NEW_EVIDENCE';
  const blocked = submission.pending || Boolean(submission.receipt);
  const closed = sla.expired || submission.closed;

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  function handleSubmit(event) {
    event.preventDefault();
    if (blocked) return;
    if (submission.canRetry) {
      submission.retry();
      return;
    }
    if (submission.closed || sla.isExpiredNow()) return;
    markAttempted();
    if (!isValid) {
      const firstInvalidControl = event.currentTarget.elements.namedItem(Object.keys(errors)[0]);
      if (firstInvalidControl instanceof HTMLElement) firstInvalidControl.focus();
      return;
    }
    submission.submit(normalizeAppeal(values));
  }

  return (
    <section className="portal-panel" aria-labelledby="appeal-title">
      <header>
        <h1 id="appeal-title">{dossier.displayName} appeal</h1>
        <p className="sample-notice">Illustrative case study for classroom use.</p>
      </header>
      <AppealSlaStatus deadlineAt={dossier.deadlineAt} remainingMs={sla.remainingMs} expired={sla.expired} />
      <div className="appeal-layout">
        <form className="appeal-form" aria-label="Appeal draft" noValidate onSubmit={handleSubmit}>
          <fieldset className="appeal-fields" disabled={blocked || submission.canRetry}>
            <InputField name="ground" label="Appeal ground" kind="select" options={appealGrounds} required />
            <InputField name="statement" label="Statement" kind="textarea" required hint="Use 20–2,000 characters." />
            <InputField
              name="evidenceUrl" label="Evidence link" kind="url" required={needsEvidence} revealError={needsEvidence}
              hint={needsEvidence ? 'Required for New evidence. Use a complete HTTP or HTTPS URL.' : 'Optional. Use a complete HTTP or HTTPS URL.'}
            />
          </fieldset>
          <div className="appeal-actions">
            <button type="submit" className="portal-action" disabled={blocked || (closed && !submission.canRetry)}>
              {submission.canRetry ? 'Retry submission' : 'Submit appeal'}
            </button>
            <Link className="portal-text-link" to={`/dossier/${dossier.playerID}`}>Back to dossier</Link>
          </div>
          <p className="appeal-status" role="status">
            {submission.pending && 'Submitting appeal…'}
            {submission.receipt && <>Appeal saved. Receipt <code>{submission.receipt.id}</code>.</>}
          </p>
          {submission.error && <p className="appeal-error" role="alert">{submission.error}</p>}
        </form>
        <ShowData data={isValid ? normalizeAppeal(values) : null} />
      </div>
    </section>
  );
}
