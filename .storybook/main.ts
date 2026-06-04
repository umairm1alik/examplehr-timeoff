import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'
import { mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [
        // Explicit automatic JSX transform so React never needs to be imported
        react({ jsxRuntime: 'automatic' }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '..'),
        },
      },
    })
  },
}

export default config
