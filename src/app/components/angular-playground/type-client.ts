/** Lazy browser-only TypeScript worker. Learner code is parsed, never executed here. */
export interface TypeDiagnostic {
  fileName?: string;
  from: number;
  to: number;
  severity: 'error' | 'warning';
  message: string;
  code: number;
}
export interface TypeCompletions {
  from: number;
  options: { label: string; type?: string; detail?: string }[];
}

export class TypeClient {
  private worker?: Worker;
  private sequence = 0;
  private disposed = false;
  private readonly pending = new Map<number, { resolve(value: unknown): void; reject(reason: Error): void; timer: ReturnType<typeof setTimeout> }>();
  private ready?: Promise<void>;
  private startupTimer?: ReturnType<typeof setTimeout>;
  private rejectReady?: (reason: Error) => void;

  private start(): Promise<void> {
    if (this.ready) return this.ready;
    this.ready = new Promise<void>((resolve, reject) => {
      this.rejectReady = reject;
      if (this.disposed || typeof Worker === 'undefined') {
        reject(new Error('Analisi TypeScript non disponibile.'));
        return;
      }
      const timer = this.startupTimer = setTimeout(() => this.fail(new Error('Avvio dell’analisi TypeScript non riuscito.')), 30000);
      try {
        this.worker = new Worker('/playground/generated/typescript-worker.js');
        this.worker.onmessage = ({ data }) => {
          if (data?.type === 'ready') { clearTimeout(timer); resolve(); return; }
          if (data?.type === 'error' && !data.id) { clearTimeout(timer); this.fail(new Error(data.message || 'Analisi TypeScript non disponibile.')); return; }
          const request = this.pending.get(data?.id);
          if (!request) return;
          clearTimeout(request.timer); this.pending.delete(data.id);
          if (data.error) request.reject(new Error(String(data.error)));
          else request.resolve(data.result);
        };
        this.worker.onerror = () => { clearTimeout(timer); this.fail(new Error('Analisi TypeScript non disponibile.')); };
      } catch {
        clearTimeout(timer); this.fail(new Error('Analisi TypeScript non disponibile.'));
      }
    });
    return this.ready;
  }

  private fail(error: Error): void {
    clearTimeout(this.startupTimer); this.rejectReady?.(error);
    this.pending.forEach(request => { clearTimeout(request.timer); request.reject(error); });
    this.pending.clear(); this.worker?.terminate(); this.worker = undefined;
  }

  private async request<T>(kind: 'check' | 'complete', source: string, position?: number, fileName?: string, files?: Record<string, string>): Promise<T> {
    await this.start();
    if (this.disposed || !this.worker) throw new Error('Analisi TypeScript non disponibile.');
    const id = ++this.sequence;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('L’analisi TypeScript non ha risposto.')); }, 15000);
      this.pending.set(id, { resolve: value => resolve(value as T), reject, timer });
      this.worker!.postMessage({ id, kind, source, position, fileName, files });
    });
  }

  check(source: string, fileName?: string, files?: Record<string, string>): Promise<TypeDiagnostic[]> { return this.request('check', source, undefined, fileName, files); }
  complete(source: string, position: number, fileName?: string, files?: Record<string, string>): Promise<TypeCompletions> { return this.request('complete', source, position, fileName, files); }
  destroy(): void { this.disposed = true; this.fail(new Error('Editor chiuso.')); }
}
