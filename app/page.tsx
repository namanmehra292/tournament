import Link from "next/link";
import Countdown from "@/components/Countdown";
import { GlassPanel, PrimaryButton, Chip } from "@/components/Glass";

const TOURNAMENT_DATE = "2026-12-12T09:00:00+05:30";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="orb w-[420px] h-[420px] bg-ocean-400 -top-32 -left-32 animate-float-slow" />
      <div className="orb w-[360px] h-[360px] bg-ocean-300 top-40 right-0 animate-float" />
      <div className="orb w-[300px] h-[300px] bg-ocean-500 bottom-0 left-1/3 animate-float-slow" />

      <section className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-20">
        <div className="flex flex-col items-start gap-6 max-w-2xl">
          <Chip>🏆 Registrations now open</Chip>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            Smash Open <span className="text-ocean-300">2026</span>
          </h1>
          <p className="text-lg text-white/75 leading-relaxed">
            A city-wide badminton tournament across five categories. Compete, connect, and
            chase the trophy — December 12–14, 2026 at the Lakeside Sports Arena.
          </p>

          <GlassPanel className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-sm text-white/80">
            <span>📅 Dec 12–14, 2026</span>
            <span>📍 Lakeside Sports Arena</span>
            <span>💰 ₹500 per player</span>
          </GlassPanel>

          <div className="pt-2">
            <span className="text-sm text-white/60 mb-2 block">Tournament starts in</span>
            <Countdown targetDate={TOURNAMENT_DATE} />
          </div>

          <div className="flex gap-4 pt-4">
            <Link href="/register">
              <PrimaryButton>Register Now</PrimaryButton>
            </Link>
            <Link href="/tournament">
              <button className="btn-ghost rounded-full px-6 py-3.5 text-[15px]">
                View Categories
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-4 sm:px-8 pb-24">
        <GlassPanel solid className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold mb-6">Why play in Smash Open?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              ["🏸", "5 Categories", "Singles, doubles and mixed doubles for every skill level."],
              ["🎖️", "Certified Officials", "Umpired matches with standard BWF court specs."],
              ["🏟️", "Pro Venue", "Indoor wooden courts with spectator seating."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="glass-panel p-5">
                <div className="text-2xl mb-2">{icon}</div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
