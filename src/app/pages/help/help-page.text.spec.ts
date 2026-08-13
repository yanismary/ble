import { helpInstructionsFor } from './help-page.text';

describe('helpInstructionsFor', () => {
  it('keeps the Phase 1 motor-side pairing sequence on Android', () => {
    const instructions = helpInstructionsFor('android');

    expect(instructions.pairing[0]).toContain('switch 1');
    expect(instructions.pairing[1]).toContain('PRG');
    expect(instructions.pairing[1]).toContain('magenta');
  });

  it('keeps the iOS pairing acceptance guidance', () => {
    const instructions = helpInstructionsFor('ios');

    expect(instructions.pairing.some((step) =>
      step.includes('demande de jumelage'),
    )).toBeTrue();
  });

  it('does not expose destructive motor reset instructions as an action', () => {
    const instructions = helpInstructionsFor('ios');

    expect(instructions.unpairing.some((step) =>
      step.includes('procédure produit validée'),
    )).toBeTrue();
  });
});
