import { createThirdwebClient } from "thirdweb";
import { embeddedWallet, inAppWallet } from "thirdweb/wallets";

// Get client ID from environment
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn("VITE_THIRDWEB_CLIENT_ID not set. Please add it to .env.local");
}

// Create Thirdweb client
export const client = createThirdwebClient({
  clientId: clientId || "placeholder_will_be_replaced",
});

// Configure wallets with social login
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
  embeddedWallet(),
];
