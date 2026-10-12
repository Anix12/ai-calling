import {
  BadgeCheck,
  BarChart3,
  Bot,
  CalendarClock,
  CalendarPlus,
  Clock3,
  Database,
  FileAudio,
  FileText,
  Gauge,
  Globe2,
  Languages,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  PhoneCall,
  PhoneForwarded,
  RefreshCw,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Timer,
  Upload,
  Users,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { externalLinks } from "@/config/links";

/**
 * Content for the LeadsZone AI Calling page. Copy and illustrative sample data live here so
 * the section components stay presentational and later phases can drive them from timelines.
 *
 * Reference designs are concepts: no statistic, testimonial or capability claim is copied from
 * them unless it is verified. Every number below is clearly labelled sample data in the UI.
 */
export const product = {
  brand: "LeadsZone",
  name: "LeadsZone AI Calling",
  parent: "LeadsZone",
};

/**
 * CTAs. "Experience AI Calling" goes to signup when configured, otherwise it tours the product
 * story on this page. "Book a Demo" goes to the demo link when configured, otherwise it scrolls
 * to the closing CTA section.
 */
export const aiCallingRoutes = {
  experience: externalLinks.signup ?? "#how-it-works",
  bookDemo: externalLinks.demo ?? "#book-demo",
};

/** In-page sections, used by the header and footer. */
export const sectionNav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Bulk calling", href: "#bulk-calling" },
  { label: "Languages", href: "#languages" },
  { label: "Handoff", href: "#handoff" },
  { label: "Call intelligence", href: "#call-intelligence" },
];

/* ---------------------------------------------------------------- Hero */

export const heroHighlights: { label: string; icon: LucideIcon }[] = [
  { label: "Calls new leads automatically", icon: PhoneCall },
  { label: "Nine languages", icon: Globe2 },
  { label: "Respects your calling hours", icon: Clock3 },
  { label: "Updates your CRM", icon: Database },
];

/** Copy for the hero's live-call simulation. Timing lives in components/ai-calling/hero-timeline.ts. */
export const heroDemo = {
  lead: { name: "Priya Nair", initials: "PN", detail: "Course enquiry" },
  notification: { title: "New website enquiry — 6:00 PM", detail: "Priya Nair · Course enquiry" },
  transcript: [
    { from: "ai", text: "Hi Priya! I'm calling about your recent course enquiry. Is this a good time?" },
    { from: "lead", text: "Yes, I wanted to know more." },
    { from: "ai", text: "Are you planning to join this month?" },
    { from: "lead", text: "Yes, I'm interested." },
  ],
  qualified: ["Interested Lead", "Qualified by AI"],
  crm: { title: "CRM Updated", detail: "Counsellor follow-up ready" },
} as const;

/* ------------------------------------------------------------- Problem */

export const manualIssues = [
  "Callbacks take hours",
  "Leads go unanswered",
  "Inconsistent follow-ups",
  "Limited to shift hours",
  "Hard to scale",
  "Team gets exhausted",
];

export const aiStrengths = [
  "Calls after your configured delay",
  "Every new lead gets a call",
  "Consistent follow-ups",
  "Retries unanswered calls",
  "Works within your calling hours",
  "Flags interested leads",
];

/**
 * The Problem section's simulation: one illustrative enquiry, two journeys, one clock.
 * Times are illustrative and inside the sample calling hours (Mon–Sat 09:00–19:00);
 * the AI side uses the sample one-minute call delay. Timing lives in problem-story.ts.
 */
export const problemStory = {
  lead: { name: "Priya Sharma", initials: "PS", title: "New course enquiry — Priya Sharma", received: "10:00 AM" },
  manualSteps: [
    { time: "10:02 AM", label: "Sales team busy on other calls" },
    { time: "10:15 AM", label: "Lead waiting in the callback queue" },
    { time: "11:00 AM", label: "Still awaiting a callback" },
    { time: "2:00 PM", label: "Manual callback attempted" },
  ],
  aiSteps: [
    { time: "10:00 AM", label: "NOVA picks up the enquiry" },
    { time: "10:00 AM", label: "Configured 1-minute delay" },
    { time: "10:01 AM", label: "AI call starts" },
    { time: "10:03 AM", label: "Marked interested · CRM updated" },
  ],
  transcript: [
    { from: "ai", text: "Hi Priya! I'm calling about your course enquiry. Is now a good time?" },
    { from: "lead", text: "Yes, I wanted to know more." },
    { from: "ai", text: "Are you planning to join this month?" },
    { from: "lead", text: "Yes, I'm interested." },
  ],
  manualOutcome: "Follow-up delayed",
  aiOutcome: "Qualified lead — ready for follow-up",
} as const;

/** Qualitative comparison only — no invented percentages. */
export const problemCompare: { manual: string; ai: string; label: string }[] = [
  { label: "Response", manual: "Hours later", ai: "Minutes, by your rules" },
  { label: "Coverage", manual: "Whoever gets reached", ai: "Every new lead called" },
  { label: "Team effort", manual: "Manual dialing", ai: "Automated first calls" },
];

/* ------------------------------------------------------ Instant calling */

export const instantFlow: { step: string; title: string; detail: string; icon: LucideIcon }[] = [
  { step: "1", title: "New lead", detail: "From your website, Facebook or other sources", icon: ListChecks },
  { step: "2", title: "AI call", detail: "Automatically, after a configured delay", icon: Bot },
  { step: "3", title: "Qualification", detail: "AI understands interest and key details", icon: PhoneCall },
  { step: "4", title: "CRM update", detail: "Lead status, notes and next steps updated", icon: Database },
];

export const instantRules: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Call delay", value: "1 min after the lead arrives", icon: Timer },
  { label: "Calling hours", value: "Mon–Sat · 09:00–19:00", icon: Clock3 },
  { label: "Daily call limit", value: "200 calls per day", icon: Gauge },
  { label: "Campaign → agent", value: "Admissions 2026 → Aria", icon: Workflow },
];

/**
 * Instant AI calling simulation: NOVA catches one illustrative lead and calls it.
 * Uses the sample rules above (1-minute delay, inside 09:00–19:00). Timing lives in instant-story.ts.
 */
export const instantStory = {
  lead: { name: "Aarav Mehta", initials: "AM", source: "Website enquiry", received: "11:00 AM", callAt: "11:01 AM" },
  transcript: [
    { from: "ai", text: "Hi Aarav, I'm calling about your enquiry." },
    { from: "lead", text: "Yes, I wanted to know more." },
    { from: "ai", text: "Would you like our team to follow up?" },
    { from: "lead", text: "Yes, please." },
  ],
  crm: { status: "Interested", next: "Team follow-up" },
} as const;

/* --------------------------------------------------------- Bulk calling */

export const bulkFeatures: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Upload your leads", body: "CSV import or straight from your CRM", icon: Upload },
  { title: "Choose campaign settings", body: "Stage, calling hours, daily limits", icon: Database },
  { title: "AI calls automatically", body: "One agent works the whole list", icon: PhoneCall },
  { title: "Smart retries", body: "Unanswered calls are retried on schedule", icon: RefreshCw },
];

export const bulkSetup: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "CRM stage", value: "New enquiry · Follow-up", icon: Database },
  { label: "AI agent", value: "Aria · Admissions", icon: Bot },
  { label: "Calling hours", value: "Mon–Sat · 09:00–19:00", icon: Clock3 },
  { label: "Daily limit & retries", value: "200 / day · up to 3 tries, 2 h apart", icon: Gauge },
];

/**
 * Bulk calling simulation: one illustrative six-lead campaign, called one lead at a time.
 * Times sit inside the sample calling hours (09:00–19:00) and follow the retry rule above
 * (up to 3 tries, 2 hours apart). Timing lives in bulk-timeline.ts.
 */
export const bulkStory = {
  campaign: "October Admissions Follow-up",
  file: "october_admissions.csv",
  startedAt: "10:00 AM",
  leads: [
    { name: "Ananya Iyer", phone: "+91 98••• ••210", calledAt: "10:00 AM" },
    { name: "Rahul Mehta", phone: "+91 87••• ••109", calledAt: "10:04 AM", retryAt: "12:04 PM" },
    { name: "Sneha Patil", phone: "+91 76••• ••098", calledAt: "10:07 AM" },
    { name: "Amit Shah", phone: "+91 65••• ••987" },
    { name: "Neha Gupta", phone: "+91 54••• ••876" },
    { name: "Karan Verma", phone: "+91 43••• ••765" },
  ],
} as const;

/* ------------------------------------------------------------ Languages */

export const languages: { name: string; native: string; glyph: string; code: string; lang: string }[] = [
  { name: "Hindi", native: "हिन्दी", glyph: "हि", code: "HI", lang: "hi" },
  { name: "Marathi", native: "मराठी", glyph: "म", code: "MR", lang: "mr" },
  { name: "English", native: "English", glyph: "A", code: "EN", lang: "en" },
  { name: "Gujarati", native: "ગુજરાતી", glyph: "ગુ", code: "GU", lang: "gu" },
  { name: "Telugu", native: "తెలుగు", glyph: "తె", code: "TE", lang: "te" },
  { name: "Malayalam", native: "മലയാളം", glyph: "മ", code: "ML", lang: "ml" },
  { name: "Kannada", native: "ಕನ್ನಡ", glyph: "ಕ", code: "KN", lang: "kn" },
  { name: "Tamil", native: "தமிழ்", glyph: "த", code: "TA", lang: "ta" },
  { name: "Bengali", native: "বাংলা", glyph: "বা", code: "BN", lang: "bn" },
];

/** The language selected when the page loads. */
export const previewLanguage = "Marathi";

export const languageFeatures: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Nine languages", body: "Natural conversations in the lead's language", icon: Languages },
  { title: "Understands context", body: "Not just word-for-word translation", icon: Sparkles },
  { title: "Comfortable first calls", body: "Leads talk in the language they prefer", icon: UsersRound },
];

/* Multilingual sample conversation ------------------------------------------------------
 * One short enquiry call, same meaning in every language. English is the source.
 * Translation data is kept apart from the animation (multilingual-timeline.ts).
 *
 * Each language holds the four lines in native script, under one of two states:
 *   `reviewed` – confirmed by a native speaker (English is the source, so it counts).
 *   `draft`    – AI-drafted, awaiting native review. Shown on the page with a small
 *                "pending language review" note; move it to `reviewed` once confirmed.
 * NOTE: no line here has been checked by a native speaker yet; review all before launch.
 */
export type ConversationLines = readonly [ai1: string, lead1: string, ai2: string, lead2: string];

export const conversationSpeakers = ["ai", "lead", "ai", "lead"] as const;

export const conversationMeaning: ConversationLines = [
  "Hello, I'm calling about your enquiry.",
  "Yes, I would like more information.",
  "Would you like our team to contact you?",
  "Yes, please.",
];

export const conversations: Record<string, { reviewed: ConversationLines } | { draft: ConversationLines }> = {
  EN: { reviewed: conversationMeaning },
  HI: {
    draft: ["नमस्ते, मैं आपकी पूछताछ के बारे में कॉल कर रहा हूँ।", "हाँ, मुझे और जानकारी चाहिए।", "क्या आप चाहेंगे कि हमारी टीम आपसे संपर्क करे?", "हाँ, ज़रूर।"],
  },
  MR: {
    draft: ["नमस्कार, मी तुमच्या चौकशीबद्दल फोन करत आहे.", "हो, मला अधिक माहिती हवी आहे.", "आमच्या टीमने तुमच्याशी संपर्क साधावा का?", "हो, नक्की."],
  },
  GU: {
    draft: ["નમસ્તે, હું તમારી પૂછપરછ વિશે ફોન કરી રહ્યો છું.", "હા, મારે વધુ માહિતી જોઈએ છે.", "શું તમે ઇચ્છો છો કે અમારી ટીમ તમારો સંપર્ક કરે?", "હા, ચોક્કસ."],
  },
  BN: {
    draft: ["নমস্কার, আমি আপনার জিজ্ঞাসার বিষয়ে ফোন করছি।", "হ্যাঁ, আমি আরও তথ্য জানতে চাই।", "আপনি কি চান আমাদের টিম আপনার সঙ্গে যোগাযোগ করুক?", "হ্যাঁ, অবশ্যই।"],
  },
  TA: {
    draft: ["வணக்கம், உங்கள் விசாரணை குறித்து அழைக்கிறேன்.", "ஆம், எனக்கு மேலும் தகவல் வேண்டும்.", "எங்கள் குழு உங்களைத் தொடர்பு கொள்ள வேண்டுமா?", "ஆம், கண்டிப்பாக."],
  },
  TE: {
    draft: ["నమస్కారం, మీ విచారణ గురించి కాల్ చేస్తున్నాను.", "అవును, నాకు మరింత సమాచారం కావాలి.", "మా బృందం మిమ్మల్ని సంప్రదించాలా?", "అవును, తప్పకుండా."],
  },
  KN: {
    draft: ["ನಮಸ್ಕಾರ, ನಿಮ್ಮ ವಿಚಾರಣೆಯ ಬಗ್ಗೆ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ.", "ಹೌದು, ನನಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕು.", "ನಮ್ಮ ತಂಡ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಬೇಕೇ?", "ಹೌದು, ಖಂಡಿತ."],
  },
  ML: {
    draft: ["നമസ്കാരം, നിങ്ങളുടെ അന്വേഷണത്തെക്കുറിച്ചാണ് വിളിക്കുന്നത്.", "അതെ, എനിക്ക് കൂടുതൽ വിവരങ്ങൾ അറിയണം.", "ഞങ്ങളുടെ ടീം നിങ്ങളെ ബന്ധപ്പെടണോ?", "അതെ, തീർച്ചയായും."],
  },
};

/* -------------------------------------------------------------- Handoff */

export const handoffFeatures: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Identifies genuine interest", body: "Understands intent from the conversation", icon: Zap },
  { title: "Assigns the right counsellor", body: "Round-robin across your team", icon: Users },
  { title: "Creates a follow-up task", body: "With call notes and next steps", icon: CalendarPlus },
  { title: "Updates your CRM", body: "Lead status, fields and timeline", icon: Database },
];

export const handoffConversation = [
  { from: "ai", text: "Hi Priya! I'm calling about your recent course enquiry. Is this a good time?" },
  { from: "lead", text: "Yes, I wanted to know more." },
  { from: "ai", text: "Are you planning to join this month?" },
  { from: "lead", text: "Yes, I'm interested." },
  { from: "ai", text: "Great! I'll have a counsellor call you with the details and next steps." },
] as const;

/** Round-robin order. Neha is next in rotation when the story starts; Rahul is next after her. */
export const counsellors = [
  { name: "Neha Gupta", role: "Course Counsellor" },
  { name: "Rahul Mehta", role: "Senior Counsellor" },
  { name: "Sneha Patil", role: "Course Counsellor" },
] as const;

/** CRM fields written during the handoff story, in the order they fill in. */
export const crmRecord: { label: string; value: string }[] = [
  { label: "Lead status", value: "Interested" },
  { label: "Assigned to", value: "Neha Gupta · round-robin" },
  { label: "Follow-up", value: "Pending · tomorrow, 10:00 AM" },
  { label: "Call notes", value: "Plans to join this month. Wants batch timings and fees." },
];

export const handoffSteps: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "AI conversation", body: "AI qualifies the lead and understands intent", icon: PhoneCall },
  { title: "Interested lead", body: "Marked as interested with key details", icon: BadgeCheck },
  { title: "Counsellor assignment", body: "Assigned to the next counsellor automatically", icon: Users },
  { title: "CRM updated", body: "Follow-up created and details saved", icon: Database },
];

/* ----------------------------------------------------- Call intelligence */

export const intelligenceFeatures: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Call recordings & transcripts", body: "Revisit every conversation anytime", icon: FileAudio },
  { title: "AI call summaries", body: "The key points, in seconds", icon: FileText },
  { title: "Outcomes", body: "See why leads convert or drop off", icon: BarChart3 },
  { title: "Actionable insights", body: "Improve scripts and campaigns", icon: Lightbulb },
];

/** One sample call, used consistently across the recording, transcript, outcome and summary. */
export const sampleCall = {
  lead: "Priya Nair",
  position: "00:42",
  duration: "02:34",
  talkTime: "2m 34s",
  transcript: [
    { time: "00:00", from: "ai", text: "Hi Priya! I'm calling about your recent course enquiry. Is this a good time?" },
    { time: "00:12", from: "lead", text: "Yes, I wanted to know more." },
    { time: "00:28", from: "ai", text: "Are you planning to join this month?" },
    { time: "00:36", from: "lead", text: "Yes, I'm interested.", highlight: true },
    { time: "00:48", from: "ai", text: "Great! I'll have a counsellor call you with the details." },
  ],
  summary:
    "Priya plans to join the course this month and asked about batch timings and fees. A counsellor follow-up is scheduled for tomorrow morning.",
};

/**
 * Drop-off reasons from a SEPARATE illustrative campaign sample (not the single call above):
 * share of 100 non-converted calls, by reason. Sums to 100.
 */
export const dropOffReasons = [
  { reason: "No answer", value: 35 },
  { reason: "Busy / call later", value: 24 },
  { reason: "Not interested right now", value: 20 },
  { reason: "Enrolled elsewhere", value: 13 },
  { reason: "Wrong number", value: 8 },
];

export const intelligenceInsights: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Improve your scripts", body: "See which questions get the best responses and refine your calling flow.", icon: Rocket },
  { title: "Coach your team", body: "Share strong conversations and the context behind every handoff.", icon: Users },
  { title: "Fix drop-off points", body: "Spot patterns in why leads don't convert and act on them.", icon: ScanSearch },
];

/* ------------------------------------------------------------ Scale */

export const aiHandles = [
  "First call to every new lead",
  "Repeat attempts on unanswered calls",
  "Standard qualification questions",
  "Call notes and CRM updates",
  "Flagging hot leads for a human",
];

export const teamFocuses = [
  "Conversations with interested leads",
  "Counselling and detailed questions",
  "Negotiation and closing",
  "Relationships that need a human touch",
];

/** Qualitative only — no invented capacity or savings figures. */
export const scaleCompare: { label: string; human: string; ai: string }[] = [
  { label: "Outreach", human: "One lead at a time", ai: "Works through whole campaigns" },
  { label: "Availability", human: "Limited to shift hours", ai: "Every hour of your calling window" },
  { label: "Repetitive calls", human: "Take up the team's day", ai: "Handled automatically" },
  { label: "Hot leads", human: "Found by chance", ai: "Flagged and handed over" },
];

/* ---------------------------------------------------------- Final CTA */

export const demoAgenda = [
  "Live AI calling flow",
  "Lead qualification",
  "CRM updates and handoff",
  "Multilingual conversations",
  "Call recordings and insights",
  "How it fits your business",
];

export const ctaAssurances: { label: string; icon: LucideIcon }[] = [
  { label: "Live product walkthrough", icon: PhoneForwarded },
  { label: "Sample call scenarios", icon: MessageSquareText },
  { label: "Your calling rules, your control", icon: ShieldCheck },
  { label: "Answers to your questions", icon: CalendarClock },
];
