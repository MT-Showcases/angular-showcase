/**
 * Native field styles shared by the editable lesson seeds.
 * Interpolated at build time so every lesson shows the full CSS as editable text.
 */
export const PLAYGROUND_FIELD_STYLES = `/* Campi nativi: stesso aspetto per input e select, senza nascondere le frecce. */
input,
select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  font: inherit;
  font-size: max(1rem, 16px);
  color: var(--mat-sys-on-surface);
  background-color: var(--mat-sys-surface);
}

/* Il focus da tastiera resta visibile anche senza colore di sfondo. */
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--mat-sys-primary);
  outline-offset: 2px;
}

input:disabled,
select:disabled {
  color: var(--mat-sys-on-surface-variant);
  background-color: var(--mat-sys-surface);
}

/* La lettura sola usa una superficie più discreta, senza sembrare disabilitata. */
input[readonly] {
  background-color: var(--mat-sys-surface-container);
}
`;

/** Portable teaching styles shared by the editable lesson seeds. */
export const PLAYGROUND_STYLES = `/* Stili locali: prova a cambiare il colore principale. */
:host {
  display: block;
  color: var(--mat-sys-on-surface);
}

.demo {
  display: grid;
  gap: 1rem;
}

h2, h3, p {
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

label {
  display: grid;
  gap: 0.375rem;
}

${PLAYGROUND_FIELD_STYLES}`;
