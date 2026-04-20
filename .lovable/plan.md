
# ChainShield — Web3 Insurance Platform

A full multi-page dApp UI inspired by Uniswap's clarity and motion, with ChainShield's dark cyber-finance identity. Real wallet connection via RainbowKit + wagmi. All protocol/policy data is mocked client-side.

## Brand & Design Language
- **Theme**: Dark-first, near-black `#080B14` base, glassmorphic panels
- **Accents**: Electric teal `#00E5CC` primary, electric blue, gold, violet
- **Type**: Syne (display) · IBM Plex Sans (body) · JetBrains Mono (numbers/addresses)
- **Motion**: Uniswap-style smooth route transitions, hover lifts, animated number counters, subtle glow pulses on live data
- **Layout**: Generous spacing, sticky translucent top nav, sharp 1px borders, geometric grid accents

## Navigation (Uniswap-style top bar)
Logo · Cover · Claims · Stake · Governance · Docs — right side: network switcher + **Connect Wallet** (RainbowKit modal). Mobile: slide-down drawer.

## Pages

### 1. Landing `/`
- Hero: oversized headline, animated TVL/cover counters, dual CTA (Get Cover · Earn Yield)
- Live stats strip (Total Cover, Active Policies, Claims Paid, APY)
- Product cards: Cover Buyers · LPs · Claim Assessors · Governance
- Supported protocols marquee (logos)
- How it works (3-step diagram)
- Footer with socials, docs, audits

### 2. Cover Marketplace `/cover`
- Filter sidebar (protocol type, chain, risk tier)
- Grid of protocol cover cards: logo, premium %, capacity, utilization bar
- Click → cover detail with quote calculator (amount + duration → premium), "Buy Cover" flow modal

### 3. Dashboard `/app`
- Wallet-gated. Shows: portfolio value, active policies table, claim history, LP positions
- Quick actions: renew, file claim, withdraw

### 4. Claims `/claims`
- Tabs: My Claims · Open Assessments · Resolved
- File claim wizard (3 steps: select policy → describe incident → submit evidence)
- Claim detail with assessor votes, timeline, status badge

### 5. Stake / Earn `/stake`
- Pool cards with APY, TVL, utilization
- Stake/unstake panel with slider and projected rewards
- Personal LP positions table

### 6. Governance `/governance`
- Active proposals list with vote bars
- Proposal detail page: description, for/against, voter list, your voting power
- "Create proposal" CTA (gated)

### 7. 404 — themed not found

## Wallet Integration
- RainbowKit + wagmi + viem
- Multi-chain: Ethereum, Arbitrum, Base, Optimism (testnets included)
- Custom RainbowKit theme matched to ChainShield palette
- Connection state drives gated UI (Dashboard, Claims, voting)
- Uses public WalletConnect projectId placeholder — you can swap in your own

## Mock Data Layer
A typed mock store (`src/lib/mock/`) provides protocols, policies, claims, pools, proposals so every page renders rich content immediately.

## Out of Scope (this pass)
No real smart contracts, no backend persistence, no real claim payouts — pure UI with wallet connect.
