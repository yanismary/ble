import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppInfoPage } from './app-info.page';

describe('AppInfoPage', () => {
  let fixture: ComponentFixture<AppInfoPage>;
  let component: AppInfoPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppInfoPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the standalone app information page', () => {
    expect(component).toBeTruthy();
  });

  it('uses a safe web fallback for the app version', () => {
    expect(component.appVersion).toBe('—');
  });
});
