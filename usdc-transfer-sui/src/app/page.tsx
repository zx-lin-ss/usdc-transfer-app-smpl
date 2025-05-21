'use client'

import { useState, useEffect } from 'react'
import {
  ConnectButton,
  useWalletKit,
  WalletKitProvider,
} from '@mysten/wallet-kit'
import { SuiClientProvider, useSuiClient } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionBlock } from '@mysten/sui.js/transactions'

const networks = {
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
}

const queryClient = new QueryClient()

const USDC_TYPE =
  '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'

function HomeContent() {
  const { currentAccount, signAndExecuteTransactionBlock } = useWalletKit()
  const suiClient = useSuiClient()

  const [connected, setConnected] = useState(false)
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [txStatus, setTxStatus] = useState('')

  useEffect(() => {
    setConnected(!!currentAccount)
  }, [currentAccount])

  const handleSendTokens = async () => {
    if (!currentAccount || !amount || !recipientAddress) {
      setTxStatus('Please connect wallet and fill all fields')
      return
    }
    try {
      const { data: coins } = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: USDC_TYPE,
      })
      if (coins.length === 0) {
        setTxStatus('No USDC coins found in your wallet')
        return
      }

      const tx = new TransactionBlock()
      const [coin] = tx.splitCoins(coins[0].coinObjectId, [
        tx.pure(BigInt(amount)),
      ])
      tx.transferObjects([coin], tx.pure(recipientAddress))

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      })
      console.log('Transaction result:', result)
      setTxStatus(`Transaction successful. Digest: ${result.digest}`)
    } catch (error) {
      console.error('Error sending tokens:', error)
      setTxStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Sui USDC Sender (Testnet)</h1>
        <ConnectButton />
        {connected && currentAccount && (
          <p className="mt-4">Connected: {currentAccount.address}</p>
        )}
        <div className="mt-8">
          <input
            type="text"
            placeholder="Amount (in USDC)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-2 border rounded mr-2 text-black"
          />
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="p-2 border rounded mr-2 text-black"
          />
          <button
            onClick={handleSendTokens}
            disabled={!connected}
            className={`p-2 rounded ${
              connected && amount && recipientAddress
                ? 'bg-blue-200 text-black hover:bg-blue-300'
                : 'bg-gray-300 text-gray-500'
            } transition-colors duration-200`}
          >
            Send USDC
          </button>
        </div>
        {txStatus && <p className="mt-4">{txStatus}</p>}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} network="testnet">
        <WalletKitProvider>
          <HomeContent />
        </WalletKitProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
