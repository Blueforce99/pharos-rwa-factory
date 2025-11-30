'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { parseEther } from 'viem'
import ERC20ABI from '../abis/ERC20.json'
import { CheckCircle, ShieldCheck, Send, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

// Helper ABI for just the Registry 'register' function
const REGISTRY_PARTIAL_ABI = [
  {
    "inputs": [{"internalType": "address","name": "_user","type": "address"}],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

interface Asset {
    tokenAddress: string;
    registryAddress: string;
    name: string;
    owner: string; // <-- FIX: ADDED OWNER PROPERTY
}

interface AssetDetailsModalProps {
    asset: Asset;
    onClose: () => void;
}

export function AssetDetailsModal({ asset, onClose }: AssetDetailsModalProps) {
    const { address: userAddress } = useAccount(); // Get the actual connected address for balance
    const [investorAddress, setInvestorAddress] = useState('');
    const [amount, setAmount] = useState('');

    // --- READ BALANCE LOGIC ---
    const { data: userBalance, refetch: refetchBalance } = useReadContract({
        address: asset.tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        // FIX: Use the connected user's address for their balance
        args: [userAddress as `0x${string}`], 
        query: { enabled: !!userAddress }
    });
    
    // Convert balance from BigInt/Wei to number/token
    const displayBalance = userBalance ? Number(userBalance) / (10 ** 18) : 0;
    
    // --- WHITELIST LOGIC ---
    const { data: wlHash, writeContract: writeWhitelist, isPending: isWlSubmitPending } = useWriteContract()
    const { isLoading: isWlConfirming, isSuccess: isWlSuccess } = useWaitForTransactionReceipt({ hash: wlHash })

    useEffect(() => {
        if (isWlSuccess) {
            toast.success("Investor Whitelisted!", { description: "Compliance Check Passed." })
        }
    }, [isWlSuccess])


    // --- TRANSFER LOGIC ---
    const { data: txHash, writeContract: writeTransfer, isPending: isTxSubmitPending, error: txError } = useWriteContract()
    const { data: receipt, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

    useEffect(() => {
        if (isTxConfirmed && receipt) {
            if (receipt.status === 'success') {
                toast.success("Transfer Complete!", { description: `Sent ${amount} tokens to investor.` });
                setAmount('');
                refetchBalance(); // Refetch balance after success
            } else if (receipt.status === 'reverted') {
                toast.error("Compliance Blocked!", { description: "⛔ TRANSFER BLOCKED: Execution failed on-chain." });
            }
        }
    }, [isTxConfirmed, receipt, amount, refetchBalance])
    
    useEffect(() => {
        if (txError) {
             const msg = txError.message;
             if (msg.includes("Pharos Compliance") || msg.includes("Receiver not verified")) {
                 toast.error("Compliance Blocked!", { description: "⛔ TRANSFER BLOCKED: User is not whitelisted!" });
             } else {
                 toast.error("Submission Failed", { description: "User rejected or simulation failed." });
             }
        }
    }, [txError])


    const handleWhitelist = () => {
      if(!investorAddress) return toast.warning("Enter an address");
      writeWhitelist({
        address: asset.registryAddress as `0x${string}`,
        abi: REGISTRY_PARTIAL_ABI,
        functionName: 'register',
        args: [investorAddress as `0x${string}`],
      })
    }

    const handleTransfer = () => {
      if(!investorAddress || !amount) return toast.warning("Enter address and amount");
      try {
          const valueInWei = parseEther(amount); 
          writeTransfer({
            address: asset.tokenAddress as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'transfer',
            args: [investorAddress as `0x${string}`, valueInWei], 
          })
      } catch (e) {
          toast.error("Invalid Amount", { description: "Please enter a valid number." });
      }
    }
    
    const isWlLoading = isWlSubmitPending || isWlConfirming;
    const isTxLoading = isTxSubmitPending || isTxConfirmed; // Use isTxConfirmed for final loading state

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#1e293b] p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-white/20">
                <header className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-blue-400">{asset.name} Command Center</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </header>

                <div className="space-y-6">
                    {/* ASSET OVERVIEW */}
                    <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl">
                        <div className="flex-1">
                            <p className="text-xs text-gray-400">Your Current Balance</p>
                            <h3 className="text-3xl font-extrabold text-white">
                                {displayBalance.toLocaleString()} <span className="text-base text-blue-400">{asset.name.slice(0, 3).toUpperCase()}</span>
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Token Address</p>
                            <p className="font-mono text-sm">{asset.tokenAddress.slice(0, 8)}...{asset.tokenAddress.slice(-6)}</p>
                            <a href={`https://atlantic.pharosscan.xyz/address/${asset.tokenAddress}`} target="_blank" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View Explorer</a>
                        </div>
                    </div>

                    {/* MANAGEMENT CONTROLS */}
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-300 mb-4">Distribution & Compliance</h3>
                        <div className="space-y-3">
                            {/* Input Row */}
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Investor Address (0x...)" 
                                    className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full"
                                    value={investorAddress}
                                    onChange={(e) => setInvestorAddress(e.target.value)}
                                />
                            </div>

                            {/* Amount and Actions Row */}
                            <div className="flex gap-2 items-stretch">
                                <input 
                                    type="number" 
                                    placeholder="Transfer Amount" 
                                    className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-1/3"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                
                                <button 
                                    onClick={handleWhitelist}
                                    disabled={isWlLoading || isTxLoading}
                                    className="w-1/3 bg-green-600/30 text-green-400 hover:bg-green-600/40 px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isWlLoading ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>}
                                    Whitelist
                                </button>
                                <button 
                                    onClick={handleTransfer}
                                    disabled={isTxLoading || isWlLoading}
                                    className="w-1/3 bg-blue-600/30 text-blue-400 hover:bg-blue-600/40 px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isTxLoading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                    Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}