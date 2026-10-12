import { Info, Power } from "lucide-react";
import { instantRules, product } from "@/data/ai-calling";
import { AiHeading, AiSection, Glass, Glow, GradientText } from "./primitives";
// Client island: the synchronized lead-catching simulation; heading and rules stay server-rendered.
import { InstantStory } from "./instant-story";

function RulesStrip() {
  return (
    <Glass strong className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-nova-muted uppercase">Your calling rules</p>
          <p className="mt-0.5 text-[16px] font-bold text-nova-ink">Campaign · Admissions 2026</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
          <Power className="size-3.5" /> Call new leads automatically · On
        </span>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {instantRules.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-nova-50/70 p-4 ring-1 ring-nova-100">
            <dt className="flex items-center gap-2 text-[12.5px] font-semibold text-nova-muted">
              <Icon className="size-4 text-nova-600" /> {label}
            </dt>
            <dd className="mt-1.5 text-[15px] font-bold text-nova-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-nova-muted">
        <Info className="mt-0.5 size-4 shrink-0" />
        Leads that arrive outside your calling hours are queued and called when your window opens. Values shown are examples.
      </p>
    </Glass>
  );
}

export function InstantCalling() {
  return (
    <AiSection id="how-it-works">
      <Glow className="top-0 right-[10%] h-[700px] w-[900px]" />
      <Glow color="lilac" className="bottom-0 left-[-10%] h-[600px] w-[700px]" />

      <InstantStory
        heading={
          <AiHeading
            index="02"
            eyebrow="Instant AI calling"
            size="xl"
            title={
              <>
                New lead? <GradientText>Your AI is already on it.</GradientText>
              </>
            }
            description={`${product.name} contacts new leads after a delay you configure, qualifies their interest and updates your CRM — so no enquiry waits in a callback list.`}
          />
        }
      />
      <div className="mt-10">
        <RulesStrip />
      </div>
    </AiSection>
  );
}
