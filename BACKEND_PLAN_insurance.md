# ChainShield — Web3 Insurance Platform
## Complete Backend Integration Plan

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (Next.js)                      │
│     RainbowKit + Privy (Google OAuth)  →  wagmi/viem hooks          │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │                                  │
        ┌──────▼──────┐                   ┌───────▼────────┐
        │   SUPABASE   │                   │  ETHEREUM RPC   │
        │   (Backend)  │                   │  (Alchemy/Infura)│
        │              │                   │                 │
        │ - Auth/Users │                   │ Smart Contracts │
        │ - Off-chain  │◄─── Webhook ──────│ - PolicyManager│
        │   metadata   │    (Events)       │ - InsurancePool│
        │ - Claims data│                   │ - ClaimsProc.  │
        │ - Admin logs │                   │ - MultiToken   │
        │ - Edge Fns   │                   │   Premium      │
        └──────────────┘                   └───────┬────────┘
               │                                   │
        ┌──────▼──────┐                   ┌────────▼───────┐
        │  SUPABASE    │                   │   CHAINLINK    │
        │  Storage     │                   │   Oracles      │
        │  (IPFS hash  │                   │   (auto claim  │
        │   metadata)  │                   │    verification)│
        └──────────────┘                   └────────────────┘
```

### Data Flow Summary
1. **User connects** via RainbowKit/Privy → Supabase user profile created
2. **User buys policy** → Smart contract tx → Supabase webhook receives PolicyCreated event → stores metadata
3. **User files claim** → Evidence uploaded to IPFS via Pinata → IPFS CID stored onchain via ClaimsProcessor contract → Supabase mirrors claim data
4. **Oracle check** → Chainlink Automation triggers oracle verification → auto-approves or flags for manual review → event emitted → Supabase updated
5. **Admin reviews** → Reads from Supabase → calls approveClaim() onchain → Supabase updated via webhook

---

## 2. SUPABASE SETUP

### 2.1 Project Configuration

```
Supabase Project: chainshield-prod
Region: us-east-1 (or closest to user base)
Plan: Pro (for realtime + edge functions)
```

### 2.2 Authentication Configuration

```
In Supabase Dashboard → Authentication:

1. Enable "Email" provider (for admin accounts)
2. Enable "Custom JWT" provider for Privy integration:
   - Privy issues JWTs on Google OAuth
   - Supabase verifies them via JWKS endpoint
   - Privy JWKS URL: https://auth.privy.io/api/v1/apps/{APP_ID}/jwks.json
   - Add this as a custom JWT secret in Supabase

JWT Hook (Edge Function) — runs on each auth:
  - Reads wallet address from Privy JWT claims
  - Looks up or creates user in public.users table
  - Adds custom claims: { role, wallet_address }
```

### 2.3 Complete Database Schema

```sql
-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address  TEXT UNIQUE NOT NULL,     -- checksummed EVM address
  privy_did       TEXT UNIQUE,              -- Privy user DID (from Google OAuth)
  email           TEXT,                     -- from Google OAuth (if signed in)
  display_name    TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'policyholder'
                  CHECK (role IN ('policyholder', 'liquidity_provider', 'admin', 'reviewer')),
  kyc_status      TEXT DEFAULT 'none'
                  CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  is_suspended    BOOLEAN DEFAULT FALSE,
  total_coverage  NUMERIC(20,8) DEFAULT 0,  -- total active coverage in ETH
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX idx_users_wallet ON public.users(wallet_address);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================================
-- POLICIES TABLE
-- ============================================================
CREATE TABLE public.policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_policy_id BIGINT UNIQUE NOT NULL,    -- ID from smart contract
  policyholder      TEXT NOT NULL REFERENCES public.users(wallet_address),
  coverage_type     TEXT NOT NULL
                    CHECK (coverage_type IN (
                      'defi_smart_contract',
                      'defi_protocol_hack', 
                      'defi_oracle_failure',
                      'health_basic',
                      'health_standard',
                      'health_premium',
                      'life_term'
                    )),
  coverage_amount   NUMERIC(20,8) NOT NULL,    -- in ETH equivalent
  coverage_amount_usd NUMERIC(20,2),
  premium_amount    NUMERIC(20,8) NOT NULL,    -- per period, in premium token
  premium_token     TEXT NOT NULL,             -- ETH / USDC / DAI / WBTC
  premium_token_address TEXT,                  -- ERC20 address (null for ETH)
  payment_frequency TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly', 'one_time')),
  auto_renew        BOOLEAN DEFAULT FALSE,
  pool_id           UUID REFERENCES public.pools(id),
  policy_nft_token_id BIGINT,                  -- ERC-721 token ID if policies are NFTs
  start_date        TIMESTAMPTZ NOT NULL,
  end_date          TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'claimed')),
  beneficiaries     JSONB DEFAULT '[]'::jsonb, -- [{address, percentage, name}]
  metadata          JSONB DEFAULT '{}'::jsonb, -- coverage-specific metadata
  tx_hash_created   TEXT NOT NULL,             -- creation transaction hash
  block_number      BIGINT,
  ipfs_document_cid TEXT,                      -- policy document on IPFS
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policies_policyholder ON public.policies(policyholder);
CREATE INDEX idx_policies_status ON public.policies(status);
CREATE INDEX idx_policies_end_date ON public.policies(end_date);
CREATE INDEX idx_policies_onchain_id ON public.policies(onchain_policy_id);

-- ============================================================
-- PREMIUMS TABLE (payment history)
-- ============================================================
CREATE TABLE public.premiums (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id       UUID NOT NULL REFERENCES public.policies(id),
  payer_address   TEXT NOT NULL,
  amount          NUMERIC(20,8) NOT NULL,
  token           TEXT NOT NULL,
  usd_equivalent  NUMERIC(20,2),
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  tx_hash         TEXT UNIQUE NOT NULL,
  block_number    BIGINT,
  status          TEXT DEFAULT 'confirmed'
                  CHECK (status IN ('pending', 'confirmed', 'failed')),
  paid_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_premiums_policy ON public.premiums(policy_id);
CREATE INDEX idx_premiums_payer ON public.premiums(payer_address);

-- ============================================================
-- CLAIMS TABLE
-- ============================================================
CREATE TABLE public.claims (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_claim_id    BIGINT UNIQUE NOT NULL,
  policy_id           UUID NOT NULL REFERENCES public.policies(id),
  claimant            TEXT NOT NULL REFERENCES public.users(wallet_address),
  claim_type          TEXT NOT NULL,           -- mirrors coverage_type
  incident_type       TEXT,                    -- sub-type of claim
  incident_date       TIMESTAMPTZ,
  description         TEXT NOT NULL,
  
  -- Financials
  requested_amount    NUMERIC(20,8) NOT NULL,
  approved_amount     NUMERIC(20,8),
  payout_token        TEXT,
  payout_tx_hash      TEXT,
  
  -- DeFi-specific fields
  protocol_name       TEXT,
  incident_tx_hash    TEXT,                    -- tx showing the loss
  affected_contract   TEXT,                    -- contract address exploited
  
  -- Health-specific fields  
  provider_name       TEXT,
  treatment_dates     JSONB,                   -- [{start, end}]
  diagnosis_codes     TEXT[],                  -- ICD codes (encrypted)
  
  -- Verification
  oracle_verdict      TEXT
                      CHECK (oracle_verdict IN ('confirmed', 'unconfirmed', 'inconclusive', 'pending')),
  oracle_data         JSONB,                   -- raw Chainlink response
  oracle_checked_at   TIMESTAMPTZ,
  
  -- Review workflow
  status              TEXT NOT NULL DEFAULT 'submitted'
                      CHECK (status IN (
                        'submitted',
                        'oracle_check',
                        'auto_approved',
                        'manual_review',
                        'approved',
                        'rejected',
                        'appealed',
                        'paid'
                      )),
  assigned_reviewer   UUID REFERENCES public.users(id),
  reviewer_notes      TEXT,
  review_started_at   TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  decision_reason     TEXT,
  
  -- Evidence
  evidence_ipfs_cids  TEXT[] DEFAULT '{}',     -- array of IPFS CIDs
  evidence_metadata   JSONB DEFAULT '[]'::jsonb,
  
  -- Onchain
  tx_hash_submitted   TEXT NOT NULL,
  block_number        BIGINT,
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_policy ON public.claims(policy_id);
CREATE INDEX idx_claims_claimant ON public.claims(claimant);
CREATE INDEX idx_claims_status ON public.claims(status);
CREATE INDEX idx_claims_reviewer ON public.claims(assigned_reviewer);

-- ============================================================
-- CLAIM MESSAGES (comms thread)
-- ============================================================
CREATE TABLE public.claim_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID NOT NULL REFERENCES public.claims(id),
  sender_id   UUID NOT NULL REFERENCES public.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('claimant', 'reviewer', 'admin', 'system')),
  message     TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT FALSE,           -- internal admin notes
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claim_messages_claim ON public.claim_messages(claim_id);

-- ============================================================
-- POOLS TABLE (Liquidity Pools)
-- ============================================================
CREATE TABLE public.pools (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_pool_id       BIGINT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,          -- "DeFi Shield Pool #1"
  description           TEXT,
  pool_type             TEXT NOT NULL
                        CHECK (pool_type IN ('defi', 'health', 'mixed')),
  accepted_tokens       TEXT[] NOT NULL,        -- tokens this pool accepts
  
  -- Financials (mirrored from chain, refreshed via indexer)
  total_liquidity       NUMERIC(30,8) DEFAULT 0,
  total_liquidity_usd   NUMERIC(20,2) DEFAULT 0,
  utilized_amount       NUMERIC(30,8) DEFAULT 0,
  utilization_rate      NUMERIC(5,4) DEFAULT 0, -- 0.00 to 1.00
  current_apy           NUMERIC(8,4) DEFAULT 0, -- e.g. 14.23
  
  -- Risk parameters
  risk_level            TEXT DEFAULT 'medium'
                        CHECK (risk_level IN ('low', 'medium', 'high')),
  max_coverage_per_policy NUMERIC(20,8),
  min_deposit           NUMERIC(20,8),
  lock_period_days      INTEGER DEFAULT 7,
  
  -- Status
  is_active             BOOLEAN DEFAULT TRUE,
  is_accepting_deposits BOOLEAN DEFAULT TRUE,
  
  contract_address      TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LP POSITIONS TABLE
-- ============================================================
CREATE TABLE public.lp_positions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id           UUID NOT NULL REFERENCES public.pools(id),
  lp_address        TEXT NOT NULL REFERENCES public.users(wallet_address),
  
  deposited_amount  NUMERIC(30,8) NOT NULL,
  deposited_token   TEXT NOT NULL,
  lp_shares         NUMERIC(30,18) NOT NULL,   -- LP token amount
  
  total_earned      NUMERIC(30,8) DEFAULT 0,
  last_claimed_at   TIMESTAMPTZ,
  
  deposit_tx_hash   TEXT NOT NULL,
  deposit_at        TIMESTAMPTZ DEFAULT NOW(),
  
  is_active         BOOLEAN DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pool_id, lp_address)
);

-- ============================================================
-- YIELD HISTORY TABLE
-- ============================================================
CREATE TABLE public.yield_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id     UUID NOT NULL REFERENCES public.pools(id),
  apy         NUMERIC(8,4) NOT NULL,
  total_tvl   NUMERIC(30,8) NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_yield_pool_time ON public.yield_snapshots(pool_id, snapshot_at);

-- ============================================================
-- ADMIN ACTIONS LOG (immutable audit trail)
-- ============================================================
CREATE TABLE public.admin_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES public.users(id),
  action_type   TEXT NOT NULL,  -- 'approve_claim' | 'reject_claim' | 'suspend_user' | etc.
  target_table  TEXT,
  target_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  notes         TEXT,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id),
  type        TEXT NOT NULL,  -- 'claim_approved' | 'premium_due' | 'policy_expiring' | etc.
  title       TEXT NOT NULL,
  body        TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ============================================================
-- BLOCKCHAIN EVENTS TABLE (event indexer mirror)
-- ============================================================
CREATE TABLE public.blockchain_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    TEXT NOT NULL,
  contract_addr TEXT NOT NULL,
  tx_hash       TEXT NOT NULL,
  block_number  BIGINT NOT NULL,
  log_index     INTEGER NOT NULL,
  args          JSONB NOT NULL,
  processed     BOOLEAN DEFAULT FALSE,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX idx_events_processed ON public.blockchain_events(processed);
CREATE INDEX idx_events_name ON public.blockchain_events(event_name);

-- ============================================================
-- UPDATED_AT TRIGGER (apply to all tables)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_policies_updated_at BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_claims_updated_at BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repeat for all tables)
```

---

## 3. ROW LEVEL SECURITY (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's wallet from JWT
CREATE OR REPLACE FUNCTION get_my_wallet()
RETURNS TEXT AS $$
  SELECT LOWER(current_setting('request.jwt.claims', TRUE)::json->>'wallet_address')
$$ LANGUAGE sql STABLE;

-- Helper: get current user's role from JWT
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', TRUE)::json->>'role'
$$ LANGUAGE sql STABLE;

-- ─── USERS ─────────────────────────────────────────
-- Users can read their own profile
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (wallet_address = get_my_wallet());

-- Admins can read all users
CREATE POLICY users_select_admin ON public.users
  FOR SELECT USING (get_my_role() = 'admin');

-- Users can update their own non-critical fields
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (wallet_address = get_my_wallet())
  WITH CHECK (wallet_address = get_my_wallet());

-- System (service role) can do anything — bypasses RLS

-- ─── POLICIES ──────────────────────────────────────
CREATE POLICY policies_select_own ON public.policies
  FOR SELECT USING (policyholder = get_my_wallet());

CREATE POLICY policies_select_admin ON public.policies
  FOR SELECT USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY policies_insert_own ON public.policies
  FOR INSERT WITH CHECK (policyholder = get_my_wallet());

-- ─── CLAIMS ────────────────────────────────────────
CREATE POLICY claims_select_own ON public.claims
  FOR SELECT USING (claimant = get_my_wallet());

CREATE POLICY claims_select_admin ON public.claims
  FOR SELECT USING (get_my_role() IN ('admin', 'reviewer'));

CREATE POLICY claims_insert_own ON public.claims
  FOR INSERT WITH CHECK (claimant = get_my_wallet());

-- Reviewers can update claim status
CREATE POLICY claims_update_reviewer ON public.claims
  FOR UPDATE USING (get_my_role() IN ('admin', 'reviewer'));

-- ─── MESSAGES ──────────────────────────────────────
CREATE POLICY messages_select_parties ON public.claim_messages
  FOR SELECT USING (
    -- Claimant can see public messages on their claims
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id 
      AND c.claimant = get_my_wallet()
      AND is_internal = FALSE
    )
    OR get_my_role() IN ('admin', 'reviewer')
  );

-- ─── POOLS ─────────────────────────────────────────
-- Pools are publicly readable (TVL, APY, etc. are public)
CREATE POLICY pools_select_all ON public.pools
  FOR SELECT USING (TRUE);

-- ─── LP POSITIONS ──────────────────────────────────
CREATE POLICY lp_select_own ON public.lp_positions
  FOR SELECT USING (lp_address = get_my_wallet());

CREATE POLICY lp_select_admin ON public.lp_positions
  FOR SELECT USING (get_my_role() = 'admin');

-- ─── NOTIFICATIONS ─────────────────────────────────
CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE wallet_address = get_my_wallet())
  );
```

---

## 4. SUPABASE EDGE FUNCTIONS

### 4.1 `auth-hook` — JWT Enrichment

```typescript
// supabase/functions/auth-hook/index.ts
// Called by Supabase on every JWT verification
// Enriches JWT with wallet_address and role

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { user_id, claims } = await req.json();
  
  // Get wallet address from Privy DID stored in user metadata
  const walletAddress = claims?.wallet_address 
    || claims?.['https://privy.io/wallet_address'];
  
  if (!walletAddress) {
    return new Response(JSON.stringify({ error: 'No wallet address' }), { status: 400 });
  }
  
  // Upsert user in database
  const { data: user } = await supabase
    .from('users')
    .upsert({ 
      wallet_address: walletAddress.toLowerCase(),
      privy_did: user_id,
      email: claims?.email
    }, { onConflict: 'wallet_address' })
    .select('role, id')
    .single();
  
  // Return enriched claims
  return new Response(JSON.stringify({
    ...claims,
    wallet_address: walletAddress.toLowerCase(),
    role: user?.role || 'policyholder',
    user_db_id: user?.id
  }));
});
```

### 4.2 `blockchain-webhook` — Event Indexer

```typescript
// supabase/functions/blockchain-webhook/index.ts
// Receives Alchemy webhook events → updates Supabase DB

import { createClient } from '@supabase/supabase-js';
import { verifyAlchemySignature } from './utils/alchemy.ts';
import { parseContractEvent } from './utils/events.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  // 1. Verify Alchemy webhook signature
  const body = await req.text();
  const signature = req.headers.get('x-alchemy-signature');
  
  if (!verifyAlchemySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const payload = JSON.parse(body);
  
  for (const event of payload.event.activity) {
    const { fromAddress, toAddress, asset, hash, log } = event;
    
    // Store raw event
    await supabase.from('blockchain_events').upsert({
      event_name: log?.topics?.[0],
      contract_addr: log?.address?.toLowerCase(),
      tx_hash: hash,
      block_number: parseInt(log?.blockNumber, 16),
      log_index: parseInt(log?.logIndex, 16),
      args: log,
      processed: false
    }, { onConflict: 'tx_hash,log_index', ignoreDuplicates: true });
    
    // Process specific events
    const parsed = parseContractEvent(log);
    if (!parsed) continue;
    
    switch (parsed.eventName) {
      case 'PolicyCreated':
        await handlePolicyCreated(parsed.args);
        break;
      case 'ClaimSubmitted':
        await handleClaimSubmitted(parsed.args);
        break;
      case 'ClaimApproved':
        await handleClaimApproved(parsed.args);
        break;
      case 'ClaimRejected':
        await handleClaimRejected(parsed.args);
        break;
      case 'PremiumPaid':
        await handlePremiumPaid(parsed.args);
        break;
      case 'LiquidityAdded':
        await handleLiquidityAdded(parsed.args);
        break;
      case 'LiquidityRemoved':
        await handleLiquidityRemoved(parsed.args);
        break;
    }
  }
  
  return new Response(JSON.stringify({ ok: true }));
});

async function handlePolicyCreated(args: any) {
  const { policyId, owner, coverageType, amount, premium, startDate, endDate } = args;
  
  // Ensure user exists
  await supabase.from('users').upsert(
    { wallet_address: owner.toLowerCase() },
    { onConflict: 'wallet_address', ignoreDuplicates: true }
  );
  
  // Create policy record
  await supabase.from('policies').upsert({
    onchain_policy_id: Number(policyId),
    policyholder: owner.toLowerCase(),
    coverage_type: mapCoverageType(coverageType),
    coverage_amount: formatUnits(amount),
    premium_amount: formatUnits(premium),
    start_date: new Date(Number(startDate) * 1000).toISOString(),
    end_date: new Date(Number(endDate) * 1000).toISOString(),
    status: 'active',
    tx_hash_created: args._txHash
  }, { onConflict: 'onchain_policy_id', ignoreDuplicates: true });
  
  // Create notification
  await createNotification(owner.toLowerCase(), 'policy_created', {
    title: 'Policy Activated! 🛡️',
    body: `Your coverage of ${formatUnits(amount)} ETH is now active.`
  });
}

async function handleClaimSubmitted(args: any) {
  const { claimId, policyId, claimant, requestedAmount } = args;
  
  // Get policy DB record
  const { data: policy } = await supabase
    .from('policies')
    .select('id')
    .eq('onchain_policy_id', Number(policyId))
    .single();
  
  if (!policy) return;
  
  await supabase.from('claims').upsert({
    onchain_claim_id: Number(claimId),
    policy_id: policy.id,
    claimant: claimant.toLowerCase(),
    requested_amount: formatUnits(requestedAmount),
    status: 'oracle_check',
    tx_hash_submitted: args._txHash
  }, { onConflict: 'onchain_claim_id' });
}

async function handleClaimApproved(args: any) {
  const { claimId, approvedAmount, payoutTx } = args;
  
  await supabase.from('claims')
    .update({
      status: 'paid',
      approved_amount: formatUnits(approvedAmount),
      payout_tx_hash: payoutTx
    })
    .eq('onchain_claim_id', Number(claimId));
  
  // Notify claimant
  const { data: claim } = await supabase
    .from('claims')
    .select('claimant')
    .eq('onchain_claim_id', Number(claimId))
    .single();
    
  if (claim) {
    await createNotification(claim.claimant, 'claim_approved', {
      title: 'Claim Approved! ✅',
      body: `Your claim has been approved. Payout: ${formatUnits(approvedAmount)} ETH`
    });
  }
}
```

### 4.3 `oracle-check` — Chainlink Response Handler

```typescript
// supabase/functions/oracle-check/index.ts
// Called when Chainlink oracle responds to a claim verification

Deno.serve(async (req) => {
  const { claimId, verdict, oracleData, requestId } = await req.json();
  
  // Verify this call is from our oracle listener (authenticate with secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${Deno.env.get('ORACLE_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const newStatus = verdict === 'confirmed' ? 'auto_approved' : 'manual_review';
  
  await supabase.from('claims')
    .update({
      oracle_verdict: verdict,
      oracle_data: oracleData,
      oracle_checked_at: new Date().toISOString(),
      status: newStatus
    })
    .eq('onchain_claim_id', Number(claimId));
  
  // If auto-approved, trigger payout via smart contract
  if (verdict === 'confirmed') {
    await triggerAutoPayout(claimId);
  } else {
    // Assign to reviewer queue
    await assignToReviewer(claimId);
  }
  
  return new Response(JSON.stringify({ ok: true }));
});

async function triggerAutoPayout(claimId: number) {
  // Call our backend signer service to execute approveClaim() onchain
  // (This uses a hot wallet / relayer with minimal ETH for gas)
  await fetch(Deno.env.get('RELAYER_URL') + '/auto-payout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('RELAYER_SECRET')}` },
    body: JSON.stringify({ claimId })
  });
}

async function assignToReviewer(claimId: number) {
  // Round-robin assignment to available reviewers
  const { data: reviewers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'reviewer')
    .eq('is_suspended', false);
  
  if (!reviewers?.length) return;
  
  // Simple round-robin: assign to least-loaded reviewer
  const { data: assignments } = await supabase
    .from('claims')
    .select('assigned_reviewer')
    .eq('status', 'manual_review');
  
  const reviewerLoadMap = new Map();
  reviewers.forEach(r => reviewerLoadMap.set(r.id, 0));
  assignments?.forEach(a => {
    if (a.assigned_reviewer) {
      reviewerLoadMap.set(a.assigned_reviewer, (reviewerLoadMap.get(a.assigned_reviewer) || 0) + 1);
    }
  });
  
  const leastLoaded = [...reviewerLoadMap.entries()].sort(([,a],[,b]) => a-b)[0][0];
  
  await supabase.from('claims')
    .update({ assigned_reviewer: leastLoaded, review_started_at: new Date().toISOString() })
    .eq('onchain_claim_id', claimId);
}
```

### 4.4 `premium-reminder` — Scheduled Function

```typescript
// supabase/functions/premium-reminder/index.ts
// Runs daily via Supabase Cron
// Notifies users of upcoming premium due dates

Deno.serve(async (_req) => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  
  // Policies with next premium due in 7 days
  const { data: policies7 } = await supabase
    .from('policies')
    .select('id, policyholder, premium_amount, premium_token, end_date')
    .eq('status', 'active')
    .eq('auto_renew', false)
    .gte('end_date', in7Days.toISOString())
    .lte('end_date', in7Days.toISOString()); // within same day
  
  for (const policy of policies7 || []) {
    await createNotification(policy.policyholder, 'premium_due', {
      title: 'Premium Due in 7 Days 💳',
      body: `Policy payment of ${policy.premium_amount} ${policy.premium_token} is due soon.`
    });
  }
  
  // Policies expiring in 1 day (final warning)
  // ... similar logic for 1-day warnings
  
  return new Response(JSON.stringify({ processed: (policies7?.length || 0) }));
});
```

---

## 5. SMART CONTRACT ARCHITECTURE

```
contracts/
├── core/
│   ├── PolicyManager.sol         # Policy lifecycle management
│   ├── InsurancePool.sol         # Liquidity pool logic
│   ├── ClaimsProcessor.sol       # Claims workflow
│   └── PremiumVault.sol          # Multi-token premium handling
├── tokens/
│   ├── ChainShieldToken.sol      # (Optional) CST governance token
│   └── LPToken.sol               # ERC-20 LP shares per pool
├── oracles/
│   ├── ChainlinkVerifier.sol     # Chainlink Any API integration
│   └── OracleConsumer.sol        # Base oracle consumer
├── governance/                   # (Phase 2)
│   └── Governor.sol
└── interfaces/
    ├── IPolicyManager.sol
    ├── IInsurancePool.sol
    └── IClaimsProcessor.sol
```

### PolicyManager.sol (Key Functions)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PolicyManager is ERC721, AccessControl, ReentrancyGuard {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct Policy {
        uint256 id;
        address policyholder;
        uint8 coverageType;      // enum: DeFiSmartContract=0, HealthBasic=1, etc.
        uint256 coverageAmount;  // in wei
        uint256 premiumAmount;   // per period in token units
        address premiumToken;    // address(0) = ETH
        uint256 startDate;
        uint256 endDate;
        bool autoRenew;
        uint8 status;            // 0=pending, 1=active, 2=expired, 3=cancelled
        uint256 poolId;
        bytes32 metadataHash;    // IPFS CID as bytes32
    }
    
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public userPolicies;
    uint256 public nextPolicyId = 1;
    
    IPremiumVault public premiumVault;
    IInsurancePool public insurancePool;
    
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed owner,
        uint8 coverageType,
        uint256 coverageAmount,
        uint256 premium,
        uint256 startDate,
        uint256 endDate
    );
    
    event PolicyRenewed(uint256 indexed policyId, uint256 newEndDate);
    event PolicyCancelled(uint256 indexed policyId);
    
    constructor(address _premiumVault, address _pool) ERC721("ChainShield Policy", "CSP") {
        premiumVault = IPremiumVault(_premiumVault);
        insurancePool = IInsurancePool(_pool);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function purchasePolicy(
        uint8 _coverageType,
        uint256 _coverageAmount,
        uint256 _durationMonths,
        address _premiumToken,
        bool _autoRenew,
        uint256 _poolId,
        bytes calldata _metadata
    ) external payable nonReentrant returns (uint256 policyId) {
        
        // Calculate premium
        uint256 premium = calculatePremium(_coverageType, _coverageAmount, _premiumToken);
        uint256 totalPremium = premium * _durationMonths;
        
        // Collect first premium payment
        premiumVault.collectPremium{value: msg.value}(
            msg.sender, _premiumToken, premium, _poolId
        );
        
        // Create policy NFT
        policyId = nextPolicyId++;
        uint256 startDate = block.timestamp;
        uint256 endDate = startDate + (_durationMonths * 30 days);
        
        policies[policyId] = Policy({
            id: policyId,
            policyholder: msg.sender,
            coverageType: _coverageType,
            coverageAmount: _coverageAmount,
            premiumAmount: premium,
            premiumToken: _premiumToken,
            startDate: startDate,
            endDate: endDate,
            autoRenew: _autoRenew,
            status: 1, // active
            poolId: _poolId,
            metadataHash: keccak256(_metadata)
        });
        
        userPolicies[msg.sender].push(policyId);
        _safeMint(msg.sender, policyId);
        
        emit PolicyCreated(policyId, msg.sender, _coverageType, _coverageAmount, premium, startDate, endDate);
    }
    
    function calculatePremium(
        uint8 coverageType,
        uint256 coverageAmount,
        address token
    ) public view returns (uint256) {
        // Base rate by coverage type (in basis points per month)
        uint256 baseRateBps;
        if (coverageType == 0) baseRateBps = 150; // 1.5% DeFi
        else if (coverageType <= 2) baseRateBps = 200; // 2.0% Health
        else baseRateBps = 250;
        
        // Pool utilization adjustment
        uint256 utilizationRate = insurancePool.getUtilizationRate();
        if (utilizationRate > 8000) baseRateBps = baseRateBps * 130 / 100; // +30% if >80% utilized
        
        // Convert coverage amount to token denomination via oracle
        uint256 coverageInToken = oracleConvert(coverageAmount, address(0), token);
        
        return (coverageInToken * baseRateBps) / 10000;
    }
    
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }
}
```

### ClaimsProcessor.sol (Key Functions)

```solidity
contract ClaimsProcessor is AccessControl, ReentrancyGuard {
    
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    uint256 public constant AUTO_REVIEW_THRESHOLD = 5 ether; // Auto-approve if oracle confirms AND < 5 ETH
    
    struct Claim {
        uint256 id;
        uint256 policyId;
        address claimant;
        uint256 requestedAmount;
        uint256 approvedAmount;
        string[] evidenceCIDs;    // IPFS CIDs
        uint8 status;             // 0=submitted, 1=oracle_check, 2=approved, 3=rejected, 4=paid
        bytes32 oracleRequestId;
        bool oracleConfirmed;
        address reviewer;
        uint256 submittedAt;
        uint256 resolvedAt;
    }
    
    mapping(uint256 => Claim) public claims;
    uint256 public nextClaimId = 1;
    
    IChainlinkVerifier public oracleVerifier;
    IInsurancePool public pool;
    
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address claimant, uint256 amount);
    event ClaimApproved(uint256 indexed claimId, uint256 approvedAmount, address reviewer);
    event ClaimRejected(uint256 indexed claimId, string reason, address reviewer);
    event OracleResponseReceived(uint256 indexed claimId, bool confirmed);
    
    function submitClaim(
        uint256 _policyId,
        uint256 _requestedAmount,
        string[] calldata _evidenceCIDs,
        bytes calldata _incidentData   // abi-encoded incident details
    ) external nonReentrant returns (uint256 claimId) {
        
        // Validate policy ownership and active status
        require(policyManager.ownerOf(_policyId) == msg.sender, "Not policy owner");
        require(policyManager.policies(_policyId).status == 1, "Policy not active");
        require(policyManager.policies(_policyId).endDate > block.timestamp, "Policy expired");
        
        claimId = nextClaimId++;
        
        claims[claimId] = Claim({
            id: claimId,
            policyId: _policyId,
            claimant: msg.sender,
            requestedAmount: _requestedAmount,
            approvedAmount: 0,
            evidenceCIDs: _evidenceCIDs,
            status: 1, // oracle_check
            oracleRequestId: bytes32(0),
            oracleConfirmed: false,
            reviewer: address(0),
            submittedAt: block.timestamp,
            resolvedAt: 0
        });
        
        emit ClaimSubmitted(claimId, _policyId, msg.sender, _requestedAmount);
        
        // Trigger Chainlink oracle verification asynchronously
        bytes32 requestId = oracleVerifier.requestVerification(claimId, _incidentData);
        claims[claimId].oracleRequestId = requestId;
    }
    
    // Called by Chainlink oracle callback
    function fulfillOracleVerification(
        bytes32 requestId,
        bool confirmed,
        uint256 verifiedAmount
    ) external onlyOracle {
        uint256 claimId = oracleRequestIdToClaimId[requestId];
        Claim storage claim = claims[claimId];
        
        claim.oracleConfirmed = confirmed;
        emit OracleResponseReceived(claimId, confirmed);
        
        // Auto-approve if oracle confirms and amount < threshold
        if (confirmed && verifiedAmount <= AUTO_REVIEW_THRESHOLD) {
            _approveClaim(claimId, verifiedAmount, address(this)); // system approval
        } else {
            // Flag for manual review
            claim.status = 4; // manual_review
        }
    }
    
    // Admin/Reviewer function
    function approveClaim(
        uint256 claimId,
        uint256 approvedAmount,
        string calldata notes
    ) external onlyRole(REVIEWER_ROLE) nonReentrant {
        _approveClaim(claimId, approvedAmount, msg.sender);
    }
    
    function _approveClaim(uint256 claimId, uint256 approvedAmount, address reviewer) internal {
        Claim storage claim = claims[claimId];
        require(claim.status == 4 || claim.status == 1, "Invalid status");
        
        claim.approvedAmount = approvedAmount;
        claim.reviewer = reviewer;
        claim.status = 2; // approved
        claim.resolvedAt = block.timestamp;
        
        // Trigger payout from pool
        pool.payoutClaim(
            claim.claimant,
            approvedAmount,
            policyManager.policies(claim.policyId).poolId
        );
        
        claim.status = 5; // paid
        emit ClaimApproved(claimId, approvedAmount, reviewer);
    }
    
    function rejectClaim(
        uint256 claimId,
        string calldata reason
    ) external onlyRole(REVIEWER_ROLE) {
        Claim storage claim = claims[claimId];
        claim.status = 3; // rejected
        claim.resolvedAt = block.timestamp;
        emit ClaimRejected(claimId, reason, msg.sender);
    }
}
```

### InsurancePool.sol (Key Functions)

```solidity
contract InsurancePool is ReentrancyGuard, AccessControl {
    
    struct Pool {
        uint256 id;
        string name;
        uint8 poolType;             // 0=defi, 1=health, 2=mixed
        address[] acceptedTokens;
        uint256 totalLiquidity;     // in ETH equivalent
        uint256 utilizedAmount;     // locked for active coverage
        uint256 lockPeriodDays;
        bool isActive;
    }
    
    struct LPPosition {
        uint256 poolId;
        address lp;
        uint256 depositedAmount;
        uint256 lpShares;
        uint256 lastClaimedYield;
        uint256 depositTimestamp;
    }
    
    mapping(uint256 => Pool) public pools;
    mapping(address => mapping(uint256 => LPPosition)) public lpPositions;
    mapping(uint256 => address) public poolLPToken;  // pool → LP ERC20 token
    
    event LiquidityAdded(uint256 indexed poolId, address indexed lp, uint256 amount, uint256 shares);
    event LiquidityRemoved(uint256 indexed poolId, address indexed lp, uint256 amount);
    event ClaimPaid(uint256 indexed poolId, address indexed claimant, uint256 amount);
    event YieldDistributed(uint256 indexed poolId, uint256 totalYield);
    
    function deposit(
        uint256 poolId,
        address token,
        uint256 amount
    ) external payable nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool inactive");
        require(isAcceptedToken(poolId, token), "Token not accepted");
        
        uint256 ethEquivalent = toEthEquivalent(token, amount);
        
        // Calculate LP shares to mint
        uint256 totalShares = IERC20(poolLPToken[poolId]).totalSupply();
        uint256 sharesToMint = totalShares == 0 
            ? ethEquivalent 
            : (ethEquivalent * totalShares) / pool.totalLiquidity;
        
        // Transfer tokens
        if (token == address(0)) {
            require(msg.value == amount, "ETH mismatch");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        pool.totalLiquidity += ethEquivalent;
        
        // Mint LP tokens
        ILPToken(poolLPToken[poolId]).mint(msg.sender, sharesToMint);
        
        // Update position
        lpPositions[msg.sender][poolId].depositedAmount += ethEquivalent;
        lpPositions[msg.sender][poolId].lpShares += sharesToMint;
        
        emit LiquidityAdded(poolId, msg.sender, ethEquivalent, sharesToMint);
    }
    
    function withdraw(uint256 poolId, uint256 shares) external nonReentrant {
        Pool storage pool = pools[poolId];
        LPPosition storage position = lpPositions[msg.sender][poolId];
        
        require(position.lpShares >= shares, "Insufficient shares");
        require(
            block.timestamp >= position.depositTimestamp + pool.lockPeriodDays * 1 days,
            "Lock period active"
        );
        
        // Calculate withdrawal amount
        uint256 totalShares = IERC20(poolLPToken[poolId]).totalSupply();
        uint256 withdrawAmount = (shares * pool.totalLiquidity) / totalShares;
        
        // Ensure pool has enough available liquidity
        uint256 available = pool.totalLiquidity - pool.utilizedAmount;
        require(withdrawAmount <= available, "Insufficient available liquidity");
        
        // Burn LP tokens and pay out
        ILPToken(poolLPToken[poolId]).burnFrom(msg.sender, shares);
        position.lpShares -= shares;
        pool.totalLiquidity -= withdrawAmount;
        
        // Return ETH or token equivalent
        _transferFunds(msg.sender, withdrawAmount);
        
        emit LiquidityRemoved(poolId, msg.sender, withdrawAmount);
    }
    
    // Called by ClaimsProcessor
    function payoutClaim(address claimant, uint256 amount, uint256 poolId) 
        external onlyRole(CLAIMS_PROCESSOR_ROLE) nonReentrant 
    {
        Pool storage pool = pools[poolId];
        require(pool.totalLiquidity - pool.utilizedAmount >= amount, "Insufficient pool liquidity");
        
        pool.totalLiquidity -= amount;
        _transferFunds(claimant, amount);
        
        emit ClaimPaid(poolId, claimant, amount);
    }
    
    function getUtilizationRate() external view returns (uint256) {
        // Returns basis points (0-10000)
        uint256 total = 0;
        uint256 utilized = 0;
        for (uint256 i = 1; i <= poolCount; i++) {
            total += pools[i].totalLiquidity;
            utilized += pools[i].utilizedAmount;
        }
        return total == 0 ? 0 : (utilized * 10000) / total;
    }
}
```

---

## 6. PRIVY + RAINBOWKIT INTEGRATION

### Installation

```bash
npm install @privy-io/react-auth @privy-io/wagmi wagmi viem @rainbow-me/rainbowkit
```

### Configuration

```typescript
// src/lib/wagmi.config.ts
import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`)
  },
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
    coinbaseWallet({ appName: 'ChainShield' })
  ]
});
```

```typescript
// src/lib/privy.config.ts
import { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  
  // Login methods — Google creates a wallet automatically
  loginMethods: ['google', 'email', 'wallet'],
  
  // Embedded wallet config — created for social login users
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',  // Auto-create for Google users
    requireUserPasswordOnCreate: false,
    noPromptOnSignature: false
  },
  
  // Wallet list (for wallet login)
  walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  
  appearance: {
    theme: 'dark',
    accentColor: '#00E5CC',
    logo: '/logo.svg',
    walletChainType: 'ethereum-only',
    showWalletLoginFirst: false
  },
  
  // Link to our Supabase auth
  customAuth: {
    isLoading: false,
    isAuthenticated: false,  // Managed by our auth hook
  }
};
```

```tsx
// src/app/layout.tsx — Root Providers
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { privyConfig } from '@/lib/privy.config';
import { wagmiConfig } from '@/lib/wagmi.config';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider appId={privyConfig.appId} config={privyConfig}>
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>
              <RainbowKitProvider
                theme={darkTheme({
                  accentColor: '#00E5CC',
                  accentColorForeground: '#080B14',
                  borderRadius: 'medium',
                  fontStack: 'system',
                  overlayBlur: 'small'
                })}
              >
                {children}
              </RainbowKitProvider>
            </WagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
```

### Custom Connect Button with Google Login

```tsx
// src/components/web3/ConnectButton.tsx
'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FcGoogle } from 'react-icons/fc';

export function ChainShieldConnectButton() {
  const { login, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  
  // Use Privy's wallet for Google users
  const activeWallet = wallets[0];
  
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        if (!mounted) return null;
        
        if (!authenticated || !account) {
          return (
            <div className="flex gap-2">
              {/* Traditional wallet connect */}
              <button onClick={openConnectModal} className="btn-secondary">
                Connect Wallet
              </button>
              
              {/* Google sign-in creates embedded wallet */}
              <button 
                onClick={() => login({ loginMethods: ['google'] })}
                className="btn-primary flex items-center gap-2"
              >
                <FcGoogle size={18} />
                Continue with Google
              </button>
            </div>
          );
        }
        
        return (
          <div className="wallet-badge">
            {user?.google?.email && (
              <span className="text-xs text-muted mr-2">{user.google.email}</span>
            )}
            <span className="address-display font-mono text-sm">
              {account.displayName}
            </span>
            <button onClick={logout} className="btn-ghost text-xs">
              Disconnect
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
```

### Auth Sync with Supabase

```typescript
// src/hooks/useAuthSync.ts
// Syncs Privy auth state to Supabase session

import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuthSync() {
  const { authenticated, user, getAccessToken } = usePrivy();
  
  useEffect(() => {
    if (!authenticated || !user) {
      supabase.auth.signOut();
      return;
    }
    
    const syncSession = async () => {
      // Get Privy JWT
      const privyToken = await getAccessToken();
      
      // Sign into Supabase using Privy JWT (custom JWT provider)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'privy' as any,
        token: privyToken!,
      });
      
      if (error) console.error('Supabase auth sync failed:', error);
    };
    
    syncSession();
  }, [authenticated, user]);
}
```

---

## 7. API ROUTES (Next.js)

### `/api/policies` — Create Policy Record

```typescript
// src/app/api/policies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPrivyToken } from '@/lib/privy-server';

export async function POST(req: NextRequest) {
  // Auth
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const user = await verifyPrivyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await req.json();
  const { txHash, policyId, coverageType, amount, duration, poolId } = body;
  
  // Verify tx on chain (via viem/alchemy)
  const txReceipt = await publicClient.getTransactionReceipt({ hash: txHash });
  // ... validate the tx belongs to user and matches params
  
  // Create in Supabase
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('policies').insert({
    onchain_policy_id: policyId,
    policyholder: user.wallet.address.toLowerCase(),
    coverage_type: coverageType,
    coverage_amount: amount,
    tx_hash_created: txHash,
    status: 'active'
  }).select().single();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ policy: data });
}
```

### `/api/claims/submit` — Submit Claim

```typescript
// src/app/api/claims/submit/route.ts
export async function POST(req: NextRequest) {
  const user = await verifyPrivyToken(req.headers.get('authorization')?.replace('Bearer ', ''));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const formData = await req.formData();
  const files = formData.getAll('evidence') as File[];
  const claimData = JSON.parse(formData.get('claim') as string);
  
  // Upload evidence to IPFS via Pinata
  const ipfsCIDs: string[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const pinataRes = await pinata.pinFileToIPFS(Buffer.from(buffer), {
      pinataMetadata: { name: file.name },
    });
    ipfsCIDs.push(pinataRes.IpfsHash);
  }
  
  // Store claim in Supabase (preliminary, before onchain)
  const { data: claim } = await supabase.from('claims').insert({
    policy_id: claimData.policyId,
    claimant: user.wallet.address.toLowerCase(),
    claim_type: claimData.claimType,
    requested_amount: claimData.amount,
    description: claimData.description,
    evidence_ipfs_cids: ipfsCIDs,
    status: 'submitted',
    // tx_hash_submitted will be updated after onchain submission
  }).select().single();
  
  return NextResponse.json({ claimId: claim.id, ipfsCIDs });
}
```

### `/api/admin/claims/[id]/review` — Admin Review

```typescript
// src/app/api/admin/claims/[id]/review/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyPrivyToken(req.headers.get('authorization')?.replace('Bearer ', ''));
  if (!user || !['admin', 'reviewer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const { decision, approvedAmount, notes } = await req.json();
  
  // If approving, trigger onchain transaction via relayer
  if (decision === 'approve') {
    await triggerOnchainApproval(params.id, approvedAmount, user.wallet.address);
  }
  
  // Update Supabase (webhook will also update, but we do it here for instant UI)
  await supabase.from('claims')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      approved_amount: approvedAmount,
      reviewer_notes: notes,
      assigned_reviewer: user.dbId,
      review_completed_at: new Date().toISOString()
    })
    .eq('id', params.id);
  
  // Log admin action
  await supabase.from('admin_actions').insert({
    admin_id: user.dbId,
    action_type: `${decision}_claim`,
    target_table: 'claims',
    target_id: params.id,
    notes
  });
  
  return NextResponse.json({ ok: true });
}
```

---

## 8. FRONTEND HOOKS (wagmi + Supabase)

### `useUserPolicies`

```typescript
// src/hooks/useUserPolicies.ts
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

export function useUserPolicies() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['policies', address],
    queryFn: async () => {
      if (!address) return [];
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('policyholder', address.toLowerCase())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!address,
    staleTime: 30_000
  });
}
```

### `usePurchasePolicy`

```typescript
// src/hooks/usePurchasePolicy.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { POLICY_MANAGER_ABI } from '@/lib/contracts/abis';
import { POLICY_MANAGER_ADDRESS } from '@/lib/contracts/addresses';

export function usePurchasePolicy() {
  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  
  const purchasePolicy = async (params: PurchasePolicyParams) => {
    const hash = await writeContractAsync({
      address: POLICY_MANAGER_ADDRESS,
      abi: POLICY_MANAGER_ABI,
      functionName: 'purchasePolicy',
      args: [
        params.coverageType,
        params.coverageAmount,
        params.durationMonths,
        params.premiumToken,
        params.autoRenew,
        params.poolId,
        '0x' // metadata encoded
      ],
      value: params.premiumToken === ZERO_ADDRESS ? params.premiumAmount : 0n
    });
    
    // Also record in Supabase
    await fetch('/api/policies', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`
      },
      body: JSON.stringify({ txHash: hash, ...params })
    });
    
    return hash;
  };
  
  return { purchasePolicy, txHash, isConfirming, isSuccess };
}
```

### Real-time Notifications

```typescript
// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const notif = payload.new;
        toast(notif.title, { description: notif.body });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
}
```

---

## 9. CHAINLINK INTEGRATION

### Chainlink Any API Flow for DeFi Claims

```
1. User submits DeFi claim (protocol hack)
2. ClaimsProcessor.sol calls ChainlinkVerifier.sol
3. ChainlinkVerifier sends Chainlink Any API request to:
   - DefiLlama hacks API (to verify protocol was hacked)
   - Etherscan API (to verify loss transaction)
4. Chainlink oracle fetches data from both sources
5. Oracle aggregates: if protocol in hacks list AND tx shows loss → confirmed
6. Callback to ClaimsProcessor.fulfillOracleVerification()
7. Auto-approve if confirmed + amount < threshold
8. Otherwise → manual review
```

### ChainlinkVerifier.sol

```solidity
contract ChainlinkVerifier is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    
    bytes32 private jobId;      // Any API job ID
    uint256 private fee;        // LINK fee
    
    mapping(bytes32 => uint256) public requestToClaimId;
    
    constructor(address _link, address _oracle, bytes32 _jobId) {
        _setChainlinkToken(_link);
        _setChainlinkOracle(_oracle);
        jobId = _jobId;
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0.1 LINK per request
    }
    
    function requestVerification(
        uint256 claimId,
        bytes calldata incidentData
    ) external returns (bytes32 requestId) {
        (string memory protocol, bytes32 txHash) = abi.decode(incidentData, (string, bytes32));
        
        Chainlink.Request memory req = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillVerification.selector
        );
        
        // Point to our verification API endpoint
        req._add("get", string.concat(
            "https://api.chainshield.xyz/oracle/verify?protocol=",
            protocol,
            "&txHash=",
            Strings.toHexString(uint256(txHash))
        ));
        req._add("path", "confirmed");
        
        requestId = _sendChainlinkRequest(req, fee);
        requestToClaimId[requestId] = claimId;
    }
    
    function fulfillVerification(bytes32 requestId, bool confirmed) 
        external recordChainlinkFulfillment(requestId) 
    {
        uint256 claimId = requestToClaimId[requestId];
        claimsProcessor.fulfillOracleVerification(requestId, confirmed, 0);
    }
}
```

---

## 10. EVENT INDEXING (Alchemy Webhooks)

### Setup Alchemy Notify Webhook

```typescript
// scripts/setup-alchemy-webhook.ts
// Run once to register webhook with Alchemy

const alchemyWebhookConfig = {
  webhook_type: "GRAPHQL",
  webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/alchemy`,
  graphql_query: `{
    block {
      logs(filter: {
        addresses: [
          "${POLICY_MANAGER_ADDRESS}",
          "${CLAIMS_PROCESSOR_ADDRESS}",
          "${INSURANCE_POOL_ADDRESS}"
        ]
      }) {
        transaction { hash }
        account { address }
        topics
        data
        index
        blockNumber
      }
    }
  }`
};
```

### Webhook Route

```typescript
// src/app/api/webhooks/alchemy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-alchemy-signature');
  
  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.ALCHEMY_SIGNING_KEY!)
    .update(body)
    .digest('hex');
  
  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Forward to Supabase Edge Function for processing
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/blockchain-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body
  });
  
  return NextResponse.json({ ok: true });
}
```

---

## 11. DEPLOYMENT PLAN

### Smart Contracts

```bash
# 1. Deploy to Sepolia testnet first
npx hardhat run scripts/deploy.ts --network sepolia

# 2. Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS

# 3. Run integration tests
npx hardhat test

# 4. Audit (mandatory before mainnet)
# Submit to: OpenZeppelin, Trail of Bits, or Certik

# 5. Deploy to Mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

### Backend (Supabase)

```bash
# 1. Create Supabase project
supabase init && supabase link --project-ref YOUR_REF

# 2. Run migrations
supabase db push

# 3. Deploy Edge Functions
supabase functions deploy blockchain-webhook
supabase functions deploy oracle-check
supabase functions deploy premium-reminder
supabase functions deploy auth-hook

# 4. Set up Cron jobs (in Supabase dashboard)
# premium-reminder: 0 8 * * *  (daily at 8am UTC)
# yield-snapshot: 0 * * * *    (every hour)

# 5. Configure Alchemy webhook URL
```

### Frontend (Vercel)

```bash
# 1. Connect GitHub repo to Vercel
# 2. Set all env vars in Vercel dashboard
# 3. Configure domains
# 4. Enable Edge Runtime for performance

vercel deploy --prod
```

---

## 12. SECURITY CHECKLIST

```
Smart Contracts:
  ✅ ReentrancyGuard on all fund-handling functions
  ✅ AccessControl roles (not just Ownable)
  ✅ OpenZeppelin SafeERC20 for token transfers
  ✅ Integer overflow protection (Solidity 0.8+)
  ✅ Oracle manipulation protection (multiple source aggregation)
  ✅ Emergency pause mechanism (Pausable)
  ✅ Timelocked admin functions for critical changes
  ✅ No delegatecall to user-supplied addresses
  ✅ Events emitted for all state changes

Backend:
  ✅ RLS on all tables (defense in depth)
  ✅ Service role key never exposed to client
  ✅ Webhook signature verification (Alchemy + Privy)
  ✅ Rate limiting on API routes (Vercel Edge Middleware)
  ✅ Input validation (Zod schemas on all API routes)
  ✅ Admin action audit log (immutable)
  ✅ Sensitive fields encrypted (health data)

Frontend:
  ✅ No private keys or service role keys in client code
  ✅ Content Security Policy headers
  ✅ Wallet address verification for protected routes
  ✅ XSS protection (React's default escaping)
  ✅ HTTPS enforced (Vercel)
```

---

## 13. ENVIRONMENT VARIABLES (COMPLETE)

```env
# ─── App ───────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://chainshield.xyz
NEXT_PUBLIC_CHAIN_ID=1

# ─── Privy ─────────────────────────────────────
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxx
PRIVY_APP_SECRET=your_privy_app_secret

# ─── WalletConnect ─────────────────────────────
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# ─── Supabase ──────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # NEVER expose to client

# ─── Alchemy ───────────────────────────────────
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
ALCHEMY_SIGNING_KEY=your_webhook_signing_key

# ─── Smart Contracts ───────────────────────────
NEXT_PUBLIC_POLICY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_CLAIMS_PROCESSOR_ADDRESS=0x...
NEXT_PUBLIC_INSURANCE_POOL_ADDRESS=0x...
NEXT_PUBLIC_PREMIUM_VAULT_ADDRESS=0x...

# ─── IPFS / Pinata ─────────────────────────────
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# ─── Chainlink ─────────────────────────────────
CHAINLINK_NODE_ADDRESS=0x...
CHAINLINK_JOB_ID=your_job_id

# ─── Internal Services ─────────────────────────
ORACLE_SECRET=random_secret_for_oracle_webhook_auth
RELAYER_URL=https://relayer.chainshield.xyz
RELAYER_SECRET=random_secret_for_relayer_auth

# ─── Hardhat (deploy only) ─────────────────────
PRIVATE_KEY=0x...  # Deployer wallet
ETHERSCAN_API_KEY=your_etherscan_key
```

---

*End of Backend Plan — 13 sections: Full DB schema, RLS, 4 Edge Functions, 3 Smart Contracts, Privy+RainbowKit integration, API routes, Chainlink oracle, event indexing, deployment & security checklists.*
