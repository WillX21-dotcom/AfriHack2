import React from 'react';

type LandingPageProps = {
  onLogin: () => void;
};

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#071326] text-white">
      <header className="border-b border-white/10 bg-[#071326]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="#home" className="font-serif-royal text-lg font-bold uppercase tracking-[0.18em] text-white">
            Royal Square
          </a>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#home" className="transition-colors hover:text-amber-300">Home</a>
            <a href="#about" className="transition-colors hover:text-amber-300">About</a>
            <a href="#contact" className="transition-colors hover:text-amber-300">Contact</a>
          </nav>
          <button
            type="button"
            onClick={onLogin}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300"
          >
            Log In
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="scroll-mt-24 mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-24 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-32">
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-amber-300">Private wealth, clearly managed</p>
            <h1 className="max-w-3xl font-serif-royal text-5xl font-bold leading-[1.05] text-white md:text-7xl">
              Financial decisions with a steadier view.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
              Royal Square brings your wealth, protection, requests, and important documents into one secure relationship with your financial team.
            </p>
            <button
              type="button"
              onClick={onLogin}
              className="mt-8 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300"
            >
              Log In to your portal
            </button>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-amber-200/20 bg-[#10243d] p-8 shadow-2xl">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-amber-300/20" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full border border-sky-300/10" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Royal Square</span>
                <span className="text-amber-300">Secure</span>
              </div>
              <div>
                <p className="text-sm text-slate-400">Your complete financial picture</p>
                <p className="mt-2 font-serif-royal text-4xl text-white">Built around you.</p>
                <div className="mt-8 h-px bg-white/10" />
                <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                  <span>Wealth</span><span>Protection</span><span>Guidance</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 border-y border-white/10 bg-[#0c1c31]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">About Royal Square</p>
            <div className="mt-5 grid gap-8 md:grid-cols-2">
              <h2 className="font-serif-royal text-3xl font-bold text-white md:text-4xl">A relationship-led financial workspace.</h2>
              <p className="leading-8 text-slate-300">Clients can track their financial position, submit service requests, report claims, and share documents. Advisers see those actions in their operations desk and can move each request forward with a clear history.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">Contact</p>
          <div className="mt-5 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif-royal text-3xl font-bold text-white">Let&apos;s make the next decision clearer.</h2>
              <p className="mt-3 text-slate-300">Speak with the Royal Square team about your financial plan.</p>
            </div>
            <a href="mailto:hello@royalsquare.co.za" className="text-sm font-semibold text-amber-300 hover:text-amber-200">hello@royalsquare.co.za</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-500">
        Royal Square Financial (Pty) Ltd · Authorised FSP #48921
      </footer>
    </div>
  );
}
