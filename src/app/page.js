import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Top nav */}
      <nav className="border-b border-black/10 bg-cream/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-ink rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-terracotta rotate-45" />
            </div>
            <div>
              <div className="display-font text-2xl leading-none">Mirath</div>
              <div className="text-[10px] tracking-[0.2em] uppercase opacity-60">میراث</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm hover:text-terracotta transition-colors">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm">Begin</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-6">
              ⊹ Hanafi Faraid · Family Tree Database
            </div>
            <h1 className="display-font text-6xl lg:text-8xl leading-[0.95] mb-8">
              Islamic<br/>
              inheritance,<br/>
              <em className="text-terracotta">made clear.</em>
            </h1>
            <p className="text-lg lg:text-xl max-w-xl opacity-80 mb-10">
              Build your family tree. Register properties. Let centuries of Islamic
              jurisprudence calculate—with arithmetic precision—exactly who inherits what.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary">
                Begin Your Family Tree →
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          </div>

          {/* Decorative inheritance diagram */}
          <div className="lg:col-span-5 animate-fade-up" style={{animationDelay: '0.2s'}}>
            <div className="card p-8 lg:p-10">
              <div className="text-xs tracking-[0.2em] uppercase opacity-60 mb-6">
                Sample distribution
              </div>
              <div className="display-font text-2xl mb-2">Estate: ₨ 10,000,000</div>
              <div className="text-sm opacity-60 mb-6">Wife + 3 Sons + 2 Daughters</div>
              <div className="space-y-3">
                {[
                  {name: 'Wife', share: '1/8', amount: '1,250,000', color: 'sage'},
                  {name: 'Son × 3', share: '7/32 each', amount: '2,187,500', color: 'ink'},
                  {name: 'Daughter × 2', share: '7/64 each', amount: '1,093,750', color: 'gold'},
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 pb-3 border-b border-black/5 last:border-0">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60 mono-font">{s.share}</div>
                    </div>
                    <div className="mono-font text-lg">₨ {s.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ornamental divider */}
      <div className="max-w-3xl mx-auto px-6 my-12">
        <div className="ornamental-divider">
          <span className="display-font italic text-xl">۞</span>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4">What it does</div>
          <h2 className="display-font text-5xl lg:text-6xl">Built for Pakistani families.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              num: '01',
              title: 'Authentic Faraid',
              desc: 'Implements Hanafi inheritance rules including Awl (proportional reduction), Radd (proportional return), and Umariyyatan special cases.',
            },
            {
              num: '02',
              title: 'Family Tree',
              desc: 'Visualize your entire lineage. See how property flows from grandfather to children, then to grandchildren in real time.',
            },
            {
              num: '03',
              title: 'Property Tracking',
              desc: 'Register land, houses, cash, gold, businesses. Track debts and bequests. Get exact monetary distribution per heir.',
            },
          ].map((f, i) => (
            <div key={i} className="animate-fade-up" style={{animationDelay: `${0.1 * i}s`}}>
              <div className="text-terracotta mono-font text-sm mb-4">{f.num}</div>
              <h3 className="display-font text-3xl mb-3">{f.title}</h3>
              <p className="opacity-70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quranic reference */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="display-font italic text-2xl lg:text-3xl leading-relaxed mb-6 opacity-90">
          "Allah commands you regarding your children: for the male, a share
          equivalent to that of two females..."
        </div>
        <div className="text-sm tracking-widest uppercase opacity-60">— Qur'an, An-Nisa 4:11</div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm opacity-60">
            © {new Date().getFullYear()} Mirath · Built for educational and personal use.
          </div>
          <div className="text-xs opacity-50 max-w-md">
            For binding legal matters, consult a qualified Islamic scholar or lawyer.
          </div>
        </div>
      </footer>
    </main>
  );
}
