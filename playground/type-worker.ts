// Same-origin worker that owns the TypeScript engine. The application bundle
// only loads this file when the editor asks for diagnostics or completions.
import { createTypeService } from './type-service';

interface LibsPayload {
  files: Record<string, string>;
}

interface TypeRequest {
  id: number | string;
  kind: 'check' | 'complete';
  source: string;
  position?: number;
  /** Selected editable TS module, for example `greeting.component.ts`. */
  fileName?: string;
  /** Current editable project, including the selected file and its imports. */
  files?: Record<string, string>;
}

interface WorkerScope {
  location: { href: string };
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<TypeRequest>) => void) | null;
}

const scope = self as unknown as WorkerScope;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let servicePromise: Promise<ReturnType<typeof createTypeService>> | undefined;

async function loadService(): Promise<ReturnType<typeof createTypeService>> {
  const url = new URL('./typescript-libs.json', scope.location.href);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossibile caricare i tipi TypeScript (${response.status}).`);
  }

  const payload = (await response.json()) as LibsPayload;
  if (!payload || typeof payload.files !== 'object' || Array.isArray(payload.files)) {
    throw new Error('Il file dei tipi TypeScript non ha il formato atteso.');
  }

  return createTypeService({ ...payload.files, '/component.ts': '' });
}

function ready(): Promise<ReturnType<typeof createTypeService>> {
  if (!servicePromise) {
    servicePromise = loadService().then(
      (service) => {
        scope.postMessage({ type: 'ready' });
        return service;
      },
      (error: unknown) => {
        scope.postMessage({ type: 'error', message: errorMessage(error) });
        throw error;
      },
    );
  }
  return servicePromise;
}

function projectFiles(request: TypeRequest): Record<string, string> {
  const files = request.files;
  return files && typeof files === 'object' && !Array.isArray(files) ? files : {};
}

scope.onmessage = async (event: MessageEvent<TypeRequest>): Promise<void> => {
  const request = event.data;
  if (!request || request.id === undefined || request.id === null) return;

  try {
    const service = await ready();
    const source = typeof request.source === 'string' ? request.source : '';
    const fileName = typeof request.fileName === 'string' && request.fileName
      ? request.fileName
      : '/component.ts';

    let result: unknown;
    if (request.kind === 'check') {
      result = service.check(source, fileName, projectFiles(request));
    } else if (request.kind === 'complete') {
      const position =
        typeof request.position === 'number' ? request.position : source.length;
      result = service.complete(source, position, fileName, projectFiles(request));
    } else {
      throw new Error(`Richiesta TypeScript non riconosciuta: ${String(request.kind)}.`);
    }

    scope.postMessage({ id: request.id, result });
  } catch (error) {
    scope.postMessage({ id: request.id, error: errorMessage(error) });
  }
};

// Start loading immediately so the ready (or init error) message is observable
// even before the first request. Rejections are reported inside ready().
void ready().catch(() => undefined);
