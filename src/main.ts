import "./style.css";
import {
  clamp,
  generatePalette,
  hexToRgb,
  hslToRgb,
  normalizeHue,
  rgbToCss,
  rgbToHex,
  rgbToHsl,
  type Hsl,
} from "./colors";

interface State {
  h: number;
  s: number;
  l: number;
  a: number;
  count: number;
}

const state: State = { h: 210, s: 70, l: 55, a: 1, count: 5 };

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div class="app">
    <header>
      <h1>Farbraum</h1>
      <p>Wähle eine Grundfarbe und erhalte automatisch eine harmonische Farbpalette.</p>
    </header>
    <main class="layout">
      <section class="picker">
        <div class="wheel-wrap">
          <canvas id="wheel" width="260" height="260"></canvas>
          <div id="wheel-handle" class="handle"></div>
        </div>
        <div class="lightness-row">
          <label for="lightness">Helligkeit</label>
          <input type="range" id="lightness" min="0" max="100" value="55" />
        </div>
        <div class="fields">
          <label>R <input type="number" id="field-r" min="0" max="255" /></label>
          <label>G <input type="number" id="field-g" min="0" max="255" /></label>
          <label>B <input type="number" id="field-b" min="0" max="255" /></label>
          <label>Alpha <input type="number" id="field-a" min="0" max="1" step="0.01" /></label>
        </div>
        <div class="fields hex-row">
          <label>Hex <input type="text" id="field-hex" maxlength="7" /></label>
        </div>
        <div class="preview">
          <div class="preview-fill" id="preview-fill"></div>
        </div>
      </section>
      <div>
        <section class="palette-controls">
          <label for="count">Anzahl Farben</label>
          <div class="count-controls">
            <input type="range" id="count" min="2" max="12" value="5" />
            <input
              type="number"
              id="count-input"
              min="2"
              max="12"
              step="1"
              value="5"
              aria-label="Anzahl Farben (manuelle Eingabe)"
            />
          </div>
        </section>
        <section class="palette" id="palette"></section>
      </div>
    </main>
    <footer>Klicke auf Hex- oder RGB-Code, um ihn in die Zwischenablage zu kopieren.</footer>
  </div>
`;

const wheelCanvas = document.querySelector<HTMLCanvasElement>("#wheel")!;
const wheelHandle = document.querySelector<HTMLDivElement>("#wheel-handle")!;
const lightnessInput = document.querySelector<HTMLInputElement>("#lightness")!;
const fieldR = document.querySelector<HTMLInputElement>("#field-r")!;
const fieldG = document.querySelector<HTMLInputElement>("#field-g")!;
const fieldB = document.querySelector<HTMLInputElement>("#field-b")!;
const fieldA = document.querySelector<HTMLInputElement>("#field-a")!;
const fieldHex = document.querySelector<HTMLInputElement>("#field-hex")!;
const previewFill = document.querySelector<HTMLDivElement>("#preview-fill")!;
const countInput = document.querySelector<HTMLInputElement>("#count")!;
const countNumberInput = document.querySelector<HTMLInputElement>("#count-input")!;
const paletteEl = document.querySelector<HTMLDivElement>("#palette")!;

const COUNT_MIN = Number(countInput.min);
const COUNT_MAX = Number(countInput.max);

const wheelCtx = wheelCanvas.getContext("2d")!;
const wheelRadius = wheelCanvas.width / 2;

function drawWheel(): void {
  const image = wheelCtx.createImageData(wheelCanvas.width, wheelCanvas.height);
  const cx = wheelRadius;
  const cy = wheelRadius;

  for (let y = 0; y < wheelCanvas.height; y++) {
    for (let x = 0; x < wheelCanvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * wheelCanvas.width + x) * 4;

      if (dist > wheelRadius) {
        image.data[idx + 3] = 0;
        continue;
      }

      const angle = normalizeHue((Math.atan2(dy, dx) * 180) / Math.PI);
      const saturation = clamp((dist / wheelRadius) * 100, 0, 100);
      const { r, g, b } = hslToRgb({ h: angle, s: saturation, l: 50 });

      image.data[idx] = r;
      image.data[idx + 1] = g;
      image.data[idx + 2] = b;
      image.data[idx + 3] = 255;
    }
  }

  wheelCtx.putImageData(image, 0, 0);
}

function currentHsl(): Hsl {
  return { h: state.h, s: state.s, l: state.l };
}

function setFromHsl(hsl: Hsl, alpha = state.a): void {
  state.h = normalizeHue(hsl.h);
  state.s = clamp(hsl.s, 0, 100);
  state.l = clamp(hsl.l, 0, 100);
  state.a = clamp(alpha, 0, 1);
  render();
}

function setFromRgb(r: number, g: number, b: number, alpha = state.a): void {
  const hsl = rgbToHsl({ r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) });
  setFromHsl(hsl, alpha);
}

function updateWheelHandle(): void {
  const angleRad = (state.h * Math.PI) / 180;
  const radius = (state.s / 100) * wheelRadius;
  const x = wheelRadius + radius * Math.cos(angleRad);
  const y = wheelRadius + radius * Math.sin(angleRad);
  wheelHandle.style.left = `${x}px`;
  wheelHandle.style.top = `${y}px`;
}

function render(): void {
  const rgb = hslToRgb(currentHsl());
  const hex = rgbToHex(rgb);

  fieldR.value = String(rgb.r);
  fieldG.value = String(rgb.g);
  fieldB.value = String(rgb.b);
  fieldA.value = state.a.toFixed(2);
  fieldHex.value = hex;

  lightnessInput.value = String(Math.round(state.l));
  const hueRgbLow = rgbToHex(hslToRgb({ h: state.h, s: state.s, l: 0 }));
  const hueRgbMid = rgbToHex(hslToRgb({ h: state.h, s: state.s, l: 50 }));
  const hueRgbHigh = rgbToHex(hslToRgb({ h: state.h, s: state.s, l: 100 }));
  lightnessInput.style.background = `linear-gradient(to right, ${hueRgbLow}, ${hueRgbMid}, ${hueRgbHigh})`;

  previewFill.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${state.a})`;

  updateWheelHandle();
  renderPalette();
}

function renderPalette(): void {
  const palette = generatePalette(currentHsl(), state.count);
  paletteEl.innerHTML = "";

  for (const color of palette) {
    const card = document.createElement("div");
    card.className = "swatch";

    const swatchColor = document.createElement("div");
    swatchColor.className = "swatch-color";
    swatchColor.style.backgroundColor = color.hex;

    const info = document.createElement("div");
    info.className = "swatch-info";

    const hexButton = document.createElement("button");
    hexButton.className = "swatch-code";
    hexButton.type = "button";
    hexButton.textContent = color.hex;
    hexButton.addEventListener("click", () => copyToClipboard(color.hex, hexButton));

    const rgbCss = rgbToCss(color.rgb);
    const rgbButton = document.createElement("button");
    rgbButton.className = "swatch-code";
    rgbButton.type = "button";
    rgbButton.textContent = rgbCss;
    rgbButton.addEventListener("click", () => copyToClipboard(rgbCss, rgbButton));

    info.append(hexButton, rgbButton);
    card.append(swatchColor, info);
    paletteEl.append(card);
  }
}

function copyToClipboard(text: string, trigger: HTMLElement): void {
  const done = () => {
    trigger.classList.add("copied");
    window.setTimeout(() => trigger.classList.remove("copied"), 1200);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(done);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    done();
  }
}

function pickFromWheelEvent(event: PointerEvent): void {
  const rect = wheelCanvas.getBoundingClientRect();
  const scaleX = wheelCanvas.width / rect.width;
  const scaleY = wheelCanvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX - wheelRadius;
  const y = (event.clientY - rect.top) * scaleY - wheelRadius;

  const dist = Math.min(Math.sqrt(x * x + y * y), wheelRadius);
  const angle = normalizeHue((Math.atan2(y, x) * 180) / Math.PI);
  const saturation = (dist / wheelRadius) * 100;

  setFromHsl({ h: angle, s: saturation, l: state.l });
}

let dragging = false;
wheelCanvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  wheelCanvas.setPointerCapture(event.pointerId);
  pickFromWheelEvent(event);
});
wheelCanvas.addEventListener("pointermove", (event) => {
  if (dragging) pickFromWheelEvent(event);
});
wheelCanvas.addEventListener("pointerup", () => {
  dragging = false;
});

lightnessInput.addEventListener("input", () => {
  setFromHsl({ h: state.h, s: state.s, l: Number(lightnessInput.value) });
});

function readRgbFields(): void {
  setFromRgb(Number(fieldR.value), Number(fieldG.value), Number(fieldB.value));
}
fieldR.addEventListener("change", readRgbFields);
fieldG.addEventListener("change", readRgbFields);
fieldB.addEventListener("change", readRgbFields);

fieldA.addEventListener("change", () => {
  state.a = clamp(Number(fieldA.value), 0, 1);
  render();
});

fieldHex.addEventListener("change", () => {
  try {
    const rgb = hexToRgb(fieldHex.value);
    setFromRgb(rgb.r, rgb.g, rgb.b);
  } catch {
    fieldHex.value = rgbToHex(hslToRgb(currentHsl()));
  }
});

function applyCount(value: number): void {
  state.count = clamp(Math.round(value), COUNT_MIN, COUNT_MAX);
  countInput.value = String(state.count);
  countNumberInput.value = String(state.count);
  countNumberInput.classList.remove("invalid");
  renderPalette();
}

countInput.addEventListener("input", () => {
  applyCount(Number(countInput.value));
});

countNumberInput.addEventListener("input", () => {
  const raw = countNumberInput.value;
  const value = Number(raw);

  if (raw.trim() === "" || Number.isNaN(value)) {
    countNumberInput.classList.add("invalid");
    return;
  }

  countNumberInput.classList.remove("invalid");
  state.count = clamp(Math.round(value), COUNT_MIN, COUNT_MAX);
  countInput.value = String(state.count);
  renderPalette();
});

countNumberInput.addEventListener("change", () => {
  const value = Number(countNumberInput.value);
  applyCount(Number.isNaN(value) ? state.count : value);
});

drawWheel();
applyCount(state.count);
render();
