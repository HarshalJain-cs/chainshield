import { createWalletAdapter, privateKeyToAccount } from "thirdweb/wallets";
import type { Wallet } from "thirdweb/wallets";
import { sepolia } from "thirdweb/chains";
import { generatePrivateKey } from "viem/accounts";
import { client } from "@/lib/thirdweb";

/**
 * Demo / no-signup wallet.
 *
 * Thirdweb's hosted social login (Google/Apple/email) needs a configured
 * `VITE_THIRDWEB_CLIENT_ID`. When one isn't set (the default demo experience),
 * we instead generate a real EVM account locally and register it with the
 * thirdweb connection manager via `createWalletAdapter`. From that point on,
 * `useActiveAccount()` returns this account everywhere in the app — so every
 * hook and page works exactly as it would with a real wallet, with zero setup.
 *
 * The key is persisted in localStorage so the same address survives refreshes
 * (and stays tied to any demo data seeded for it).
 */
const PK_STORAGE_KEY = "chainshield_demo_pk";
const CONNECTED_FLAG_KEY = "chainshield_demo_connected";

export function getOrCreateDemoPrivateKey(): `0x${string}` {
  let pk = localStorage.getItem(PK_STORAGE_KEY);
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    pk = generatePrivateKey();
    localStorage.setItem(PK_STORAGE_KEY, pk);
  }
  return pk as `0x${string}`;
}

/** True if the user previously connected the demo wallet (used to auto-reconnect on refresh). */
export function wasDemoConnected(): boolean {
  return localStorage.getItem(CONNECTED_FLAG_KEY) === "1";
}

export function markDemoConnected() {
  localStorage.setItem(CONNECTED_FLAG_KEY, "1");
}

/** Forget the connection (but keep the key so re-login keeps the same address). */
export function forgetDemoConnection() {
  localStorage.removeItem(CONNECTED_FLAG_KEY);
}

/** Fully reset the demo wallet (new address next time). */
export function clearDemoWallet() {
  localStorage.removeItem(PK_STORAGE_KEY);
  localStorage.removeItem(CONNECTED_FLAG_KEY);
}

export function createDemoWallet(): Wallet {
  const account = privateKeyToAccount({
    client,
    privateKey: getOrCreateDemoPrivateKey(),
  });

  return createWalletAdapter({
    client,
    adaptedAccount: account,
    chain: sepolia,
    onDisconnect: () => {
      // Connection teardown is handled by useDisconnect(); nothing extra here.
    },
    switchChain: async () => {
      // The demo wallet is single-chain (Sepolia); chain switching is a no-op.
    },
  });
}
