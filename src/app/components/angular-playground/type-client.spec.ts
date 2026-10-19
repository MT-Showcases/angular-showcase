import { afterEach, describe, expect, it, vi } from 'vitest';
import { TypeClient } from './type-client';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { TestWorker.instances.push(this); }
  receive(data: unknown): void { this.onmessage?.({ data }); }
}

afterEach(() => { vi.unstubAllGlobals(); TestWorker.instances = []; });

describe('TypeScript worker client', () => {
  it('waits for worker readiness, matches out-of-order responses and terminates on destruction', async () => {
    vi.stubGlobal('Worker', TestWorker);
    const client = new TypeClient();
    const check = client.check('const count = 1;');
    const complete = client.complete('count.', 6);
    const worker = TestWorker.instances[0];
    expect(worker.postMessage).not.toHaveBeenCalled();
    worker.receive({ type: 'ready' });
    await Promise.resolve();
    const first = worker.postMessage.mock.calls[0][0];
    const second = worker.postMessage.mock.calls[1][0];
    worker.receive({ id: second.id, result: { from: 6, options: [{ label: 'toFixed' }] } });
    worker.receive({ id: first.id, result: [] });
    expect(await check).toEqual([]);
    expect((await complete).options[0].label).toBe('toFixed');
    const pending = client.check('const count = 2;');
    await Promise.resolve();
    client.destroy();
    await expect(pending).rejects.toThrow('Editor chiuso');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('fails explicitly when the browser cannot start a worker', async () => {
    vi.stubGlobal('Worker', undefined);
    const client = new TypeClient();
    await expect(client.check('const count = 1;')).rejects.toThrow('non disponibile');
    client.destroy();
  });
});
