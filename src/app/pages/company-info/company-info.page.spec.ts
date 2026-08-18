import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyInfoPage } from './company-info.page';

describe('CompanyInfoPage', () => {
  let fixture: ComponentFixture<CompanyInfoPage>;
  let component: CompanyInfoPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyInfoPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the standalone company information page', () => {
    expect(component).toBeTruthy();
  });

  it('exposes migrated company content', () => {
    expect(component.copy.contentTitle).toBeTruthy();
    expect(component.copy.expertiseItems.length).toBe(3);
  });

  it('renders the Phase 1 style navbar and historical company images', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ion-toolbar.mantion-navbar')).toBeTruthy();
    expect(element.querySelector('img[src="assets/img/mantionSMT_exterior.jpg"]'))
      .toBeTruthy();
    expect(element.querySelector('img[src="assets/img/mantionSMT_manufacturing.jpg"]'))
      .toBeTruthy();
  });
});
