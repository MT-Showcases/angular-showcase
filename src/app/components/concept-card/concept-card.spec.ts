import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptCard } from './concept-card';

describe('ConceptCard', () => {
  let component: ConceptCard;
  let fixture: ComponentFixture<ConceptCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConceptCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptCard);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('icon', '🏪');
    fixture.componentRef.setInput('title', 'Test Concept');
    fixture.componentRef.setInput('description', 'Test description');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display icon, title, and description', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.concept-card__icon')?.textContent).toContain('🏪');
    expect(compiled.querySelector('h3')?.textContent).toContain('Test Concept');
    expect(compiled.querySelector('.concept-card__description')?.textContent).toContain(
      'Test description',
    );
  });

  it('should display code block when code is provided', () => {
    fixture.componentRef.setInput('code', 'const test = "example";');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-code-block')).toBeTruthy();
  });

  it('should not display code block when code is not provided', () => {
    fixture.componentRef.setInput('code', undefined);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-code-block')).toBeFalsy();
  });

  it('should display key points when provided', () => {
    fixture.componentRef.setInput('keyPointsTitle', 'Features:');
    fixture.componentRef.setInput('keyPoints', ['Feature 1', 'Feature 2', 'Feature 3']);
    fixture.detectChanges();

    const keyPoints = fixture.nativeElement.querySelector('.concept-card__key-points');
    expect(keyPoints).toBeTruthy();
    expect(keyPoints.querySelector('h4')?.textContent).toContain('Features:');

    const listItems = keyPoints.querySelectorAll('li');
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toContain('Feature 1');
  });

  it('should not display key points section when keyPoints is empty', () => {
    fixture.componentRef.setInput('keyPoints', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.concept-card__key-points')).toBeFalsy();
  });
});
