import {
  getHelpProductGroup,
  helpPageTextFor,
  helpProductTextFor,
} from './help-page.text';

describe('help page text', () => {
  it('keeps the Phase 1 Widoor and Moventiv/Garline grouping', () => {
    expect(getHelpProductGroup('widoor')).toBe('widoor');
    expect(getHelpProductGroup('moventiv')).toBe('moventiv-garline');
    expect(getHelpProductGroup('garline')).toBe('moventiv-garline');
  });

  it('keeps the Phase 1 motor-side pairing sequence', () => {
    const instructions = helpProductTextFor('fr', 'android', 'moventiv');

    expect(instructions.pairing.steps.some((step) =>
      step.includes('switch 1'),
    )).toBeTrue();
    expect(instructions.pairing.steps.some((step) =>
      step.includes('PRG'),
    )).toBeTrue();
    expect(instructions.pairing.steps.some((step) =>
      step.includes('magenta'),
    )).toBeTrue();
  });

  it('adapts obsolete Android GPS guidance to the current BLE stack', () => {
    const instructions = helpProductTextFor('fr', 'android', 'widoor');

    expect(instructions.pairing.note).toContain('GPS');
    expect(instructions.pairing.note).toContain('pas necessaire');
  });

  it('keeps iOS pairing acceptance guidance', () => {
    const instructions = helpProductTextFor('en', 'ios', 'widoor');

    expect(instructions.pairing.note).toContain('pairing request');
  });

  it('resolves supported Phase 2 languages', () => {
    expect(helpPageTextFor('fr').title).toBe('Aide');
    expect(helpPageTextFor('en').title).toBe('Help');
    expect(helpPageTextFor('de').title).toBe('Hilfe');
    expect(helpPageTextFor('pl').title).toBe('Pomoc');
  });
});
