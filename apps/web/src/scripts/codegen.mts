import { generateSchema } from '@gql.tada/cli-utils';

await generateSchema({
  input: 'https://countries.trevorblades.com/graphql',
  output: './src/gql/schema.graphql',
  headers: undefined,
  tsconfig: undefined,
});
