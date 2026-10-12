import { ArrowRight, CalendarCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiCallingRoutes, ctaAssurances, demoAgenda, product } from "@/data/ai-calling";
import { AiEyebrow, Glass, Glow, GradientText, Platform, RobotSlot, ctaPrimary, ctaSecondary } from "./primitives";
import { cn } from "@/lib/utils";
import { AnimatedNova } from "./animated-nova";
// Lightweight, view-triggered entrance (no story timeline in this section).
import { RevealOnView } from "./reveal-on-view";
import { revealDelay, revealItem } from "./reveal-classes";

/**
 * Closing scene. Carries the `get-started` / `book-demo` anchors that the header's CTA
 * fallbacks scroll to when no signup or demo URL is configured.
 */
const ctaLift = "motion-safe:hover:-translate-y-0.5";

export function AiCallingFinalCta() {
  return (
    <section id="get-started" data-scene="final-cta" className="relative isolate scroll-mt-16 overflow-x-clip bg-white pt-8 pb-24 sm:pb-28">
      <div id="book-demo" className="container-page scroll-mt-16">
        <RevealOnView className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#faf8ff] via-lavender to-nova-100 px-6 py-12 ring-1 ring-nova-100 sm:px-10 sm:py-14 lg:px-12">
          {/* Ambient purple light that brightens once as the scene appears (opacity only, no loop). */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-[1400ms] ease-out group-data-[shown=false]/reveal:opacity-40 motion-reduce:transition-none">
            <Glow className="top-[-20%] left-[35%] h-[700px] w-[800px]" />
            <Glow color="pink" className="right-[-10%] bottom-[-30%] h-[500px] w-[600px]" />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_320px_320px] xl:gap-8">
            <div className="flex flex-col items-start lg:col-span-2 xl:col-span-1">
              <AiEyebrow index="08" className={revealItem}>
                Get started
              </AiEyebrow>
              <h2 style={revealDelay(120)} className={cn("mt-6 text-[2.5rem] leading-[1.02] font-bold tracking-[-0.05em] text-balance text-nova-ink sm:text-[3.4rem]", revealItem)}>
                Let AI make the first call. <GradientText>Let your team close the deal.</GradientText>
              </h2>
              <p style={revealDelay(260)} className={cn("mt-5 max-w-lg text-[17px] leading-relaxed text-nova-body", revealItem)}>
                See how {product.name} fits into your business — from the first enquiry to the closed deal. Book a demo and
                experience AI calling for yourself.
              </p>
              <div style={revealDelay(400)} className={cn("mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row", revealItem)}>
                {/* One soft glow on first appearance; hover lifts gently; focus uses the global ring. */}
                <Button href={aiCallingRoutes.experience} size="lg" className={cn(ctaPrimary, ctaLift, "motion-safe:group-data-[shown=true]/reveal:animate-[nova-cta-glow_1.8s_ease-out_0.9s_1]")}>
                  Experience AI Calling <ArrowRight />
                </Button>
                <Button href={aiCallingRoutes.bookDemo} size="lg" variant="secondary" className={cn(ctaSecondary, ctaLift)}>
                  <CalendarCheck /> Book a Demo
                </Button>
              </div>
              <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {ctaAssurances.map(({ label, icon: Icon }, i) => (
                  <li key={label} style={revealDelay(550 + i * 70)} className={cn("flex items-center gap-2.5 text-[14px] font-medium text-nova-body", revealItem)}>
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-white text-nova-600 shadow-nova">
                      <Icon className="size-4" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto flex w-full max-w-[320px] flex-col items-center pt-16 pb-12">
              <span style={revealDelay(700)} className={cn(revealItem, "absolute top-0 left-0 rotate-[-6deg] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] leading-snug font-bold text-nova-ink shadow-nova ring-1 ring-nova-100")}>
                Ready when your
                <span className="block text-nova-600">leads are.</span>
              </span>
              <RobotSlot name="final" className="relative w-[240px]">
                <Platform className="-bottom-12 left-1/2 h-[110px] w-[330px] -translate-x-1/2" label={product.name} />
                <AnimatedNova preset="final" label="NOVA, the LeadsZone AI calling assistant, waving" />
              </RobotSlot>
            </div>

            <Glass strong style={revealDelay(450)} className={cn("p-5 sm:p-6", revealItem)}>
              <p className="text-[17px] font-bold text-nova-ink">What you&apos;ll see in the demo</p>
              <ul className="mt-4 grid gap-3">
                {demoAgenda.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14.5px] text-nova-body">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-nova-600 text-white">
                      <Check className="size-3" strokeWidth={3.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Glass>
          </div>
        </RevealOnView>
      </div>
    </section>
  );
}
