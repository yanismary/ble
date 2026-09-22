import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNoticePage } from '../legal-notice.page';

describe('LegalNoticePage', () => {
  let fixture: ComponentFixture<LegalNoticePage>;
  let component: LegalNoticePage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalNoticePage],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNoticePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the standalone legal notice page', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the current terms of use', () => {
    expect(component.copy.title).toContain('MANTION Door Control');
    expect(component.copy.definitions.length).toBe(4);
  });

  it('renders the terms and update date without action buttons', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ion-toolbar.main-menu-destination-navbar'))
      .toBeTruthy();
    expect(element.querySelectorAll('section').length).toBeGreaterThan(1);
    expect(element.textContent).toContain(component.copy.lastUpdated);
    expect(element.querySelector('dl')).toBeTruthy();
    expect(element.querySelector('ion-button')).toBeNull();
  });
});
