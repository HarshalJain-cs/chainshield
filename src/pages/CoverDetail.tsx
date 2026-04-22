import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { products, lineMeta, formatPremium, fmtUsd, type PaymentFrequency } from "@/lib/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Window } from "@/components/Window";
import { ArrowLeft, ShieldCheck, Clock, TrendingUp } from "lucide-react";
import { RiskBadge } from "./Cover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { usePurchasePolicy } from "@/hooks/usePurchasePolicy";
import { TxStatusModal } from "@/components/web3/TxStatusModal";

const frequencies: PaymentFrequency[] = ["monthly", "quarterly", "yearly", "one_time"];

export default function CoverDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  // Generic state shared across calculators
  const [amount, setAmount] = useState("10000");
  const [days, setDays] = useState(180);
  const [age, setAge] = useState(35);
  const [vehicleValue, setVehicleValue] = useState(25000);
  const [tripCost, setTripCost] = useState(3000);
  const [tripDays, setTripDays] = useState(14);
  const [frequency, setFrequency] = useState<PaymentFrequency>("yearly");
  const [beneficiary, setBeneficiary] = useState("");
  const [beneficiaryShare, setBeneficiaryShare] = useState(100);
  const [open, setOpen] = useState(false);
  const { isConnected } = useAccount();

  const { purchase, txStatus, txHash, reset } = usePurchasePolicy();
  const [showTx, setShowTx] = useState(false);

  const quote = useMemo(() => {
    if (!product) return { amount: 0, label: "" };
    switch (product.line) {
      case "defi":
      case "finance": {
        const a = parseFloat(amount) || 0;
        return { amount: (a * product.premium / 100) * (days / 365), label: `for $${a.toLocaleString()} over ${days} days` };
      }
      case "health": {
        const ageMult = age < 30 ? 0.85 : age < 50 ? 1 : age < 65 ? 1.45 : 2.1;
        const monthly = product.premium * ageMult;
        return { amount: monthly, label: `per month (age ${age})` };
      }
      case "life": {
        const ageMult = age < 30 ? 0.6 : age < 45 ? 1 : age < 60 ? 1.8 : 3.2;
        const monthly = product.premium * ageMult;
        return { amount: monthly, label: `per month (age ${age})` };
      }
      case "auto": {
        const valMult = Math.max(0.7, vehicleValue / 25000);
        const ageMult = age < 25 ? 1.6 : age < 60 ? 1 : 1.3;
        const annual = product.premium * valMult * ageMult;
        return { amount: annual, label: `per year (vehicle $${vehicleValue.toLocaleString()})` };
      }
      case "travel": {
        const flat = product.premium + tripCost * 0.01 + tripDays * 1.5;
        return { amount: flat, label: `flat for ${tripDays}-day trip` };
      }
    }
  }, [product, amount, days, age, vehicleValue, tripCost, tripDays]);

  const handlePurchase = async () => {
    if (!product) return;
    setOpen(false);
    setShowTx(true);

    try {
      let coverageType = product.line === "defi" ? "defi_smart_contract" :
                         product.line === "health" ? "health_standard" :
                         product.line === "life" ? "life_term" :
                         product.line === "auto" ? "auto_full" :
                         product.line === "travel" ? "travel_basic" : "finance_wallet";

      let durationMonths = product.line === "defi" ? Math.ceil(days / 30) :
                           product.line === "travel" ? 1 : 12;

      let coverageAmountUsd = product.line === "defi" || product.line === "finance" ? parseFloat(amount) :
                              product.line === "auto" ? vehicleValue : 
                              product.line === "health" ? 250_000 : 500_000;

      await purchase({
        coverageType,
        coverageAmountUsd,
        premiumAmountUsd: quote.amount,
        premiumToken: "USDC",
        paymentFrequency: frequency as any,
        autoRenew: false,
        productId: product.id,
        durationMonths,
        beneficiaries: product.line === "life" && beneficiary ? [{ name: "Beneficiary", wallet: beneficiary, share: beneficiaryShare }] : undefined,
      });
    } catch (e) {
      // modal handles error
    }
  };

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-foreground/70">Product not found.</p>
        <Button asChild className="mt-4"><Link to="/cover">Back to marketplace</Link></Button>
      </div>
    );
  }

  const lineLabel = lineMeta[product.line].label;

  return (
    <div className="container py-10 max-w-6xl">
      <TxStatusModal
        open={showTx && txStatus !== "idle"}
        onClose={() => { setShowTx(false); reset(); }}
        status={txStatus}
        txHash={txHash}
        title="Purchasing Cover"
        successMessage="Your policy has been successfully issued."
      />

      <Link to="/cover" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase mb-6 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8">
        <div>
          <div className="flex items-start gap-4 mb-8">
            <span className="w-16 h-16 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold shadow-window-sm" style={{ background: `hsl(${product.color} / 0.4)` }}>
              {product.symbol.slice(0, 3)}
            </span>
            <div>
              <h1 className="font-display text-5xl">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono uppercase flex-wrap">
                <span className="px-1.5 py-0.5 border-[1.5px] border-foreground bg-primary text-primary-foreground">{lineLabel}</span>
                <span>{product.category}</span><span>·</span><span>{product.region}</span><span>·</span><RiskBadge risk={product.risk} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            <MetricCard icon={TrendingUp} label="Premium" value={formatPremium(product)} accent />
            <MetricCard icon={ShieldCheck} label="Available capacity" value={fmtUsd(product.capacityUsd * (1 - product.utilizationPct / 100))} />
            <MetricCard icon={Clock} label="Tier" value={product.tier} />
          </div>

          <Window title="coverage.terms" tag="terms" tagColor="muted">
            <div className="p-6 space-y-4">
              <h2 className="font-display text-2xl">What's covered</h2>
              <ul className="space-y-2 text-sm text-foreground/80">
                {lineMeta[product.line].perils.map((peril) => (
                  <li key={peril} className="flex gap-2"><span className="text-secondary">▸</span> {peril}</li>
                ))}
                {product.meta && Object.entries(product.meta).map(([k, v]) => (
                  <li key={k} className="flex gap-2"><span className="text-secondary">▸</span> <span className="font-mono uppercase text-xs">{k}:</span> {String(v)}</li>
                ))}
              </ul>
              <h3 className="font-display text-xl pt-2">What's not covered</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex gap-2"><span className="text-destructive">▸</span> Pre-existing or fraudulent claims</li>
                <li className="flex gap-2"><span className="text-destructive">▸</span> Losses unrelated to listed perils</li>
                <li className="flex gap-2"><span className="text-destructive">▸</span> User-side errors or negligence</li>
              </ul>
            </div>
          </Window>
        </div>

        {/* Quote panel */}
        <div>
          <div className="sticky top-28">
            <Window title="quote.calculator" tag="quote" tagColor="primary" large>
              <div className="p-6">
                <h2 className="font-display text-2xl mb-4">Get a quote</h2>

                {(product.line === "defi" || product.line === "finance") && (
                  <>
                    <Field label="Cover amount (USD)">
                      <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="font-mono border-foreground" />
                    </Field>
                    <Field label={`Duration: ${days} days`}>
                      <input type="range" min={30} max={365} step={30} value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full accent-primary" />
                    </Field>
                  </>
                )}

                {(product.line === "health" || product.line === "life") && (
                  <Field label={`Age: ${age}`}>
                    <input type="range" min={18} max={75} step={1} value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full accent-primary" />
                  </Field>
                )}

                {product.line === "auto" && (
                  <>
                    <Field label="Vehicle value (USD)">
                      <Input value={vehicleValue} onChange={(e) => setVehicleValue(parseFloat(e.target.value) || 0)} type="number" className="font-mono border-foreground" />
                    </Field>
                    <Field label={`Driver age: ${age}`}>
                      <input type="range" min={18} max={75} step={1} value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full accent-primary" />
                    </Field>
                  </>
                )}

                {product.line === "travel" && (
                  <>
                    <Field label="Trip cost (USD)">
                      <Input value={tripCost} onChange={(e) => setTripCost(parseFloat(e.target.value) || 0)} type="number" className="font-mono border-foreground" />
                    </Field>
                    <Field label={`Trip duration: ${tripDays} days`}>
                      <input type="range" min={1} max={60} step={1} value={tripDays} onChange={(e) => setTripDays(parseInt(e.target.value))} className="w-full accent-primary" />
                    </Field>
                  </>
                )}

                {product.line === "life" && (
                  <>
                    <Field label="Beneficiary wallet">
                      <Input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder="0x…" className="font-mono border-foreground" />
                    </Field>
                    <Field label={`Beneficiary share: ${beneficiaryShare}%`}>
                      <input type="range" min={0} max={100} step={5} value={beneficiaryShare} onChange={(e) => setBeneficiaryShare(parseInt(e.target.value))} className="w-full accent-primary" />
                    </Field>
                  </>
                )}

                <Field label="Payment frequency">
                  <div className="flex gap-1.5 flex-wrap">
                    {frequencies.map((f) => (
                      <button key={f} onClick={() => setFrequency(f)} className={`px-2 py-1 text-[11px] font-mono font-bold uppercase border-[1.5px] border-foreground transition-smooth ${frequency === f ? "bg-primary text-primary-foreground shadow-window-sm" : "bg-card hover:bg-muted"}`}>{f.replace("_", "-")}</button>
                    ))}
                  </div>
                </Field>

                <div className="border-[1.5px] border-foreground bg-muted/40 p-4 space-y-2 mt-4">
                  <Row label="Product" value={product.tier} />
                  <Row label="Frequency" value={frequency.replace("_", "-")} />
                  <div className="border-t-[1.5px] border-foreground my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-mono uppercase">Quote</span>
                    <span className="font-display text-3xl text-primary">${quote.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground text-right">{quote.label}</div>
                </div>

                <Button size="lg" className="w-full mt-4" onClick={() => setOpen(true)} disabled={!isConnected}>
                  Buy cover
                </Button>
                {!isConnected && (
                  <p className="text-[10px] font-mono uppercase text-center mt-3 text-muted-foreground">Connect wallet to purchase</p>
                )}
              </div>
            </Window>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="window-lg bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">Confirm cover purchase</DialogTitle>
            <DialogDescription>Review the details before signing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 border-y-[1.5px] border-foreground">
            <Row label="Product" value={product.name} />
            <Row label="Line" value={lineLabel} />
            <Row label="Frequency" value={frequency.replace("_", "-")} />
            <Row label="Quote" value={`$${quote.amount.toFixed(2)}`} />
            {product.line === "life" && beneficiary && <Row label="Beneficiary" value={`${beneficiary.slice(0,6)}… (${beneficiaryShare}%)`} />}
          </div>
          <DialogFooter>
            {isConnected ? (
              <Button className="w-full" onClick={handlePurchase}>
                Sign transaction onchain
              </Button>
            ) : (
              <div className="w-full flex justify-center"><ConnectButton /></div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-mono uppercase font-bold mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <Window>
      <div className="p-4">
        <Icon className={`h-4 w-4 mb-2 ${accent ? "text-primary" : ""}`} />
        <div className="text-[10px] font-mono uppercase text-muted-foreground">{label}</div>
        <div className={`font-display text-2xl ${accent ? "text-primary" : ""}`}>{value}</div>
      </div>
    </Window>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-foreground/70 font-mono text-xs uppercase">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
