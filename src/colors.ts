/**
 * Reine Farbfunktionen (HSL ⇄ RGB ⇄ Hex ⇄ HCL/CIE LCh, Palettenberechnung).
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

export interface Hcl {
  h: number; // 0-360 (0 bei achromatischen Farben)
  c: number; // Chroma, >= 0
  l: number; // Luminance, 0-100
}

// D65-Referenzweiss (CIE-Normalbeobachter, 2°).
const D65_XN = 95.047;
const D65_YN = 100;
const D65_ZN = 108.883;

/** Wandelt einen linearisierten sRGB-Kanal (0-1) in seinen Gamma-korrigierten Wert um. */
function linearToSrgbChannel(channel: number): number {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

/** Wandelt einen Gamma-korrigierten sRGB-Kanal (0-1) in seinen linearisierten Wert um. */
function srgbToLinearChannel(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Wandelt RGB (0-255) in CIE XYZ um (D65-Weisspunkt). */
export function rgbToXyz({ r, g, b }: Rgb): { x: number; y: number; z: number } {
  const rLin = srgbToLinearChannel(r / 255);
  const gLin = srgbToLinearChannel(g / 255);
  const bLin = srgbToLinearChannel(b / 255);

  return {
    x: (rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375) * 100,
    y: (rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.072175) * 100,
    z: (rLin * 0.0193339 + gLin * 0.119192 + bLin * 0.9503041) * 100,
  };
}

/** Wandelt CIE XYZ (D65-Weisspunkt) in ungeclampte, gammakorrigierte sRGB-Kanäle (~0-255) um. */
function xyzToSrgbChannels({ x, y, z }: { x: number; y: number; z: number }): {
  r: number;
  g: number;
  b: number;
} {
  const xNorm = x / 100;
  const yNorm = y / 100;
  const zNorm = z / 100;

  const rLin = xNorm * 3.2404542 + yNorm * -1.5371385 + zNorm * -0.4985314;
  const gLin = xNorm * -0.969266 + yNorm * 1.8760108 + zNorm * 0.041556;
  const bLin = xNorm * 0.0556434 + yNorm * -0.2040259 + zNorm * 1.0572252;

  return {
    r: linearToSrgbChannel(rLin) * 255,
    g: linearToSrgbChannel(gLin) * 255,
    b: linearToSrgbChannel(bLin) * 255,
  };
}

/** Wandelt CIE XYZ (D65-Weisspunkt) in RGB (0-255) um. */
export function xyzToRgb(xyz: { x: number; y: number; z: number }): Rgb {
  const { r, g, b } = xyzToSrgbChannels(xyz);
  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
  };
}

const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;

function labPivotForward(t: number): number {
  return t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + 16) / 116;
}

function labPivotInverse(t: number): number {
  const t3 = t * t * t;
  return t3 > LAB_EPSILON ? t3 : (116 * t - 16) / LAB_KAPPA;
}

/** Wandelt CIE XYZ (D65-Weisspunkt) in CIE Lab um. */
export function xyzToLab({ x, y, z }: { x: number; y: number; z: number }): {
  l: number;
  a: number;
  b: number;
} {
  const fx = labPivotForward(x / D65_XN);
  const fy = labPivotForward(y / D65_YN);
  const fz = labPivotForward(z / D65_ZN);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** Wandelt CIE Lab in CIE XYZ (D65-Weisspunkt) um. */
export function labToXyz({ l, a, b }: { l: number; a: number; b: number }): {
  x: number;
  y: number;
  z: number;
} {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  return {
    x: labPivotInverse(fx) * D65_XN,
    y: labPivotInverse(fy) * D65_YN,
    z: labPivotInverse(fz) * D65_ZN,
  };
}

/** Wandelt RGB (0-255) in HCL um (CIE LCh: h 0-360, c >= 0, l 0-100). */
export function rgbToHcl(rgb: Rgb): Hcl {
  const { l, a, b } = xyzToLab(rgbToXyz(rgb));
  const c = Math.sqrt(a * a + b * b);
  const h = c < 1e-7 ? 0 : normalizeHue((Math.atan2(b, a) * 180) / Math.PI);

  return { h, c, l };
}

/** Wandelt HCL (CIE LCh: h 0-360, c >= 0, l 0-100) in RGB (0-255) um. */
export function hclToRgb({ h, c, l }: Hcl): Rgb {
  const hRad = (normalizeHue(h) * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  return xyzToRgb(labToXyz({ l, a, b }));
}

/** Formatiert HCL als CSS-artigen hcl()-String. */
export function hclToCss({ h, c, l }: Hcl): string {
  return `hcl(${Math.round(h)}, ${Math.round(c)}, ${Math.round(l)})`;
}

// Toleranz in RGB-Einheiten für die Gamut-Prüfung (fängt Rundungsfehler ab).
const GAMUT_EPSILON = 0.5;

/**
 * Prüft, ob eine HCL-Farbe innerhalb des sRGB-Gamuts liegt, d.h. ob sie ohne
 * Clamping der einzelnen Kanäle exakt als RGB darstellbar ist.
 */
export function isHclInGamut({ h, c, l }: Hcl): boolean {
  const hRad = (normalizeHue(h) * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bLab = c * Math.sin(hRad);
  const { r, g, b } = xyzToSrgbChannels(labToXyz({ l, a, b: bLab }));

  return (
    r >= -GAMUT_EPSILON &&
    r <= 255 + GAMUT_EPSILON &&
    g >= -GAMUT_EPSILON &&
    g <= 255 + GAMUT_EPSILON &&
    b >= -GAMUT_EPSILON &&
    b <= 255 + GAMUT_EPSILON
  );
}

export interface PaletteColor {
  hue: number;
  hsl: Hsl;
  rgb: Rgb;
  hex: string;
  hcl: Hcl;
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
      hcl: rgbToHcl(rgb),
    };
  });
}
