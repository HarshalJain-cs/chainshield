import { ConnectButton } from "thirdweb/react";
import { client, wallets } from "@/lib/thirdweb";
import { ethereum, polygon, arbitrum } from "thirdweb/chains";

export function ThirdwebConnectButton() {
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      chains={[ethereum, polygon, arbitrum]}
      theme="dark"
      connectModal={{
        size: "compact",
        title: "Connect to ChainShield",
        welcomeScreen: {
          title: "Decentralized Insurance",
          subtitle: "Sign in with Google or connect your wallet",
        },
      }}
      connectButton={{
        label: "Connect Wallet",
        className: "!bg-primary !text-primary-foreground !border-[1.5px] !border-foreground !px-4 !py-2 !text-xs !font-mono !font-bold !uppercase !shadow-window-sm hover:!shadow-window-md !transition-all",
      }}
      detailsButton={{
        className: "!bg-card !border-[1.5px] !border-foreground !px-3 !py-1.5 !text-xs !font-mono",
      }}
    />
  );
}
