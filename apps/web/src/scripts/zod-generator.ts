import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  generates: {
    'src/lib/graphql/zod.ts': {
      schema: 'https://countries.trevorblades.com/graphql',
      plugins: ['typescript-validation-schema', 'typescript'],
      config: {
        schema: 'zod',
      },
    },
  },
};
export default config;
