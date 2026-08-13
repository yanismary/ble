import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpPage, normalizeHelpPlatform } from './help.page';

describe('HelpPage', () => {
  let fixture: ComponentFixture<HelpPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpPage],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpPage);
    fixture.detectChanges();
  });

  it('creates the standalone help page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('normalizes native and web platform values', () => {
    expect(normalizeHelpPlatform('android')).toBe('android');
    expect(normalizeHelpPlatform('ios')).toBe('ios');
    expect(normalizeHelpPlatform('web')).toBe('web');
    expect(normalizeHelpPlatform('unknown')).toBe('web');
  });
});
