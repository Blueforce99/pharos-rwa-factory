'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { useState, useEffect } from 'react'
import AssetFactoryABI from '../abis/AssetFactory.json'
import { Users, Coins, Wallet, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react'

//⚠️ REPLACE THIS WITH YOUR LATEST DEPLOYED ADDRESS FROM REMIX
const FACTORY_ADDRESS = '0xAa190cAAd9a5dB30Db377BD65949cE8c88377629';

const REGISTRY_PARTIAL_ABI = [
  {
    "inputs": [{"internalType": "address","name": "_user","type": "address"}],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export function AssetList() {
  const { data: assets, refetch, isRefetching, error } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: AssetFactoryABI,
    functionName: 'getAssets',
  })

  // DEBUGGING: Open your Browser Console (F12) to see this
  useEffect(() => {
    if(assets) console.log("✅ Data Loaded:", assets);
    if(error) console.error("❌ Fetch Error:", error);
  }, [assets, error]);

  return (
    <div className="space-y-6">
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

      {/* Error Message Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
            Error loading assets. Check console (F12) for details. <br/>
            Make sure your FACTORY_ADDRESS matches your deployment.
        </div>
      )}

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
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {/* Check if assets exists and has length */}
              {Array.isArray(assets) && assets.length > 0 ? (
                // @ts-ignore
                assets.map((asset: any, idx: number) => (
                    <AssetRow key={idx} asset={asset} />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No assets found on this contract.<br/>
                    <span className="text-xs text-gray-600">Contract: {FACTORY_ADDRESS}</span>
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

function AssetRow({ asset }: { asset: any }) {
  const [investorAddress, setInvestorAddress] = useState('')
  const { writeContract, isPending, isSuccess } = useWriteContract()

  const handleWhitelist = () => {
    if(!investorAddress) return;
    writeContract({
      address: asset.registryAddress,
      abi: REGISTRY_PARTIAL_ABI,
      functionName: 'register',
      args: [investorAddress],
    })
  }

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-6 py-4 font-medium">{asset.name}</td>
      <td className="px-6 py-4 text-sm font-mono text-gray-400">
        {asset.tokenAddress.slice(0,6)}...{asset.tokenAddress.slice(-4)}
      </td>
      <td className="px-6 py-4 text-sm font-mono text-gray-400">
        {asset.registryAddress.slice(0,6)}...{asset.registryAddress.slice(-4)}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
           <input 
             type="text" 
             placeholder="0x... Investor" 
             className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500 w-32 text-white"
             value={investorAddress}
             onChange={(e) => setInvestorAddress(e.target.value)}
           />
           <button 
             onClick={handleWhitelist}
             disabled={isPending}
             className="bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors"
           >
             {isSuccess ? <CheckCircle size={14}/> : <ShieldCheck size={14}/>}
           </button>
        </div>
      </td>
    </tr>
  )
}