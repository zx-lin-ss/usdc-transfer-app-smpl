import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  http,
  type Address,
  type Hash,
  type TransactionReceipt,
  createPublicClient,
  createWalletClient,
  custom,
  stringify,
  encodeFunctionData,
} from 'viem';
import { sepolia } from 'viem/chains';
import 'viem/window';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
});

const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom(window.ethereum!)
});

const USDC_CONTRACT_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

function Example() {
  const [account, setAccount] = useState<Address>();
  const [hash, setHash] = useState<Hash>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();

  const addressInput = React.createRef<HTMLInputElement>();
  const valueInput = React.createRef<HTMLInputElement>();

  const connect = async () => {
    const [address] = await walletClient.requestAddresses();
    setAccount(address);
  };

  const sendTransaction = async () => {
    if (!account) return;
    const to = addressInput.current!.value as Address;
    const value = valueInput.current!.value as `${number}`;
    const valueInWei = BigInt(value) * BigInt(10 ** 6); // Assuming USDC has 6 decimals

    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [to, valueInWei],
    });

    const hash = await walletClient.sendTransaction({
      account,
      to: USDC_CONTRACT_ADDRESS,
      data,
    });
    setHash(hash);
  };

  useEffect(() => {
    (async () => {
      if (hash) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setReceipt(receipt);
      }
    })();
  }, [hash]);

  if (account) {
    return (
      <>
        <div>Connected: {account}</div>
        <input ref={addressInput} placeholder="address" />
        <input ref={valueInput} placeholder="value (USDC)" />
        <button onClick={sendTransaction}>Send</button>
        {receipt && (
          <div>
            Receipt: <pre><code>{stringify(receipt, null, 2)}</code></pre>
          </div>
        )}
      </>
    );
  }
  return <button onClick={connect}>Connect Wallet</button>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
<Example />
);
