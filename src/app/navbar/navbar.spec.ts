import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';

describe('Navbar', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }),
  );

  it('opens a labelled group and closes it with Escape', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.dropdown-trigger');
    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes a group when the user clicks outside navigation', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.dropdown-trigger');
    trigger.click();
    await fixture.whenStable();
    document.body.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
