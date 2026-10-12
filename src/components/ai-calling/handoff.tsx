import { handoffFeatures } from "@/data/ai-calling";
import { AiHeading, AiSection, FeatureRow, Glow, GradientText } from "./primitives";
// Client island: the synchronized handoff simulation; heading and features stay server-rendered.
import { HandoffStory } from "./handoff-story";

export function Handoff() {
  return (
    <AiSection id="handoff" tone="lavender">
      <Glow className="top-[20%] left-1/2 h-[700px] w-[1000px] -translate-x-1/2" />

      <div className="grid gap-12 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-10">
        <div className="flex flex-col gap-8">
          <AiHeading
            index="05"
            eyebrow="Hot lead handoff"
            title={
              <>
                When a lead says yes, <GradientText>your team takes over.</GradientText>
              </>
            }
            description="The AI spots genuine interest, assigns the next counsellor in your round-robin rotation, creates a follow-up task and updates the CRM — so nobody asks the lead the same questions twice."
          />
          <ul className="grid gap-3">
            {handoffFeatures.map((f) => (
              <FeatureRow key={f.title} icon={f.icon} title={f.title} body={f.body} />
            ))}
          </ul>
        </div>

        <HandoffStory />
      </div>
    </AiSection>
  );
}
