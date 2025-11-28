import { Injectable, signal, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalContent {
  type: 'external' | 'component';
  url: string;
  component?: Type<any>;
  title?: string;
}

export interface ModalState {
  isOpen: boolean;
  content: ModalContent | null;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalStateSubject = new BehaviorSubject<ModalState>({
    isOpen: false,
    content: null,
  });

  modalState$ = this.modalStateSubject.asObservable();

  openExternal(url: string, title?: string) {
    this.modalStateSubject.next({
      isOpen: true,
      content: {
        type: 'external',
        url,
        title: title || 'Link Esterno',
      },
    });
  }

  openComponent(component: Type<any>, title?: string) {
    this.modalStateSubject.next({
      isOpen: true,
      content: {
        type: 'component',
        url: '',
        component,
        title: title || 'Contenuto',
      },
    });
  }

  close() {
    this.modalStateSubject.next({
      isOpen: false,
      content: null,
    });
  }

  isExternal(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);
      return urlObj.origin !== window.location.origin;
    } catch {
      return false;
    }
  }
}
