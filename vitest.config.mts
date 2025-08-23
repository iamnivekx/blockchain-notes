import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // you can use a list of glob patterns to define your projects
      // Vitest expects a list of config files
      // or directories where there is a config file
      'packages/*',
      'tests/*/vitest.config.{e2e,unit}.ts',
      // you can even run the same tests,
      // but with different configs in the same "vitest" process
      {
        test: {
          name: 'node',
          root: './examples',
          environment: 'node',
          include: ['**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', 'website'],
        },
      },
    ],
  },
});
