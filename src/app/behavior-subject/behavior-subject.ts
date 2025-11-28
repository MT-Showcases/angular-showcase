import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { PageHeader } from '../page-header/page-header';
import { CodeBlock } from '../components/code-block/code-block';
import { MessageDemo } from './message-demo/message-demo';

interface Message {
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-behavior-subject',
  standalone: true,
  imports: [CommonModule, PageHeader, CodeBlock, MessageDemo],
  templateUrl: './behavior-subject.html',
  styleUrl: './behavior-subject.scss'
})
export class BehaviorSubjectComponent {
  // BehaviorSubject con valore iniziale
  messageSubject = new BehaviorSubject<string>('Benvenuto!');
  message$ = this.messageSubject.asObservable();
  currentMessage = '';

  // BehaviorSubject per contatore
  counterSubject = new BehaviorSubject<number>(0);
  counter$ = this.counterSubject.asObservable();
  currentCount = 0;

  // BehaviorSubject per messaggi complessi
  messagesSubject = new BehaviorSubject<Message[]>([]);
  messages$ = this.messagesSubject.asObservable();
  messageHistory: Message[] = [];

  // BehaviorSubject per stato utente
  userStateSubject = new BehaviorSubject<{ name: string; online: boolean }>({
    name: 'Ospite',
    online: false,
  });
  userState$ = this.userStateSubject.asObservable();
  currentUserState = { name: 'Ospite', online: false };

  constructor() {
    // Sottoscrizioni per visualizzare i valori correnti
    this.message$.subscribe((msg) => (this.currentMessage = msg));
    this.counter$.subscribe((count) => (this.currentCount = count));
    this.messages$.subscribe((msgs) => (this.messageHistory = msgs));
    this.userState$.subscribe((state) => (this.currentUserState = state));
  }

  // Metodi per l'esempio del messaggio
  updateMessage(newMessage: string) {
    this.messageSubject.next(newMessage);
  }

  resetMessage() {
    this.messageSubject.next('Benvenuto!');
  }

  // Metodi per l'esempio del contatore
  incrementCounter() {
    const currentValue = this.counterSubject.value;
    this.counterSubject.next(currentValue + 1);
  }

  decrementCounter() {
    const currentValue = this.counterSubject.value;
    this.counterSubject.next(currentValue - 1);
  }

  resetCounter() {
    this.counterSubject.next(0);
  }

  // Metodi per l'esempio dei messaggi
  addMessage(text: string) {
    const currentMessages = this.messagesSubject.value;
    const newMessage: Message = {
      text,
      timestamp: new Date(),
    };
    this.messagesSubject.next([...currentMessages, newMessage]);
  }

  clearMessages() {
    this.messagesSubject.next([]);
  }

  // Metodi per l'esempio dello stato utente
  login(name: string) {
    this.userStateSubject.next({ name, online: true });
  }

  logout() {
    this.userStateSubject.next({ name: 'Ospite', online: false });
  }

  // Esempi di codice
  basicExample = `import { BehaviorSubject } from 'rxjs';

// Creazione di un BehaviorSubject con valore iniziale
const subject = new BehaviorSubject<string>('Valore iniziale');

// Sottoscrizione - riceve subito il valore corrente
subject.subscribe(value => {
  console.log('Ricevuto:', value);
});
// Output: Ricevuto: Valore iniziale

// Emissione di un nuovo valore
subject.next('Nuovo valore');
// Output: Ricevuto: Nuovo valore`;

  valueAccessExample = `// Accesso al valore corrente senza sottoscrizione
const currentValue = subject.value;
console.log('Valore corrente:', currentValue);

// Questo è utile per operazioni sincrone
if (subject.value === 'qualcosa') {
  // fai qualcosa
}`;

  comparisonExample = `// Subject - NON ha valore iniziale
const subject = new Subject<string>();
subject.subscribe(v => console.log('Sub 1:', v));
// Non viene stampato nulla ancora

subject.next('Primo valore');
// Output: Sub 1: Primo valore

// BehaviorSubject - HA valore iniziale
const behaviorSubject = new BehaviorSubject<string>('Iniziale');
behaviorSubject.subscribe(v => console.log('Sub 1:', v));
// Output: Sub 1: Iniziale (emesso subito!)

behaviorSubject.next('Secondo valore');
// Output: Sub 1: Secondo valore`;

  practicalExample = `import { BehaviorSubject } from 'rxjs';

// Service per gestire lo stato di autenticazione
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  login(user: User) {
    this.userSubject.next(user);
  }

  logout() {
    this.userSubject.next(null);
  }

  // Ottieni l'utente corrente senza sottoscrizione
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // Verifica se l'utente è loggato
  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }
}`;

  stateManagementExample = `// Service per gestire lo stato del carrello
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  addItem(item: CartItem) {
    const currentCart = this.cartSubject.value;
    this.cartSubject.next([...currentCart, item]);
  }

  removeItem(itemId: string) {
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.filter(item => item.id !== itemId);
    this.cartSubject.next(updatedCart);
  }

  clearCart() {
    this.cartSubject.next([]);
  }

  getItemCount(): number {
    return this.cartSubject.value.length;
  }
}`;
}
