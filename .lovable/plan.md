
# AegisChain — Multi-Line Onchain Insurance (Frontend Expansion)

Expand ChainShield from DeFi-only into a full multi-line insurance dApp covering **DeFi, Health, Auto/Car, Life, and Finance** — with a refreshed tagline, new product name, and UI structure that matches the backend plan you uploaded (policies, claims, pools, premiums per coverage type).

This pass is frontend + mock data only. No Supabase/contracts wired yet — the data shape will mirror the backend schema so the swap later is trivial.

## Rebrand

- **Old**: "Phoenix-4 cover engine · live" / "You've never insured DeFi like this."
- **New product codename**: **Aegis-1 underwriting engine · live** (Aegis = the mythological shield — fits insurance across all lines, not just DeFi).
- **New tagline**: **"One wallet. Every kind of cover."**
- **Hero headline**: *"Insurance that finally lives onchain."*
- Keep "ChainShield" as the brand name (it works for multi-line). Remove all DeFi-exclusive copy from hero, footer, marquee label.

## New Coverage Lines

Six top-level coverage types matching `coverage_type` enum from your backend plan:

| Line | Examples | Icon |
|---|---|---|
| DeFi | Smart-contract failure, oracle attack, depeg | Shield |
| Health | Basic / Standard / Premium plans | HeartPulse |
| Auto | Liability, collision, theft | Car |
| Life | Term life, beneficiaries | Users |
| Finance | Wallet hack, exchange insolvency | Landmark |
| Travel | Trip cancel, medical abroad | Plane |

## Page Changes

### Landing `/`
- Hero: new headline + tagline + "Aegis-1" chip.
- Replace "Covered protocols" marquee with a **"Covered against"** marquee listing perils (Smart-contract exploit · Oracle failure · Hospitalization · Collision · Theft · Death · Trip cancellation · Exchange insolvency).
- New section **"Pick your coverage line"** — 6 windows, one per line, linking to filtered marketplace.
- Stats updated: "Total cover active · Lives + wallets covered · Claims paid · Avg LP APY".

### Marketplace `/cover`
- Add a **Coverage Line** filter (top tabs: All · DeFi · Health · Auto · Life · Finance · Travel).
- Cards show line-specific fields (e.g. Health → monthly premium + deductible; Auto → vehicle class + premium; DeFi → premium % + capacity).
- Mock data extended: ~18 products across all 6 lines.

### Cover Detail `/cover/:id`
- Quote calculator becomes coverage-aware:
  - **DeFi**: amount + duration → premium %
  - **Health/Life**: age band + plan tier → monthly premium
  - **Auto**: vehicle value + driver age → annual premium
  - **Travel**: trip cost + days → flat premium
- Beneficiaries field for Life policies (matches `beneficiaries jsonb`).
- Payment frequency selector (monthly / quarterly / yearly / one-time).

### Dashboard `/app`
- Policies table grouped by coverage line with line badges.
- Add **Premium history** mini-table (mirrors `premiums` table).
- Quick action: "Renew" / "File claim" / "Add beneficiary".

### Claims `/claims`
- Wizard step 2 ("Describe incident") becomes **dynamic per line**:
  - DeFi → protocol + incident tx hash + affected contract
  - Health → provider + treatment dates
  - Auto → incident date + police report #
  - Life → date of event + beneficiary wallet
- Status pill set expanded: Submitted · Oracle check · Auto-approved · Manual review · Approved · Rejected · Paid (matches schema).

### Stake `/stake`
- Pool cards show **Pool type** badge (DeFi / Health / Mixed) per `pools.pool_type`.
- New "Mixed" pool with blended APY.

### Governance `/governance`
- Rename proposal prefix `CIP-###` → `AIP-###` (Aegis Improvement Proposal).
- Update sample proposals to span lines (e.g. "Onboard EV-only auto cover", "Add maternity rider to health line").

## Mock Data Refactor (`src/lib/mock/data.ts`)

Add types & arrays:
- `CoverageLine = "defi" | "health" | "auto" | "life" | "finance" | "travel"`
- `CoverageProduct` (replaces `Protocol`) with `line`, `tier`, `premiumModel`, line-specific `meta`.
- Extend `Policy` with `coverageType`, `paymentFrequency`, `beneficiaries`.
- Extend `Claim` with `claimType`, `incidentType`, `oracleVerdict`, expanded `status`.
- Extend `Pool` with `poolType`, `acceptedTokens`.

Existing DeFi protocols stay (mapped under line `"defi"`) so nothing breaks; new entries added for the other 5 lines.

## Technical Notes

- All field names align with your Supabase schema (`coverage_type`, `payment_frequency`, `beneficiaries`, `oracle_verdict`, `pool_type`) so wiring real backend later is a 1:1 swap.
- No new dependencies. Uses existing `Window`, `framer-motion`, `lucide-react` icons.
- Keeps current Tavus-inspired retro-window aesthetic — only copy, icons, and data shapes change.
- 404 + wallet integration unchanged.

## Out of Scope (this pass)

- Supabase tables, edge functions, Privy/Google OAuth, Pinata IPFS, Chainlink oracles, smart-contract calls — covered in a follow-up "Wire backend" pass once you confirm the UI direction.

## Open Question

Should I keep the brand name **"ChainShield"** with the new "Aegis-1" engine codename, or rename the whole product (e.g. **AegisChain**, **Coverly**, **Polis**)? Default if no answer: keep ChainShield, use "Aegis-1" as the engine name.
