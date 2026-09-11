import { scanSurfaceTextFor } from './scan-surface.text';

describe('scanSurfaceTextFor', () => {
  it('should expose the Phase 1 Scan labels in every supported language', () => {
    expect(scanSurfaceTextFor('fr')).toEqual(jasmine.objectContaining({
      title: 'Sélection',
      search: 'Rechercher',
      searching: 'Recherche en cours...',
      noMotorDetected: 'Aucune motorisation détectée.',
      demo: 'Démo',
    }));
    expect(scanSurfaceTextFor('en')).toEqual(jasmine.objectContaining({
      title: 'Selection',
      search: 'Search',
      searching: 'Searching in progress...',
      noMotorDetected: 'No motor detected.',
      demo: 'Demo',
    }));
    expect(scanSurfaceTextFor('de')).toEqual(jasmine.objectContaining({
      title: 'Auswahl',
      search: 'Suchen',
      searching: 'Suche läuft...',
      noMotorDetected: 'Kein Motor gefunden.',
      demo: 'Demo',
    }));
    expect(scanSurfaceTextFor('pl')).toEqual(jasmine.objectContaining({
      title: 'Wybór napędów',
      search: 'Wyszukiwanie',
      searching: 'Wyszukiwanie w trakcie...',
      noMotorDetected: 'Nie znaleziono napędu.',
      demo: 'Demo',
    }));
  });

  it('should keep the Phase 1 platform-specific identifier labels', () => {
    for (const language of ['fr', 'en', 'de', 'pl'] as const) {
      expect(scanSurfaceTextFor(language).macAddress).toBe('MAC:');
      expect(scanSurfaceTextFor(language).uuidAddress).toBe('UUID:');
    }
  });
});
