// COMPONENT TYPE: Container
// SECTION: UI Components - Modal
//
// ROLE:
// - Display modal for external links and dynamic components
// - Handle iframe embedding for external URLs
// - Support dynamic component loading with ViewContainerRef
// - Manage modal state via ModalService
//
// PATTERNS USED:
// - Reactive modal state with Signals
// - DomSanitizer for safe URL handling
// - Dynamic component loading with ViewContainerRef
// - Service subscription for state management
//
// NOTES FOR CONTRIBUTORS:
// - Modal state comes from ModalService
// - External links are embedded in iframe (sanitized)
// - Components are dynamically loaded into ViewContainerRef
// - Always clear component refs on close to prevent memory leaks
// - Use DomSanitizer for all external URLs

import {
  Component,
  signal,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  Type,
  inject,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModalService, ModalContent, ModalState } from '../services/modal.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Icon } from '../components/icon/icon';

@Component({
  selector: 'app-link-modal',
  standalone: true,
  imports: [Icon],
  templateUrl: './link-modal.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './link-modal.scss',
})
export class LinkModal {
  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef })
  dynamicComponentContainer!: ViewContainerRef;

  isOpen = signal(false);
  content = signal<ModalContent | null>(null);
  safeUrl = signal<SafeResourceUrl | null>(null);

  private componentRef: ComponentRef<any> | null = null;
  private modalService = inject(ModalService);
  private sanitizer = inject(DomSanitizer);

  constructor() {
    this.modalService.modalState$.pipe(takeUntilDestroyed()).subscribe((state: ModalState) => {
      this.isOpen.set(state.isOpen);
      this.content.set(state.content);

      if (state.isOpen && state.content) {
        if (state.content.type === 'external') {
          this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(state.content.url));
        } else if (state.content.type === 'component') {
          this.loadComponent(state.content.component!);
        }
      } else {
        this.clearComponent();
        this.safeUrl.set(null);
      }
    });
  }

  private loadComponent(component: Type<any>) {
    if (this.dynamicComponentContainer) {
      this.clearComponent();
      this.componentRef = this.dynamicComponentContainer.createComponent(component);
    }
  }

  private clearComponent() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

  @HostListener('document:keydown.escape')
  close() {
    this.modalService.close();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
