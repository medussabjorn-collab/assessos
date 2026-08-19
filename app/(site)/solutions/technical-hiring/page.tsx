import type { Metadata } from "next";
import SolutionDetail, { SolutionData } from "@/components/SolutionDetail";
import { Code, Terminal, ShieldCheck, Sparkles, Bars, Plug } from "@/components/icons";

export const metadata: Metadata = {
  title: "Technical Hiring",
  description:
    "Prove real engineering ability with a live coding IDE, system-design tasks, and AI-assisted anti-cheat your engineers trust.",
};

const data: SolutionData = {
  crumb: "Solutions / Technical",
  title: "Prove real engineering ability.",
  sub: "Whiteboard trivia and take-homes both fail — one is unrealistic, the other is gameable. Prelim measures how candidates actually build, in a live environment your team believes.",
  overview: {
    title: "Real repos. Real tasks. Real signal.",
    body: "Candidates work in a full IDE against realistic problems — reading existing code, designing systems, and shipping working solutions. Specialized assessors grade reasoning and correctness, and anti-cheat flags anomalies without punishing legitimate tooling.",
    points: [
      "Live, browser-based coding IDE with real repositories",
      "System-design and DevOps exercises, not just algorithms",
      "AI-assisted grading of correctness and approach",
      "Integrity signals that survive the age of AI copilots",
    ],
  },
  stat: { value: "87%", label: "faster time-to-shortlist", note: "Teams skip the take-home backlog and interview only candidates who already cleared a real technical bar." },
  capsTitle: "What you can assess.",
  caps: [
    { Icon: Code, title: "Coding ability", desc: "Correctness, structure, and readability on realistic tasks." },
    { Icon: Terminal, title: "Live coding IDE", desc: "A full editor with test runners and real repos in the browser." },
    { Icon: Sparkles, title: "System design", desc: "Architecture and trade-off reasoning, scored consistently." },
    { Icon: Plug, title: "DevOps & tooling", desc: "Practical skills with CI, containers, and infrastructure." },
    { Icon: ShieldCheck, title: "Anti-cheating", desc: "Proctoring and integrity signals tuned for the AI era." },
    { Icon: Bars, title: "Skills matrix", desc: "A ranked, explainable breakdown per competency." },
  ],
  faq: [
    { q: "Can candidates use AI copilots during the test?", a: "You decide per assessment. Prelim can allow, restrict, or observe copilot use — and scores the quality of the candidate's judgment either way, since that's what the job requires." },
    { q: "Do you support our language and framework stack?", a: "Prelim ships environments for the major languages and frameworks, and supports custom repos so candidates work in something close to your real codebase." },
    { q: "How do you prevent cheating without false positives?", a: "Integrity signals are probabilistic and reviewable. Prelim flags anomalies for a human to confirm rather than auto-rejecting, protecting legitimate candidates." },
  ],
  cta: { title: "Interview only engineers who can already build.", sub: "Bring one open technical role. We'll assemble the assessment live and show you a sample skills matrix." },
};

export default function Page() {
  return <SolutionDetail data={data} />;
}
