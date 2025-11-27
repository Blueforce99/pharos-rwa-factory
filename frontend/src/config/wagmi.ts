import { createConfig, http, custom } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const pharosAtlantic = {
  id: 688688, // <--- Correct Chain ID for Public Atlantic Testnet
  name: 'Pharos Atlantic',
  nativeCurrency: { name: 'Pharos', symbol: 'PHAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.pharosnetwork.xyz'] }, // <--- Public RPC
  },
  blockExplorers: {
    default: { name: 'PharosScan', url: 'https://scan.pharos.network' },
  },
} as const

export const config = createConfig({
  chains: [pharosAtlantic],
  connectors: [injected()],
  transports: {
    [pharosAtlantic.id]: 
      // Use Wallet Connection if available (Best for preventing RPC errors)
      typeof window !== 'undefined' && window.ethereum 
        ? custom(window.ethereum) 
        : http(), 
  },
  ssr: true,
})