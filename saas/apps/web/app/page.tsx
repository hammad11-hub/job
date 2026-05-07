import { Button } from '@hireos/ui';
import AiMatchDemo from '../components/ai/AiMatchDemo';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              AI Recruitment OS · Rapidly hire remote engineers
            </div>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Hire developers faster with AI matching, screening, and hiring operations.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-400">
                Transform recruiting into a modern, scalable workflow for remote startups, agencies, and tech hiring teams.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Start free trial</Button>
              <Button variant="secondary">Book a demo</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Faster hiring', value: 'AI-matched candidates in minutes' },
                { label: 'Better quality', value: 'Structured scoring and interview kits' },
                { label: 'Lower cost', value: 'Automated screening and outreach' },
                { label: 'Team-ready', value: 'Org roles, audit logs, and analytics' }
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-base font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-3xl bg-slate-800 px-4 py-2 text-sm uppercase tracking-[0.24em] text-slate-300">Live demo</div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">AI matching</span>
            </div>
            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-950/90 p-5">
                <h2 className="text-sm uppercase tracking-[0.24em] text-slate-400">Top candidate match</h2>
                <p className="mt-3 text-xl font-semibold text-white">Senior React Engineer</p>
                <p className="mt-2 text-sm text-slate-400">95% match — strong remote experience, modern stack, and rapid availability.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Score</p>
                  <p className="mt-3 text-3xl font-semibold text-white">92</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Next action</p>
                  <p className="mt-3 text-base font-semibold text-white">Send interview invite</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14">
          <AiMatchDemo />
        </div>
      </section>
    </main>
  );
}
