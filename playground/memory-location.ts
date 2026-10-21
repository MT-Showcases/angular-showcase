// Keep routing inside the opaque-origin preview. This strategy never reads or
// writes window.location/window.history, so the host URL and the lesson route
// cannot interfere with each other.
import { LocationChangeListener, LocationStrategy } from '@angular/common';
import { OnDestroy } from '@angular/core';

interface MemoryHistoryEntry {
  path: string;
  state: unknown;
}

function normalizeQueryParams(queryParams: string): string {
  return queryParams && queryParams[0] !== '?' ? `?${queryParams}` : queryParams;
}

function normalizePath(url: string): string {
  return url.startsWith('/') ? url : `/${url}`;
}

/** One application-scoped history stack backed only by JavaScript memory. */
export class MemoryLocationStrategy extends LocationStrategy implements OnDestroy {
  // The preview always starts at the application root, like a fresh page load.
  private readonly entries: MemoryHistoryEntry[] = [{ path: '/', state: null }];
  private readonly listeners = new Set<LocationChangeListener>();
  private index = 0;

  override path(includeHash = false): string {
    const path = this.entries[this.index].path;
    return includeHash ? path : path.split('#')[0];
  }

  override getBaseHref(): string {
    return '/';
  }

  override prepareExternalUrl(internal: string): string {
    return internal.startsWith('/') ? internal : `/${internal}`;
  }

  override getState(): unknown {
    return this.entries[this.index].state;
  }

  override pushState(state: unknown, _title: string, url: string, queryParams: string): void {
    // A new navigation after going back discards the forward branch, as a
    // browser history would.
    this.entries.splice(this.index + 1);
    this.entries.push({ path: normalizePath(url) + normalizeQueryParams(queryParams), state });
    this.index = this.entries.length - 1;
  }

  override replaceState(state: unknown, _title: string, url: string, queryParams: string): void {
    this.entries[this.index] = {
      path: normalizePath(url) + normalizeQueryParams(queryParams),
      state,
    };
  }

  override back(): void {
    this.moveBy(-1);
  }

  override forward(): void {
    this.moveBy(1);
  }

  override historyGo(relativePosition = 0): void {
    this.moveBy(relativePosition);
  }

  override onPopState(fn: LocationChangeListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  ngOnDestroy(): void {
    this.listeners.clear();
  }

  /** Only history moves emit popstate; pushState/replaceState stay silent. */
  private moveBy(relativePosition: number): void {
    const next = this.index + relativePosition;
    if (relativePosition === 0 || next < 0 || next >= this.entries.length) return;

    this.index = next;
    const entry = this.entries[this.index];
    for (const listener of [...this.listeners]) {
      listener({ type: 'popstate', state: entry.state });
    }
  }
}
