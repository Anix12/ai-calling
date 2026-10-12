import { ArrowDown, Bot, Check, ShieldCheck, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiHandles, product, scaleCompare, teamFocuses } from "@/data/ai-calling";
import { AiHeading, AiSection, Glass, Glow, GlowIcon, GradientText, HeadingRow, Platform, RobotSlot } from "./primitives";
import { AnimatedNova } from "./animated-nova";
// Lightweight, view-triggered entrances (no story timeline in this section).
import { RevealOnView } from "./reveal-on-view";
import { revealDelay, revealItem } from "./reveal-classes";

function TaskCard({ title, icon, items, delay }: { title: string; icon: typeof Bot; items: string[]; delay: number }) {
  return (
    <Glass className={cn("p-5", revealItem)} style={revealDelay(delay)}>
      <div className="flex items-center gap-3">
        <GlowIcon icon={icon} className="size-10 rounded-xl" />
        <h3 className="text-[16px] font-bold text-nova-ink">{title}</h3>
      </div>
      <ul className="mt-4 grid gap-2.5 pl-1">
        {items.map((item, i) => (
          <li key={item} style={revealDelay(delay + 150 + i * 70)} className={cn("flex items-center gap-2.5 text-[14px] text-nova-body", revealItem)}>
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-nova-100 text-nova-700">
              <Check className="size-2.5" strokeWidth={3.5} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Glass>
  );
}

function Comparison() {
  return (
    <div data-anim="scale-compare" className="grid grid-cols-2 items-end gap-3 sm:gap-4">
      <Glass className={cn("p-4 sm:p-5", revealItem)} style={revealDelay(250)}>
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UsersRound className="size-6" />
          </span>
          <p className="mt-3 text-[14px] font-bold text-nova-ink">With a human team only</p>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-nova-100 pt-4">
          {scaleCompare.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold tracking-wide text-nova-muted uppercase">{c.label}</dt>
              <dd className="mt-0.5 text-[13.5px] leading-snug font-semibold text-slate-600">{c.human}</dd>
            </div>
          ))}
        </dl>
      </Glass>
      <div style={revealDelay(400)} className={cn("relative rounded-3xl bg-gradient-to-b from-nova-500 via-nova-600 to-nova-800 p-4 text-white shadow-nova-lg sm:p-5", revealItem)}>
        <div aria-hidden className="absolute inset-x-6 -top-3 h-6 rounded-full bg-nova-400/60 blur-xl" />
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <Bot className="size-6" />
          </span>
          <p className="mt-3 text-[14px] font-bold">With {product.name}</p>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-white/20 pt-4">
          {scaleCompare.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold tracking-wide text-white/75 uppercase">{c.label}</dt>
              <dd className="mt-0.5 text-[13.5px] leading-snug font-bold">{c.ai}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function Scale() {
  return (
    <AiSection id="scale" tone="lavender">
      <Glow className="top-[20%] right-[10%] h-[700px] w-[900px]" />

      <HeadingRow
        heading={
          <AiHeading
            index="07"
            eyebrow="Scale & cost"
            title={
              <>
                Scale conversations. <GradientText>Not your calling team.</GradientText>
              </>
            }
          />
        }
      >
        {product.name} takes on the repetitive calls, so your team can spend its energy on the conversations that close.
      </HeadingRow>

      <RevealOnView className="mt-14 grid items-center gap-8 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_250px] xl:gap-8">
        <div className="flex flex-col">
          <TaskCard title="Your AI agent handles" icon={Bot} items={aiHandles} delay={0} />
          {/* The division of work: what the AI flags, the team picks up */}
          <div aria-hidden className="flex flex-col items-center justify-center gap-1 py-2">
            <span className="h-4 w-px origin-top bg-gradient-to-b from-nova-300 to-nova-500 transition-transform delay-500 duration-700 group-data-[shown=false]/reveal:scale-y-0 motion-reduce:transition-none" />
            <span style={revealDelay(700)} className={cn("inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-nova-700 shadow-nova ring-1 ring-nova-100", revealItem)}>
              <ArrowDown className="size-3.5" /> Interested leads handed to your team
            </span>
          </div>
          <TaskCard title="Your team focuses on" icon={Users} items={teamFocuses} delay={850} />
        </div>

        <Comparison />

        <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-center pt-16 pb-10 lg:col-span-2 xl:col-span-1">
          <span
            data-anim="scale-bubble"
            style={revealDelay(600)}
            className={cn("absolute top-0 right-0 rounded-2xl rounded-br-md bg-white px-4 py-2.5 text-[14px] leading-snug font-bold text-nova-ink shadow-nova ring-1 ring-nova-100", revealItem)}
          >
            More conversations.
            <span className="block text-nova-600">Less repetitive dialing.</span>
          </span>
          <RobotSlot name="scale" className="relative w-[210px]">
            <Platform className="-bottom-10 left-1/2 h-[100px] w-[290px] -translate-x-1/2" />
            <AnimatedNova preset="scale" />
          </RobotSlot>
        </div>
      </RevealOnView>

      <Glass className="mt-14 flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
        <GlowIcon icon={ShieldCheck} tone="soft" />
        <div>
          <h3 className="text-[16px] font-bold text-nova-ink">Calling, responsibly</h3>
          <p className="mt-1.5 max-w-3xl text-[14.5px] leading-relaxed text-nova-body">
            Set calling windows and daily limits for every campaign, and call only leads who have shared their number and agreed
            to be contacted. You stay in control of meeting the calling and consent regulations that apply to your business.
          </p>
        </div>
      </Glass>
    </AiSection>
  );
}
