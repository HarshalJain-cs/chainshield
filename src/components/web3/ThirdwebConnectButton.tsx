import { ConnectButton } from "thirdweb/react";
import { client, wallets, SUPPORTED_CHAINS, hasThirdwebClientId } from "@/lib/thirdweb";
import { DemoConnectButton } from "@/components/web3/DemoConnectButton";

export function ThirdwebConnectButton() {
  // Without a configured client ID, thirdweb's hosted social login can't work,
  // so use the zero-setup demo wallet instead.
  if (!hasThirdwebClientId) {
    return <DemoConnectButton />;
  }

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      chains={SUPPORTED_CHAINS}
      theme="dark"
      connectModal={{
        size: "compact",
        title: "Connect to ChainShield",
        welcomeScreen: {
          title: "Decentralized Insurance",
          subtitle: "Sign in with Google or connect your wallet to get started",
        },
        showThirdwebBranding: false,
      }}
      connectButton={{
        label: "Connect Wallet",
        className:
          "!bg-primary !text-primary-foreground !border-[1.5px] !border-foreground !px-4 !py-2 !text-xs !font-mono !font-bold !uppercase !shadow-window-sm hover:!shadow-window-md !transition-all",
      }}
      detailsButton={{
        className:
          "!bg-card !border-[1.5px] !border-foreground !px-3 !py-1.5 !text-xs !font-mono",
      }}
    />
  );
}
