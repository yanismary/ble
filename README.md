# MANTION SMT

Application mobile BLE regroupant Widoor, Moventiv et Garline.

## Prerequis

- Node.js et npm compatibles avec Ionic 3 / Angular 5.
- Dependances installees avec `npm install`.
- Capacitor CLI disponible via `npx cap`.

## Commandes utiles

```bash
npm run build
npm run lint
npx tsc -p tsconfig.json --noEmit --noUnusedLocals --noUnusedParameters
npm run cap:sync
```

## Plateformes

- Android est synchronise via Capacitor dans `android/`.
- iOS est synchronise via Capacitor dans `ios/`(disponible uniquement sur MAC)


## Notes de maintenance

- Conserver les controles de permissions Bluetooth/localisation avant scan.
- Conserver les protections sur les identifiants BLE manquants.
- Garline utilise la page Moventiv avec son type produit dedie.
