import { Component, signal, ViewChild, ViewContainerRef, ComponentRef, Type, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalContent, ModalState } from '../services/modal.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Icon } from '../components/icon/icon';

@Component({
  selector: 'app-link-modal',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './link-modal.html',
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
    this.modalService.modalState$.subscribe((state: ModalState) => {
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

  close() {
    this.modalService.close();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
