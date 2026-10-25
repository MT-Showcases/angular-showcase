// Pure browser-safe wrapper around the real TypeScript LanguageService.
// It only reads virtual files; learner sources are never evaluated here.
import * as ts from 'typescript';

export interface TypeDiagnostic {
  from: number;
  to: number;
  severity: 'error' | 'warning';
  message: string;
  code: number;
}

export interface CompletionOption {
  label: string;
  type?: string;
  detail?: string;
}

export interface CompletionResult {
  from: number;
  options: CompletionOption[];
}

const COMPONENT_FILE = '/component.ts';
const UNSUPPORTED_IMPORT_CODE = 90001;

/** Modules exposed by the preview runtime and therefore safe to type-check. */
export const SUPPORTED_IMPORTS = [
  '@angular/core',
  '@angular/common',
  '@angular/common/http',
  '@angular/core/rxjs-interop',
  'rxjs',
  '@ngrx/store',
  '@angular/forms',
  '@angular/router',
  '@angular/material/button',
  '@angular/material/form-field',
  '@angular/material/input',
] as const;

const COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  experimentalDecorators: true,
  useDefineForClassFields: false,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  types: [],
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  // @ViewChild-style decorator fields are injected by Angular, not assigned in
  // the class body. The preview intentionally makes no template-type promises.
  strictPropertyInitialization: false,
};

/** Collapse relative segments so language-service paths cannot leave the virtual root. */
function normalizePath(fileName: string): string {
  const segments: string[] = [];
  for (const segment of fileName.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return `/${segments.join('/')}`;
}

function clampPosition(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.trunc(value), maximum));
}

function completionStart(source: string, position: number): number {
  let start = position;
  while (start > 0 && /[A-Za-z0-9_$]/.test(source[start - 1])) start -= 1;
  return start;
}

function unsupportedImports(source: string, fileName: string): TypeDiagnostic[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const diagnostics: TypeDiagnostic[] = [];

  const report = (specifier: ts.StringLiteral): void => {
    const name = specifier.text;
    // Relative modules are resolved against the current editable project by the
    // real language service. Missing ones surface as TS2307.
    if (name.startsWith('.')) return;
    if ((SUPPORTED_IMPORTS as readonly string[]).includes(name)) return;

    diagnostics.push({
      from: specifier.getStart(sourceFile),
      to: specifier.getEnd(),
      severity: 'error',
      message:
        `Import non supportato: "${name}". Nel playground sono disponibili ` +
        '@angular/core, @angular/common, @angular/forms, @angular/router e i moduli Material ' +
        'button, form-field e input.',
      code: UNSUPPORTED_IMPORT_CODE,
    });
  };

  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      report(statement.moduleSpecifier);
    }
  }

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      report(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return diagnostics;
}

export function createTypeService(files: Record<string, string>) {
  const declarations = new Map<string, string>();
  for (const [name, text] of Object.entries(files)) {
    declarations.set(normalizePath(name), text);
  }

  let contents = new Map(declarations);
  let projectPaths = new Set<string>([COMPONENT_FILE]);
  let scriptNames = [...declarations.keys()].filter((name) => name.endsWith('.d.ts')).sort();
  const versions = new Map<string, number>();

  const directoryExists = (directory: string): boolean => {
    const prefix = `${normalizePath(directory).replace(/\/$/, '')}/`;
    for (const name of contents.keys()) {
      if (name.startsWith(prefix)) return true;
    }
    return false;
  };

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => scriptNames,
    getScriptVersion: (fileName) => String(versions.get(normalizePath(fileName)) ?? 0),
    getScriptSnapshot: (fileName) => {
      const text = contents.get(normalizePath(fileName));
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => '/lib/lib.es2022.full.d.ts',
    getCompilationSettings: () => COMPILER_OPTIONS,
    getScriptKind: (fileName) => {
      const path = normalizePath(fileName);
      return path.endsWith('.ts') || path.endsWith('.tsx') ? ts.ScriptKind.TS : ts.ScriptKind.Unknown;
    },
    fileExists: (fileName) => contents.has(normalizePath(fileName)),
    readFile: (fileName) => contents.get(normalizePath(fileName)),
    directoryExists,
    getDirectories: (directory) => {
      const prefix = `${normalizePath(directory).replace(/\/$/, '')}/`;
      const names = new Set<string>();
      for (const name of contents.keys()) {
        if (!name.startsWith(prefix)) continue;
        const segment = name.slice(prefix.length).split('/')[0];
        if (segment) names.add(segment);
      }
      return [...names];
    },
    readDirectory: (directory) => {
      const prefix = `${normalizePath(directory).replace(/\/$/, '')}/`;
      return [...contents.keys()].filter((name) => name.startsWith(prefix));
    },
    realpath: (fileName) => normalizePath(fileName),
    getNewLine: () => '\n',
    useCaseSensitiveFileNames: () => true,
  };

  const service = ts.createLanguageService(host);

  /**
   * Each request replaces the editable project map. Declaration files stay in
   * place, while added, edited and removed modules all receive fresh versions.
   */
  const applyProject = (
    source: string,
    fileName: string,
    projectFiles: Record<string, string>,
  ): string => {
    const selected = normalizePath(fileName);
    const next = new Map(declarations);
    const project = new Map<string, string>();

    for (const [name, text] of Object.entries(projectFiles ?? {})) {
      if (typeof text !== 'string') continue;
      const path = normalizePath(name);
      if (path === '/') continue;
      project.set(path, text);
      next.set(path, text);
    }

    // Keep the established default entry point available for old callers.
    if (!next.has(COMPONENT_FILE)) next.set(COMPONENT_FILE, '');
    project.set(selected, source);
    next.set(selected, source);

    for (const [path, text] of next) {
      if (!contents.has(path) || contents.get(path) !== text) {
        versions.set(path, (versions.get(path) ?? 0) + 1);
      }
    }
    for (const path of contents.keys()) {
      if (!next.has(path)) versions.set(path, (versions.get(path) ?? 0) + 1);
    }

    contents = next;
    projectPaths = new Set([COMPONENT_FILE]);
    for (const path of project.keys()) {
      if (path.endsWith('.ts')) projectPaths.add(path);
    }
    if (selected.endsWith('.ts')) projectPaths.add(selected);
    scriptNames = [...new Set([
      ...[...declarations.keys()].filter((name) => name.endsWith('.d.ts')),
      ...projectPaths,
    ])].sort();

    return selected;
  };

  const check = (
    source: string,
    fileName = COMPONENT_FILE,
    projectFiles: Record<string, string> = {},
  ): TypeDiagnostic[] => {
    const selected = applyProject(source, fileName, projectFiles);
    const unsupported = unsupportedImports(source, selected);
    const unsupportedSpans = unsupported.map(({ from, to }) => ({ from, to }));
    const diagnostics: TypeDiagnostic[] = [...unsupported];
    const seen = new Set<string>();

    const add = (diagnostic: ts.Diagnostic): void => {
      if (diagnostic.file && normalizePath(diagnostic.file.fileName) !== selected) return;
      const start = diagnostic.start ?? 0;
      if (unsupportedSpans.some((span) => start >= span.from && start < span.to)) return;

      const from = clampPosition(start, source.length);
      const to = clampPosition(start + (diagnostic.length ?? source.length - start), source.length);
      const entry: TypeDiagnostic = {
        from,
        to,
        severity:
          diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        code: diagnostic.code,
      };
      const key = `${entry.from}:${entry.to}:${entry.code}:${entry.message}`;
      if (seen.has(key)) return;
      seen.add(key);
      diagnostics.push(entry);
    };

    for (const diagnostic of service.getSyntacticDiagnostics(selected)) add(diagnostic);
    for (const diagnostic of service.getSemanticDiagnostics(selected)) add(diagnostic);

    return diagnostics.sort((left, right) => left.from - right.from || left.code - right.code);
  };

  const complete = (
    source: string,
    position: number,
    fileName = COMPONENT_FILE,
    projectFiles: Record<string, string> = {},
  ): CompletionResult => {
    const selected = applyProject(source, fileName, projectFiles);

    const limit = source.length;
    const at = clampPosition(position, limit);
    const info = service.getCompletionsAtPosition(selected, at, {
      includeCompletionsForModuleExports: false,
      includeCompletionsWithInsertText: false,
      includeCompletionsWithSnippetText: false,
    });

    if (!info) return { from: completionStart(source, at), options: [] };

    const from = info.optionalReplacementSpan
      ? clampPosition(info.optionalReplacementSpan.start, at)
      : completionStart(source, at);
    const options: CompletionOption[] = [];
    const seen = new Set<string>();

    for (const entry of info.entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);

      const option: CompletionOption = { label: entry.name };
      if (entry.kind) option.type = entry.kind;
      if (entry.source) option.detail = entry.source;
      options.push(option);
    }

    return { from, options };
  };

  return { check, complete };
}
