/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    test: {
        // Vitest configuration options
        globals: true, // Use describe, it, expect without imports
        environment: 'node',
        include: ['src/**/*.test.ts'],
        exclude: ['tests/**/*', 'node_modules/**/*'],
    },
});
