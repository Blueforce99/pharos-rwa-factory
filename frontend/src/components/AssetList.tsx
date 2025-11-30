'use client'

import { useReadContract, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import AssetFactoryABI from '../abis/AssetFactory.json'
import { Users, Coins, Wallet, RefreshCw, Layers } from 'lucide-react'
import { AssetDetailsModal } from './AssetDetailsModal'; // <--- IMPORT MODAL

// ⚠️ YOUR FACTORY ADDRESS
const FACTORY_ADDRESS = '0xAa190cAAd9a5dB30Db377BD65949cE8c88377629'; // <--- Ensure this is your latest Hardened Address

// Helper ABI, no longer needed in this file, but kept for context.
const REGISTRY_PARTIAL_ABI = []

export function AssetList() {
  const { data: assets, refetch, isRefetching, error } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: AssetFactoryABI,
    functionName: 'getAssets',
  })
  
  // State for the modal
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Force refresh on load
  useEffect(() => { refetch() }, [refetch])

  return (
    <div className="space-y-6">
      {/* --- Asset Detail Modal --- */}
      {selectedAsset && (
          <AssetDetailsModal 
              asset={selectedAsset} 
              onClose={() => {
                setSelectedAsset(null);
                refetch(); // Refresh list after closing modal
              }}
          />
      )}

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Asset Overview</h1>
          <p className="text-gray-400">Manage your deployed RWA tokens and compliance.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors border border-white/10"
        >
          <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
          {isRefetching ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Assets" value={Array.isArray(assets) ? assets.length.toString() : '0'} icon={<Coins className="text-purple-400" />} />
        <StatCard title="Total Value Locked" value="$0.00" sub="(Mock Data)" icon={<Wallet className="text-green-400" />} />
        <StatCard title="Active Investors" value="1" sub="(You)" icon={<Users className="text-blue-400" />} />
      </div>

      {/* Assets Table */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold">Your Deployed Assets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Asset Name</th>
                <th className="px-6 py-4">Token Address</th>
                <th className="px-6 py-4">Registry Address</th>
                <th className="px-6 py-4">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {Array.isArray(assets) && assets.length > 0 ? (
                // @ts-ignore
                assets.map((asset: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedAsset({...asset, owner: useAccount().address})}>
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        <Layers size={16} className="text-blue-400" />
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-400">
                        {asset.tokenAddress.slice(0,6)}...{asset.tokenAddress.slice(-4)}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-400">
                        {asset.registryAddress.slice(0,6)}...{asset.registryAddress.slice(-4)}
                      </td>
                      <td className="px-6 py-4">
                          <button onClick={(e) => {e.stopPropagation(); setSelectedAsset({...asset, owner: useAccount().address})}} 
                              className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600/40"
                          >
                            Manage
                          </button>
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No assets found on this contract.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


function StatCard({ title, value, icon, sub }: any) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <h4 className="text-2xl font-bold">{value} <span className="text-xs text-gray-500 font-normal">{sub}</span></h4>
      </div>
      <div className="p-3 bg-white/5 rounded-xl">
        {icon}
      </div>
    </div>
  )
}