import { languageFeatures, product } from "@/data/ai-calling";
import { AiHeading, AiSection, FeatureRow, Glow, GradientText } from "./primitives";
// Client island: the interactive language selector and conversation story; the heading stays server-rendered.
import { MultilingualStory } from "./multilingual-story";

export function Multilingual() {
  return (
    <AiSection id="languages">
      <Glow className="top-[15%] left-1/2 h-[700px] w-[900px] -translate-x-1/2" />

      <div className="grid items-center gap-12 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-8">
        <div className="flex flex-col gap-8">
          <AiHeading
            index="04"
            eyebrow="Multilingual AI calling"
            title={
              <>
                Speak to leads <GradientText>in their language.</GradientText>
              </>
            }
            description={`${product.name} converses naturally in nine languages, so you connect with more leads and every first call feels familiar. Pick a language to see a sample call.`}
          />
          <ul className="grid gap-3">
            {languageFeatures.map((f) => (
              <FeatureRow key={f.title} icon={f.icon} title={f.title} body={f.body} />
            ))}
          </ul>
        </div>

        <MultilingualStory />
      </div>
    </AiSection>
  );
}
