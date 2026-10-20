/** Editable virtual files. The runner resolves these names without fetching user-controlled URLs. */
export interface PlaygroundSources {
  typescript: string;
  html: string;
  css: string;
  /** Extra modules such as `tag-list.pipe.ts` or `greeting.component.html`, keyed by relative path. */
  files?: Record<string, string>;
}

/** Root identifiers stay stable for existing editors; extra virtual paths are plain strings. */
export type PlaygroundFile = string;

const ROOT_FILES = {
  typescript: 'typescript',
  html: 'html',
  css: 'css',
} as const;

const PROJECT_FILES: Record<string, keyof Omit<PlaygroundSources, 'files'>> = {
  'component.ts': 'typescript',
  'component.html': 'html',
  'component.css': 'css',
};

function isRootFile(id: string): id is keyof typeof ROOT_FILES {
  return Object.hasOwn(ROOT_FILES, id);
}

/** Read one editable file without mutating the shared project. */
export function sourceText(sources: PlaygroundSources, id: PlaygroundFile): string {
  if (isRootFile(id)) return sources[id];
  return sources.files?.[id] ?? '';
}

/** Replace one editable file and return a new immutable project object. */
export function updateSource(
  sources: PlaygroundSources,
  id: PlaygroundFile,
  text: string,
): PlaygroundSources {
  if (isRootFile(id)) return { ...sources, [id]: text };

  return {
    ...sources,
    files: { ...sources.files, [id]: text },
  };
}

/** Copy the nested file map so callers can compare or discard edits safely. */
export function cloneSources(sources: PlaygroundSources): PlaygroundSources {
  return sources.files === undefined ? { ...sources } : { ...sources, files: { ...sources.files } };
}

/** Project shape consumed by the runtime and the TypeScript language service. */
export function toProjectFiles(sources: PlaygroundSources): Record<string, string> {
  const project: Record<string, string> = { ...sources.files };

  // Root files are authoritative even if an extra entry reused their names.
  for (const [name, key] of Object.entries(PROJECT_FILES)) {
    project[name] = sources[key];
  }

  return project;
}
