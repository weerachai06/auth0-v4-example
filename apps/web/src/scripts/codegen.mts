import { generateOutput, generateSchema } from '@gql.tada/cli-utils';

await generateSchema({
  input: 'https://countries.trevorblades.com/graphql',
  output: './src/lib/graphql/schema.graphql',
  headers: undefined,
  tsconfig: undefined,
});

await generateOutput({
  output: './src/lib/graphql/graphql-env.d.ts',
  disablePreprocessing: false,
  tsconfig: undefined,
});
