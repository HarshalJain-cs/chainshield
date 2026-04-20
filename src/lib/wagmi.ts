import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, arbitrum, base, optimism, sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "ChainShield",
  // Public placeholder — replace with your own WalletConnect projectId from cloud.walletconnect.com
  projectId: "3fbb6bba6f1de962d911bb5b5c3dba68",
  chains: [mainnet, arbitrum, base, optimism, sepolia],
  ssr: false,
});