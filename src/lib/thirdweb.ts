import { createThirdwebClient } from "thirdweb";
import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";
import { sepolia, ethereum, polygon, arbitrum } from "thirdweb/chains";

// ─── Client ────────────────────────────────────────────────────────────────
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn(
    "[ChainShield] VITE_THIRDWEB_CLIENT_ID is not set.\n" +
    "  Social login (Google/Apple/Email) will not work.\n" +
    "  Get a free Client ID at: https://thirdweb.com/dashboard"
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
