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

const EURC_CONTRACT_ADDRESS = '0x08210f9170f89ab7658f0b5e3ff39b0e03c594d4';
const EURC_ABI = [
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
    const valueInWei = BigInt(value) * BigInt(10 ** 6);

    const data = encodeFunctionData({
      abi: EURC_ABI,
      functionName: 'transfer',
      args: [to, valueInWei],
    });

    const hash = await walletClient.sendTransaction({
      account,
      to: EURC_CONTRACT_ADDRESS,
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
        <input ref={valueInput} placeholder="value (EURC)" />
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
