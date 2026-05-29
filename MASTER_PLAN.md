# ChainShield — Production Backend Master Plan

## Context

ChainShield is a Web3 insurance protocol with a complete MVP frontend (10 pages, 97 files, Convex backend with mock data). The frontend is fully functional with demo/simulation flows but lacks real smart contracts, blockchain transactions, oracle verification, and production infrastructure. This plan takes ChainShield from "working demo" to "production-ready platform people can actually use" — while keeping the demo simulation working as a fallback throughout development.

---

## Tech Stack (Final Decisions)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Backend DB | Convex Cloud (realtime, serverless) |
| Wallet/Auth | Thirdweb ConnectWallet (social login + wallets) |
| Smart Contracts | Solidity + Thirdweb Deploy |
| Network | Ethereum Sepolia (testnet) → mainnet later |
| Oracles | Chainlink Functions (claim verification) |
| IPFS | Pinata (evidence/document storage) |
| Token | CST (ChainShield Token) — ERC-20 governance |
| Hosting | Vercel (frontend) + Convex Cloud (backend) |
| Admin | Role-gated routes in same app (/admin/*) |

---

## Phase 1: Backend Foundation — Convex Production Schema + Actions

### 1.1 Upgrade Convex Schema (`convex/schema.ts`)

Add missing production tables to existing schema:

```
Tables to ADD:
├── governanceProposals   — on-chain proposals, voting, execution
├── votes                 — individual vote records (wallet, proposalId, weight)
├── claimMessages         — communication thread on claims (claimant ↔ reviewer)
├── yieldSnapshots        — daily APY/TVL history per pool (for charts)
├── adminActions          — immutable audit log of all admin operations
├── blockchainEvents      — raw event mirror from smart contracts
└── products              — move mock product catalog into Convex (currently hardcoded)

Tables to MODIFY:
├── users                 — add email, privyDid, lastLoginAt fields
├── policies              — add policyNftTokenId, ipfsDocumentCid, blockNumber fields
├── claims                — add decisionReason, reviewStartedAt, reviewCompletedAt, appealDeadline
├── pools                 — add contractAddress (required), minDeposit, maxCoveragePerPolicy
└── notifications         — add metadata field (JSON), actionUrl field
```

### 1.2 New Convex Functions (Mutations + Queries + Actions)

**Smart Contract Bridge Functions** (`convex/actions/`):
- `convex/actions/blockchain.ts` — Convex Actions (not mutations) that call Thirdweb SDK to interact with smart contracts. Actions can make external HTTP calls, mutations cannot.
  - `purchasePolicyOnchain` — calls PolicyManager.purchasePolicy(), stores tx hash
  - `submitClaimOnchain` — calls ClaimsProcessor.submitClaim(), stores tx hash
  - `depositToPoolOnchain` — calls InsurancePool.deposit(), stores tx hash
  - `withdrawFromPoolOnchain` — calls InsurancePool.withdraw()
  - `voteOnProposalOnchain` — calls Governor.castVote()
  - `approveClaimOnchain` — admin calls ClaimsProcessor.approveClaim()

**IPFS Upload Action** (`convex/actions/ipfs.ts`):
- `uploadEvidence` — receives file bytes, uploads to Pinata, returns CID
- `uploadPolicyDocument` — generates policy PDF metadata, pins to IPFS

**Oracle Integration Action** (`convex/actions/oracle.ts`):
- `triggerOracleCheck` — calls Chainlink Functions for DeFi claim verification
- `processOracleResponse` — callback handler, updates claim status
- `autoApproveClaim` — if oracle confirms + amount < $5K threshold

**Governance Functions** (`convex/governance.ts`):
- `createProposal` — create governance proposal (requires CST stake)
- `getActiveProposals` — list proposals in voting period
- `getProposalById` — single proposal with vote tallies
- `castVote` — record vote with CST weight
- `executeProposal` — execute passed proposal after timelock

**Admin Functions** (`convex/admin.ts`):
- `getAdminDashboard` — aggregate stats (total policies, claims, TVL, revenue)
- `getPendingClaims` — claims awaiting manual review
- `assignReviewer` — round-robin claim assignment
- `reviewClaim` — approve/reject with notes
- `suspendUser` — flag suspicious accounts
- `getAuditLog` — paginated admin action history

**Product Catalog** (`convex/products.ts`):
- `getAllProducts` — replace mock data.ts with Convex query
- `getProductById` — single product details
- `getProductsByLine` — filter by coverage line
- `seedProducts` — one-time migration from mock data to Convex

**Enhanced Existing Functions:**
- `convex/policies.ts` — add `renewPolicy`, `cancelPolicy`, `getExpiringPolicies`
- `convex/claims.ts` — add `appealClaim`, `getClaimTimeline`, `addClaimMessage`
- `convex/pools.ts` — add `getPoolHistory`, `calculateProjectedYield`
- `convex/users.ts` — add `getUserProfile`, `updateProfile`, `getUserStats`

### 1.3 Convex Cron Jobs (`convex/crons.ts`)

```
Scheduled functions:
├── checkExpiringPolicies    — daily, notify users 7d and 1d before expiry
├── processAutoRenewals      — daily, auto-renew policies with autoRenew=true
├── snapshotYields            — daily, record APY/TVL for each pool
├── expireOverduePolicies     — daily, mark past-due policies as expired
└── cleanupStaleNotifications — weekly, delete read notifications older than 30d
```

---

## Phase 2: Smart Contracts — Thirdweb Deploy

### 2.1 Contract Architecture

```
contracts/
├── core/
│   ├── PolicyManager.sol          — ERC-721 policy NFTs + lifecycle
│   ├── InsurancePool.sol          — multi-pool liquidity management
│   ├── ClaimsProcessor.sol        — claim workflow + oracle integration
│   └── PremiumVault.sol           — multi-token premium collection
├── tokens/
│   ├── ChainShieldToken.sol       — CST ERC-20 governance token
│   └── LPToken.sol                — per-pool LP share tokens
├── oracle/
│   └── ChainlinkVerifier.sol      — Chainlink Functions consumer
├── governance/
│   └── ChainShieldGovernor.sol    — OpenZeppelin Governor + Timelock
└── interfaces/
    ├── IPolicyManager.sol
    ├── IInsurancePool.sol
    └── IClaimsProcessor.sol
```

### 2.2 PolicyManager.sol (ERC-721)

Core functions:
- `purchasePolicy(coverageType, amount, duration, premiumToken, poolId)` → mints NFT
- `renewPolicy(policyId)` → extends endDate, collects premium
- `cancelPolicy(policyId)` → burns NFT, partial refund if applicable
- `calculatePremium(coverageType, amount, token)` → dynamic pricing based on pool utilization
- Events: `PolicyCreated`, `PolicyRenewed`, `PolicyCancelled`, `PremiumPaid`

### 2.3 InsurancePool.sol

Core functions:
- `deposit(poolId, token, amount)` → mint LP shares, add liquidity
- `withdraw(poolId, shares)` → burn LP shares, return funds (respects lock period)
- `payoutClaim(claimant, amount, poolId)` → called by ClaimsProcessor only
- `getUtilizationRate(poolId)` → basis points (0-10000)
- `distributeYield(poolId)` → distribute premium revenue to LPs
- Events: `LiquidityAdded`, `LiquidityRemoved`, `ClaimPaid`, `YieldDistributed`

### 2.4 ClaimsProcessor.sol

Core functions:
- `submitClaim(policyId, amount, evidenceCIDs, incidentData)` → triggers oracle
- `fulfillOracleVerification(requestId, confirmed, verifiedAmount)` → Chainlink callback
- `approveClaim(claimId, amount, notes)` → REVIEWER_ROLE only
- `rejectClaim(claimId, reason)` → REVIEWER_ROLE only
- `appealClaim(claimId, newEvidence)` → claimant can appeal rejection
- Auto-approve threshold: claims < $5,000 with oracle confirmation
- Events: `ClaimSubmitted`, `ClaimApproved`, `ClaimRejected`, `OracleResponse`

### 2.5 ChainShieldToken.sol (CST)

- ERC-20 + ERC20Votes (OpenZeppelin)
- Initial supply: 100,000,000 CST
- Distribution: 40% community/LP rewards, 20% treasury, 20% team (4yr vest), 10% early users, 10% reserve
- LP staking rewards: CST emitted per block proportional to pool TVL
- Governance weight: 1 CST = 1 vote

### 2.6 Deployment via Thirdweb

- Use `npx thirdweb deploy` to deploy each contract to Sepolia
- Thirdweb Dashboard provides verified contract UI, read/write explorer
- Frontend uses `thirdweb` SDK `getContract()` + `prepareContractCall()` to interact
- Contract addresses stored as env vars: `VITE_POLICY_MANAGER_ADDRESS`, etc.

---

## Phase 3: Frontend ↔ Backend Integration

### 3.1 Dual-Mode Architecture (Demo + Live)

**Critical**: Keep demo simulation working alongside real blockchain. Use a feature flag:

```
VITE_MODE = "demo" | "live"
```

- `demo` mode: Uses existing Convex mock data, simulated transactions, no real blockchain
- `live` mode: Real smart contract calls, real Convex persistence, real IPFS uploads
- Each hook checks mode and branches accordingly
- Users can toggle in UI (dev/staging only)

### 3.2 Hook Upgrades (src/hooks/)

**`usePurchasePolicy.ts`** — currently mock, upgrade to:
1. Call Thirdweb `prepareContractCall` → PolicyManager.purchasePolicy()
2. User signs transaction via ConnectWallet
3. Wait for tx confirmation
4. Call Convex mutation to store policy record with txHash
5. Return { status, txHash, policyId }
6. In demo mode: simulate delay, generate fake txHash, store in Convex

**`useSubmitClaim.ts`** — currently mock, upgrade to:
1. Upload evidence files to Pinata via Convex action → get CIDs
2. Call Thirdweb → ClaimsProcessor.submitClaim()
3. Store claim in Convex with txHash + CIDs
4. Oracle check triggered automatically by contract event
5. In demo mode: simulate upload, fake CIDs, store in Convex with simulated status progression

**`useStake.ts`** — currently mock, upgrade to:
1. Approve token spend (if ERC-20)
2. Call Thirdweb → InsurancePool.deposit()
3. Store LP position in Convex
4. In demo mode: simulate deposit, update Convex

**`useGovernance.ts`** — NEW hook:
1. `createProposal` → Governor.propose()
2. `castVote` → Governor.castVote()
3. Sync proposal state from chain to Convex

**`useClaimTimeline.ts`** — NEW hook:
- Real-time subscription to claim status changes
- Shows: Submitted → Oracle Check → Auto-Approved/Manual Review → Approved/Rejected → Paid

**`useNotifications.ts`** — NEW hook:
- Subscribe to Convex notifications table
- Mark as read
- Bell icon badge count in TopNav

### 3.3 Page Integration Map

| Page | Data Source (Demo) | Data Source (Live) | Write Operations |
|------|-------------------|-------------------|-----------------|
| `/` Landing | Hardcoded stats | Convex aggregate queries | None |
| `/cover` Browse | mock/data.ts products | Convex `products` table | None |
| `/cover/:id` Detail | mock/data.ts single | Convex `getProductById` | Purchase policy (contract) |
| `/app` Dashboard | Convex mock policies | Convex + chain sync | None (read-only) |
| `/claims` | Convex mock claims | Convex + chain events | Submit claim (contract + IPFS) |
| `/stake` | Convex mock pools | Convex + chain TVL | Deposit/Withdraw (contract) |
| `/governance` | Hardcoded proposals | Convex + Governor contract | Vote/Propose (contract) |
| `/admin/*` | N/A (NEW) | Convex admin queries | Review claims, manage users |

### 3.4 New Pages to Build

**`/admin` — Admin Dashboard** (role-gated, only `role === "admin"` or `"reviewer"`):
- Stats cards: total policies, active claims, TVL, revenue
- Pending claims queue with assign/review actions
- User management table (suspend, change roles)
- Pool management (create, pause, adjust parameters)
- Audit log viewer

**`/admin/claims/:id` — Claim Review**:
- Full claim details with evidence viewer (IPFS images/docs)
- Oracle verdict display
- Approve/Reject form with required notes
- Communication thread with claimant

**`/profile` — User Profile**:
- Wallet address, email (if social login)
- KYC status indicator
- Total coverage, total earned (LP), claim history summary
- Notification preferences

### 3.5 Wallet Integration (Thirdweb ConnectWallet)

Current setup already uses Thirdweb. Enhancements needed:

- Configure `ConnectButton` with social login options (Google, Email, Phone)
- On first connect: Convex `createOrUpdateUser` mutation fires automatically
- Store wallet address in React context for all downstream hooks
- Add network switching UI (Sepolia in dev, mainnet later)
- Transaction confirmation modals with gas estimation
- Transaction history panel

### 3.6 Event Indexing (Chain → Convex Sync)

Use Convex HTTP Actions as webhook endpoints:

**`convex/http.ts`** — HTTP router for external webhooks:
- `POST /events/alchemy` — Alchemy webhook receiver
  - Verifies signature
  - Parses contract events (PolicyCreated, ClaimSubmitted, etc.)
  - Calls internal mutations to update Convex records
  - Creates notifications for affected users

**Alchemy Webhook Setup**:
- Create Alchemy Notify webhook pointing to `https://<convex-deployment>.convex.site/events/alchemy`
- Monitor contract addresses: PolicyManager, ClaimsProcessor, InsurancePool
- Events indexed: PolicyCreated, PolicyRenewed, ClaimSubmitted, ClaimApproved, ClaimRejected, LiquidityAdded, LiquidityRemoved, PremiumPaid

---

## Phase 4: Chainlink Oracle Integration

### 4.1 Chainlink Functions Setup

For DeFi claims only (Health/Auto/Life/Travel claims always go to manual review):

1. Deploy `ChainlinkVerifier.sol` as Chainlink Functions consumer
2. Create Chainlink Functions subscription on Sepolia
3. JavaScript source code runs off-chain, verifies:
   - Was there a real exploit on the claimed protocol? (check DeFiLlama API)
   - Does the incident tx hash show actual fund loss?
   - Does the loss amount match the claim?
4. Returns `(bool confirmed, uint256 verifiedAmount)` to contract
5. Contract emits `OracleResponse` event → Alchemy webhook → Convex update

### 4.2 Auto-Approve Logic

```
IF oracle_verdict === "confirmed" AND claim_amount < $5,000:
  → Auto-approve, trigger payout from pool
ELSE IF oracle_verdict === "confirmed" AND claim_amount >= $5,000:
  → Flag for manual review (large amount)
ELSE IF oracle_verdict === "unconfirmed":
  → Flag for manual review (oracle couldn't verify)
ELSE (non-DeFi claims):
  → Always manual review
```

### 4.3 Demo Mode Oracle Simulation

In demo mode, simulate oracle with a delayed Convex scheduled function:
- Submit claim → status = "Oracle check"
- After 10 seconds → simulate oracle response (random pass/fail weighted 80/20)
- If pass + small amount → auto-approve
- Otherwise → manual review status

---

## Phase 5: IPFS Integration (Pinata)

### 5.1 Evidence Upload Flow

1. User selects files in Claims form (images, PDFs, up to 10MB each)
2. Frontend sends files to Convex Action (`uploadEvidence`)
3. Convex Action calls Pinata API:
   ```
   POST https://api.pinata.cloud/pinning/pinFileToIPFS
   Headers: Authorization: Bearer <PINATA_JWT>
   ```
4. Returns array of IPFS CIDs
5. CIDs stored in claim record AND passed to smart contract
6. Evidence viewable via `https://gateway.pinata.cloud/ipfs/<CID>`

### 5.2 Policy Document Storage

- On policy creation, generate JSON metadata (coverage details, terms)
- Pin to IPFS via Pinata
- Store CID in policy record (ipfsDocumentCid field)
- Policy NFT tokenURI points to this IPFS metadata

### 5.3 Demo Mode IPFS Simulation

In demo mode: generate fake CIDs (`QmSIMULATED_<random>`), skip Pinata calls.

---

## Phase 6: CST Governance Token

### 6.1 Token Contract

- Deploy ChainShieldToken.sol via Thirdweb Deploy
- ERC-20 with ERC20Votes extension (OpenZeppelin)
- Minting controlled by MINTER_ROLE (assigned to InsurancePool for LP rewards)

### 6.2 LP Reward Distribution

- LPs earn CST proportional to their share of pool liquidity
- Reward rate: configurable CST per block per pool
- Claim rewards via `InsurancePool.claimRewards(poolId)`
- Frontend shows accrued rewards in Stake page

### 6.3 Governance Flow

1. User with ≥10,000 CST can create proposal
2. Voting period: 7 days
3. Quorum: 4% of total supply
4. If passed: 2-day timelock, then executable
5. Proposal types: adjust pool parameters, add coverage types, upgrade contracts

### 6.4 Demo Mode Governance

In demo mode: proposals and votes stored only in Convex, no contract calls. Simulated CST balances.

---

## Phase 7: Admin Dashboard

### 7.1 Route Structure

```
/admin                   — Dashboard overview (stats, charts, alerts)
/admin/claims            — Claims queue (pending, in-review, resolved)
/admin/claims/:id        — Single claim review interface
/admin/users             — User management table
/admin/pools             — Pool management
/admin/audit             — Audit log viewer
```

### 7.2 Access Control

- Convex queries check `role` field on user record
- Frontend route guard: redirect non-admins to `/app`
- Admin role assigned manually via Convex dashboard (or by existing admin)

### 7.3 Claim Review Interface

- Evidence gallery (load images from IPFS gateway)
- Oracle verdict badge (pass/fail/n/a)
- Policy details sidebar
- Approve button → calls `approveClaimOnchain` action
- Reject button → requires reason text
- Message thread with claimant

---

## Phase 8: Production Deployment

### 8.1 Environment Setup

```env
# Vercel Environment Variables
VITE_CONVEX_URL=https://xxx.convex.cloud
VITE_THIRDWEB_CLIENT_ID=xxx
VITE_ALCHEMY_ID=xxx
VITE_MODE=demo                            # "demo" or "live"

# Contract Addresses (Sepolia)
VITE_POLICY_MANAGER_ADDRESS=0x...
VITE_INSURANCE_POOL_ADDRESS=0x...
VITE_CLAIMS_PROCESSOR_ADDRESS=0x...
VITE_CST_TOKEN_ADDRESS=0x...
VITE_GOVERNOR_ADDRESS=0x...
VITE_CHAINLINK_VERIFIER_ADDRESS=0x...

# Convex Environment Variables (server-side)
PINATA_JWT=xxx
PINATA_GATEWAY=https://gateway.pinata.cloud
ALCHEMY_WEBHOOK_SECRET=xxx
CHAINLINK_SUBSCRIPTION_ID=xxx
```

### 8.2 Deployment Pipeline

```
1. Smart Contracts:
   npx thirdweb deploy          → deploy to Sepolia
   Verify on Etherscan          → automatic via Thirdweb
   Store addresses in .env      → update Vercel env vars

2. Convex Backend:
   npx convex deploy            → deploy schema + functions to Convex Cloud
   npx convex run seed:seedProducts → populate product catalog

3. Frontend:
   Vercel auto-deploys from git push to main
   Preview deploys on PRs

4. Webhooks:
   Configure Alchemy Notify     → point to Convex HTTP endpoint
   Configure Chainlink sub      → fund with LINK on Sepolia
```

### 8.3 Domain & SSL

- Frontend: `chainshield.xyz` (or `.io`) → Vercel
- Convex: auto-provisioned subdomain with SSL
- IPFS gateway: Pinata dedicated gateway (optional)

---

## Phase 9: Testing Strategy

### 9.1 Unit Tests (Vitest)

- All Convex functions: test queries/mutations with mock data
- All React hooks: test with @testing-library/react-hooks
- Utility functions: format, validation, calculations

### 9.2 Integration Tests

- Convex Action tests: mock Pinata/Alchemy HTTP calls
- Smart contract tests: Hardhat/Foundry test suite on local fork
- Full flow tests: purchase → claim → oracle → payout

### 9.3 E2E Tests (Playwright)

- Happy paths: connect wallet → browse → purchase → view dashboard
- Claims flow: file claim → upload evidence → track status
- Staking flow: deposit → earn yield → withdraw
- Admin flow: login as admin → review claim → approve/reject

### 9.4 Demo Mode Always Works

- All E2E tests run in demo mode by default
- Separate test suite for live mode on Sepolia fork
- CI/CD runs demo mode tests on every PR

---

## Implementation Order (Build Sequence)

### Sprint 1: Foundation
1. Upgrade `convex/schema.ts` with all new tables and fields
2. Move mock product catalog into Convex `products` table
3. Create `convex/products.ts` queries
4. Create `convex/admin.ts` queries and mutations
5. Create `convex/governance.ts` queries and mutations
6. Add `VITE_MODE` feature flag, create `useAppMode()` hook
7. Refactor existing hooks to check mode (demo vs live)

### Sprint 2: Smart Contracts
8. Write PolicyManager.sol, InsurancePool.sol, ClaimsProcessor.sol
9. Write ChainShieldToken.sol, LPToken.sol
10. Write ChainShieldGovernor.sol
11. Deploy all contracts to Sepolia via Thirdweb
12. Store contract addresses in environment config
13. Create `src/lib/contracts.ts` — Thirdweb contract instances

### Sprint 3: Contract Integration
14. Create `convex/actions/blockchain.ts` — all onchain action wrappers
15. Upgrade `usePurchasePolicy` hook — real contract call in live mode
16. Upgrade `useSubmitClaim` hook — real contract call + IPFS
17. Upgrade `useStake` hook — real deposit/withdraw
18. Create `convex/actions/ipfs.ts` — Pinata upload actions
19. Create `convex/http.ts` — Alchemy webhook receiver
20. Set up Alchemy Notify webhooks for contract events

### Sprint 4: Oracle + Governance
21. Write ChainlinkVerifier.sol, deploy to Sepolia
22. Create Chainlink Functions subscription, fund with LINK
23. Create `convex/actions/oracle.ts` — oracle trigger + response handler
24. Implement auto-approve logic in ClaimsProcessor
25. Connect Governance page to Governor contract
26. Implement CST staking rewards in InsurancePool

### Sprint 5: Admin + Polish
27. Build `/admin` dashboard page with stats
28. Build `/admin/claims` queue with review interface
29. Build `/admin/claims/:id` detail with evidence viewer
30. Build `/admin/users` management table
31. Build `/profile` page
32. Add notification system (bell icon, real-time via Convex subscriptions)
33. Create `convex/crons.ts` — scheduled jobs

### Sprint 6: Testing + Deploy
34. Write Vitest unit tests for all Convex functions
35. Write Playwright E2E tests (demo mode)
36. Deploy Convex to production
37. Deploy frontend to Vercel
38. Configure production webhooks
39. Smoke test full flow on Sepolia
40. Launch demo mode publicly

---

## Files to Create

```
convex/
├── products.ts                    — product catalog CRUD
├── governance.ts                  — proposals, votes
├── admin.ts                       — admin dashboard, claim review, user mgmt
├── crons.ts                       — scheduled jobs
├── http.ts                        — HTTP webhook endpoints
├── actions/
│   ├── blockchain.ts              — smart contract interaction actions
│   ├── ipfs.ts                    — Pinata upload actions
│   └── oracle.ts                  — Chainlink oracle actions

contracts/
├── core/
│   ├── PolicyManager.sol
│   ├── InsurancePool.sol
│   ├── ClaimsProcessor.sol
│   └── PremiumVault.sol
├── tokens/
│   ├── ChainShieldToken.sol
│   └── LPToken.sol
├── oracle/
│   └── ChainlinkVerifier.sol
├── governance/
│   └── ChainShieldGovernor.sol

src/
├── hooks/
│   ├── useAppMode.ts              — demo vs live mode flag
│   ├── useGovernance.ts           — governance actions
│   ├── useClaimTimeline.ts        — real-time claim status
│   ├── useNotifications.ts        — notification subscription
│   └── useAdmin.ts                — admin data hooks
├── lib/
│   └── contracts.ts               — Thirdweb contract instances
├── pages/
│   ├── Admin.tsx                  — admin dashboard
│   ├── AdminClaims.tsx            — claims review queue
│   ├── AdminClaimDetail.tsx       — single claim review
│   ├── AdminUsers.tsx             — user management
│   └── Profile.tsx                — user profile
├── components/
│   ├── admin/
│   │   ├── StatsCards.tsx
│   │   ├── ClaimReviewForm.tsx
│   │   ├── EvidenceGallery.tsx
│   │   ├── UserTable.tsx
│   │   └── AuditLog.tsx
│   └── NotificationBell.tsx
```

## Files to Modify

```
convex/schema.ts                   — add new tables, extend existing
convex/claims.ts                   — add appeal, timeline, messages
convex/policies.ts                 — add renew, cancel, expiry check
convex/pools.ts                    — add history, yield calculation
convex/users.ts                    — add profile, stats, admin queries

src/App.tsx                        — add admin routes, profile route
src/hooks/usePurchasePolicy.ts     — dual-mode (demo + live)
src/hooks/useSubmitClaim.ts        — dual-mode + IPFS upload
src/hooks/useStake.ts              — dual-mode
src/hooks/useClaims.ts             — add timeline subscription
src/components/TopNav.tsx          — add notification bell, admin link
src/components/AppLayout.tsx       — admin sidebar for admin users
src/pages/Governance.tsx           — connect to real governance hooks
src/pages/ProposalDetail.tsx       — connect to voting hooks
src/pages/Claims.tsx               — IPFS evidence upload UI
src/pages/Stake.tsx                — CST rewards display
src/pages/Dashboard.tsx            — real aggregated stats
```

## Verification

1. **Demo mode**: `VITE_MODE=demo` → all existing flows still work exactly as before, no blockchain required
2. **Live mode**: `VITE_MODE=live` → connect wallet on Sepolia, purchase policy (real tx), file claim (real IPFS + tx), stake (real tx), vote (real tx)
3. **Admin**: Login with admin wallet → see dashboard, review claims, approve/reject
4. **Oracle**: Submit DeFi claim → oracle checks → auto-approve (small) or manual review (large)
5. **Notifications**: Real-time bell updates when claim status changes, policy expiring, etc.
6. **E2E**: `npm run test:e2e` passes all Playwright tests in demo mode
