import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
    // Vite doesn't read PORT on its own; honour the port the harness assigns.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
});
