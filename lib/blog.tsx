export type Post = {
  slug: string;
  title: string;
  dek: string; // one-line summary for cards
  date: string;
  readMins: number;
  category: string;
  body: { h?: string; p: string }[];
};

export const POSTS: Post[] = [
  {
    slug: "why-structured-assessment-beats-gut-feel",
    title: "Why structured assessment beats gut feel — even for senior hires",
    dek: "Panel interviews feel rigorous. The data says otherwise. Here's what actually predicts on-the-job performance.",
    date: "2026-06-02",
    readMins: 6,
    category: "Hiring science",
    body: [
      { p: "Ask any hiring manager how they picked their last strong hire, and you'll usually hear a story about a gut feeling — a good vibe in the room, a sharp answer to an offhand question. It's a satisfying story. It's also a poor predictor." },
      { h: "The evidence problem", p: "Unstructured interviews — the free-flowing conversation most panels default to — are among the weakest predictors of job performance we have data on. Structured assessment, where every candidate is measured against the same rubric on the same tasks, consistently outperforms them, and by a wide margin at senior levels where the stakes and the noise are both highest." },
      { h: "Why seniority makes it worse, not better", p: "Executive and staff-level candidates are the most practiced interviewees in the building. They've done this a hundred times. Their answers are polished, their stories are rehearsed, and panel members mistake fluency for competence. A structured, scenario-based assessment strips away the rehearsal and looks at how someone actually reasons under a live constraint." },
      { h: "What 'structured' actually means", p: "It doesn't mean rigid or robotic. It means every candidate for a role sees the same core exercises, is scored against the same published rubric, and the panel's disagreement is visible and resolved against evidence — not vibes. That's the whole idea behind Prelim: keep the human judgment, remove the noise around it." },
    ],
  },
  {
    slug: "take-homes-are-broken-heres-the-data",
    title: "Take-home assignments are broken. Here's the data.",
    dek: "They burn candidate goodwill, take too long to grade, and can't tell you who actually wrote the code.",
    date: "2026-06-18",
    readMins: 5,
    category: "Technical hiring",
    body: [
      { p: "Take-home assignments were meant to fix the whiteboard-interview problem — replace artificial pressure with realistic, unhurried work. In practice, they've created three new problems." },
      { h: "Problem one: time", p: "A well-designed take-home takes candidates 4–8 hours. Strong candidates — the ones with other offers on the table — increasingly decline to spend an unpaid workday on a maybe. You lose them before you ever see their work." },
      { h: "Problem two: grading debt", p: "Someone on your team has to read every submission carefully enough to score it fairly. That review backlog is where most take-home pipelines quietly die — assignments sit ungraded for a week while the candidate accepts somewhere else." },
      { h: "Problem three: authorship", p: "With AI coding assistants now mainstream, a take-home no longer reliably tells you who wrote the code, or how much help they had. That uncertainty erodes trust in the whole exercise for both the panel and the candidate." },
      { h: "What actually works", p: "A live, proctored session — 60 to 90 minutes, scored the moment it ends — solves all three. Candidates get a fast, respectful process. You get a graded result before your next panel call. And you can see how someone works, not just what they eventually submit." },
    ],
  },
  {
    slug: "one-rigor-bar-across-every-function",
    title: "One rigor bar across every function, not just engineering",
    dek: "Most companies obsess over technical hiring quality and wing everything else. That gap shows up in turnover.",
    date: "2026-07-09",
    readMins: 4,
    category: "Hiring strategy",
    body: [
      { p: "Ask a VP of Engineering how their team assesses candidates, and you'll typically hear a detailed, opinionated answer — system design rounds, take-homes, pairing sessions, calibrated rubrics. Ask the same question about the sales or operations org, and the answer gets vague fast." },
      { h: "The hidden cost of the gap", p: "Non-technical roles usually make up the majority of headcount, and they usually get the least assessment rigor. That imbalance shows up later — in 90-day attrition, in inconsistent quality bars between departments, and in hiring managers who can't explain why one candidate was chosen over another." },
      { h: "Why 'one bar' is harder than it sounds", p: "A finance analyst and a support rep don't need the same test. But they can be measured on the same underlying model — cognitive reasoning, role-specific knowledge, and behavioral fit — scored with the same rigor and the same transparency as your technical pipeline." },
      { h: "Where to start", p: "Pick the function with the highest volume or the highest turnover cost, and give it the same assessment discipline your engineering team already has. The gap closes faster than most leaders expect, and the turnover data usually moves within two quarters." },
    ],
  },
  {
    slug: "reading-a-composite-score-correctly",
    title: "How to read a composite assessment score correctly",
    dek: "A single number is useful only if you understand what's underneath it. A field guide for hiring managers.",
    date: "2026-07-27",
    readMins: 4,
    category: "Hiring science",
    body: [
      { p: "A composite score is a convenience, not a verdict. It compresses a dozen signals into one number so a busy hiring manager can triage a stack of candidates quickly. Used correctly, it's powerful. Used as the only input, it's a liability." },
      { h: "Look at the components before the total", p: "Two candidates can land on the same composite score for very different reasons — one strong across the board, one exceptional in one area and weak in another. If the role leans heavily on one competency, the breakdown matters more than the headline number." },
      { h: "Check the confidence, not just the score", p: "A score built on a thin evidence base — a short session, an unusual environment, ambiguous responses — should carry lower confidence even if the number itself looks strong. Prelim surfaces this explicitly rather than presenting every score with false certainty." },
      { h: "Use it to focus the conversation, not replace it", p: "The best use of a composite score is to tell your panel where to dig deeper in the next round — not to auto-reject or auto-advance without a human ever reading why. Evidence-based hiring means using the evidence, not outsourcing the decision to it." },
    ],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
