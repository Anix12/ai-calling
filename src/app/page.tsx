import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AiCallingHero } from "@/components/ai-calling/hero";
import { Problem } from "@/components/ai-calling/problem";
import { InstantCalling } from "@/components/ai-calling/instant-calling";
import { BulkCalling } from "@/components/ai-calling/bulk-calling";
import { Multilingual } from "@/components/ai-calling/multilingual";
import { Handoff } from "@/components/ai-calling/handoff";
import { CallIntelligence } from "@/components/ai-calling/call-intelligence";
import { Scale } from "@/components/ai-calling/scale";
import { AiCallingFinalCta } from "@/components/ai-calling/final-cta";

export default function AiCallingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <AiCallingHero />
        <Problem />
        <InstantCalling />
        <BulkCalling />
        <Multilingual />
        <Handoff />
        <CallIntelligence />
        <Scale />
        <AiCallingFinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
