import { createConfig, http, custom } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { type Chain } from 'viem'

export const pharosAtlantic = {
  id: 688689, // <--- UPDATED CHAIN ID
  name: 'Pharos Atlantic Testnet',
  nativeCurrency: { name: 'Pharos', symbol: 'PHAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://atlantic.dplabs-internal.com'] },
    public: { http: ['https://atlantic.dplabs-internal.com'] },
  },
  blockExplorers: {
    default: { name: 'PharosScan', url: 'https://atlantic.pharosscan.xyz' },
  },
  testnet: true,
} as const satisfies Chain

export const config = createConfig({
  chains: [pharosAtlantic],
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [pharosAtlantic.id]: 
      typeof window !== 'undefined' && window.ethereum 
        ? custom(window.ethereum) 
        : http('https://atlantic.dplabs-internal.com'),
  },
  ssr: true,
})