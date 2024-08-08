import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  dev: {
    port: 4001,
  },
  runtime: {
    router: true,
  },
  security: {
    checkSyntax: true,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  source: {
    // downgrade @module-federation related pkgs
    include: [
      // should set module-federation in outer repo
      /universe\/packages/,
      /core\/packages/,
    ],
  },
  // source: {
  //   enableAsyncEntry: true,
  // },
  plugins: [appTools(), moduleFederationPlugin()],
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
});
