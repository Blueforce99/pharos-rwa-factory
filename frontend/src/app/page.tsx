'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { config, pharosAtlantic } from '../config/wagmi' 
import { DeployForm } from '../components/DeployForm'
import { AssetList } from '../components/AssetList'
import { useState, useEffect } from 'react'
import { LayoutDashboard, PlusCircle, Wallet, LogOut, ShieldCheck, Network, AlertTriangle } from 'lucide-react'
import { Toaster, toast } from 'sonner'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
        <Toaster position="bottom-right" theme="dark" richColors />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function Dashboard() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId() 
  const { switchChain, error: switchError } = useSwitchChain() 
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deploy'>('dashboard')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ⚡ AUTO-SWITCH LOGIC (Rabby Optimized)
  useEffect(() => {
    if (isConnected && chainId !== pharosAtlantic.id) {
      // We try to switch. If the chain is missing, Wagmi will auto-try adding it 
      // because we defined the full chain object in wagmi.ts
      switchChain({ chainId: pharosAtlantic.id })
    }
  }, [isConnected, chainId, switchChain])

  // Monitor Switch Errors (e.g. User Rejected)
  useEffect(() => {
    if(switchError) {
      toast.error("Network Switch Failed", {
        description: "Please switch to Pharos Atlantic manually in your wallet."
      })
    }
  }, [switchError])

  if (!mounted) return null

  const glassPanel = "bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
  const isWrongNetwork = chainId && chainId !== pharosAtlantic.id;

  // 1. NOT CONNECTED
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px] animate-pulse"></div>
        <div className={`relative z-10 p-10 rounded-2xl max-w-md w-full text-center ${glassPanel}`}>
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <ShieldCheck className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Pharos Asset Factory</h1>
          <p className="text-gray-400 mb-8">Institutional RWA Tokenization Suite</p>
          <button 
            onClick={() => connect({ connector: connectors[0] })}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25"
          >
            Connect Wallet
          </button>
        </div>
      </main>
    )
  }

  // 2. DASHBOARD
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex relative overflow-hidden">
       <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

       <aside className={`w-64 m-4 rounded-2xl flex flex-col ${glassPanel}`}>
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-blue-400" /> Pharos<span className="text-blue-400">RWA</span>
            </h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-white/5'}`}
            >
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('deploy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deploy' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-white/5'}`}
            >
              <PlusCircle size={20} /> Deploy Asset
            </button>
          </nav>

          <div className="p-4 border-t border-white/10 space-y-3">
            
            {/* NETWORK INDICATOR (With Click-to-Fix Fallback) */}
            <div 
                onClick={() => isWrongNetwork && switchChain({ chainId: pharosAtlantic.id })}
                className={`p-3 rounded-xl flex items-center gap-3 border cursor-pointer transition-all ${isWrongNetwork ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/50'}`}
            >
                {isWrongNetwork ? <AlertTriangle size={16} className="text-red-400" /> : <Network size={16} className="text-green-400" />}
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-gray-400">Network</p>
                    <p className={`text-sm font-semibold truncate ${isWrongNetwork ? "text-red-400" : "text-green-400"}`}>
                        {isWrongNetwork ? "Wrong Network (Fix)" : "Pharos Atlantic"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20">
              <Wallet size={16} className="text-gray-400"/>
              <span className="text-sm font-mono text-gray-300">{address?.slice(0,6)}...{address?.slice(-4)}</span>
            </div>
            
            <button 
              onClick={() => disconnect()}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut size={16} /> Disconnect
            </button>
          </div>
       </aside>

       <main className="flex-1 p-4 h-screen overflow-y-auto">
         {/* If Wrong Network, BLOCK the main view to force attention */}
         {isWrongNetwork ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <AlertTriangle size={64} className="text-red-400 mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold">Network Mismatch</h2>
                <p className="text-gray-400 max-w-md">
                    Rabby prevented the auto-switch. Please approve the network switch in your wallet.
                </p>
                <button 
                    onClick={() => switchChain({ chainId: pharosAtlantic.id })}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg"
                >
                    Switch to Pharos
                </button>
            </div>
         ) : (
            activeTab === 'dashboard' ? <AssetList /> : <DeployForm onSuccess={() => setActiveTab('dashboard')} />
         )}
       </main>
    </div>
  )
}