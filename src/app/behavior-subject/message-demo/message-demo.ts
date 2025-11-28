import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-message-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-demo.html',
  styleUrl: './message-demo.scss'
})
export class MessageDemo {
  messageSubject = new BehaviorSubject<string>('Benvenuto!');
  message$ = this.messageSubject.asObservable();
  currentMessage = '';

  constructor() {
    this.message$.subscribe((msg) => (this.currentMessage = msg));
  }

  updateMessage(newMessage: string) {
    if (newMessage.trim()) {
      this.messageSubject.next(newMessage);
    }
  }

  resetMessage() {
    this.messageSubject.next('Benvenuto!');
  }
}
