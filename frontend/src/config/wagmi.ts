import { createConfig, http, custom } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { type Chain } from 'viem'

// Define the chain with strict types
export const pharosAtlantic = {
  id: 688688,
  name: 'Pharos Atlantic Testnet',
  nativeCurrency: { name: 'Pharos', symbol: 'PHAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.pharosnetwork.xyz'] },
    public: { http: ['https://testnet.pharosnetwork.xyz'] },
  },
  blockExplorers: {
    default: { name: 'PharosScan', url: 'https://scan.pharos.network' },
  },
  testnet: true,
} as const satisfies Chain

export const config = createConfig({
  chains: [pharosAtlantic],
  connectors: [
    injected({ shimDisconnect: true }), // shimDisconnect helps with Rabby/MetaMask conflicts
  ],
  transports: {
    [pharosAtlantic.id]: 
      typeof window !== 'undefined' && window.ethereum 
        ? custom(window.ethereum) 
        : http(), 
  },
  ssr: true,
})