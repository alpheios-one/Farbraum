# Farbraum

🔗 Live: [https://alpheios-one.github.io/Farbraum/](https://alpheios-one.github.io/Farbraum/)

Farbraum ist eine kleine Webanwendung, mit der du eine Grundfarbe über ein
klassisches Farbrad wählst und daraus automatisch eine harmonische
Farbpalette berechnen lassen kannst. Alle Paletten-Farben teilen sich die
Sättigung und Helligkeit der Grundfarbe – nur der Farbton (Hue) wird
gleichmässig über den Farbkreis verteilt.

## Funktionen

- **Farbwähler**: Farbrad (Hue als Winkel, Sättigung als Radius) plus
  horizontaler Helligkeits-Schieberegler
- Eingabefelder für R, G, B, Alpha sowie den Hex-Code
- Slider zur Auswahl der Anzahl Paletten-Farben (2–12)
- Für jede Paletten-Farbe: Swatch, Hex-Code und RGB-Code, per Klick in die
  Zwischenablage kopierbar

## Screenshot

> Screenshot folgt – lokal mit `npm run dev` starten, um die Anwendung im
> Browser zu sehen.

## Technik

- [Vite](https://vitejs.dev/) + TypeScript, kein Backend nötig
- Die Farbumrechnungen (HSL ⇄ RGB ⇄ Hex) und die Palettenberechnung sind als
  reine Funktionen in [`src/colors.ts`](./src/colors.ts) implementiert – ohne
  DOM-Zugriff, dadurch gut isoliert testbar
- [Vitest](https://vitest.dev/) für Unit-Tests ([`src/colors.test.ts`](./src/colors.test.ts))

## Lokal starten

```bash
npm install
npm run dev
```

Die Anwendung ist danach unter der von Vite ausgegebenen lokalen Adresse
(standardmässig http://localhost:5173) erreichbar.

## Tests ausführen

```bash
npm test
```

Die Tests decken unter anderem ab:

- HSL ⇄ RGB ⇄ Hex Umrechnung (inkl. Rundung)
- Palette mit N Farben hat exakt N Einträge
- Alle Paletten-Farben haben dieselbe Sättigung/Helligkeit wie die Grundfarbe
- Hue-Abstand zwischen benachbarten Paletten-Farben entspricht 360° / N
- Grundfarbe ist Teil der resultierenden Palette
- Edge Cases: N = 1, N = 2, sehr hohe N

## Build

```bash
npm run build
```

Erstellt einen produktionsreifen Build im Ordner `dist/`.
