import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Coins, Gavel, Vote, Wallet, FileSearch, HeartPulse, Car, Users, Landmark, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Window } from "@/components/Window";
import { products, lineMeta, formatPremium, type CoverageLine } from "@/lib/mock/data";

const stats = [
  { label: "Total cover active", value: 982_400_000, prefix: "$" },
  { label: "Lives + wallets covered", value: 48_320, prefix: "" },
  { label: "Claims paid", value: 38_700_000, prefix: "$" },
  { label: "Avg LP APY", value: 8.2, prefix: "", suffix: "%", decimals: 1 },
];

const roles = [
  { icon: Shield, tag: "01", title: "Cover buyers",      desc: "Protect your health, car, life, wallet & DeFi positions in one place.", to: "/cover", color: "primary" as const },
  { icon: Coins,  tag: "02", title: "Liquidity providers", desc: "Underwrite cover pools across lines and earn from premiums + emissions.", to: "/stake", color: "secondary" as const },
  { icon: Gavel,  tag: "03", title: "Claim assessors",   desc: "Vote on disputed claims with staked CSHD and earn rewards.", to: "/claims", color: "accent" as const },
  { icon: Vote,   tag: "04", title: "Governance",        desc: "Steer parameters, treasury and onboarding of new coverage lines.", to: "/governance", color: "muted" as const },
];

const steps = [
  { icon: Wallet, title: "Connect", desc: "Connect any wallet — no signup, no paperwork." },
  { icon: Shield, title: "Buy cover", desc: "Pick a line, set amount + duration, pay the premium." },
  { icon: FileSearch, title: "Claim", desc: "If something happens, file a claim. Oracles + assessors decide." },
];

const lineIcons: Record<CoverageLine, typeof Shield> = {
  defi: Shield, health: HeartPulse, auto: Car, life: Users, finance: Landmark, travel: Plane,
};

const perils = [
  "Smart-contract exploit", "Oracle failure", "Hospitalization", "Surgery",
  "Collision", "Theft", "Death", "Critical illness",
  "Trip cancellation", "Lost luggage", "Wallet hack", "Exchange insolvency",
];

export default function Index() {
  const featured = products.slice(0, 3);
  const lines = (Object.keys(lineMeta) as CoverageLine[]);

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="container pt-12 pb-24 md:pt-20 md:pb-32 grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="chip mb-6">Aegis-1 underwriting engine · live</span>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight">
              Insurance that <br />
              finally <em className="not-italic">lives</em> <br />
              <span className="text-gradient italic">onchain.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-foreground/80 max-w-xl">
              One wallet. Every kind of cover. Health, auto, life, travel, finance and DeFi — all underwritten by a transparent, community-owned protocol.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base h-12 px-6">
                <Link to="/cover">Get cover <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base h-12 px-6">
                <Link to="/stake">Earn yield</Link>
              </Button>
            </div>
          </motion.div>

          {/* Floating window stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full lg:w-[420px] h-[460px] hidden md:block"
          >
            <Window
              title="active.policy"
              tag="health"
              tagColor="primary"
              large
              className="absolute top-0 right-0 w-[340px] rotate-2"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase text-muted-foreground">StandardCare+</div>
                    <div className="font-display text-2xl mt-1">$250,000</div>
                  </div>
                  <div className="w-12 h-12 bg-primary border-[1.5px] border-foreground flex items-center justify-center">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                </div>
                <div className="border-t-[1.5px] border-foreground -mx-5" />
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div><div className="text-muted-foreground">Premium</div><div className="text-base font-bold">$89/mo</div></div>
                  <div><div className="text-muted-foreground">Renews</div><div className="text-base font-bold">Aug 01</div></div>
                </div>
                <Button size="sm" className="w-full">
                  <FileSearch className="h-3 w-3" /> File claim
                </Button>
              </div>
            </Window>

            <Window
              title="pool.mixed"
              tag="earn"
              tagColor="secondary"
              large
              className="absolute bottom-0 left-0 w-[300px] -rotate-3"
            >
              <div className="p-5">
                <div className="text-xs font-mono uppercase text-muted-foreground">Aegis Mixed Pool</div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="font-display text-3xl">10.4%</div>
                  <div className="text-xs font-mono">APY</div>
                </div>
                <div className="mt-3 h-2 bg-muted border-[1.5px] border-foreground relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-secondary" style={{ width: "67%" }} />
                </div>
                <div className="mt-1 text-[10px] font-mono text-muted-foreground">67% utilized · $31.2M TVL</div>
              </div>
            </Window>
          </motion.div>
        </div>
      </section>

      {/* Marquee — Covered against */}
      <section className="border-y-[1.5px] border-foreground bg-card overflow-hidden">
        <div className="flex items-center">
          <div className="px-4 py-3 border-r-[1.5px] border-foreground bg-primary text-xs font-mono font-bold uppercase whitespace-nowrap">
            Covered against →
          </div>
          <div className="flex-1 overflow-hidden py-3">
            <div className="flex gap-10 animate-marquee whitespace-nowrap">
              {[...perils, ...perils].map((peril, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-sm font-bold uppercase">
                  <span className="w-2 h-2 bg-foreground" />
                  {peril}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Window key={s.label} title={s.label} tag="stat" tagColor="muted">
              <div className="p-5">
                <div className="font-display text-3xl md:text-4xl">
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground mt-2">{s.label}</div>
              </div>
            </Window>
          ))}
        </div>
      </section>

      {/* Pick your coverage line */}
      <section className="container pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="chip mb-4">Pick your coverage line</span>
          <h2 className="font-display text-4xl md:text-6xl leading-tight">Six lines. <em>One protocol.</em></h2>
          <p className="mt-4 text-foreground/70 text-lg">From hospital bills to smart-contract exploits — all underwritten transparently onchain.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lines.map((line, i) => {
            const meta = lineMeta[line];
            const Icon = lineIcons[line];
            return (
              <motion.div
                key={line}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link to={`/cover?line=${line}`} className="block group">
                  <Window title={`line_${line}`} tag={meta.label} tagColor={i % 2 === 0 ? "primary" : "secondary"} hover className="h-full">
                    <div className="p-6">
                      <div className="w-12 h-12 border-[1.5px] border-foreground flex items-center justify-center mb-5" style={{ background: `hsl(${meta.color} / 0.4)` }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-2xl mb-2">{meta.label}</h3>
                      <p className="text-sm text-foreground/70 mb-3">{meta.tagline}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.perils.map((p) => (
                          <span key={p} className="text-[9px] font-mono uppercase border-[1.5px] border-foreground px-1.5 py-0.5 bg-card">{p}</span>
                        ))}
                      </div>
                      <div className="mt-5 inline-flex items-center text-xs font-mono font-bold uppercase tracking-wider">
                        Browse <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-smooth" />
                      </div>
                    </div>
                  </Window>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Roles */}
      <section className="container pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="chip mb-4">Pick your role</span>
          <h2 className="font-display text-4xl md:text-6xl leading-tight">Four ways in.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={p.to} className="block group">
                <Window title={`role_${p.tag}`} tag={p.tag} tagColor={p.color} hover className="h-full">
                  <div className="p-6">
                    <div className="w-12 h-12 border-[1.5px] border-foreground flex items-center justify-center mb-5 bg-card">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-2xl mb-2">{p.title}</h3>
                    <p className="text-sm text-foreground/70">{p.desc}</p>
                    <div className="mt-5 inline-flex items-center text-xs font-mono font-bold uppercase tracking-wider">
                      Open <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-smooth" />
                    </div>
                  </div>
                </Window>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured cover */}
      <section className="container pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="chip mb-3">Marketplace</span>
            <h2 className="font-display text-4xl md:text-5xl">Featured cover.</h2>
          </div>
          <Button asChild variant="outline"><Link to="/cover">View all →</Link></Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {featured.map((p) => (
            <Link key={p.id} to={`/cover/${p.id}`} className="block">
              <Window title={p.id} tag={lineMeta[p.line].label} tagColor="secondary" hover>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-11 h-11 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold text-sm bg-card" style={{ background: `hsl(${p.color} / 0.4)` }}>
                      {p.symbol.slice(0, 3)}
                    </span>
                    <div>
                      <div className="font-display text-xl">{p.name}</div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">{p.category}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t-[1.5px] border-foreground">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">Premium</div>
                      <div className="font-display text-2xl text-primary">{formatPremium(p)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">Tier</div>
                      <div className="font-display text-2xl">{p.tier}</div>
                    </div>
                  </div>
                </div>
              </Window>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container pb-20">
        <div className="max-w-2xl mb-12">
          <span className="chip mb-3">How it works</span>
          <h2 className="font-display text-4xl md:text-6xl leading-tight">Three steps. <em>No paperwork.</em></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <Window key={s.title} title={`step_0${i + 1}`} tag={`0${i + 1}`} tagColor={i === 1 ? "secondary" : "primary"}>
              <div className="p-6">
                <s.icon className="h-8 w-8 mb-4" />
                <h3 className="font-display text-3xl mb-2">{s.title}</h3>
                <p className="text-foreground/70">{s.desc}</p>
              </div>
            </Window>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <Window title="get_started.cta" tag="ready?" tagColor="primary" large>
          <div className="p-10 md:p-16 text-center">
            <h2 className="font-display text-4xl md:text-6xl leading-tight max-w-2xl mx-auto">Cover everything. <em>In one wallet.</em></h2>
            <p className="mt-4 text-foreground/70 max-w-xl mx-auto">From hospital bills to wallet hacks — get covered in under 60 seconds.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg"><Link to="/cover">Browse cover</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/governance">View governance</Link></Button>
            </div>
          </div>
        </Window>
      </section>
    </div>
  );
}
