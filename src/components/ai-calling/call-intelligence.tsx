import { intelligenceFeatures } from "@/data/ai-calling";
import { AiHeading, AiSection, FeatureRow, Glow, GradientText } from "./primitives";
// Client island: the synchronized call-review simulation; heading and features stay server-rendered.
import { IntelligenceStory } from "./intelligence-story";

export function CallIntelligence() {
  return (
    <AiSection id="call-intelligence">
      <Glow className="top-[10%] left-[30%] h-[700px] w-[900px]" />

      <div className="grid gap-10 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-8">
        <div className="flex flex-col gap-8">
          <AiHeading
            index="06"
            eyebrow="Call intelligence"
            title={
              <>
                Every conversation <GradientText>tells you something.</GradientText>
              </>
            }
            description="Listen to recordings, read transcripts, see outcomes and understand why leads drop off — so you can improve every campaign."
          />
          <ul className="grid gap-3">
            {intelligenceFeatures.map((f) => (
              <FeatureRow key={f.title} icon={f.icon} title={f.title} body={f.body} />
            ))}
          </ul>
        </div>

        <IntelligenceStory />
      </div>
    </AiSection>
  );
}
