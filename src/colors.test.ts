import { describe, expect, it } from "vitest";
import {
  clamp,
  generatePalette,
  hclToCss,
  hclToRgb,
  hexToRgb,
  hslToCss,
  hslToHex,
  hslToRgb,
  isHclInGamut,
  normalizeHue,
  rgbToCss,
  rgbToHcl,
  rgbToHex,
  rgbToHsl,
  type Hcl,
} from "./colors";

describe("clamp", () => {
  it("begrenzt Werte auf den angegebenen Bereich", () => {
    expect(clamp(-10, 0, 255)).toBe(0);
    expect(clamp(300, 0, 255)).toBe(255);
    expect(clamp(128, 0, 255)).toBe(128);
  });
});

describe("normalizeHue", () => {
  it("normalisiert Hue-Werte auf [0, 360)", () => {
    expect(normalizeHue(0)).toBe(0);
    expect(normalizeHue(360)).toBe(0);
    expect(normalizeHue(370)).toBe(10);
    expect(normalizeHue(-10)).toBe(350);
    expect(normalizeHue(720)).toBe(0);
  });
});

describe("rgbToHex", () => {
  it("wandelt RGB korrekt in Hex um", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
    expect(rgbToHex({ r: 18, g: 52, b: 86 })).toBe("#123456");
  });

  it("rundet Nachkommastellen korrekt", () => {
    expect(rgbToHex({ r: 127.6, g: 0.4, b: 254.5 })).toBe("#8000ff");
  });
});

describe("hexToRgb", () => {
  it("wandelt 6-stelligen Hex-Code korrekt in RGB um", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("123456")).toEqual({ r: 18, g: 52, b: 86 });
  });

  it("unterstützt die kurze 3-stellige Schreibweise", () => {
    expect(hexToRgb("#0f0")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("abc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("wirft einen Fehler bei ungültigem Hex-Code", () => {
    expect(() => hexToRgb("#zzzzzz")).toThrow();
    expect(() => hexToRgb("#12345")).toThrow();
  });
});

describe("rgbToHsl / hslToRgb", () => {
  it("berechnet HSL für bekannte Grundfarben korrekt", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
  });

  it("ist zueinander invers (Hin- und Rückumrechnung, mit Rundungstoleranz)", () => {
    const samples: Array<{ r: number; g: number; b: number }> = [
      { r: 18, g: 52, b: 86 },
      { r: 200, g: 100, b: 50 },
      { r: 10, g: 200, b: 210 },
      { r: 128, g: 128, b: 128 },
    ];

    for (const rgb of samples) {
      const hsl = rgbToHsl(rgb);
      const roundTripped = hslToRgb(hsl);
      expect(roundTripped.r).toBeCloseTo(rgb.r, 0);
      expect(roundTripped.g).toBeCloseTo(rgb.g, 0);
      expect(roundTripped.b).toBeCloseTo(rgb.b, 0);
    }
  });

  it("wandelt HSL korrekt in RGB um", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
    expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("hslToHex", () => {
  it("wandelt HSL direkt in Hex um", () => {
    expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe("#ff0000");
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe("#00ff00");
  });
});

describe("rgbToCss", () => {
  it("formatiert RGB als CSS rgb()-String", () => {
    expect(rgbToCss({ r: 255, g: 0, b: 0 })).toBe("rgb(255, 0, 0)");
    expect(rgbToCss({ r: 12.4, g: 0, b: 200.6 })).toBe("rgb(12, 0, 201)");
  });
});

describe("hslToCss", () => {
  it("formatiert HSL als CSS hsl()-String", () => {
    expect(hslToCss({ h: 0, s: 100, l: 50 })).toBe("hsl(0, 100%, 50%)");
    expect(hslToCss({ h: 210.4, s: 45.2, l: 61.9 })).toBe("hsl(210, 45%, 62%)");
  });
});

describe("rgbToHcl / hclToRgb", () => {
  it("berechnet HCL für bekannte Grundfarben korrekt (D65-Referenzwerte)", () => {
    const red = rgbToHcl({ r: 255, g: 0, b: 0 });
    expect(red.l).toBeCloseTo(53.24, 1);
    expect(red.c).toBeCloseTo(104.55, 1);
    expect(red.h).toBeCloseTo(40, 0);

    const white = rgbToHcl({ r: 255, g: 255, b: 255 });
    expect(white.l).toBeCloseTo(100, 1);
    expect(white.c).toBeCloseTo(0, 2);

    const black = rgbToHcl({ r: 0, g: 0, b: 0 });
    expect(black.l).toBeCloseTo(0, 5);
    expect(black.c).toBeCloseTo(0, 5);
  });

  it("liefert für achromatische Grautöne ein Chroma von ~0", () => {
    const grays: Array<{ r: number; g: number; b: number }> = [
      { r: 0, g: 0, b: 0 },
      { r: 64, g: 64, b: 64 },
      { r: 128, g: 128, b: 128 },
      { r: 200, g: 200, b: 200 },
      { r: 255, g: 255, b: 255 },
    ];

    for (const rgb of grays) {
      const hcl = rgbToHcl(rgb);
      expect(hcl.c).toBeCloseTo(0, 4);
    }
  });

  it("ist zueinander invers (Hin- und Rückumrechnung, mit Rundungstoleranz)", () => {
    const samples: Array<{ r: number; g: number; b: number }> = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 18, g: 52, b: 86 },
      { r: 200, g: 100, b: 50 },
      { r: 10, g: 200, b: 210 },
      { r: 128, g: 128, b: 128 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
    ];

    for (const rgb of samples) {
      const hcl = rgbToHcl(rgb);
      const roundTripped = hclToRgb(hcl);
      expect(roundTripped.r).toBeCloseTo(rgb.r, 0);
      expect(roundTripped.g).toBeCloseTo(rgb.g, 0);
      expect(roundTripped.b).toBeCloseTo(rgb.b, 0);
    }
  });
});

describe("isHclInGamut", () => {
  it("erkennt Farben von bekannten RGB-Werten als darstellbar", () => {
    const samples: Array<{ r: number; g: number; b: number }> = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 18, g: 52, b: 86 },
      { r: 128, g: 128, b: 128 },
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    ];

    for (const rgb of samples) {
      expect(isHclInGamut(rgbToHcl(rgb))).toBe(true);
    }
  });

  it("erkennt nicht darstellbare HCL-Kombinationen (zu hohes Chroma)", () => {
    expect(isHclInGamut({ h: 0, c: 500, l: 50 })).toBe(false);
    expect(isHclInGamut({ h: 120, c: 300, l: 90 })).toBe(false);
  });

  it("clamped hclToRgb liefert für nicht darstellbare Kombinationen einen gültigen RGB-Wert", () => {
    const outOfGamut: Hcl = { h: 0, c: 500, l: 50 };
    expect(isHclInGamut(outOfGamut)).toBe(false);

    const rgb = hclToRgb(outOfGamut);
    expect(rgb.r).toBeGreaterThanOrEqual(0);
    expect(rgb.r).toBeLessThanOrEqual(255);
    expect(rgb.g).toBeGreaterThanOrEqual(0);
    expect(rgb.g).toBeLessThanOrEqual(255);
    expect(rgb.b).toBeGreaterThanOrEqual(0);
    expect(rgb.b).toBeLessThanOrEqual(255);
  });
});

describe("hclToCss", () => {
  it("formatiert HCL als hcl()-String", () => {
    expect(hclToCss({ h: 210.4, c: 45.2, l: 61.9 })).toBe("hcl(210, 45, 62)");
  });
});

describe("generatePalette", () => {
  const base = { h: 200, s: 60, l: 50 };

  it("liefert exakt N Einträge", () => {
    for (const n of [1, 2, 3, 5, 8, 12]) {
      expect(generatePalette(base, n)).toHaveLength(n);
    }
  });

  it("alle Farben haben dieselbe Sättigung und Helligkeit wie die Grundfarbe", () => {
    const palette = generatePalette(base, 6);
    for (const color of palette) {
      expect(color.hsl.s).toBeCloseTo(base.s, 5);
      expect(color.hsl.l).toBeCloseTo(base.l, 5);
    }
  });

  it("der Hue-Abstand zwischen benachbarten Farben entspricht 360° / N", () => {
    const n = 5;
    const palette = generatePalette(base, n);
    const expectedStep = 360 / n;

    for (let i = 1; i < palette.length; i++) {
      const diff = normalizeHue(palette[i].hue - palette[i - 1].hue);
      expect(diff).toBeCloseTo(expectedStep, 5);
    }
  });

  it("die Grundfarbe ist Teil der resultierenden Palette", () => {
    const palette = generatePalette(base, 4);
    expect(palette[0].hue).toBeCloseTo(base.h, 5);
    expect(palette[0].hex).toBe(hslToHex(base));
  });

  it("jede Farbe enthält den passenden HCL-Wert", () => {
    const palette = generatePalette(base, 4);
    for (const color of palette) {
      expect(color.hcl).toEqual(rgbToHcl(color.rgb));
    }
  });

  it("Edge Case N = 1: liefert nur die Grundfarbe", () => {
    const palette = generatePalette(base, 1);
    expect(palette).toHaveLength(1);
    expect(palette[0].hue).toBeCloseTo(base.h, 5);
  });

  it("Edge Case N = 2: liefert Grundfarbe und Komplementärfarbe (180° Abstand)", () => {
    const palette = generatePalette(base, 2);
    expect(palette).toHaveLength(2);
    const diff = normalizeHue(palette[1].hue - palette[0].hue);
    expect(diff).toBeCloseTo(180, 5);
  });

  it("Edge Case sehr hohe N: liefert weiterhin korrekte Anzahl und Verteilung", () => {
    const n = 360;
    const palette = generatePalette(base, n);
    expect(palette).toHaveLength(n);

    const expectedStep = 360 / n;
    for (let i = 1; i < palette.length; i++) {
      const diff = normalizeHue(palette[i].hue - palette[i - 1].hue);
      expect(diff).toBeCloseTo(expectedStep, 5);
    }
  });
});
