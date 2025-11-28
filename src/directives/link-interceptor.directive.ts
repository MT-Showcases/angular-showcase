import { Directive, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../app/services/modal.service';

@Directive({
  selector: '[appLinkInterceptor]',
  standalone: true,
})
export class LinkInterceptor {
  private modalService = inject(ModalService);
  private router = inject(Router);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');

    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href');
    const target_attr = anchor.getAttribute('target');

    // Se il link ha target="_blank" o non ha href, ignoriamo
    if (!href || href === '#') {
      return;
    }

    // Se ha target="_blank", intercetta e apri in modale
    if (target_attr === '_blank') {
      event.preventDefault();
      event.stopPropagation();

      if (this.modalService.isExternal(href)) {
        this.modalService.openExternal(href, anchor.textContent || undefined);
      } else {
        // Link interno - naviga usando il router in modale
        this.router.navigate([href]);
      }
      return;
    }

    // Controlla se il link è esterno
    if (this.modalService.isExternal(href)) {
      event.preventDefault();
      event.stopPropagation();
      this.modalService.openExternal(href, anchor.textContent || undefined);
    }
  }
}
