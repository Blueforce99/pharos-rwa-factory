'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount, useConnect, useDisconnect } from 'wagmi'
import { config } from '../config/wagmi'
import { DeployForm } from '../components/DeployForm'
import { AssetList } from '../components/AssetList'
import { useState, useEffect } from 'react'
import { LayoutDashboard, PlusCircle, Wallet, LogOut, ShieldCheck } from 'lucide-react'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function Dashboard() {
  const { isConnected, address } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deploy'>('dashboard')
  
  // --- HYDRATION FIX START ---
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent rendering until client-side is ready
  if (!mounted) return null
  // --- HYDRATION FIX END ---

  const glassPanel = "bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"

  // 1. LOGIN SCREEN (Not Connected)
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse"></div>

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

  // 2. DASHBOARD (Connected)
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex relative overflow-hidden">
       {/* Background Ambience */}
       <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

       {/* Sidebar */}
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

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20 mb-2">
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

       {/* Main Content */}
       <main className="flex-1 p-4 h-screen overflow-y-auto">
         {activeTab === 'dashboard' ? <AssetList /> : <DeployForm onSuccess={() => setActiveTab('dashboard')} />}
       </main>
    </div>
  )
}