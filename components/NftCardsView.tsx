'use client'

import { useState, useEffect } from 'react'
import { Gift, Sparkles, Send, Eye, Check, X, ShieldCheck } from 'lucide-react'
import { getNftCards, redeemNftCard, transferNftCard, type NftGiftCard } from '@/lib/api'

export function NftCardsView({ address }: { address?: string }) {
  const [cards, setCards] = useState<NftGiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [transferModalCard, setTransferModalCard] = useState<NftGiftCard | null>(null)
  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [revealedCode, setRevealedCode] = useState<{ tokenId: string; code: string } | null>(null)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    loadCards()
  }, [address])

  function loadCards() {
    if (!address) return
    getNftCards(address)
      .then((data) => setCards(data.cards))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }

  async function handleRedeem(card: NftGiftCard) {
    if (!address) return
    try {
      const res = await redeemNftCard(card.tokenId, address)
      setRevealedCode({ tokenId: card.tokenId, code: res.claimCode })
      loadCards()
    } catch {
      alert('Could not unwrap card voucher')
    }
  }

  async function handleTransfer() {
    if (!transferModalCard || !address || !transferRecipient) return
    setTransferLoading(true)
    try {
      await transferNftCard(transferModalCard.tokenId, address, transferRecipient.trim())
      setTransferModalCard(null)
      setTransferRecipient('')
      loadCards()
      alert('NFT Gift Card transferred successfully!')
    } catch {
      alert('Transfer failed. Please check recipient address.')
    } finally {
      setTransferLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Gift size={32} className="text-gray-300 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Connect wallet to view your NFT Gift Cards</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">Your minted Web3 digital vouchers will appear here.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#2b2bf5] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-[#2b2bf5] rounded-2xl p-6 text-white shadow-xs">
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold mb-2">
          <Sparkles size={13} />
          NFT-Backed Digital Vouchers
        </div>
        <h1 className="text-2xl font-bold">Your Web3 Gift Card Inventory</h1>
        <p className="text-xs text-white/80 mt-1 max-w-lg">
          These cards are minted on-chain. You can hold them as digital assets, send them to any wallet, or unwrap the voucher anytime to claim the code.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-xs text-center space-y-2">
          <Gift size={36} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No NFT Gift Cards Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            When ordering any gift card, check "Mint as NFT Gift Card" to receive an on-chain digital card token.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card) => {
            const isRedeemed = card.status === 'redeemed'
            const activeCode = revealedCode?.tokenId === card.tokenId ? revealedCode.code : card.claimCode

            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Visual Card Face */}
                <div className="p-5 bg-gradient-to-br from-gray-900 to-indigo-950 text-white relative">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase">
                      {card.chain.toUpperCase()} VOUCHER
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isRedeemed ? 'bg-gray-700 text-gray-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isRedeemed ? 'Redeemed' : 'Active'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold truncate">{card.brandName}</h4>
                  <p className="text-2xl font-extrabold font-mono mt-1">${card.faceValue}</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-3 truncate">Token #{card.tokenId}</p>
                </div>

                {/* Card Actions */}
                <div className="p-4 space-y-3">
                  {activeCode ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-emerald-800 font-semibold uppercase block mb-1">Gift Card Code</span>
                      <code className="text-xs font-mono font-bold text-emerald-900 select-all">{activeCode}</code>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 text-center">
                      Code is locked on-chain. Unwrap whenever you are ready to spend.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {!isRedeemed && !activeCode && (
                      <button
                        type="button"
                        onClick={() => handleRedeem(card)}
                        className="py-2 px-3 bg-[#2b2bf5] text-white rounded-xl text-xs font-semibold hover:bg-[#1f1fd8] flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye size={13} />
                        Unwrap Code
                      </button>
                    )}
                    {!isRedeemed && (
                      <button
                        type="button"
                        onClick={() => setTransferModalCard(card)}
                        className={`py-2 px-3 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold hover:bg-gray-200 flex items-center justify-center gap-1 transition-colors ${
                          activeCode ? 'col-span-2' : ''
                        }`}
                      >
                        <Send size={13} />
                        Transfer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Transfer NFT Voucher</h3>
              <button onClick={() => setTransferModalCard(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Transfer <strong>{transferModalCard.brandName} (${transferModalCard.faceValue})</strong> to any EVM wallet.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">Recipient Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-xl font-mono bg-gray-50 focus:bg-white outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTransferModalCard(null)}
                className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={transferLoading || !transferRecipient}
                className="flex-1 py-2 bg-[#2b2bf5] text-white rounded-xl text-xs font-semibold hover:bg-[#1f1fd8] disabled:opacity-50"
              >
                {transferLoading ? 'Transferring…' : 'Send NFT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
