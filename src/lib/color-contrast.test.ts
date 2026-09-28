import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, oklchToRgb, parseOklch } from '@/lib/color-contrast';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

/**
 * The value of a token in one theme, following the cascade: `:root.light` when
 * it overrides, the base `:root` otherwise. A token that is deliberately shared
 * — `--on-brand`, the fonts, the spacing — resolves to its single definition
 * rather than being reported missing.
 */
function token(name: string, theme: 'dark' | 'light'): string {
  const base = css.slice(css.indexOf(':root {'), css.indexOf(':root.light'));
  const override = css.slice(css.indexOf(':root.light'));
  const read = (block: string) =>
    block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();

  const value = theme === 'light' ? (read(override) ?? read(base)) : read(base);
  assert.ok(value, `${name} is not defined for ${theme}`);
  return value;
}

function rgbOf(name: string, theme: 'dark' | 'light') {
  const value = token(name, theme);
  const parsed = parseOklch(value);
  assert.ok(parsed, `${name} (${theme}) is not an oklch colour: ${value}`);
  return parsed;
}

test('the conversion agrees with known sRGB anchors', () => {
  // White and black are the two values a wrong matrix gets wrong first.
  assert.deepEqual(oklchToRgb(1, 0, 0), { r: 255, g: 255, b: 255 });
  assert.deepEqual(oklchToRgb(0, 0, 0), { r: 0, g: 0, b: 0 });
  assert.equal(
    contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 }).toFixed(0),
    '21',
  );
});

test('the primary button is legible in BOTH themes', () => {
  for (const selector of ['.btn--primary', '.btn--primary:hover']) {
    const rule = css.match(
      new RegExp(selector.replaceAll('.', '\\.') + '\\s*\\{([^}]*)\\}'),
    );
    assert.ok(rule, `missing ${selector}`);
    const inkToken = rule[1]!.match(
      /(?:^|[;\n])\s*color:\s*var\((--[a-z0-9-]+)\)/,
    )?.[1];
    const faceToken = rule[1]!.match(
      /background:\s*var\((--[a-z0-9-]+)\)/,
    )?.[1];
    assert.ok(inkToken && faceToken, `${selector} must use colour tokens`);
    for (const theme of ['dark', 'light'] as const) {
      const ratio = contrastRatio(
        rgbOf(inkToken, theme),
        rgbOf(faceToken, theme),
      );
      assert.ok(ratio >= 4.5, `${selector} in ${theme}: ${ratio.toFixed(2)}:1`);
    }
  }
});

test('body text clears AA against its own background, in both themes', () => {
  for (const theme of ['dark', 'light'] as const) {
    const bg = rgbOf('--bg-0', theme);
    // --fg-4 is the faintest text the palette offers; if it passes, all do.
    for (const fg of [
      '--fg-0',
      '--fg-1',
      '--fg-2',
      '--fg-3',
      '--fg-4',
    ] as const) {
      const ratio = contrastRatio(rgbOf(fg, theme), bg);
      assert.ok(
        ratio >= 4.5,
        `${fg} on --bg-0 in ${theme} is ${ratio.toFixed(2)}:1`,
      );
    }
  }
});

test('every accent reads against the surface it is painted on', () => {
  // --brand/--amber/--mint/--peri/--rose are used as TEXT on their own tinted --*-bg.
  for (const theme of ['dark', 'light'] as const) {
    for (const hue of ['brand', 'amber', 'mint', 'peri', 'rose'] as const) {
      const ratio = contrastRatio(
        rgbOf(`--${hue}`, theme),
        rgbOf(`--${hue}-bg`, theme),
      );
      assert.ok(
        ratio >= 4.5,
        `--${hue} on --${hue}-bg in ${theme} is ${ratio.toFixed(2)}:1, below the 4.5:1 minimum`,
      );
    }
  }
});

test('identity initials read on neutral tiles and the dark rail in both themes', () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const hue of ['amber', 'mint', 'peri', 'rose'] as const) {
      for (const [ink, face] of [
        [`--${hue}`, '--bg-2'],
        [`--sidebar-${hue}`, '--sidebar-active'],
      ]) {
        const ratio = contrastRatio(rgbOf(ink, theme), rgbOf(face, theme));
        assert.ok(
          ratio >= 4.5,
          `${ink} on ${face} in ${theme}: ${ratio.toFixed(2)}:1`,
        );
      }
    }
  }
});

test('brand text and the ink on a solid brand face read in both themes', () => {
  // --brand is the link colour on the page ground and on white cards, and a
  // checked box paints --on-brand-solid on a solid --brand face.
  for (const theme of ['dark', 'light'] as const) {
    const brand = rgbOf('--brand', theme);
    for (const [label, other] of [
      ['--bg-0', rgbOf('--bg-0', theme)],
      ['--bg-1', rgbOf('--bg-1', theme)],
      ['--on-brand-solid', rgbOf('--on-brand-solid', theme)],
    ] as const) {
      const ratio = contrastRatio(brand, other);
      assert.ok(
        ratio >= 4.5,
        `--brand against ${label} in ${theme} is ${ratio.toFixed(2)}:1`,
      );
    }
  }
});
