module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './src/**/**/*.{html,ts}',
    './src/**/**/**/*.{html,ts}',
    './src/**/**/**/**/*.{html,ts}'
  ],
  darkMode: 'class',
  theme: {
    colors: {
      lime: require('tailwindcss/colors').lime,
      white: require('tailwindcss/colors').white,
      gray: require('tailwindcss/colors').gray,
      black: require('tailwindcss/colors').black,
      transparent: 'transparent',
      current: 'currentColor',
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        'blue': {
          "primary": "#3B3DBF",
          // "primary": "#1d4ed8",
          "secondary": "#DF1995",
          "accent": "#37CDBE",
          "neutral": "#2A2E37",
          "base-100": "#3D4451",
          "base-200": "#f1f4f5",
          "base-300": "#eae9ee",
          "info": "#00AED6",
          "success": "#00AA13",
          "warning": "#FBBD23",
          "error": "#EE2737",
          // 'primary': '#1D4ED8',
          // 'primary-focus': '#1E40AF',
          // 'primary-content': '#ffffff',
          // 'secondary': '#1D4ED8',
          // 'secondary-focus': '#1E40AF',
          // 'secondary-content': '#ffffff',
          // 'accent': '#6366F1',
          // 'accent-focus': '#4F46E5',
          // 'accent-content': '#ffffff',
          // 'neutral': '#111827',
          // 'neutral-focus': '#000000',
          // 'neutral-content': '#ffffff',
          // 'base-100': '#F3F4F6',
          // 'base-200': '#D1D5DB',
          // 'base-300': '#6B7280',
          // 'base-content': '#000000',
          // 'info': '#0EA5E9',
          // 'success': '#10B981',
          // 'warning': '#EAB308',
          // 'error': '#F43F5E',
        }
      }
    ]
  }
}
