'use client';

import { JSX } from 'react';
import { ExampleComponent } from '@/components/ExampleComponent';

export default function Home(): JSX.Element {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">App</h1>
      <div className="mt-8">
        <ExampleComponent />
      </div>
    </main>
  );
}
