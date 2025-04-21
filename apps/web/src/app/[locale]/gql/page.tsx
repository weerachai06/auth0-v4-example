'use client';

import { graphql } from '@/lib/graphql/graphql';
import { useQuery } from '@urql/next';
import { useState } from 'react';
import { z } from 'zod';

const CountriesQuery = graphql(`
  query CountriesByContinent($code: ID!) {
    continent(code: $code) {
      countries {
        code
        name
        capital
        currency
        languages {
          code
          name
        }
      }
    }
  }
`);

// Form schema for the continent selector
const formSchema = z.object({
  continentCode: z.string().length(2, 'Continent code must be 2 characters'),
});

type FormValues = z.infer<typeof formSchema>;

// Sample continent data
const continents = [
  { code: 'AF', name: 'Africa' },
  { code: 'AN', name: 'Antarctica' },
  { code: 'AS', name: 'Asia' },
  { code: 'EU', name: 'Europe' },
  { code: 'NA', name: 'North America' },
  { code: 'OC', name: 'Oceania' },
  { code: 'SA', name: 'South America' },
];

export default function GqlTadaExample() {
  const [continentCode, setContinentCode] = useState<string>('EU');

  const [result] = useQuery({
    query: CountriesQuery,
    variables: { code: continentCode },
  });

  const { data, fetching, error } = result;

  const onSubmit = (data: FormValues) => {
    setContinentCode(data.continentCode);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">gql.tada Example with Countries API</h1>

      {fetching && (
        <div className="flex justify-center my-4">
          <div className="loader"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 p-4 rounded mb-4">
          <p className="text-red-700">Error: {error.message}</p>
        </div>
      )}

      {/* CSS for the loader */}
      <style jsx>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-radius: 50%;
          border-top: 3px solid #3498db;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
