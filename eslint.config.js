import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettierConfig from 'eslint-config-prettier';

const layeringMessage = (layer, forbidden) =>
  `The ${layer} layer must not depend on ${forbidden}. See docs/architecture.md.`;

const restrictedImports = (layer, forbidden, paths, patterns) => ({
  'no-restricted-imports': [
    'error',
    {
      paths: paths.map((name) => ({ name, message: layeringMessage(layer, forbidden) })),
      patterns: patterns.map((group) => ({
        group: [group],
        message: layeringMessage(layer, forbidden),
      })),
    },
  ],
});

const assertionBans = [
  {
    selector: 'TSAsExpression',
    message:
      'Type assertions are only allowed at the raw JSON validation boundary in src/infrastructure/schemas/.',
  },
  {
    selector: 'TSTypeAssertion',
    message:
      'Type assertions are only allowed at the raw JSON validation boundary in src/infrastructure/schemas/.',
  },
  {
    selector: 'TSNonNullExpression',
    message: 'Non-null assertions are banned. Narrow the value explicitly instead.',
  },
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'coverage/**',
      'node_modules/**',
      'public/**',
      'src/assets/icons/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-restricted-syntax': ['error', ...assertionBans],
      eqeqeq: ['error', 'always'],
      'no-console': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['src/infrastructure/platform/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    files: ['src/main.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['src/types/type-assertions.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
    },
  },
  {
    files: ['src/infrastructure/schemas/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: restrictedImports(
      'domain',
      'Vue, Pinia, storage or browser APIs',
      ['vue', 'pinia', 'vue-router', 'idb', 'zod'],
      [
        '**/services/**',
        '**/infrastructure/**',
        '**/stores/**',
        '**/components/**',
        '**/views/**',
        '**/composables/**',
        '**/router/**',
        '**/app/**',
      ],
    ),
  },
  {
    files: ['src/services/**/*.ts'],
    rules: restrictedImports(
      'application service',
      'Vue components, Pinia or concrete storage',
      ['vue', 'pinia', 'vue-router', 'idb'],
      [
        '**/infrastructure/**',
        '**/stores/**',
        '**/components/**',
        '**/views/**',
        '**/composables/**',
        '**/router/**',
        '**/app/**',
      ],
    ),
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: restrictedImports(
      'infrastructure',
      'domain internals or Vue components',
      ['vue', 'pinia', 'vue-router'],
      [
        '**/domain/**',
        '**/services/**',
        '**/stores/**',
        '**/components/**',
        '**/views/**',
        '**/composables/**',
        '**/router/**',
        '**/app/**',
      ],
    ),
  },
  {
    files: [
      'src/components/**/*.{ts,vue}',
      'src/views/**/*.{ts,vue}',
      'src/composables/**/*.ts',
      'src/stores/**/*.ts',
    ],
    rules: restrictedImports(
      'presentation',
      'infrastructure concretions',
      ['idb'],
      ['**/infrastructure/**'],
    ),
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] },
      ],
      'vue/no-undef-components': 'off',
      'vue/require-default-prop': 'off',
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/v-on-event-hyphenation': ['error', 'always'],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  prettierConfig,
);
