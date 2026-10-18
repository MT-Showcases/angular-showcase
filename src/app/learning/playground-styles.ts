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

/* Il testo modificabile resta leggibile anche su telefono. */
input {
  min-height: 2.75rem;
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  font: inherit;
  font-size: max(1rem, 16px);
  color: inherit;
  background: var(--mat-sys-surface);
}`;
