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

  it('exposes migrated legal content', () => {
    expect(component.copy.title).toBeTruthy();
    expect(component.copy.definitions.length).toBe(3);
  });

  it('renders the Phase 1 style legal notice page without action buttons', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ion-toolbar.main-menu-destination-navbar'))
      .toBeTruthy();
    expect(element.querySelectorAll('section').length).toBeGreaterThan(1);
    expect(element.querySelector('dl')).toBeTruthy();
    expect(element.querySelector('ion-button')).toBeNull();
  });
});
