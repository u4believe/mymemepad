'use client';

import { configureClient, API_URL_LOCAL } from '@0xintuition/graphql';
import { WalletProvider } from './wallet-provider';

// Configure GraphQL client for local development
configureClient({
  apiUrl: API_URL_LOCAL,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}