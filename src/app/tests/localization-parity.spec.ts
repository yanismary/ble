import type { AppLanguage } from '../core/services/app-language';
import { appInfoCopyFor } from '../pages/app-info/app-info.model';
import { companyInfoCopyFor } from '../pages/company-info/company-info.model';
import {
  helpPageTextFor,
  helpProductTextFor,
} from '../pages/help/help-page.text';
import { legalNoticeCopyFor } from
  '../pages/legal-notice/legal-notice.model';
import { productDemoTextFor } from
  '../pages/product/shared/demo/product-demo';
import {
  moventivMotorStateLabelFor,
  productPageTextFor,
  widoorDelayedOpenLabelFor,
  widoorMotorStateLabelFor,
  type WidoorMotorStateKey,
} from '../pages/product/shared/localization/product-page-localization';
import { scanBluetoothTextFor } from
  '../pages/scan/scan-bluetooth.text';
import { scanErrorTextFor } from '../pages/scan/scan-error.text';
import { scanExitTextFor } from '../pages/scan/scan-exit.text';
import { scanLocationTextFor } from '../pages/scan/scan-location.text';
import { scanPermissionTextFor } from '../pages/scan/scan-permission.text';
import { scanProductConnectionTextFor } from
  '../pages/scan/scan-product-connection.text';
import { scanSurfaceTextFor } from '../pages/scan/scan-surface.text';
import { settingsPageTextFor } from
  '../pages/settings/settings-page.text';
import { tutorialCopyFor } from '../pages/tutorial/tutorial.model';
import { appMainMenuItemsFor } from
  '../shared/app-main-menu/app-main-menu.model';
import { appMainMenuButtonLabelFor } from
  '../shared/app-main-menu/app-main-menu.model';

const LANGUAGES: readonly AppLanguage[] = ['fr', 'en', 'de', 'pl'];

interface LocalizedSurface {
  readonly name: string;
  readonly valueFor: (language: AppLanguage) => unknown;
  readonly allowedEmptyPaths?: ReadonlySet<string>;
}

const PRODUCT_LEARNING_EMPTY_PATHS = new Set([
  'widoorCommands.learning.confirmTitle',
  'widoorCommands.learning.confirmMessage',
  'widoorCommands.learning.confirmAction',
  'widoorCommands.learning.confirmed',
  'widoorCommands.learning.notConfirmed',
]);

const MOTOR_STATE_KEYS: readonly WidoorMotorStateKey[] = [
  'push-and-go',
  'ble-switch',
  'automatic-manual',
  'direction',
  'pairing',
];

const LOCALIZED_SURFACES: readonly LocalizedSurface[] = [
  {
    name: 'main menu',
    valueFor: (language) => ({
      buttonLabel: appMainMenuButtonLabelFor(language),
      items: appMainMenuItemsFor(language).map(({ label }) => label),
    }),
  },
  { name: 'settings', valueFor: settingsPageTextFor },
  { name: 'help', valueFor: helpPageTextFor },
  {
    name: 'help Android Widoor',
    valueFor: (language) => helpProductTextFor(language, 'android', 'widoor'),
  },
  {
    name: 'help iOS Moventiv/Garline',
    valueFor: (language) => helpProductTextFor(
      language,
      'ios',
      'moventiv-garline',
    ),
  },
  ...(['widoor', 'moventiv', 'garline'] as const).reduce<LocalizedSurface[]>(
    (surfaces, product) => surfaces.concat(
      (['android', 'ios'] as const).map((platform): LocalizedSurface => ({
        name: `tutorial ${product} ${platform}`,
        valueFor: (language) => tutorialCopyFor(product, language, platform),
      })),
    ),
    [],
  ),
  { name: 'app info and contact', valueFor: appInfoCopyFor },
  { name: 'company info', valueFor: companyInfoCopyFor },
  { name: 'legal notice', valueFor: legalNoticeCopyFor },
  { name: 'scan surface', valueFor: scanSurfaceTextFor },
  { name: 'scan Bluetooth alerts', valueFor: scanBluetoothTextFor },
  { name: 'scan errors', valueFor: scanErrorTextFor },
  { name: 'scan exit alert', valueFor: scanExitTextFor },
  { name: 'scan location alert', valueFor: scanLocationTextFor },
  {
    name: 'scan Bluetooth permission',
    valueFor: (language) => scanPermissionTextFor(language, 'bluetooth'),
  },
  {
    name: 'scan legacy permission',
    valueFor: (language) => scanPermissionTextFor(
      language,
      'bluetooth-and-location',
    ),
  },
  {
    name: 'scan product connection',
    valueFor: scanProductConnectionTextFor,
  },
  { name: 'product demo', valueFor: productDemoTextFor },
  {
    name: 'product dynamic labels',
    valueFor: (language) => ({
      delayedOpen: widoorDelayedOpenLabelFor(language, 4),
      widoorStates: MOTOR_STATE_KEYS.reduce<string[]>((labels, key) => [
        ...labels,
        widoorMotorStateLabelFor(language, key, false),
        widoorMotorStateLabelFor(language, key, true),
      ], []),
      moventivDirection: [
        moventivMotorStateLabelFor(language, 'direction', false),
        moventivMotorStateLabelFor(language, 'direction', true),
      ],
    }),
  },
  ...(['widoor', 'moventiv-60', 'moventiv-80', 'garline'] as const)
    .map((profile): LocalizedSurface => ({
      name: `product ${profile}`,
      valueFor: (language) => productPageTextFor(language, profile),
      allowedEmptyPaths: PRODUCT_LEARNING_EMPTY_PATHS,
    })),
];

describe('visible localization parity', () => {
  for (const surface of LOCALIZED_SURFACES) {
    it(`keeps FR/EN/DE/PL structurally complete for ${surface.name}`, () => {
      const frenchPaths = leafPaths(surface.valueFor('fr'));

      for (const language of LANGUAGES) {
        const values = leafPaths(surface.valueFor(language));
        expect([...values.keys()].sort())
          .withContext(`${surface.name}/${language}`)
          .toEqual([...frenchPaths.keys()].sort());

        for (const [path, value] of values) {
          if (surface.allowedEmptyPaths?.has(path)) {
            continue;
          }
          expect(value.trim().length)
            .withContext(`${surface.name}/${language}/${path}`)
            .toBeGreaterThan(0);
        }
      }
    });
  }

  it('does not fall back to French for Product user-facing text', () => {
    const french = leafPaths(productPageTextFor('fr', 'widoor'));
    const languageSpecificSameValues: Readonly<Record<
      Exclude<AppLanguage, 'fr'>,
      ReadonlySet<string>
    >> = {
      en: new Set([
        'expertInputControls.radar',
        'sections.maintenance',
        'serviceUuid',
        'version.crc',
        'motor.pushAndGo',
        'motor.ble',
        'moventivCloseLockAlert.ok',
        'widoorCommandAlerts.lock.ok',
        'widoorCommandAlerts.retention.ok',
      ]),
      de: new Set([
        'expertInputControls.radar',
        'profile',
        'version.crc',
        'motor.pushAndGo',
        'motor.ble',
        'moventivCloseLockAlert.ok',
        'widoorCommandAlerts.lock.ok',
        'widoorCommandAlerts.retention.ok',
      ]),
      pl: new Set([
        'expertInputControls.radar',
        'profile',
        'nameRoomControls.rooms.livingRoom',
        'version.crc',
        'motor.pushAndGo',
        'motor.ble',
        'moventivCloseLockAlert.ok',
        'widoorCommandAlerts.lock.ok',
        'widoorCommandAlerts.retention.ok',
      ]),
    };

    for (const language of ['en', 'de', 'pl'] as const) {
      const translated = leafPaths(productPageTextFor(language, 'widoor'));
      for (const [path, frenchValue] of french) {
        if (PRODUCT_LEARNING_EMPTY_PATHS.has(path) ||
            languageSpecificSameValues[language].has(path)) {
          continue;
        }
        expect(translated.get(path))
          .withContext(`Product French fallback at ${language}/${path}`)
          .not.toBe(frenchValue);
      }
    }
  });
});

function leafPaths(
  value: unknown,
  prefix = '',
  result = new Map<string, string>(),
): Map<string, string> {
  if (typeof value === 'string') {
    result.set(prefix, value);
    return result;
  }
  if (typeof value === 'function') {
    result.set(prefix, String(value('__TEST_VALUE__')));
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      leafPaths(entry, joinPath(prefix, String(index)), result),
    );
    return result;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      leafPaths(entry, joinPath(prefix, key), result);
    }
  }
  return result;
}

function joinPath(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}
