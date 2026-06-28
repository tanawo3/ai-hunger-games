import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';

export const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: {
    decimals: 18,
    name: 'RITUAL',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ritualfoundation.org'],
      webSocket: ['wss://rpc.ritualfoundation.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ritual Explorer',
      url: 'https://explorer.ritualfoundation.org',
    },
  },
});

export const config = createConfig({
  chains: [ritualChain],
  transports: {
    [ritualChain.id]: http(),
  },
});
