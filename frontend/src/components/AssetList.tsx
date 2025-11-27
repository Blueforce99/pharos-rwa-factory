'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { parseEther } from 'viem' // <--- IMPORT THIS FOR DECIMALS
import AssetFactoryABI from '../abis/AssetFactory.json'
import ERC20ABI from '../abis/ERC20.json'
import { Users, Coins, Wallet, RefreshCw, CheckCircle, ShieldCheck, Send, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

//⚠️ YOUR FACTORY ADDRESS
const FACTORY_ADDRESS = '0xAa190cAAd9a5dB30Db377BD65949cE8c88377629'; // <--- Ensure this is your latest Hardened Address

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

  // Force refresh on load
  useEffect(() => { refetch() }, [])

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
                    <AssetRow key={idx} asset={asset} />
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

function AssetRow({ asset }: { asset: any }) {
  const [investorAddress, setInvestorAddress] = useState('')
  const [amount, setAmount] = useState('')

  // --- WHITELIST LOGIC ---
  const { data: wlHash, writeContract: writeWhitelist, isPending: isWlSubmitPending } = useWriteContract()
  
  const { isLoading: isWlConfirming, isSuccess: isWlSuccess } = useWaitForTransactionReceipt({ 
    hash: wlHash 
  })

  // Watch Whitelist Status
  useEffect(() => {
    if (isWlSuccess) {
        toast.success("Investor Whitelisted!", { description: "Compliance Check Passed." })
    }
  }, [isWlSuccess])


  // --- TRANSFER LOGIC ---
  const { data: txHash, writeContract: writeTransfer, isPending: isTxSubmitPending, error: txError } = useWriteContract()

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess, status: txStatus } = useWaitForTransactionReceipt({ 
    hash: txHash 
  })

  // Watch Transfer Status (This fixes the "False Success" issue)
  useEffect(() => {
    if (isTxSuccess) {
        toast.success("Transfer Complete!", { description: `Sent ${amount} tokens to investor.` });
        setAmount('');
    }
    // If status is 'reverted' (compliance blocked), showing error
    if (txStatus === 'reverted') {
        toast.error("Transaction Reverted", { description: "Compliance Check Failed on-chain." });
    }
  }, [isTxSuccess, txStatus, amount])

  // Watch Immediate Submission Errors (e.g. User rejects wallet)
  useEffect(() => {
    if (txError) {
        const msg = txError.message;
        if (msg.includes("Pharos Compliance") || msg.includes("Receiver not verified")) {
             toast.error("Compliance Blocked!", { description: "⛔ User is not whitelisted!" });
        } else {
             toast.error("Submission Failed", { description: "User rejected or simulation failed." });
        }
    }
  }, [txError])


  const handleWhitelist = () => {
    if(!investorAddress) return toast.warning("Enter an address");
    writeWhitelist({
      address: asset.registryAddress,
      abi: REGISTRY_PARTIAL_ABI,
      functionName: 'register',
      args: [investorAddress],
    })
  }

  const handleTransfer = () => {
    if(!investorAddress || !amount) return toast.warning("Enter address and amount");
    
    // FIX 2: Use parseEther to convert "2000" to "2000000000000000000000"
    try {
        const valueInWei = parseEther(amount); 
        writeTransfer({
          address: asset.tokenAddress,
          abi: ERC20ABI,
          functionName: 'transfer',
          args: [investorAddress, valueInWei], 
        })
    } catch (e) {
        toast.error("Invalid Amount", { description: "Please enter a valid number." });
    }
  }

  const isWlLoading = isWlSubmitPending || isWlConfirming;
  const isTxLoading = isTxSubmitPending || isTxConfirming;

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-6 py-4 font-medium">{asset.name}</td>
      <td className="px-6 py-4 text-sm font-mono text-gray-400">
        <div className="flex items-center gap-1">
            {asset.tokenAddress.slice(0,6)}...{asset.tokenAddress.slice(-4)}
            <CopyButton text={asset.tokenAddress} />
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-mono text-gray-400">
        {asset.registryAddress.slice(0,6)}...{asset.registryAddress.slice(-4)}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
           {/* Input Row */}
           <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="0x... Investor" 
                    className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500 w-32 text-white"
                    value={investorAddress}
                    onChange={(e) => setInvestorAddress(e.target.value)}
                />
                <input 
                    type="number" 
                    placeholder="Amount" 
                    className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500 w-20 text-white"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
           </div>

           {/* Button Row */}
           <div className="flex gap-2">
                <button 
                    onClick={handleWhitelist}
                    disabled={isWlLoading}
                    className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors border border-green-500/20 disabled:opacity-50"
                >
                    {isWlLoading ? <Loader2 size={12} className="animate-spin"/> : <ShieldCheck size={12}/>}
                    {isWlLoading ? 'Processing...' : 'Whitelist'}
                </button>
                <button 
                    onClick={handleTransfer}
                    disabled={isTxLoading}
                    className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors border border-blue-500/20 disabled:opacity-50"
                >
                    {isTxLoading ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                    {isTxLoading ? 'Sending...' : 'Transfer'}
                </button>
           </div>
        </div>
      </td>
    </tr>
  )
}

function CopyButton({ text }: { text: string }) {
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied!"); }} className="text-gray-600 hover:text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
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