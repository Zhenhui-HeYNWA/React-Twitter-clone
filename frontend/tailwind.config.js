import daisyui from 'daisyui';
import daisyUIThemes from 'daisyui/src/theming/themes';
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      height: {
        150: '32rem',
      },
      width: {
        100: '26rem',
      },
      maxHeight: {
        128: '32rem',
      },
    },
  },
  plugins: [daisyui],

  daisyui: {
    themes: [
      'light',
      {
        black: {
          ...daisyUIThemes['dark'],
          primary: 'rgb(29, 155, 240)',
          secondary: 'rgb(24, 24, 24)',
        },
      },
    ],
  },
};
