'use client'
import { useState, useEffect } from 'react'
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk'

// Initialize Aptos client
const config = new AptosConfig({ network: Network.TESTNET })
const aptos = new Aptos(config)

// Aptos USDC contract address on testnet
const USDC_ADDRESS = '0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832'

function HomeContent() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Check if Petra wallet is available
  const isPetraAvailable = () => {
    return typeof window !== 'undefined' && window.aptos;
  };

  // Check connection status on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (isPetraAvailable()) {
        try {
          const response = await window.aptos.account();
          if (response) {
            setAccount(response);
            setConnected(true);
          }
        } catch (error) {
          // Not connected, which is fine
          console.log('Wallet not connected yet');
        }
      }
    };
    
    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      setTxStatus('Connecting...');
      
      if (!isPetraAvailable()) {
        setTxStatus('Petra Wallet not detected. Please install Petra Wallet extension and refresh the page.');
        return;
      }

      // Request connection to Petra wallet
      const response = await window.aptos.connect();
      
      if (response) {
        setAccount(response);
        setConnected(true);
        setTxStatus('Successfully connected to Petra Wallet!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setTxStatus(''), 3000);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      
      if (error.message?.includes('User rejected')) {
        setTxStatus('Connection rejected by user');
      } else {
        setTxStatus(`Connection failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      if (isPetraAvailable()) {
        await window.aptos.disconnect();
      }
      setAccount(null);
      setConnected(false);
      setTxStatus('Disconnected from wallet');
      
      // Clear message after 3 seconds
      setTimeout(() => setTxStatus(''), 3000);
    } catch (error) {
      console.error('Disconnect failed:', error);
      setTxStatus('Disconnect failed');
    }
  };

  const handleSendTokens = async () => {
    if (!connected || !account || !amount || !recipientAddress) {
      setTxStatus('Please connect wallet and fill all fields')
      return
    }

    try {
      setTxStatus('Preparing transaction...');

      const transaction = {
        type: "entry_function_payload",
        function: "0x1::primary_fungible_store::transfer",
        type_arguments: ["0x1::fungible_asset::Metadata"],
        arguments: [
          USDC_ADDRESS,
          recipientAddress,
          (parseFloat(amount) * 1_000_000).toString() // Convert to smallest unit
        ]
      };

      setTxStatus('Please approve the transaction in your wallet...');
      
      // Sign and submit transaction using Petra's API
      const pendingTransaction = await window.aptos.signAndSubmitTransaction(transaction);
      
      setTxStatus('Transaction submitted. Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const txResult = await aptos.waitForTransaction({ 
        transactionHash: pendingTransaction.hash 
      });

      setTxStatus(`Transaction successful! Hash: ${pendingTransaction.hash}`);
      
      // Clear form
      setAmount('');
      setRecipientAddress('');
      
    } catch (error) {
      console.error('Transaction error:', error);
      
      if (error.message?.includes('User rejected')) {
        setTxStatus('Transaction rejected by user');
      } else if (error.message?.includes('insufficient')) {
        setTxStatus('Insufficient balance or gas fees');
      } else {
        setTxStatus(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Aptos USDC Sender (Testnet)</h1>
        
        {/* Wallet Status */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="mb-4">
            <strong>Wallet Status:</strong> {isPetraAvailable() ? '✅ Petra Detected' : '❌ Petra Not Found'}
          </div>
          
          {!connected ? (
            <button
              onClick={handleConnect}
              disabled={!isPetraAvailable()}
              className={`font-bold py-3 px-6 rounded-lg ${
                isPetraAvailable() 
                  ? 'bg-blue-500 hover:bg-blue-700 text-white cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isPetraAvailable() ? 'Connect Petra Wallet' : 'Install Petra Wallet'}
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-semibold">✅ Wallet Connected</span>
              <button
                onClick={handleDisconnect}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {connected && account && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p><strong>Connected Address:</strong></p>
            <p className="font-mono text-sm break-all">{account.address}</p>
          </div>
        )}

        {/* Transaction Form */}
        <div className="mt-8 space-y-4">
          <div>
            <input
              type="number"
              step="0.000001"
              placeholder="Amount (in USDC)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border rounded-lg text-black"
              disabled={!connected}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Recipient Address (0x...)"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full p-3 border rounded-lg text-black"
              disabled={!connected}
            />
          </div>
          <button
            onClick={handleSendTokens}
            disabled={!connected || !amount || !recipientAddress}
            className={`w-full p-3 rounded-lg font-bold ${
              connected && amount && recipientAddress
                ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-colors duration-200`}
          >
            Send USDC
          </button>
        </div>

        {/* Status Messages */}
        {txStatus && (
          <div className={`mt-6 p-4 rounded-lg ${
            txStatus.includes('successful') || txStatus.includes('Successfully') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : txStatus.includes('failed') || txStatus.includes('Error') || txStatus.includes('rejected')
              ? 'bg-red-100 border border-red-400 text-red-700'
              : 'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            <p className="break-all">{txStatus}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return <HomeContent />;
}