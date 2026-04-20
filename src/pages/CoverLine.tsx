import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, ShieldCheck, FileSearch, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Window } from "@/components/Window";
import { products, lineMeta, formatPremium, fmtUsd, type CoverageLine } from "@/lib/mock/data";
import { lineContent } from "@/lib/mock/lineContent";

const validLines: CoverageLine[] = ["defi", "health", "auto", "life", "finance", "travel"];

export default function CoverLinePage() {
  const { line } = useParams<{ line: string }>();
  if (!line || !validLines.includes(line as CoverageLine)) {
    return <Navigate to="/cover" replace />;
  }
  const lineKey = line as CoverageLine;
  const meta = lineMeta[lineKey];
  const content = lineContent[lineKey];
  const Icon = content.icon;
  const lineProducts = products.filter((p) => p.line === lineKey);

  return (
    <div>
      {/* Hero */}
      <section className="container pt-12 pb-16 md:pt-16 md:pb-20">
        <Link to="/cover" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase mb-6 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All cover lines
        </Link>
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
            <span className="chip mb-6">{content.hero.eyebrow}</span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              {content.hero.headline}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-foreground/80 max-w-2xl">{content.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base h-12 px-6">
                <Link to={`/cover?line=${lineKey}`}>Browse {meta.label} cover <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base h-12 px-6">
                <Link to="/claims">File a claim</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {meta.perils.map((p) => (
                <span key={p} className="text-[10px] font-mono uppercase border-[1.5px] border-foreground px-2 py-1 bg-card">{p}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="hidden lg:block">
            <Window title={`${lineKey}.cover`} tag={meta.label} tagColor="primary" large className="w-[300px] rotate-2">
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 border-[1.5px] border-foreground flex items-center justify-center mb-4 shadow-window-sm" style={{ background: `hsl(${meta.color} / 0.5)` }}>
                  <Icon className="h-9 w-9" />
                </div>
                <div className="font-display text-3xl">{meta.label}</div>
                <div className="text-xs font-mono uppercase text-muted-foreground mt-1">{meta.tagline}</div>
              </div>
            </Window>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y-[1.5px] border-foreground bg-card">
        <div className="container grid grid-cols-2 md:grid-cols-4 divide-x-[1.5px] divide-foreground">
          {content.stats.map((s, i) => (
            <div key={i} className={`p-5 ${i >= 2 ? "border-t-[1.5px] md:border-t-0 border-foreground" : ""}`}>
              <div className="font-display text-3xl md:text-4xl">{s.value}</div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products in this line */}
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="chip mb-3">Plans</span>
            <h2 className="font-display text-4xl md:text-5xl">Available {meta.label.toLowerCase()} cover.</h2>
          </div>
          <Button asChild variant="outline"><Link to={`/cover?line=${lineKey}`}>View all →</Link></Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lineProducts.map((p) => (
            <Link key={p.id} to={`/cover/${p.id}`} className="block group">
              <Window title={p.id} tag={p.tier} tagColor={p.tier === "Premium" ? "primary" : p.tier === "Standard" ? "secondary" : "muted"} hover>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-11 h-11 border-[1.5px] border-foreground flex items-center justify-center font-mono font-bold text-xs" style={{ background: `hsl(${p.color} / 0.4)` }}>
                      {p.symbol.slice(0, 3)}
                    </span>
                    <div>
                      <div className="font-display text-xl leading-tight">{p.name}</div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">{p.category}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t-[1.5px] border-foreground">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">Premium</div>
                      <div className="font-display text-2xl text-primary">{formatPremium(p)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground">Capacity</div>
                      <div className="font-display text-2xl">{fmtUsd(p.capacityUsd)}</div>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-mono font-bold uppercase">
                    Get cover <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-smooth" />
                  </div>
                </div>
              </Window>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="container pb-16">
        <div className="max-w-2xl mb-8">
          <span className="chip mb-3">Why ChainShield</span>
          <h2 className="font-display text-4xl md:text-5xl">Built different.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {content.trustSignals.map((t, i) => (
            <Window key={t.title} title={`trust_0${i + 1}`} tag={`0${i + 1}`} tagColor={i === 1 ? "secondary" : "primary"}>
              <div className="p-6">
                <ShieldCheck className="h-7 w-7 mb-3" />
                <h3 className="font-display text-2xl mb-2">{t.title}</h3>
                <p className="text-sm text-foreground/70">{t.desc}</p>
              </div>
            </Window>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="container pb-16">
        <Window title="testimonial.quote" tag="real talk" tagColor="secondary" large>
          <div className="p-8 md:p-12">
            <div className="font-display text-2xl md:text-4xl leading-tight">
              <span className="text-primary">"</span>{content.testimonial.quote}<span className="text-primary">"</span>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs font-mono uppercase">
              <span className="w-8 h-8 border-[1.5px] border-foreground bg-primary" />
              <div>
                <div className="font-bold">{content.testimonial.author}</div>
                <div className="text-muted-foreground">{content.testimonial.role}</div>
              </div>
            </div>
          </div>
        </Window>
      </section>

      {/* FAQ */}
      <section className="container pb-20">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-start">
          <div>
            <span className="chip mb-3">FAQ</span>
            <h2 className="font-display text-4xl md:text-5xl">Questions?</h2>
            <p className="mt-3 text-foreground/70">Everything you need to know about {meta.label.toLowerCase()} cover on ChainShield.</p>
          </div>
          <div className="space-y-3">
            {content.faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <Window title="get_started" tag="ready?" tagColor="primary" large>
          <div className="p-10 md:p-16 text-center">
            <h2 className="font-display text-4xl md:text-6xl leading-tight max-w-2xl mx-auto">Get covered in <em>under 60 seconds.</em></h2>
            <p className="mt-4 text-foreground/70 max-w-xl mx-auto">No paperwork, no calls. Just connect your wallet and pick a plan.</p>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Button asChild size="lg"><Link to={`/cover?line=${lineKey}`}>Browse {meta.label}</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/claims"><FileSearch className="h-4 w-4" /> File a claim</Link></Button>
            </div>
          </div>
        </Window>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Window>
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-muted/40 transition-smooth">
        <div className="font-display text-lg md:text-xl">{q}</div>
        <div className="shrink-0 w-7 h-7 border-[1.5px] border-foreground flex items-center justify-center bg-card">
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-2 text-sm text-foreground/80 border-t-[1.5px] border-foreground pt-4">
          {a}
        </div>
      )}
    </Window>
  );
}
