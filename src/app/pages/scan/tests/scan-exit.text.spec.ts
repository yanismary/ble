import { scanExitTextFor } from '../scan-exit.text';

describe('scanExitTextFor', () => {
  it('should expose the Phase 1 exit prompt in every supported language', () => {
    expect(scanExitTextFor('fr')).toEqual({
      message: "Souhaitez-vous quitter l'application ?",
      cancel: 'Annuler',
      exit: 'Quitter',
    });
    expect(scanExitTextFor('en')).toEqual({
      message: 'Would you like to exit the application?',
      cancel: 'Cancel',
      exit: 'Exit',
    });
    expect(scanExitTextFor('de')).toEqual({
      message: 'Möchten Sie die Anwendung beenden?',
      cancel: 'Abbrechen',
      exit: 'Beenden',
    });
    expect(scanExitTextFor('pl')).toEqual({
      message: 'Czy chcesz zamknąć aplikację?',
      cancel: 'Anuluj',
      exit: 'Zamknij',
    });
  });
});
