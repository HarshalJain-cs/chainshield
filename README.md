# 🛡️ ChainShield

**Decentralized insurance platform built on Ethereum**

ChainShield is a comprehensive Web3 insurance protocol offering coverage across 6 lines: DeFi, Health, Auto, Life, Finance, and Travel. Built with transparency, powered by blockchain.

---

## ✨ Features

### 🏥 **Multi-Line Coverage**
- **DeFi**: Smart contract exploits, protocol hacks, oracle failures
- **Health**: Hospital, outpatient, specialist visits
- **Auto**: Liability, collision, theft coverage
- **Life**: Term life insurance with on-chain beneficiaries
- **Finance**: Wallet hacks, exchange insolvency protection
- **Travel**: Trip cancellation, medical abroad

### 💰 **Liquidity Pools**
- Earn yield by underwriting cover pools
- APY ranges from 5.8% to 14.2%
- Flexible deposits in ETH, USDC, DAI
- Lock periods: 7-30 days

### ⚖️ **Claims System**
- Automated oracle verification
- Community governance voting
- 24-48h review for complex cases
- Transparent payout history

### 🗳️ **Governance**
- On-chain proposal system
- Vote with staked tokens
- Community-driven parameters

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Git**
- **Convex account** (free at [convex.dev](https://convex.dev))
- **Thirdweb Client ID** (free at [thirdweb.com/dashboard](https://thirdweb.com/dashboard))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chainshield.git
cd chainshield

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Configuration section)

# Initialize Convex
npx convex dev

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Configuration

### 1. **Convex Setup** (Required)

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Create a new project
3. Run `npx convex dev` - this will:
   - Create `convex/` folder if needed
   - Deploy your backend functions
   - Generate `.env.local` with `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`

### 2. **Thirdweb Setup** (Required)

1. Go to [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Create account and new project
3. Copy your Client ID
4. Add to `.env.local`:
   ```
   VITE_THIRDWEB_CLIENT_ID=your_client_id_here
   ```

**What you get:**
- ✅ **Social Login**: Users sign in with Google, Apple, Facebook, Email, or Phone
- ✅ **Embedded Wallets**: Auto-created wallets for Web2 users (no MetaMask required!)
- ✅ **Traditional Wallets**: MetaMask, Coinbase Wallet, WalletConnect still supported

### 3. **Blockchain RPC** (Optional but Recommended)

For better performance, use a dedicated RPC provider:

**Option A: Alchemy** (Recommended)
1. Sign up at [alchemy.com](https://www.alchemy.com)
2. Create API key
3. Add to `.env.local`:
   ```
   VITE_ALCHEMY_ID=your_alchemy_key
   ```

**Option B: Infura**
1. Sign up at [infura.io](https://infura.io)
2. Create API key
3. Add to `.env.local`:
   ```
   VITE_INFURA_ID=your_infura_key
   ```

---

## 📦 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** + **shadcn/ui** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation

### Web3
- **Thirdweb v5** - Social login, embedded wallets, wallet connections
- **Viem 2.21** - TypeScript Ethereum library

### Backend
- **Convex** - Realtime serverless database
- TypeScript functions
- Automatic scaling
- Built-in auth

---

## 🏗️ Project Structure

```
chainshield/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui primitives
│   │   └── web3/        # Web3-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configs
│   │   ├── mock/        # Mock data (development)
│   │   └── contracts/   # Contract ABIs and mock tx
│   └── pages/           # Route pages
│       ├── Index.tsx    # Landing page
│       ├── Dashboard.tsx
│       ├── Cover.tsx    # Coverage marketplace
│       ├── Claims.tsx   # Claims management
│       ├── Stake.tsx    # LP pools
│       └── Governance.tsx
├── convex/              # Backend functions
│   ├── schema.ts        # Database schema
│   ├── users.ts         # User management
│   ├── policies.ts      # Policy CRUD
│   ├── claims.ts        # Claims processing
│   ├── pools.ts         # Liquidity pools
│   ├── lp.ts            # LP positions
│   ├── premiums.ts      # Premium payments
│   └── seed.ts          # Demo data seeder
└── public/              # Static assets
```

---

## 🎮 Usage

### For Policyholders

1. **Connect Wallet**
   - Click "Connect Wallet" in top-right
   - Choose your wallet (MetaMask, Coinbase, etc.)

2. **Browse Coverage**
   - Navigate to "Cover" page
   - Filter by line (DeFi, Health, Auto, etc.)
   - View product details and premium quotes

3. **Purchase Policy**
   - Select a product
   - Configure coverage amount and duration
   - Confirm transaction
   - View policy in Dashboard

4. **File a Claim**
   - Go to "Claims" page
   - Click "File Claim"
   - Select your policy
   - Fill incident details
   - Submit on-chain

### For Liquidity Providers

1. **Explore Pools**
   - Go to "Earn" page
   - Review pool APY, TVL, risk level

2. **Stake Liquidity**
   - Select a pool
   - Enter amount to stake
   - Confirm transaction
   - Track earnings in Dashboard

3. **Withdraw**
   - Navigate to your position
   - Click "Unstake"
   - Respect lock period (7-30 days)

### For Governance Participants

1. **View Proposals**
   - Go to "Governance" page
   - Review active proposals

2. **Vote**
   - Click on a proposal
   - Cast vote (For/Against)
   - Stake required for voting power

---

## 🧪 Development

### Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Lint code
npm run test         # Run tests

# Convex
npx convex dev       # Start Convex backend in dev mode
npx convex deploy    # Deploy backend to production
npx convex dashboard # Open Convex dashboard
```

### Seed Demo Data

1. Connect your wallet
2. Go to Dashboard
3. Click "Load Demo Data"
4. Demo policies, claims, and LP positions will be created

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables:
     - `VITE_CONVEX_URL`
     - `VITE_THIRDWEB_CLIENT_ID`
     - (Optional) `VITE_ALCHEMY_ID`
   - Deploy!

3. **Deploy Convex to Production**
   ```bash
   npx convex deploy --prod
   ```
   Update `VITE_CONVEX_URL` in Vercel with production URL

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables for Production

Ensure these are set in your hosting platform:
- `VITE_CONVEX_URL` (production Convex URL)
- `VITE_THIRDWEB_CLIENT_ID`
- `VITE_APP_URL` (your production domain)

---

## 🔐 Security

- ✅ No private keys in code
- ✅ Environment variables for sensitive data
- ✅ Wallet address validation
- ✅ XSS protection (React defaults)
- ⚠️ **Note**: Current implementation uses mock transactions for development
- 🚧 **TODO**: Deploy actual smart contracts before handling real funds

---

## 🛣️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Multi-line insurance marketplace
- [x] Wallet connection
- [x] Policy purchase flow
- [x] Claims filing system
- [x] LP staking pools
- [x] Governance proposals

### 🚧 Phase 2: On-Chain (In Progress)
- [ ] Deploy smart contracts to testnet
- [ ] Real blockchain transactions
- [ ] Chainlink oracle integration
- [ ] On-chain governance
- [ ] IPFS evidence storage

### 📋 Phase 3: Production
- [ ] Security audits
- [ ] Mainnet deployment
- [ ] Multi-chain support (Arbitrum, Base, Optimism)
- [ ] Mobile app (React Native)
- [ ] KYC/AML integration

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/chainshield/issues)
- **Discord**: [Join our community](https://discord.gg/your-invite)
- **Twitter**: [@ChainShield](https://twitter.com/chainshield)

---

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Wallet infrastructure by [RainbowKit](https://rainbowkit.com)
- Icons by [Lucide](https://lucide.dev)

---

**Made with ❤️ for the decentralized future**

🛡️ **ChainShield** - Insurance Without Intermediaries
