import { ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiCallingRoutes, heroHighlights, product } from "@/data/ai-calling";
import { AiEyebrow, Glow, GradientText, ctaPrimary, ctaSecondary } from "./primitives";
// Client island: only the live-call simulation is animated; the copy stays server-rendered.
import { HeroLiveDemo } from "./hero-demo";

export function AiCallingHero() {
  return (
    <section data-scene="hero" className="relative isolate overflow-x-clip bg-gradient-to-b from-white via-[#faf8ff] to-lavender">
      <Glow className="-top-40 right-[-10%] h-[760px] w-[980px]" />
      <Glow color="lilac" className="top-[35%] left-[-15%] h-[520px] w-[700px]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-white" />

      <div className="container-page grid items-center gap-12 pt-12 pb-20 sm:pt-16 xl:grid-cols-[minmax(0,1fr)_700px] xl:gap-6 xl:pt-20 xl:pb-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center xl:mx-0 xl:items-start xl:text-left">
          <AiEyebrow>{product.parent} · AI Calling</AiEyebrow>
          <h1 className="mt-7 text-[2.9rem] leading-[0.98] font-bold tracking-[-0.055em] text-balance text-nova-ink sm:text-[4.3rem] xl:text-[3.85rem]">
            Your best <GradientText>salesperson</GradientText> never <GradientText>misses a call.</GradientText>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-pretty text-nova-body">
            Meet {product.name} — the voice AI that contacts leads, qualifies interest, speaks your customers&apos; language, and
            keeps your sales team focused on closing deals.
          </p>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href={aiCallingRoutes.experience} size="lg" className={ctaPrimary}>
              Experience AI Calling <ArrowRight />
            </Button>
            <Button href={aiCallingRoutes.bookDemo} size="lg" variant="secondary" className={ctaSecondary}>
              <CalendarCheck /> Book a Demo
            </Button>
          </div>
          <ul className="mt-10 grid gap-x-8 gap-y-3.5 text-left sm:grid-cols-2">
            {heroHighlights.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 text-[15px] font-medium text-nova-body">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-nova-100 text-nova-700">
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <HeroLiveDemo />
      </div>
    </section>
  );
}
