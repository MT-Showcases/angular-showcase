/** Editable virtual files. The runner resolves these names without fetching user-controlled URLs. */
export interface PlaygroundSources { typescript: string; html: string; css: string }
export type PlaygroundFile = keyof PlaygroundSources;
