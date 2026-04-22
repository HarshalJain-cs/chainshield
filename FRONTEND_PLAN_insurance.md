# ChainShield — Web3 Insurance Platform
## Complete Frontend UI/UX Implementation Plan

---

## 1. PROJECT IDENTITY & BRAND

### Platform Name: **ChainShield**
**Tagline**: *Trustless protection. Onchain always.*

### Design Philosophy
Inspired by Uniswap's ruthless clarity and MetaMask's technical authority — but with the premium weight of a financial institution. **Dark-first, glassmorphic, electric teal + deep navy** with sharp geometric accents. Think Bloomberg Terminal meets DeFi protocol. Every surface breathes trust, speed, and technical precision.

### Aesthetic Direction
- **Theme**: Dark mode primary (near-black `#080B14` base)
- **Style**: Cyberpunk-Finance — precise grid lines, glowing accents, subtle HUD aesthetics
- **Feeling**: "Bloomberg Terminal if it was built by a Tier-1 DeFi team"
- **Animation Philosophy**: Physics-based transitions, number counters, glowing pulses on live data

---

## 2. DESIGN SYSTEM

### Color Palette (CSS Variables)

```css
:root {
  /* Backgrounds */
  --bg-void:       #080B14;   /* deepest background */
  --bg-deep:       #0D1220;   /* card/panel background */
  --bg-surface:    #131929;   /* elevated surface */
  --bg-overlay:    #1A2135;   /* modal/drawer overlay */
  --bg-glass:      rgba(19, 25, 41, 0.6); /* glassmorphic panels */

  /* Brand Accents */
  --accent-primary:  #00E5CC;  /* electric teal — primary CTA */
  --accent-secondary:#3B82F6;  /* electric blue — secondary */
  --accent-gold:     #F5A623;  /* gold — premium / governance */
  --accent-violet:   #8B5CF6;  /* violet — LP / yield */

  /* Semantic Colors */
  --success:   #10B981;
  --warning:   #F59E0B;
  --danger:    #EF4444;
  --info:      #3B82F6;

  /* Text */
  --text-primary:   #F0F4FF;
  --text-secondary: #8892A4;
  --text-muted:     #4A5568;
  --text-accent:    #00E5CC;

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-medium:  rgba(255,255,255,0.12);
  --border-glow:    rgba(0,229,204,0.4);

  /* Shadows */
  --shadow-card:    0 4px 24px rgba(0,0,0,0.4);
  --shadow-glow:    0 0 40px rgba(0,229,204,0.15);
  --shadow-danger:  0 0 20px rgba(239,68,68,0.2);
}
```

### Typography

```
Display Font:   "Space Grotesk" — No. Use "DM Sans" for body but "Bebas Neue" is too harsh.
                → Use: "Syne" (Display headings) — sharp, technical, geometric
Body Font:      "IBM Plex Sans" — technical precision, financial credibility  
Monospace:      "JetBrains Mono" — addresses, hashes, numbers, prices
```

**Scale:**
```
xs:   0.75rem  / 12px
sm:   0.875rem / 14px
base: 1rem     / 16px
lg:   1.125rem / 18px
xl:   1.25rem  / 20px
2xl:  1.5rem   / 24px
3xl:  1.875rem / 30px
4xl:  2.25rem  / 36px
5xl:  3rem     / 48px
6xl:  4rem     / 64px
hero: 5.5rem   / 88px
```

### Spacing System
4px base unit. All spacing multiples of 4 (8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128)

### Border Radius
```
sm: 4px    — chips, badges
md: 8px    — inputs, small cards  
lg: 12px   — cards, panels
xl: 16px   — modals, large cards
2xl: 24px  — feature cards
pill: 9999px — buttons, tags
```

---

## 3. TECH STACK — FRONTEND

```
Framework:        Next.js 14 (App Router)
Language:         TypeScript 5.x
Styling:          Tailwind CSS v3 + CSS Variables + CSS Modules for complex components
Animations:       Framer Motion v11
Web3/Wallet:      RainbowKit v2 + wagmi v2 + viem
Social Login:     Privy SDK (@privy-io/react-auth) — Google OAuth → Smart Wallet
State Mgmt:       Zustand v4
Data Fetching:    TanStack Query v5 + wagmi hooks
Charts:           Recharts + custom SVG for premium visualizations
Forms:            React Hook Form + Zod
Icons:            Lucide React + custom SVG icons
Notifications:    Sonner (toast system)
Table:            TanStack Table v8
Date:             date-fns
Env:              T3 Env (type-safe env vars)
Linting:          ESLint + Prettier + Husky
Testing:          Vitest + Testing Library + Playwright (E2E)
```

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Public marketing pages
│   │   ├── page.tsx              # Landing page
│   │   ├── about/page.tsx
│   │   └── docs/page.tsx
│   ├── (app)/                    # Authenticated app
│   │   ├── layout.tsx            # App shell with sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── policies/
│   │   │   ├── page.tsx          # All policies list
│   │   │   ├── [id]/page.tsx     # Policy detail
│   │   │   └── new/page.tsx      # Purchase flow
│   │   ├── claims/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── file/page.tsx     # File new claim
│   │   ├── pool/                 # LP/Underwriter section
│   │   │   ├── page.tsx
│   │   │   └── [poolId]/page.tsx
│   │   └── governance/page.tsx
│   ├── admin/                    # Admin panel (role-gated)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Admin overview
│   │   ├── claims/page.tsx       # Claims review queue
│   │   ├── policies/page.tsx
│   │   └── users/page.tsx
│   ├── api/                      # API routes (Next.js)
│   │   ├── auth/[...privy]/      # Privy auth callbacks
│   │   ├── policies/route.ts
│   │   ├── claims/route.ts
│   │   └── webhooks/route.ts
│   ├── layout.tsx                # Root layout (providers)
│   └── globals.css
│
├── components/
│   ├── ui/                       # Primitive UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Tabs.tsx
│   │   ├── Progress.tsx
│   │   └── DataTable.tsx
│   ├── web3/                     # Web3-specific components
│   │   ├── ConnectButton.tsx     # Custom RainbowKit button
│   │   ├── WalletAvatar.tsx
│   │   ├── AddressDisplay.tsx
│   │   ├── TokenAmountInput.tsx
│   │   ├── TxStatusModal.tsx
│   │   ├── GasEstimate.tsx
│   │   └── NetworkBadge.tsx
│   ├── charts/                   # Data visualization
│   │   ├── PoolLiquidityChart.tsx
│   │   ├── PremiumHistoryChart.tsx
│   │   ├── ClaimsBreakdownChart.tsx
│   │   └── YieldCurveChart.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── AppShell.tsx
│   ├── landing/                  # Marketing page components
│   │   ├── Hero.tsx
│   │   ├── StatsBar.tsx
│   │   ├── ProductFeatures.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── ProtocolStats.tsx
│   │   ├── Testimonials.tsx
│   │   └── CTA.tsx
│   ├── policies/
│   │   ├── PolicyCard.tsx
│   │   ├── PolicyWizard.tsx      # Multi-step purchase
│   │   ├── CoverageSelector.tsx
│   │   ├── PremiumCalculator.tsx
│   │   └── PolicyStatus.tsx
│   ├── claims/
│   │   ├── ClaimCard.tsx
│   │   ├── ClaimWizard.tsx
│   │   ├── ClaimStatusTimeline.tsx
│   │   ├── EvidenceUploader.tsx
│   │   └── OracleStatus.tsx
│   ├── pool/
│   │   ├── PoolCard.tsx
│   │   ├── DepositModal.tsx
│   │   ├── WithdrawModal.tsx
│   │   └── YieldDisplay.tsx
│   └── admin/
│       ├── ClaimReviewPanel.tsx
│       ├── UserTable.tsx
│       └── AnalyticsDashboard.tsx
│
├── hooks/
│   ├── useInsuranceContract.ts
│   ├── useUserPolicies.ts
│   ├── usePoolData.ts
│   ├── useClaims.ts
│   ├── useTokenBalance.ts
│   ├── useGasEstimate.ts
│   └── useAdminAccess.ts
│
├── lib/
│   ├── wagmi.config.ts
│   ├── rainbowkit.config.ts
│   ├── privy.config.ts
│   ├── supabase.ts               # Supabase client
│   ├── contracts/
│   │   ├── abis/                 # Contract ABIs
│   │   └── addresses.ts          # Deployed addresses
│   └── utils/
│       ├── format.ts             # Number/address formatters
│       ├── tokens.ts             # Token metadata
│       └── cn.ts                 # classnames utility
│
├── stores/
│   ├── useAppStore.ts            # Global app state
│   ├── useWalletStore.ts
│   └── useNotificationStore.ts
│
└── types/
    ├── policy.ts
    ├── claim.ts
    ├── pool.ts
    ├── user.ts
    └── contracts.ts
```

---

## 4. PAGE-BY-PAGE UI/UX SPECIFICATION

---

### 4.1 LANDING PAGE (`/`)

**Visual Concept**: Full-screen immersive hero with animated blockchain nodes, glowing grid lines, floating stat counters.

#### Hero Section
```
Layout: Full viewport height (100vh)
Background: 
  - Deep void black (#080B14)
  - Animated dot-grid (CSS canvas/SVG) with pulsing connection lines
  - Radial gradient spotlight from top-center (teal glow)
  - Subtle scan-line texture overlay (5% opacity)

Content (centered, max-w-4xl):
  - Top badge: "Built on Ethereum · Audited by [Firm]"
    → Pill shape, border: 1px solid rgba(0,229,204,0.3), small green pulse dot
  
  - H1: "Insurance Without  
         Intermediaries."
    → Font: Syne, 88px, line-height 1.0
    → "Without Intermediaries." in gradient text: teal → blue
    → Word-by-word staggered entrance animation (Framer Motion)
  
  - Subheading:
    "Trustless health and DeFi coverage. Premiums paid onchain.  
     Claims settled automatically or by community vote."
    → IBM Plex Sans, 20px, color: --text-secondary
    → Fade-in after H1 (300ms delay)
  
  - CTA Row (mt-10):
    [Get Coverage →]     [Provide Liquidity]
    → Primary: bg teal, rounded-pill, 52px height, bold
    → Secondary: border teal, ghost style
    → Both have hover glow effect (box-shadow: 0 0 20px rgba(0,229,204,0.4))
  
  - Trust indicators row (below CTAs):
    🔒 Non-Custodial  •  ⚡ Instant Claims  •  🌐 Fully Onchain
    → Small pills with icons, text-secondary
```

#### Animated Stats Bar (below hero)
```
Full-width strip, bg-surface, border-top + border-bottom: var(--border-subtle)
Horizontally scrolling (marquee) or static 4-column grid:

  [💰 $84.2M]     [📋 12,847]    [✅ 98.4%]      [🏦 3 Pools]
  Total Value      Policies        Claims Paid      Active Pools
  Locked           Issued          Rate

Numbers animate (count up) when section enters viewport.
```

#### How It Works Section
```
Layout: 3 columns, each a tall card (glassmorphic)
Step numbers in large Syne font (01, 02, 03) as background watermarks

Card 1: Connect & Verify
  Icon: animated wallet icon with teal pulse
  Body: "Connect with your wallet or sign in with Google — a smart wallet is 
         created automatically."

Card 2: Choose Coverage  
  Icon: shield icon with gradient fill
  Body: "Select DeFi smart contract coverage or Health/Life policies.
         Set term, coverage amount, and pay with ETH, USDC, or DAI."

Card 3: Claim Anytime
  Icon: lightning bolt in circle
  Body: "File claims with evidence. Chainlink oracles handle automated 
         verification. Complex cases go to admin review."

Animation: Cards slide up staggered as user scrolls.
```

#### Coverage Products Section
```
Two large product cards side-by-side (or stacked on mobile)

[CARD 1: DeFi Coverage]
Background: subtle blue-violet gradient mesh
Icon: circuit board / smart contract
Tag: "For DeFi Investors"
Features:
  ✓ Smart contract exploit protection
  ✓ Protocol hack coverage  
  ✓ Oracle failure insurance
  ✓ Automated Chainlink verification
CTA: [Explore DeFi Coverage →]

[CARD 2: Health & Life]  
Background: subtle teal-green gradient mesh
Icon: heartbeat / medical cross
Tag: "For Individuals"
Features:
  ✓ Decentralized health policies
  ✓ On-chain claim verification
  ✓ Privacy-preserving submissions
  ✓ Global coverage, no borders
CTA: [Explore Health Coverage →]
```

#### Protocol Stats Section
```
Dark, full-width band with grid of 6 metrics:

Total Premiums Collected  |  Claims Paid  |  Avg. Response Time
Unique Policyholders      |  LP Yield APY |  Protocols Covered

Each number in large Syne font (teal color), with label below.
Animated count-up on scroll entry.
```

#### Liquidity Provider Callout
```
Split layout: Left = text, Right = animated yield visualization

Left:
  H2: "Earn yield by underwriting risk."
  Body: "Deposit stablecoins or ETH into insurance pools. Earn premiums 
         as passive yield while securing the protocol."
  Stats:
    Current APY: [animated %]
    Total Deposited: [$X]
    Pools: [3]
  CTA: [Start Earning →]

Right:
  Animated yield curve chart (SVG/Recharts)
  Shows hypothetical $10K deposit growing over 12 months
```

#### Footer
```
4-column grid:
Col 1: Logo + tagline + social links (Twitter, Discord, GitHub)
Col 2: Product (Dashboard, Coverage, Pools, Claims)
Col 3: Developers (Docs, Smart Contracts, Audits, GitHub)
Col 4: Legal (Terms, Privacy, Cookie Policy)

Bottom bar: "ChainShield © 2024 · Built on Ethereum"
Contract address display with copy button.
```

---

### 4.2 APP SHELL (Authenticated Layout)

#### Navbar (Top)
```
Height: 64px
Background: bg-deep with border-bottom: var(--border-subtle)
Backdrop-filter: blur(20px), position: sticky top-0, z-50

Left: Logo (ChainShield wordmark + shield icon)
Center: Network indicator pill (🟢 Ethereum Mainnet)  
Right:
  - Gas price live ticker (⛽ 12 Gwei — from ethers/wagmi)
  - Notification bell (with red dot badge)
  - Custom Connect Button:
    → If disconnected: "Connect Wallet" (teal button)
    → If connected: Avatar + truncated address + chevron
      → Dropdown: Copy Address, View on Etherscan, Switch Account, Disconnect
```

#### Sidebar (Left Navigation)
```
Width: 240px (collapsible to 64px icon-only mode)
Background: bg-deep
Border-right: var(--border-subtle)

Logo area (64px height)

Navigation sections:

[OVERVIEW]
  🏠  Dashboard
  📊  Analytics (admin only)

[INSURANCE]  
  🛡️  My Policies
  📝  File a Claim
  🔍  Claim Status

[LIQUIDITY]
  💧  Pools
  💰  My Positions
  📈  Yield

[GOVERNANCE]  (future/DAO)
  🗳️  Vote
  📣  Proposals

[ADMIN] (role-gated, red accent)
  ⚖️  Review Claims
  👥  Users
  ⚙️  Settings

Bottom:
  - Settings gear icon
  - Help / Docs link
  - Connected wallet indicator (small)
  
Active state: Left border 3px solid teal, bg slightly lighter.
Hover: bg-overlay transition 150ms.
```

---

### 4.3 POLICYHOLDER DASHBOARD

**Route**: `/dashboard`

```
Layout: 
  Top row: 4 KPI stat cards (equal width)
  Middle: My Active Policies list + right sidebar (quick actions)
  Bottom: Recent Claims + Premium Payment History

KPI Cards (4):
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Active Coverage │  │  Total Premiums  │  │  Open Claims    │  │  Next Premium   │
│  $250,000        │  │  Paid 0.42 ETH  │  │  1 Pending      │  │  Due Jan 15     │
│  ↑ +$50K today  │  │  ≈ $1,240       │  │  Est. $5,000    │  │  0.04 ETH       │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘

Card design:
- bg-surface, rounded-xl, border: var(--border-subtle)
- Icon in top-right (16x16 colored icon)
- Large number (Syne font, 28px)
- Label (text-secondary, 13px)
- Change indicator (green/red with arrow)

Active Policies Table:
Columns: Coverage Type | Amount | Premium | Status | Expires | Actions
Each row:
  - Type: badge pill (💙 Health | 🔷 DeFi)
  - Amount: large monospace 
  - Premium: per month amount
  - Status: colored badge (Active/Expired/Pending)
  - Expires: relative date (e.g. "in 45 days") with progress bar
  - Actions: [View] [File Claim] buttons

Empty state: Animated shield illustration + "No active policies" + [Get Coverage] CTA

Quick Actions Sidebar (right, 280px):
  Card: "Get New Coverage"
  Card: "Pay Premium"  (if due)
  Card: "Track Claim"
  Card: "Refer a Friend" (with referral code)

Recent Claims Widget:
  3 most recent claims in compact list
  Each: icon + claim ID + type + amount + status badge + date
  [View All Claims →] link

Premium History Chart:
  Bar chart (Recharts) — monthly premiums paid
  Toggle: ETH | USD view
  6M / 1Y / All time selector
```

---

### 4.4 BUY INSURANCE FLOW (Policy Purchase Wizard)

**Route**: `/policies/new`

**Design**: Full-screen centered wizard, step indicator at top, card expands/contracts per step.

```
Step Indicator:
  ①──②──③──④
  Type  Coverage  Payment  Confirm

───────────────────────────────────

STEP 1: Choose Coverage Type
  Two large selectable cards:
  
  ┌──────────────────────────────┐  ┌──────────────────────────────┐
  │  🔷 DeFi Coverage             │  │  💊 Health & Life             │
  │                               │  │                               │
  │  Protects against smart       │  │  Decentralized health         │
  │  contract exploits, protocol  │  │  coverage for individuals     │
  │  hacks, oracle failures       │  │  and families worldwide.      │
  │                               │  │                               │
  │  From 0.02 ETH/month         │  │  From 0.05 ETH/month         │
  │  [Select →]                   │  │  [Select →]                   │
  └──────────────────────────────┘  └──────────────────────────────┘

  Click selects with animated border glow + checkmark.

───────────────────────────────────

STEP 2: Configure Coverage

  [DeFi Coverage sub-type:]
    Radio group with icons:
    ○ Smart Contract Exploit — covers if protocol you interact with is hacked
    ○ Protocol Hack — covers your deposited assets during a hack
    ○ Oracle Failure — covers losses from price manipulation via oracles

  Coverage Amount Slider:
    "How much do you want covered?"
    $1,000 ──────●────────────── $500,000
    Custom input field below

  Coverage Duration:
    Pill selector: [1 Month] [3 Months] [6 Months] [1 Year]

  [Health sub-type:]
    Plan selector:
    ○ Basic — Emergency & hospitalization
    ○ Standard — + Outpatient, specialist visits
    ○ Premium — + Preventive, dental, vision

    Beneficiaries section:
    + Add beneficiary (name, wallet address, %)

  Live Premium Calculator (right side or below):
  ┌─────────────────────────────────┐
  │  Premium Estimate               │
  │  Coverage: $50,000              │
  │  Duration: 6 Months             │
  │  Monthly: 0.042 ETH (~$124)     │
  │  Total: 0.252 ETH (~$744)       │
  │  ─────────────────────────      │
  │  Risk Score: ●●●○○ Medium       │
  │  Pool Utilization: 67%          │
  └─────────────────────────────────┘
  (Numbers animate as sliders move — debounced contract call)

───────────────────────────────────

STEP 3: Choose Payment Token

  Token selector grid (large tiles):
  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
  │  ETH │ │ USDC │ │  DAI │ │ WBTC │
  │      │ │      │ │      │ │      │
  │0.042 │ │$124  │ │$124  │ │0.002 │
  │/mo   │ │/mo   │ │/mo   │ │/mo   │
  └──────┘ └──────┘ └──────┘ └──────┘
  
  Selected token shows glowing border (teal).
  Balance shown below each option.
  Approve token button (if ERC-20, not ETH).
  
  Auto-pay toggle:
  ━━━━━━━━━━━━━━━━━━━━━━━
  🔄 Enable Auto-Renewal      [●──] ON
  Automatically pay premium from wallet each month.
  ━━━━━━━━━━━━━━━━━━━━━━━

───────────────────────────────────

STEP 4: Review & Confirm

  Summary card:
  ┌──────────────────────────────────────────┐
  │  📋 Policy Summary                        │
  │  ─────────────────────────────────────   │
  │  Type:           DeFi - Smart Contract    │
  │  Coverage:       $50,000                  │
  │  Duration:       6 Months                 │
  │  Start Date:     Today (Jan 10, 2025)     │
  │  End Date:       July 10, 2025            │
  │  Payment:        0.042 ETH/month in ETH   │
  │  Auto-renew:     Enabled                  │
  │  ─────────────────────────────────────   │
  │  First Payment:  0.042 ETH (~$124)        │
  │  Gas Estimate:   ~$4.20                   │
  │  Pool:           DeFi Shield Pool #1      │
  └──────────────────────────────────────────┘

  Legal acknowledgment checkbox:
  ☐ I agree to the Policy Terms and understand this is a  
    blockchain-based smart contract. [Read Terms]
  
  [← Back]     [Confirm & Pay on Chain →]
  
  On click → TxStatusModal:
    States: Confirming → Submitted → Mined → Success
    Shows tx hash with Etherscan link.
    Confetti animation on success.
```

---

### 4.5 CLAIMS FILING WIZARD

**Route**: `/claims/file`

```
Step Indicator:
  ①──②──③──④
  Policy  Incident  Evidence  Review

STEP 1: Select Policy
  Dropdown/card selector of user's active policies
  Each option shows: Policy ID, type, coverage amount, status

STEP 2: Describe Incident

  [DeFi Claims:]
  - Incident type radio: Exploit / Hack / Oracle failure / Other
  - Protocol name input (with auto-suggest)
  - Incident date (date picker)  
  - Transaction hash that shows the loss (input with Etherscan validate btn)
  - Estimated loss amount (with ETH ↔ USD toggle)
  - Description textarea (500 chars)

  [Health Claims:]
  - Claim type: Hospitalization / Outpatient / Specialist / Emergency
  - Treatment date(s)
  - Provider name
  - Description textarea
  - Estimated claim amount

STEP 3: Upload Evidence
  Drag-and-drop upload zone:
  ┌─────────────────────────────────────┐
  │      📎 Drag files here or          │
  │         [Browse Files]              │
  │                                     │
  │  Supported: PDF, JPG, PNG, IPFS     │
  │  Max 25MB per file                  │
  └─────────────────────────────────────┘
  
  Uploaded files list:
  [🗂️ hospital_invoice.pdf  2.4MB ✅ Uploaded to IPFS]
  [🖼️ tx_screenshot.png     1.1MB ✅ Uploaded to IPFS]
  
  Files uploaded to IPFS via web3.storage/Pinata.
  IPFS CID stored onchain with claim.
  
  Oracle Check Indicator (DeFi only):
  "🤖 Chainlink Oracle is checking this incident automatically..."
  → Spinner → Result: ✅ Confirmed (auto-approved) OR ⚠️ Manual review needed

STEP 4: Review & Submit
  Summary of claim details.
  Gas estimate.
  [Submit Claim Onchain →]
  
  On submission:
  - Tx submitted → pending state
  - Claim ID generated
  - Status page redirect
```

---

### 4.6 CLAIM STATUS PAGE

**Route**: `/claims/[id]`

```
Header: 
  Claim #C-2847 | DeFi Smart Contract | $12,000 | ⏳ Under Review

Timeline component (vertical stepper):

  ✅ Claim Submitted        Jan 10, 2025, 2:34 PM
     Tx: 0x1234...abcd [Etherscan ↗]
  
  ✅ Chainlink Oracle Check  Jan 10, 2025, 2:35 PM
     "Incident confirmed onchain. Protocol hack verified."
  
  ⏳ Admin Review            Assigned to: Reviewer #3
     Est. completion: 24-48 hours
     "Complex case — manual verification required."
  
  ○ Payout Decision
     Pending review
  
  ○ Funds Disbursed
     Pending approval

Right panel:
  Claim Details card (all metadata)
  Evidence section (IPFS links to files, clickable)
  Communication thread (policyholder ↔ admin messages)
    → Input field to add comment/response
  
  Appeal section (if rejected):
    [File Appeal →] — triggers DAO vote or escalation
```

---

### 4.7 LIQUIDITY PROVIDER DASHBOARD

**Route**: `/pool`

```
Hero stats (top):
  Total Deposited: $84.2M  |  Your Deposit: $12,400  |  Earned Yield: $842  |  APY: 14.2%

Pool cards (3 pools):
┌────────────────────────────────────────┐
│  💧 DeFi Shield Pool                    │
│  ───────────────────────────────────   │
│  Total Liquidity: $42M                  │
│  Utilization: ████████░░ 67%           │
│  Current APY: 18.4%                    │
│  Risk Level: ●●●○○ Medium              │
│                                        │
│  Your Position: $8,200                 │
│  Your Earned: $412 USDC                │
│                                        │
│  [Deposit]  [Withdraw]  [Details →]   │
└────────────────────────────────────────┘

Deposit/Withdraw Modal (glassmorphic):
  Token selector (ETH/USDC/DAI)
  Amount input with MAX button
  Your share: X%
  Expected APY: XX%
  Lock period: 7 days (if any)
  [Confirm Deposit] → TxStatusModal

Yield History Chart:
  Line chart, your cumulative earnings over time
  Toggle: USDC | ETH view

Risk Dashboard:
  Pool utilization gauge (donut chart)
  Active policies backed by this pool
  Claim exposure (how much is at risk)
  Historical loss ratio
```

---

### 4.8 ADMIN DASHBOARD

**Route**: `/admin` (role-gated — checks wallet address against admin list in Supabase)

```
Overview KPIs (6 cards):
  Pending Reviews | Approved Today | Rejected Today | 
  Avg Review Time | Total Payout Today | Fraud Flags

Claims Review Queue:
  Filterable table:
  Filter by: Type | Status | Amount | Date | Oracle Result

  Each row:
  Claim ID | Policyholder (addr) | Type | Amount | Oracle Status | Priority | Assigned | Actions

  Priority badges: 🔴 High (>$50K) | 🟡 Medium | 🟢 Low

  [Review] opens side panel (not new page):
  ┌──────────────────────────────────────────────────────────┐
  │  Claim #C-2847 Review                                     │
  │  ─────────────────────────────────────────────────────   │
  │  Policyholder: 0x1234...   [View Profile]                 │
  │  Oracle Result: ✅ Confirmed                              │
  │  Evidence: [📄 invoice.pdf] [🖼️ screenshot.png]          │
  │  ─────────────────────────────────────────────────────   │
  │  Admin Notes:                                             │
  │  [                                           ]           │
  │  ─────────────────────────────────────────────────────   │
  │  Decision:                                                │
  │  Payout Amount: [_____________] ETH                       │
  │  [✅ Approve & Pay]  [❌ Reject]  [↩ Request More Info]  │
  └──────────────────────────────────────────────────────────┘

Users Panel:
  Table of all registered wallets
  Filter by role (Policyholder / LP / Admin)
  View policies, claims per user
  [Promote to Admin] | [Suspend] actions

Protocol Analytics:
  Full analytics dashboard:
  - Premium collected by month (bar chart)
  - Claims paid vs denied ratio (donut)
  - Pool utilization over time (area chart)
  - Top claim categories
  - Risk heatmap by coverage type
```

---

## 5. COMPONENT SPECIFICATIONS

### CustomConnectButton Component
```tsx
// Wraps RainbowKit + Privy for unified auth UX
// Shows:
//   - "Connect Wallet" if no wallet
//   - "Sign in with Google" option (via Privy)
//   - After connect: Avatar + truncated address
//   - Dropdown: wallet info, copy, disconnect
// Design: Pill shape, teal border, hover glow
```

### TxStatusModal Component
```
Triggered for every onchain transaction.

States:
  1. CONFIRM: "Waiting for wallet confirmation..."
     Spinner + wallet icon
  
  2. PENDING: "Transaction submitted..."
     Animated dots + tx hash (truncated) + Etherscan link
     Estimated time remaining
  
  3. SUCCESS: ✅ + success message + confetti animation
     View on Etherscan button
     Next action button (context-specific)
  
  4. ERROR: ❌ + error message (human-readable)
     "Try Again" + "Contact Support" buttons

Design: 
  Centered modal, bg-overlay, glass effect
  Large animated icon area
  Clean typography
```

### PolicyCard Component
```
Glassmorphic card (md border-radius)
Left: Colored border accent (teal=active, yellow=expiring, red=expired)
Icon: Shield with coverage type color
Title: Coverage type
Subtitle: Policy ID (monospace)
Stats row: Amount | Premium | Expiry
Status badge
Action buttons
```

### Token Amount Input Component
```
Combined input:
[0.00   ] [ETH ▼]  Max
          (dropdown to switch token)

Shows: USD equivalent below in secondary color
Shows: Wallet balance
Validates: Insufficient balance, minimum amounts
```

---

## 6. ANIMATIONS & INTERACTIONS

### Page Transitions
```
Route changes: Fade + slight slide-up (Framer Motion AnimatePresence)
Duration: 200ms ease-out
```

### Micro-interactions
```
Button hover: Scale 1.02 + glow pulse (150ms)
Card hover: Subtle lift (translateY -2px) + shadow increase
Badge pulse: Looping pulse animation for "live" status badges
Number counters: Count-up animation on first render (react-countup)
Chart load: Lines draw in from left (SVG stroke animation)
```

### Loading States
```
Skeleton loaders: Match exact shape of content
Shimmer animation: Left-to-right gradient sweep
Empty states: Illustrated SVG + helpful CTA (not just text)
```

### Onboarding Tour (First Visit)
```
Spotlight-style tooltips highlighting key UI areas
Steps: Connect Wallet → Browse Coverage → Pool Overview
Dismissible, "Don't show again" stored in localStorage
```

---

## 7. WALLET & WEB3 UX

### RainbowKit + Privy Setup

```tsx
// providers.tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';

// Privy handles Google OAuth → creates embedded EVM wallet
// RainbowKit handles traditional wallet connections
// Both share the same wagmi config
```

### Google Login Flow
```
1. User clicks "Sign in with Google"
2. Privy opens Google OAuth popup
3. Google authenticates user
4. Privy creates a new EVM smart wallet for the user (if first time)
5. Wallet address returned to app
6. wagmi / RainbowKit context updated with this wallet
7. User is now "connected" — can sign txs via Privy's embedded signer
8. Profile created in Supabase with wallet address + google email
```

### Transaction Flow UX
```
1. User clicks action (Buy Policy, File Claim, etc.)
2. Pre-tx modal shows: what will happen, gas estimate
3. User confirms → wallet prompt opens (MetaMask/Privy popup)
4. TxStatusModal shows pending state
5. Subscribe to tx receipt via wagmi/viem
6. Update UI on confirmation (optimistic updates where safe)
7. Supabase record updated via webhook (from our indexer)
```

### Error Handling
```
User rejected: "Transaction cancelled" toast (non-intrusive)
Insufficient gas: "Not enough ETH for gas" with link to bridge/buy
Contract revert: Human-readable error (decode custom errors from ABI)
Network mismatch: Banner: "Please switch to Ethereum Mainnet"
```

---

## 8. RESPONSIVE DESIGN

### Breakpoints
```
Mobile:  < 640px   → Single column, bottom nav bar
Tablet:  640–1024px → Collapsed sidebar (icon-only)
Desktop: > 1024px  → Full sidebar + content
Wide:    > 1440px  → Max content width capped at 1440px
```

### Mobile-Specific Adaptations
```
- Bottom navigation bar (5 icons) replaces sidebar
- Swipeable cards for policy list
- Full-screen modals instead of side panels
- Simplified charts (single metric focus)
- Touch-optimized input areas (min 44px tap targets)
- RainbowKit mobile wallet deep links (WalletConnect)
```

---

## 9. ACCESSIBILITY

```
- WCAG 2.1 AA compliant
- All interactive elements keyboard navigable
- ARIA labels on all icon buttons
- Focus rings visible (custom teal outline)
- Color not the only status indicator (always + icon/text)
- Screen reader text for chart data (data tables alternative)
- Reduced motion: respects prefers-reduced-motion
- High contrast mode: fallback color variables
```

---

## 10. PERFORMANCE TARGETS

```
Lighthouse Score:    Performance ≥ 90, Accessibility ≥ 95
LCP:                < 2.5s
FID/INP:            < 100ms
CLS:                < 0.1
Bundle Size:        < 200KB initial JS (code split aggressively)
Web3 Init:          Lazy-load wagmi/rainbowkit (not on landing page SSR)
Images:             next/image with WebP, lazy loading
Fonts:              next/font with subset, display: swap
```

---

## 11. KEY DEPENDENCIES (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.4.0",
    
    "@rainbow-me/rainbowkit": "^2.1.0",
    "wagmi": "^2.12.0",
    "viem": "^2.21.0",
    "@tanstack/react-query": "^5.56.0",
    
    "@privy-io/react-auth": "^1.81.0",
    "@privy-io/wagmi": "^0.2.0",
    
    "framer-motion": "^11.11.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    
    "@supabase/supabase-js": "^2.45.0",
    
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.454.0",
    
    "sonner": "^1.5.0",
    "@tanstack/react-table": "^8.20.0",
    "date-fns": "^4.1.0",
    "react-countup": "^6.5.0"
  }
}
```

---

## 12. ENVIRONMENT VARIABLES

```env
# App
NEXT_PUBLIC_APP_URL=https://chainshield.xyz

# Privy (Social Login + Smart Wallets)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret

# WalletConnect (RainbowKit)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_INSURANCE_POOL_ADDRESS=0x...
NEXT_PUBLIC_POLICY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_CLAIMS_PROCESSOR_ADDRESS=0x...

# IPFS (evidence storage)
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
PINATA_JWT=your_pinata_jwt

# Alchemy (RPC)
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
```

---

*End of Frontend Plan — Total: 12 sections, 8 pages, full component spec.*
