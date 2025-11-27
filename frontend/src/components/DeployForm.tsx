'use client'
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import AssetFactoryABI from '../abis/AssetFactory.json'
import { Rocket, Loader2, ExternalLink, CheckCircle } from 'lucide-react'

// ⚠️ REPLACE THIS WITH YOUR LATEST DEPLOYED ADDRESS FROM REMIX
const FACTORY_ADDRESS = '0x741cDEe12E86d855D89447928746B3B289A048FA'; 

export function DeployForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: hash, writeContract, isPending } = useWriteContract()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [supply, setSupply] = useState('')

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Auto-redirect when confirmed
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => onSuccess(), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onSuccess])

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !symbol || !supply) return
    
    writeContract({
      address: FACTORY_ADDRESS,
      abi: AssetFactoryABI,
      functionName: 'deployRWA',
      args: [name, symbol, BigInt(supply)],
    })
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Rocket className="text-blue-400" /> Launch New Asset
            </h2>
            <p className="text-gray-400 mt-2">Deploy an ERC-3643 Compliant RWA Token on Pharos.</p>
        </div>
      
        {!hash ? (
            /* 1. INPUT FORM */
            <form onSubmit={handleDeploy} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Asset Name</label>
                        <input type="text" placeholder="e.g. Solar Farm 1" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ticker Symbol</label>
                        <input type="text" placeholder="e.g. SOLAR" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Initial Supply</label>
                    <input type="number" placeholder="1000000" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500" value={supply} onChange={(e) => setSupply(e.target.value)} />
                </div>
                <button disabled={isPending} type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                    {isPending ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                    {isPending ? 'Check Wallet...' : 'Deploy Asset'}
                </button>
            </form>
        ) : (
            /* 2. LOADING / SUCCESS STATE */
            <div className="text-center py-8 space-y-4">
                {isSuccess ? (
                    <div className="text-green-400 flex flex-col items-center animate-bounce">
                        <CheckCircle size={48} className="mb-2" />
                        <h3 className="text-xl font-bold">Deployment Complete!</h3>
                    </div>
                ) : (
                    <div className="text-blue-400 flex flex-col items-center">
                        <Loader2 size={48} className="mb-2 animate-spin" />
                        <h3 className="text-xl font-bold">Deploying to Pharos...</h3>
                        <p className="text-sm text-gray-400">Waiting for block confirmation</p>
                    </div>
                )}

                <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-400 break-all border border-white/10">
                    Tx: {hash}
                </div>

                <div className="flex gap-3 justify-center pt-4">
                    <a href={`https://scan.pharos.network/tx/${hash}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <ExternalLink size={16} /> View on Explorer
                    </a>
                    {/* MANUAL OVERRIDE BUTTON */}
                    <button onClick={onSuccess} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-600/30 transition-colors">
                        Go to Dashboard &rarr;
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}