/**
 * Reine Farbfunktionen (HSL ⇄ RGB ⇄ Hex, Palettenberechnung).
 * Enthält bewusst keinen DOM-Zugriff, damit sich alles isoliert testen lässt.
 */

export interface Rgb {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface Hsl {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/** Begrenzt einen Wert auf den Bereich [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normalisiert einen Hue-Wert auf den Bereich [0, 360). */
export function normalizeHue(hue: number): number {
  const h = hue % 360;
  return h < 0 ? h + 360 : h;
}

/** Wandelt RGB (0-255) in einen Hex-String (#rrggbb) um. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (channel: number) =>
    clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Wandelt einen Hex-String (#rgb, #rrggbb, mit oder ohne '#') in RGB um. */
export function hexToRgb(hex: string): Rgb {
  let value = hex.trim().replace(/^#/, "");

  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Ungültiger Hex-Farbcode: "${hex}"`);
  }

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** Wandelt RGB (0-255) in HSL um (h: 0-360, s/l: 0-100). */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  h = normalizeHue(h);

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}

/** Wandelt HSL (h: 0-360, s/l: 0-100) in RGB (0-255) um. */
export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hNorm = normalizeHue(h);
  const sNorm = clamp(s, 0, 100) / 100;
  const lNorm = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hNorm < 60) {
    [rPrime, gPrime, bPrime] = [c, x, 0];
  } else if (hNorm < 120) {
    [rPrime, gPrime, bPrime] = [x, c, 0];
  } else if (hNorm < 180) {
    [rPrime, gPrime, bPrime] = [0, c, x];
  } else if (hNorm < 240) {
    [rPrime, gPrime, bPrime] = [0, x, c];
  } else if (hNorm < 300) {
    [rPrime, gPrime, bPrime] = [x, 0, c];
  } else {
    [rPrime, gPrime, bPrime] = [c, 0, x];
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

/** Kurzform: Hex direkt in HSL umwandeln. */
export function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

/** Kurzform: HSL direkt in Hex umwandeln. */
export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

/** Formatiert RGB als CSS-rgb()-String. */
export function rgbToCss({ r, g, b }: Rgb): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export interface PaletteColor {
  hue: number;
  hsl: Hsl;
  rgb: Rgb;
  hex: string;
}

/**
 * Berechnet eine harmonische Palette aus N Farben, ausgehend von einer
 * Grundfarbe (HSL). Sättigung und Helligkeit bleiben für alle Paletten-Farben
 * gleich, nur der Farbton (Hue) wird gleichmässig über den Farbkreis verteilt
 * (Abstand = 360° / N). Die Grundfarbe ist immer Teil der Palette (erster Eintrag).
 */
export function generatePalette(base: Hsl, count: number): PaletteColor[] {
  const n = Math.max(1, Math.round(count));
  const step = 360 / n;

  return Array.from({ length: n }, (_, i) => {
    const hue = normalizeHue(base.h + i * step);
    const hsl: Hsl = { h: hue, s: base.s, l: base.l };
    const rgb = hslToRgb(hsl);
    return {
      hue,
      hsl,
      rgb,
      hex: rgbToHex(rgb),
    };
  });
}
