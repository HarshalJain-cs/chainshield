import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Coins, Gavel, Vote, CheckCircle2, Wallet, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { protocols } from "@/lib/mock/data";

const stats = [
  { label: "Total cover active", value: 248_300_000, prefix: "$", suffix: "" },
  { label: "Active policies", value: 14_820, prefix: "", suffix: "" },
  { label: "Claims paid", value: 12_400_000, prefix: "$", suffix: "" },
  { label: "Avg LP APY", value: 9.4, prefix: "", suffix: "%", decimals: 1 },
];

const products = [
  { icon: Shield, title: "Cover buyers", desc: "Protect your DeFi positions against smart-contract failure, oracle attacks and stablecoin depegs.", to: "/cover" },
  { icon: Coins, title: "Liquidity providers", desc: "Underwrite cover pools and earn yield from protocol premiums and incentive emissions.", to: "/stake" },
  { icon: Gavel, title: "Claim assessors", desc: "Vote on claim outcomes with staked CSHD and earn assessor rewards.", to: "/claims" },
  { icon: Vote, title: "Governance", desc: "Steer protocol parameters, treasury and onboarding of new cover products.", to: "/governance" },
];

const steps = [
  { icon: Wallet, title: "Connect", desc: "Connect any EVM wallet — no signup, no KYC." },
  { icon: Shield, title: "Buy cover", desc: "Choose a protocol, set amount and duration, pay the premium." },
  { icon: FileSearch, title: "Claim & resolve", desc: "If something fails, file a claim. Onchain assessors decide." },
];

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              Live on Ethereum · Arbitrum · Base · Optimism
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
              Onchain insurance <br />
              for <span className="text-gradient">DeFi positions.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Cover protocol exploits, oracle failures and stablecoin depegs. Earn yield underwriting risk. All settled by onchain assessors — no insurer in the middle.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                <Link to="/cover">Get cover <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/80">
                <Link to="/stake">Earn yield</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl glass overflow-hidden"
          >
            {stats.map((s) => (
              <div key={s.label} className="p-6 bg-card/40">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{s.label}</div>
                <div className="text-2xl md:text-3xl font-display font-bold">
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="container py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-bold">One protocol. Four ways in.</h2>
          <p className="mt-3 text-muted-foreground text-lg">Whether you hold positions, deploy capital, evaluate risk or steer the DAO.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={p.to} className="block group">
                <div className="glass rounded-2xl p-6 h-full transition-smooth hover:-translate-y-1 hover:border-primary/40">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  <div className="mt-4 inline-flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-smooth">
                    Explore <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Marquee */}
      <section className="py-12 border-y border-border/60 overflow-hidden">
        <div className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">Covered protocols</div>
        <div className="relative">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {[...protocols, ...protocols].map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-lg font-display font-semibold opacity-70 hover:opacity-100 transition-smooth">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                  style={{ background: `hsl(${p.color} / 0.2)`, color: `hsl(${p.color})`, border: `1px solid hsl(${p.color} / 0.4)` }}
                >
                  {p.symbol.slice(0, 2)}
                </span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-24">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-bold">How it works</h2>
          <p className="mt-3 text-muted-foreground text-lg">Three steps. No paperwork. No call centers.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="glass rounded-2xl p-8 relative">
              <div className="absolute top-6 right-6 font-mono text-5xl font-bold text-primary/10">0{i + 1}</div>
              <s.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display text-2xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="glass rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
          <div className="relative">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-5xl font-bold max-w-2xl mx-auto">Ship safer. Sleep better.</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Get coverage for your DeFi exposure in under 60 seconds.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/cover">Browse cover</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/governance">View governance</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
