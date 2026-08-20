import type { ComponentType, SVGProps } from "react";
import { Shield, Code, Users } from "@/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type SampleQuestion = {
  format: string;
  prompt: string;
  measures: string;
};

export type SampleTrack = {
  id: string;
  name: string;
  Icon: Icon;
  href: string;
  intro: string;
  questions: SampleQuestion[];
};

export const SAMPLE_TRACKS: SampleTrack[] = [
  {
    id: "leadership",
    name: "Leadership",
    Icon: Shield,
    href: "/solutions/leadership-hiring",
    intro: "Situational judgment and 360°-style exercises. There's rarely one \"correct\" answer — Prelim scores the reasoning behind the choice.",
    questions: [
      {
        format: "Situational judgment",
        prompt: "A direct report on your team consistently delivers strong individual work but undermines a peer's ideas in group settings. You have a 1:1 with them tomorrow. Walk through how you'd open the conversation.",
        measures: "Coaching approach, directness, and balance between individual performance and team health.",
      },
      {
        format: "Trade-off scenario",
        prompt: "Your team has two weeks left in the quarter and is behind on a committed roadmap item. Engineering says cutting scope by 30% gets it done on time; sales says the missing 30% is what the customer actually asked for. What do you do, and what do you tell each side?",
        measures: "Decision-making under conflicting stakeholder pressure and communication clarity.",
      },
      {
        format: "360° reflection",
        prompt: "Describe a time a decision you made turned out to be wrong once new information came in. What did you do next?",
        measures: "Self-awareness, adaptability, and how the candidate handles being wrong.",
      },
    ],
  },
  {
    id: "technical",
    name: "Technical",
    Icon: Code,
    href: "/solutions/technical-hiring",
    intro: "Live, proctored exercises in a real IDE against realistic code — not algorithm trivia.",
    questions: [
      {
        format: "Live debugging",
        prompt: "You're given a small service with a failing integration test and access to logs. Find the root cause and fix it, narrating your reasoning as you go.",
        measures: "Debugging process, use of available evidence, and communication while working.",
      },
      {
        format: "System design",
        prompt: "Design a rate limiter for a public API that needs to support per-user and per-endpoint limits, with minimal added latency. What are the trade-offs of your approach?",
        measures: "Architecture judgment, trade-off reasoning, and awareness of failure modes.",
      },
      {
        format: "Code review",
        prompt: "Review this pull request (provided) and leave the comments you'd actually leave on a real team. What would you approve, block, or ask about?",
        measures: "Code quality judgment and how the candidate gives feedback to peers.",
      },
    ],
  },
  {
    id: "non-it",
    name: "Non-IT",
    Icon: Users,
    href: "/solutions/non-it-hiring",
    intro: "Role-specific batteries. The example below is drawn from a financial-analyst assessment — non-IT modules exist for finance, sales, ops, healthcare, and legal.",
    questions: [
      {
        format: "Analytical case",
        prompt: "Given a simplified P&L and three years of revenue by segment (provided), identify the two biggest risks to next year's forecast and explain your reasoning.",
        measures: "Financial reasoning and the ability to prioritize signal over noise in messy data.",
      },
      {
        format: "Applied modeling",
        prompt: "Build a simple model in the provided spreadsheet to estimate the payback period of a proposed cost investment, given the assumptions listed.",
        measures: "Excel/modeling fluency and correctness under realistic constraints.",
      },
      {
        format: "Judgment scenario",
        prompt: "A client's numbers don't reconcile with what they told you verbally. Describe how you'd raise this with them.",
        measures: "Communication, integrity, and client-facing judgment.",
      },
    ],
  },
];
