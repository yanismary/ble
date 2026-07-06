// L'affectation de piece est encodee en suffixe (4 caracteres) ajoute a la fin du nom BLE
// du moteur (ex: "Firma#SDJ"), partage par WIDOOR / MOVENTIV / GARLINE. Ce module centralise
// la liste des suffixes et leur resolution en icone pour le nouveau cache local piece
// (voir RoomCacheService) et scan.ts, sans toucher aux copies deja existantes dans
// widoor.ts/moventiv.ts (qui gerent en plus le formulaire d'edition).
export const ROOM_SUFFIXES: string[] = [
  '#CHA', '#ENT', '#SAL', '#CUI', '#SAM', '#SDB', '#WCS', '#GAR', '#SLL', '#SDJ'
];

export function extractRoomSuffix(name: string): string {
  const value = name || '';
  for (let i = 0; i < ROOM_SUFFIXES.length; i++) {
    const suffix = ROOM_SUFFIXES[i];
    if (value.lastIndexOf(suffix) === value.length - suffix.length) {
      return suffix;
    }
  }
  return '';
}

export function roomIconForSuffix(suffix: string): string {
  switch (suffix) {
    case '#CHA': return 'ai-loc-cha';
    case '#SAL': return 'ai-loc-sal';
    case '#CUI': return 'ai-loc-cui';
    case '#SAM': return 'ai-loc-sam';
    case '#SDB': return 'ai-loc-sdb';
    case '#WCS': return 'ai-loc-wcs';
    case '#GAR': return 'ai-loc-garage';
    case '#SDJ': return 'ai-loc-sdj';
    case '#SLL':
    case '#ENT':
      return 'ai-loc-autre';
    default:
      return '';
  }
}
