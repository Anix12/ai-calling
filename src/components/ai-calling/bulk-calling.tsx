import { bulkFeatures, product } from "@/data/ai-calling";
import { AiHeading, AiSection, FeatureRow, Glow, GradientText } from "./primitives";
// Client island: the synchronized campaign simulation; the heading and feature list stay server-rendered.
import { BulkStory } from "./bulk-story";

export function BulkCalling() {
  return (
    <AiSection id="bulk-calling" tone="lavender">
      <Glow className="top-[5%] right-[-5%] h-[700px] w-[900px]" />

      <div className="grid gap-12 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-10">
        <div className="flex flex-col gap-8">
          <AiHeading
            index="03"
            eyebrow="Bulk AI calling"
            title={
              <>
                One AI agent. <GradientText>A whole pipeline of conversations.</GradientText>
              </>
            }
            description={`Upload your leads or pick them by CRM stage, then launch a campaign. ${product.name} handles the outreach so your team can focus on the hot opportunities.`}
          />
          <ul className="grid gap-3">
            {bulkFeatures.map((f) => (
              <FeatureRow key={f.title} icon={f.icon} title={f.title} body={f.body} />
            ))}
          </ul>
        </div>

        <BulkStory />
      </div>
    </AiSection>
  );
}
