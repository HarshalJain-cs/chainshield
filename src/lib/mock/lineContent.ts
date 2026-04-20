import type { CoverageLine } from "./data";
import { Shield, HeartPulse, Car, Users, Landmark, Plane, type LucideIcon } from "lucide-react";

export type LineContent = {
  icon: LucideIcon;
  hero: { eyebrow: string; headline: string; sub: string };
  stats: { label: string; value: string }[];
  trustSignals: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  testimonial: { quote: string; author: string; role: string };
};

export const lineContent: Record<CoverageLine, LineContent> = {
  defi: {
    icon: Shield,
    hero: {
      eyebrow: "DeFi cover",
      headline: "Cover the code. Not just the contract.",
      sub: "Insure your DeFi positions against smart-contract exploits, oracle manipulation and stablecoin depegs — settled by onchain assessors in days, not months.",
    },
    stats: [
      { label: "Protocols covered", value: "6+" },
      { label: "TVL insured", value: "$148M" },
      { label: "Avg payout time", value: "4 days" },
      { label: "Claim approval rate", value: "82%" },
    ],
    trustSignals: [
      { title: "Audited by 3 firms", desc: "Trail of Bits, Spearbit and Code4rena reviewed the cover engine and payout logic." },
      { title: "Onchain assessment", desc: "Every claim is decided by staked CSHD holders — fully transparent, fully verifiable." },
      { title: "Multi-chain", desc: "Ethereum, Arbitrum, Base and Optimism. One policy, every chain you use." },
    ],
    faqs: [
      { q: "What counts as a covered exploit?", a: "Any verifiable smart-contract bug, oracle manipulation or governance attack that causes irrecoverable loss of user funds in the covered protocol." },
      { q: "What is NOT covered?", a: "Phishing, key compromise, frontend-only incidents, and pure economic loss unrelated to a protocol failure." },
      { q: "How fast are payouts?", a: "Auto-approved cases pay within hours via the oracle layer. Manual reviews resolve in 3–7 days on average." },
      { q: "Can I cover positions on L2s?", a: "Yes — Arbitrum, Base and Optimism are supported alongside Ethereum mainnet." },
    ],
    testimonial: { quote: "Filed a claim Tuesday after the oracle event, paid out Friday. No emails, no paperwork.", author: "0x9F…3AaB", role: "Aave LP" },
  },
  health: {
    icon: HeartPulse,
    hero: {
      eyebrow: "Health cover",
      headline: "Healthcare that doesn't gatekeep.",
      sub: "Hospital, surgery and prescription cover with global portability. Premiums in stablecoins, payouts straight to your provider — or your wallet.",
    },
    stats: [
      { label: "Lives covered", value: "12,400+" },
      { label: "In-network providers", value: "180k" },
      { label: "Avg claim turnaround", value: "48h" },
      { label: "Countries supported", value: "38" },
    ],
    trustSignals: [
      { title: "HIPAA-aware", desc: "Medical records stay encrypted on IPFS — only you and the assessor pool see them, and only when you file a claim." },
      { title: "Direct provider pay", desc: "Approved hospitals are paid directly from the cover pool. No reimbursement loops." },
      { title: "Maternity & critical illness riders", desc: "Add coverage that matches your life — at any time during the policy term." },
    ],
    faqs: [
      { q: "Is this a replacement for national insurance?", a: "ChainShield Health is a supplementary cover. It works alongside national or employer schemes and pays out for whatever they don't." },
      { q: "Are pre-existing conditions covered?", a: "Conditions disclosed at signup may be covered with a 6-month waiting period; undisclosed conditions are excluded." },
      { q: "Which currencies do you accept?", a: "USDC, DAI and USDT for premiums. Payouts can be sent in stablecoins or fiat (via offramp partner)." },
      { q: "How does the claim process work?", a: "Upload your invoice + records — encrypted. Auto-pass cases settle in 24h; complex cases go to assessor review." },
    ],
    testimonial: { quote: "Appendix surgery in Bangkok, paid out in 3 days. My old insurer would've taken six weeks.", author: "M. Okonkwo", role: "PremiumCare 360 holder" },
  },
  auto: {
    icon: Car,
    hero: {
      eyebrow: "Auto cover",
      headline: "Drive anywhere. Covered everywhere.",
      sub: "Liability, collision and theft cover for any vehicle — gas, hybrid or EV. Photo-based claims, oracle-verified, paid in days.",
    },
    stats: [
      { label: "Vehicles covered", value: "8,200+" },
      { label: "Avg claim payout", value: "$5.4k" },
      { label: "Oracle auto-approval", value: "61%" },
      { label: "Fraud rejection rate", value: "3.2%" },
    ],
    trustSignals: [
      { title: "Photo + telematics oracle", desc: "Damage assessment via vision oracles + optional telematics tracking for real-time accident detection." },
      { title: "EV-specialized line", desc: "Battery incidents, charger damage and at-home electrical fires — covered explicitly, not as fine-print exclusions." },
      { title: "No-blame fast-track", desc: "When the police report confirms third-party fault, we pay first and pursue recovery onchain." },
    ],
    faqs: [
      { q: "What documentation do I need to file?", a: "Photos of the damage, the police report number (if applicable), and a repair estimate from any licensed shop." },
      { q: "Are commercial vehicles covered?", a: "Not yet — passenger vehicles and motorcycles only. Commercial line is on the AIP roadmap (AIP-019)." },
      { q: "Do you cover EV battery degradation?", a: "Sudden battery failure due to defect or external damage is covered. Normal capacity loss is not." },
      { q: "How is my premium calculated?", a: "Vehicle value + driver age + region + telematics score (optional). The math is open-sourced — see /docs." },
    ],
    testimonial: { quote: "Hit-and-run on a Tuesday, claim approved by oracle Wednesday, repair shop paid Thursday. That fast.", author: "0x12…F0c1", role: "RoadGuard Full holder" },
  },
  life: {
    icon: Users,
    hero: {
      eyebrow: "Life cover",
      headline: "A legacy your family can actually access.",
      sub: "Term and whole-life cover with onchain beneficiary records. No probate, no waiting — funds disburse to your designated wallet on verified event.",
    },
    stats: [
      { label: "Policies in force", value: "6,800+" },
      { label: "Avg payout speed", value: "9 days" },
      { label: "Beneficiary disputes", value: "0.4%" },
      { label: "Coverage in force", value: "$2.1B" },
    ],
    trustSignals: [
      { title: "Multi-beneficiary splits", desc: "Set unlimited beneficiaries with custom percentage splits — change them anytime, no fees." },
      { title: "Death certificate oracle", desc: "We verify against national vital records oracles where available, falling back to assessor review." },
      { title: "No medical exam under $250k", desc: "Term Life policies up to $250k issued without a physical — just a 5-question health attestation." },
    ],
    faqs: [
      { q: "How are beneficiaries verified?", a: "On policy issuance you sign over each beneficiary wallet. At claim time the policyholder's death is verified by a vital-records oracle or assessor pool." },
      { q: "What if my beneficiary loses their wallet keys?", a: "Beneficiaries can set a recovery guardian at any time. Funds remain claimable for 7 years from the verified event." },
      { q: "Is there a contestability period?", a: "Yes — 24 months from policy start. After that, the protocol cannot rescind for misstatement except in cases of proven fraud." },
      { q: "Can I convert term to whole-life later?", a: "Yes, between years 2 and 10 of any term policy, without re-underwriting." },
    ],
    testimonial: { quote: "Set up Term Life in 8 minutes. The fact my wife's wallet is the beneficiary, not a court, is everything.", author: "R. Patel", role: "Term Life — 20y holder" },
  },
  finance: {
    icon: Landmark,
    hero: {
      eyebrow: "Finance cover",
      headline: "When the exchange goes down, you don't.",
      sub: "Cover for wallet hacks, exchange insolvencies and custodian failures. Because not all of crypto is your fault.",
    },
    stats: [
      { label: "Capacity available", value: "$27.6M" },
      { label: "Top CEXs covered", value: "12" },
      { label: "Avg payout (insolvency)", value: "60 days" },
      { label: "Wallet hack response", value: "7 days" },
    ],
    trustSignals: [
      { title: "Proof-of-reserves monitoring", desc: "We track covered exchanges' reserves daily. Coverage pauses automatically if reserve ratios drop below safe thresholds." },
      { title: "Forensic claim review", desc: "Wallet-hack claims include onchain trace analysis to verify the loss path and rule out user error." },
      { title: "Restricted to non-custodial recovery", desc: "WalletShield only pays for losses where private keys were compromised through verifiable exploit, not phishing." },
    ],
    faqs: [
      { q: "Are all exchanges covered by ExchangeGuard?", a: "Only the 12 exchanges that pass our PoR + audit criteria. The list is published onchain and updated quarterly." },
      { q: "What's the difference vs SAFU funds?", a: "SAFU is the exchange's promise to itself. ExchangeGuard is a binding onchain policy with a defined claim process." },
      { q: "Does WalletShield cover phishing?", a: "No. Only verifiable wallet-software vulnerabilities or supply-chain attacks. Always read transactions before signing." },
      { q: "What's the maximum payout?", a: "$500k per wallet for WalletShield, up to $100k per user per exchange for ExchangeGuard." },
    ],
    testimonial: { quote: "Lost funds when a popular wallet shipped a malicious update. Forensic team confirmed in 5 days, paid in 9.", author: "0xAA…77B2", role: "WalletShield holder" },
  },
  travel: {
    icon: Plane,
    hero: {
      eyebrow: "Travel cover",
      headline: "Trip cover that doesn't fight you.",
      sub: "Cancellation, lost luggage, and emergency medical abroad — bought in 30 seconds, claimed from your phone, paid in stablecoins.",
    },
    stats: [
      { label: "Trips covered", value: "21,000+" },
      { label: "Avg claim payout", value: "$680" },
      { label: "Auto-approval rate", value: "78%" },
      { label: "Countries", value: "Worldwide" },
    ],
    trustSignals: [
      { title: "Flight-delay oracle", desc: "Connected to FlightAware. If your flight is officially delayed past the threshold, your claim auto-approves." },
      { title: "No deductible on basic plans", desc: "First-dollar coverage on Trip Saver — get the full amount you claim, up to your trip cost." },
      { title: "Telemedicine included", desc: "MedAbroad Plus comes with 24/7 telemedicine in 8 languages, no extra fee." },
    ],
    faqs: [
      { q: "When does coverage start?", a: "Cancellation cover starts the moment you buy the policy. Medical and luggage cover start when your scheduled trip begins." },
      { q: "Are pre-existing medical conditions covered abroad?", a: "MedAbroad Plus covers acute exacerbations of disclosed pre-existing conditions. Trip Saver does not." },
      { q: "What if my flight is just delayed, not cancelled?", a: "Delays over 6 hours trigger a flat $200 payout via oracle. Over 12 hours bumps it to $500." },
      { q: "Is adventure sports covered?", a: "Skiing, snorkeling and hiking up to 3000m are included. High-risk sports require the Adventure rider." },
    ],
    testimonial: { quote: "Flight cancelled in Lisbon, $200 hit my wallet before I'd even left the gate. Wild.", author: "K. Fernandez", role: "Trip Saver holder" },
  },
};
