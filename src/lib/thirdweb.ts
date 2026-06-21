import { createThirdwebClient } from "thirdweb";
import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";
import { sepolia, ethereum, polygon, arbitrum } from "thirdweb/chains";

// ─── Client ────────────────────────────────────────────────────────────────
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

/**
 * Whether a real thirdweb client ID is configured. Thirdweb's hosted social
 * login + embedded-wallet service require one. When it's absent we fall back to
 * the local demo wallet (see lib/demoWallet.ts) so the app still works fully.
 */
export const hasThirdwebClientId =
  !!clientId && clientId !== "placeholder_client_id";

if (!hasThirdwebClientId) {
  console.info(
    "[ChainShield] No VITE_THIRDWEB_CLIENT_ID set — using the built-in demo wallet.\n" +
    "  Click \"Continue with Google\" to instantly create a local demo account.\n" +
    "  For real social login + on-chain wallets, add a free Client ID from:\n" +
    "  https://thirdweb.com/dashboard"
  );
}

export const client = createThirdwebClient({
  clientId: clientId || "placeholder_client_id",
});

// ─── Wallets ───────────────────────────────────────────────────────────────
// In-app wallet: social login + email/phone — creates embedded EVM wallets
// External wallets: MetaMask, Coinbase, WalletConnect
export const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "apple",
        "facebook",
        "email",
        "phone",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("walletConnect"),
];

// ─── Chains ─────────────────────────────────────────────────────────────────
// Sepolia is the primary testnet; mainnet chains ready for future
export const SUPPORTED_CHAINS = [sepolia, ethereum, polygon, arbitrum];
export const DEFAULT_CHAIN = sepolia;

// Re-export for convenience
export { sepolia, ethereum, polygon, arbitrum };
