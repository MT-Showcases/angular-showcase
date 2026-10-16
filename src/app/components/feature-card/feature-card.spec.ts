import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureCard } from './feature-card';

describe('FeatureCard', () => {
  let component: FeatureCard;
  let fixture: ComponentFixture<FeatureCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('routerLink', '/advanced/signals');
    fixture.componentRef.setInput('features', ['Writable Signals']);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
