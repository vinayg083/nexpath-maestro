const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: 'rgb(222 229 234 / <alpha-value>)',
        },
        input: {
          DEFAULT: 'rgb(222 229 234 / <alpha-value>)',
        },
        ring: {
          DEFAULT: 'rgb(51 102 153 / <alpha-value>)',
        },
        background: {
          DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(41 56 69 / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(51 102 153 / <alpha-value>)',
          foreground: 'rgb(250 250 250 / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(243 246 248 / <alpha-value>)',
          foreground: 'rgb(41 56 69 / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(214 227 235 / <alpha-value>)',
          foreground: 'rgb(250 250 250 / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(211 69 91 / <alpha-value>)',
          foreground: 'rgb(250 250 250 / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(56 144 100 / <alpha-value>)',
          foreground: 'rgb(250 250 250 / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(217 164 31 / <alpha-value>)',
          foreground: 'rgb(41 56 69 / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(243 246 248 / <alpha-value>)',
          foreground: 'rgb(101 119 137 / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(211 69 91 / <alpha-value>)',
          foreground: 'rgb(250 250 250 / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
          foreground: 'rgb(41 56 69 / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
          foreground: 'rgb(41 56 69 / <alpha-value>)',
        },
        overlay: {
          DEFAULT: 'rgb(0 0 0 / <alpha-value>)',
        },
        notification: {
          DEFAULT: 'rgb(51 102 153 / <alpha-value>)',
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  corePlugins: {
    backgroundOpacity: true,
    textOpacity: true,
    borderOpacity: true,
    divideOpacity: true,
  },
  safelist: [
    {
      pattern:
        /^(bg|text|border|ring|outline)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    {
      pattern:
        /^(bg|text|border|ring|outline)-(primary|secondary|tertiary|destructive|success|warning|muted|accent|popover|card|background|foreground|input)(-foreground)?$/,
    },
    {
      pattern: /^(bg|text|border|ring|outline)-(transparent|current|inherit|black|white)$/,
    },
    {
      pattern:
        /^(m|p)[xytrbl]?-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
    },
    {
      pattern:
        /^(w|h|min-w|min-h|max-w|max-h)-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)$/,
    },
    {
      pattern: /^border(-[xytrbl])?-(0|2|4|8|hairline)$/,
    },
    {
      pattern: /^rounded(-[xytrbl])?(-[lr])?-(none|sm|md|lg|xl|2xl|3xl|full)$/,
    },
    {
      pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
    },
    {
      pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    },
    {
      pattern: /^leading-(none|tight|snug|normal|relaxed|loose|3|4|5|6|7|8|9|10)$/,
    },
    {
      pattern: /^tracking-(tighter|tight|normal|wide|wider|widest)$/,
    },
    {
      pattern: /^text-(left|center|right|justify|start|end)$/,
    },
    {
      pattern: /^(flex|grid|inline-flex|inline-grid|block|inline-block|inline|hidden)$/,
    },
    {
      pattern: /^flex-(row|row-reverse|col|col-reverse|wrap|wrap-reverse|nowrap)$/,
    },
    {
      pattern:
        /^(justify|items|content|self)-(start|end|center|between|around|evenly|stretch|baseline|auto)$/,
    },
    {
      pattern: /^flex-(1|auto|initial|none)$/,
    },
    {
      pattern: /^(grow|shrink)(-0)?$/,
    },
    {
      pattern: /^grid-cols-([1-9]|1[0-2]|none|subgrid)$/,
    },
    {
      pattern: /^grid-rows-([1-6]|none|subgrid)$/,
    },
    {
      pattern: /^col-span-([1-9]|1[0-2]|full)$/,
    },
    {
      pattern: /^row-span-([1-6]|full)$/,
    },
    {
      pattern: /^gap-([0-9]|1[0-6]|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
    },
    {
      pattern: /^(relative|absolute|fixed|sticky|static)$/,
    },
    {
      pattern:
        /^(top|right|bottom|left|inset)-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full)$/,
    },
    {
      pattern: /^z-([0-9]|10|20|30|40|50|auto)$/,
    },
    {
      pattern: /^opacity-([0-9]|[1-9][0-9]|100)$/,
    },
    {
      pattern: /^shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?$/,
    },
    {
      pattern:
        /^shadow-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
    },
    {
      pattern: /^(overflow|overflow-x|overflow-y)-(auto|hidden|clip|visible|scroll)$/,
    },
    'animate-spin',
    'animate-ping',
    'animate-pulse',
    'animate-bounce',
    'animate-accordion-down',
    'animate-accordion-up',
  ],
};
