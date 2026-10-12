import { product } from "@/data/ai-calling";
import { AiHeading, AiSection, Glow, GradientText, HeadingRow } from "./primitives";
// Client island: the synchronized manual-vs-AI simulation; the heading stays server-rendered.
import { ProblemComparison } from "./problem-comparison";

export function Problem() {
  return (
    <AiSection id="problem" tone="lavender">
      <Glow className="top-[10%] right-[5%] h-[600px] w-[900px]" />

      <HeadingRow
        heading={
          <AiHeading
            index="01"
            eyebrow="The problem"
            title={
              <>
                Your leads are waiting. <GradientText>Your competitors aren&apos;t.</GradientText>
              </>
            }
          />
        }
      >
        Every hour a lead sits unanswered, their interest cools. Manual calling is slow, inconsistent and hard to scale.{" "}
        {product.name} gives every lead a timely, consistent first conversation.
      </HeadingRow>

      <ProblemComparison />
    </AiSection>
  );
}
