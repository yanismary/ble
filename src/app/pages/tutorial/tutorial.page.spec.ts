import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TutorialPage } from './tutorial.page';

describe('TutorialPage', () => {
  let fixture: ComponentFixture<TutorialPage>;
  let component: TutorialPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorialPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the standalone tutorial page', () => {
    expect(component).toBeTruthy();
  });

  it('starts with product selection and resets to the first slide', () => {
    expect(component.selectedProduct).toBeNull();

    component.selectProduct('widoor');

    expect(component.selectedProduct).toBe('widoor');
    expect(component.slideIndex).toBe(0);
    expect(component.currentSlide).toBeTruthy();
  });

  it('does not move before the first slide', () => {
    component.selectProduct('moventiv');
    component.previous();

    expect(component.slideIndex).toBe(0);
  });
});
