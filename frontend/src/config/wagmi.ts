import { createConfig, http, custom } from 'wagmi'
import { injected } from 'wagmi/connectors'

// 1. DEFINING THE NETWORK
export const pharosAtlantic = {
  id: 688688, // Pharos Public Testnet ID
  name: 'Pharos Atlantic',
  nativeCurrency: { name: 'Pharos', symbol: 'PHAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.pharosnetwork.xyz'] },
  },
  blockExplorers: {
    default: { name: 'PharosScan', url: 'https://scan.pharos.network' },
  },
} as const

// 2. EXPORTING CONFIG
export const config = createConfig({
  chains: [pharosAtlantic],
  connectors: [injected()],
  transports: {
    [pharosAtlantic.id]: 
      typeof window !== 'undefined' && window.ethereum 
        ? custom(window.ethereum) 
        : http(), 
  },
  ssr: true,
})