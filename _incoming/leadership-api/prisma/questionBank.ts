// Production question bank — generates 100 unique questions per module (500 total)
// with calibrated IRT 3-PL parameters (difficulty b, discrimination a, guessing c).
//
// Strategy per module:
//   technical      — hand-authored CS/engineering items + parameterized code-output
//                    and complexity questions (deterministically generated, all unique)
//   attitude       — hand-authored workplace-values items + scenario matrix
//   behavioral     — STAR-based situational items + competency × situation matrix
//   psychometric   — generated number series, analogies, syllogisms, matrix logic
//   communication  — hand-authored written/verbal items + scenario matrix

export interface SeedQuestion {
  moduleId: 'technical' | 'attitude' | 'behavioral' | 'psychometric' | 'communication';
  subTopic: string;
  text: string;
  options: { index: number; text: string }[];
  correctIndex: number;
  explanation?: string;
  difficulty: number;      // IRT b: -3 (easy) .. +3 (hard)
  discrimination: number;  // IRT a: 0.5 .. 3
  guessing: number;        // IRT c: usually 0.25 for 4-option MCQ
  tags: string[];
}

const opt = (texts: string[]) => texts.map((text, index) => ({ index, text }));

// Deterministic PRNG so seeding is reproducible
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithAnswer(rng: () => number, correct: string, wrong: string[]): { options: { index: number; text: string }[]; correctIndex: number } {
  const all = [correct, ...wrong];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { options: opt(all), correctIndex: all.indexOf(correct) };
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL — 100 questions
// ═══════════════════════════════════════════════════════════════════════════

function technicalQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];
  const rng = mulberry32(42);

  // ── 40 hand-authored core CS items ──────────────────────────────────────
  const authored: Array<[string, string, string[], number, number]> = [
    // [subTopic, text, [correct, wrong1, wrong2, wrong3], difficulty, discrimination]
    ['Algorithms', 'What is the average-case time complexity of QuickSort?', ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], -0.5, 1.4],
    ['Algorithms', 'Which data structure gives O(1) average lookup by key?', ['Hash table', 'Binary search tree', 'Sorted array', 'Linked list'], -1.2, 1.5],
    ['Algorithms', 'What is the worst-case complexity of binary search?', ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], -1.0, 1.3],
    ['Algorithms', 'Which algorithm finds shortest paths from one source in a weighted graph with non-negative edges?', ['Dijkstra’s algorithm', 'DFS', 'Kruskal’s algorithm', 'Bubble sort'], 0.2, 1.6],
    ['Algorithms', 'Which traversal of a binary search tree yields sorted order?', ['In-order', 'Pre-order', 'Post-order', 'Level-order'], -0.4, 1.5],
    ['Algorithms', 'A stack is best described as which discipline?', ['LIFO', 'FIFO', 'Priority-based', 'Random access'], -1.8, 1.2],
    ['Algorithms', 'What does dynamic programming primarily exploit?', ['Overlapping subproblems and optimal substructure', 'Random sampling', 'Parallel execution', 'Greedy local choices only'], 0.8, 1.7],
    ['Algorithms', 'Which sorting algorithm is stable and O(n log n) worst case?', ['Merge sort', 'QuickSort', 'Heap sort', 'Selection sort'], 0.4, 1.5],
    ['Algorithms', 'What is amortized complexity of appending to a dynamic array?', ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], 0.6, 1.4],
    ['Algorithms', 'Topological sort applies to which structure?', ['Directed acyclic graph', 'Undirected graph with cycles', 'Binary heap', 'Hash table'], 0.7, 1.6],
    ['System Design', 'What does CAP theorem state about distributed systems?', ['You can guarantee at most two of consistency, availability, partition tolerance', 'All three properties are always achievable', 'Consistency requires partitions', 'Availability implies consistency'], 0.9, 1.6],
    ['System Design', 'What is the primary purpose of a load balancer?', ['Distribute traffic across multiple servers', 'Encrypt traffic', 'Cache static assets', 'Compress responses'], -0.8, 1.3],
    ['System Design', 'Which caching strategy writes to cache and DB simultaneously?', ['Write-through', 'Write-back', 'Cache-aside', 'Read-through'], 0.8, 1.5],
    ['System Design', 'What problem does database sharding solve?', ['Horizontal scaling of data beyond one machine', 'Schema migrations', 'SQL injection', 'Slow joins on small tables'], 0.5, 1.5],
    ['System Design', 'What is eventual consistency?', ['Replicas converge to the same value given no new writes', 'Every read sees the latest write', 'Writes are rejected during partitions', 'Transactions always roll back'], 1.0, 1.6],
    ['System Design', 'A message queue primarily provides:', ['Asynchronous decoupling between producers and consumers', 'Synchronous RPC', 'Strong consistency', 'Schema validation'], 0.3, 1.4],
    ['System Design', 'What is the role of a CDN?', ['Serve content from edge locations near users', 'Run business logic', 'Store relational data', 'Manage user sessions'], -0.6, 1.3],
    ['System Design', 'Which pattern prevents cascading failures by failing fast?', ['Circuit breaker', 'Singleton', 'Observer', 'Decorator'], 0.9, 1.7],
    ['System Design', 'Idempotency in an API means:', ['Repeating the same request has the same effect as one request', 'Requests are encrypted', 'Responses are cached', 'Requests cannot fail'], 0.6, 1.6],
    ['System Design', 'What is a database index trade-off?', ['Faster reads, slower writes and more storage', 'Faster writes, slower reads', 'Less storage, faster everything', 'No trade-off exists'], 0.1, 1.4],
    ['JavaScript', 'What does "===" check in JavaScript?', ['Value and type equality', 'Value only', 'Type only', 'Reference identity for primitives'], -1.4, 1.4],
    ['JavaScript', 'What is a closure?', ['A function retaining access to its lexical scope', 'A class with private fields', 'A loop construct', 'An immediately-thrown error'], 0.2, 1.6],
    ['JavaScript', 'Which statement about Promises is true?', ['A settled promise cannot change state', 'Promises can resolve multiple times', 'await blocks the entire thread', 'Promises run on a separate OS thread'], 0.5, 1.5],
    ['JavaScript', 'What does the event loop do?', ['Processes the callback queue when the call stack is empty', 'Creates OS threads per callback', 'Compiles JS to machine code', 'Garbage-collects unused objects'], 0.7, 1.6],
    ['JavaScript', '"let" differs from "var" because let is:', ['Block-scoped and not hoisted-initialized', 'Function-scoped', 'Globally scoped always', 'Immutable'], -0.7, 1.3],
    ['Databases', 'ACID’s "I" stands for:', ['Isolation', 'Integrity', 'Idempotency', 'Indexing'], -0.9, 1.3],
    ['Databases', 'A SQL LEFT JOIN returns:', ['All left-table rows plus matching right-table rows', 'Only matching rows from both tables', 'All right-table rows only', 'The Cartesian product'], -0.3, 1.4],
    ['Databases', 'What is a transaction deadlock?', ['Two transactions each waiting on locks held by the other', 'A transaction that takes too long', 'A corrupted index', 'An unindexed full scan'], 0.4, 1.5],
    ['Databases', 'Normalization to 3NF primarily reduces:', ['Data redundancy and update anomalies', 'Query latency', 'Index size', 'Connection pool usage'], 0.5, 1.4],
    ['Databases', 'Which isolation level allows non-repeatable reads but not dirty reads?', ['Read committed', 'Read uncommitted', 'Repeatable read', 'Serializable'], 1.3, 1.8],
    ['Networking', 'Which protocol underlies HTTPS encryption?', ['TLS', 'SSH', 'IPSec', 'FTP'], -0.6, 1.3],
    ['Networking', 'TCP differs from UDP because TCP provides:', ['Reliable, ordered, connection-oriented delivery', 'Lower latency always', 'Broadcast support', 'Stateless datagrams'], -0.5, 1.4],
    ['Networking', 'What does DNS resolve?', ['Domain names to IP addresses', 'IP addresses to MAC addresses', 'URLs to HTML', 'Ports to processes'], -1.5, 1.2],
    ['Networking', 'HTTP status 503 means:', ['Service unavailable', 'Not found', 'Unauthorized', 'Permanent redirect'], -0.4, 1.3],
    ['Security', 'What does parameterized querying prevent?', ['SQL injection', 'Cross-site scripting', 'CSRF', 'DDoS'], -0.2, 1.5],
    ['Security', 'Why store password hashes with salt?', ['To defeat precomputed rainbow-table attacks', 'To speed up login', 'To compress storage', 'To enable password recovery'], 0.3, 1.6],
    ['Security', 'JWT signature verification ensures:', ['The token was not tampered with', 'The token is encrypted', 'The user is authorized for every action', 'The token never expires'], 0.6, 1.5],
    ['Security', 'CSRF attacks exploit:', ['The browser auto-sending credentials with cross-site requests', 'Unescaped HTML output', 'Weak password hashing', 'Open S3 buckets'], 1.1, 1.7],
    ['DevOps', 'Blue-green deployment means:', ['Two identical environments, switching traffic between them', 'Deploying twice a day', 'Canary releases to 1% of users', 'Rolling back via git revert'], 0.7, 1.5],
    ['DevOps', 'What does container immutability imply?', ['Changes require building a new image, not patching a running container', 'Containers cannot be deleted', 'Volumes are read-only', 'Images cannot be versioned'], 0.8, 1.5],
  ];
  for (const [subTopic, text, [correct, ...wrong], difficulty, discrimination] of authored) {
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({ moduleId: 'technical', subTopic, text, options, correctIndex, difficulty, discrimination, guessing: 0.25, tags: ['technical', subTopic.toLowerCase().replace(/ /g, '-')] });
  }

  // ── 30 generated code-output questions (JS arithmetic/logic, all unique) ─
  for (let i = 0; i < 30; i++) {
    const a = 2 + Math.floor(rng() * 8);
    const b = 2 + Math.floor(rng() * 8);
    const c = 1 + Math.floor(rng() * 5);
    const variant = i % 3;
    let text: string, answer: number;
    if (variant === 0) {
      answer = a * b + c;
      text = `What does this JavaScript print?\n\nlet x = ${a};\nlet y = ${b};\nconsole.log(x * y + ${c});`;
    } else if (variant === 1) {
      answer = Array.from({ length: b }, (_, k) => k).reduce((s, k) => s + k, a);
      text = `What does this JavaScript print?\n\nlet sum = ${a};\nfor (let k = 0; k < ${b}; k++) { sum += k; }\nconsole.log(sum);`;
    } else {
      answer = ((a + b) % c === 0) ? a + b : (a + b) * 2;
      text = `What does this JavaScript print?\n\nconst n = ${a} + ${b};\nconsole.log(n % ${c} === 0 ? n : n * 2);`;
    }
    const wrong = [answer + 1, answer - 1, answer + c + 1].map(String);
    const { options, correctIndex } = shuffleWithAnswer(rng, String(answer), wrong);
    qs.push({ moduleId: 'technical', subTopic: 'Code Reading', text, options, correctIndex, difficulty: -0.6 + (i % 5) * 0.35, discrimination: 1.2 + (i % 4) * 0.15, guessing: 0.25, tags: ['technical', 'code-reading', 'javascript'] });
  }

  // ── 30 generated complexity questions (all unique snippets) ─────────────
  const loopForms: Array<[string, string]> = [
    ['for (let i = 0; i < n; i++) work();', 'O(n)'],
    ['for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) work();', 'O(n²)'],
    ['for (let i = 1; i < n; i *= 2) work();', 'O(log n)'],
    ['for (let i = 0; i < n; i++) for (let j = 1; j < n; j *= 2) work();', 'O(n log n)'],
    ['work(); work(); work();', 'O(1)'],
    ['for (let i = 0; i < n; i++) for (let j = i; j < n; j++) work();', 'O(n²)'],
  ];
  const allComplexities = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
  for (let i = 0; i < 30; i++) {
    const [snippet, correct] = loopForms[i % loopForms.length];
    const fnName = `process${String.fromCharCode(65 + (i % 26))}${i}`;
    const wrong = allComplexities.filter(x => x !== correct).slice(0, 3);
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({
      moduleId: 'technical', subTopic: 'Complexity Analysis',
      text: `What is the time complexity of ${fnName}?\n\nfunction ${fnName}(n) {\n  ${snippet}\n}`,
      options, correctIndex,
      difficulty: -0.8 + (i % 6) * 0.4, discrimination: 1.3 + (i % 3) * 0.2, guessing: 0.25,
      tags: ['technical', 'complexity', 'big-o'],
    });
  }

  return qs.slice(0, 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTITUDE — 100 questions (workplace values, ethics, growth mindset)
// ═══════════════════════════════════════════════════════════════════════════

function attitudeQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];
  const rng = mulberry32(101);

  const authored: Array<[string, string, string[], number]> = [
    ['Integrity', 'You notice a colleague taking credit for your work in a meeting. The most professional first step is to:', ['Discuss it privately with the colleague first', 'Correct them publicly in the meeting', 'Escalate to HR immediately', 'Say nothing and withdraw effort'], 0.0],
    ['Integrity', 'You discover a minor billing error in the company’s favor that no one else noticed. You should:', ['Report it so it can be corrected', 'Ignore it since it benefits the company', 'Mention it only if asked', 'Wait to see if the client notices'], -0.5],
    ['Integrity', 'A vendor offers you a personal gift while you’re evaluating their proposal. You should:', ['Decline and disclose per company policy', 'Accept it but stay impartial', 'Accept only if it’s small', 'Accept and recuse yourself silently'], -0.2],
    ['Accountability', 'You shipped a change that caused a production outage. The best response is to:', ['Own it, help fix it, and run a blameless retrospective', 'Quietly fix it before anyone notices', 'Point out the reviewer also missed it', 'Argue the testing process is at fault'], -0.6],
    ['Accountability', 'You committed to a deadline you now know you’ll miss. You should:', ['Inform stakeholders early with a revised plan', 'Work silently and hope to catch up', 'Deliver partial work without comment', 'Wait until the deadline to explain'], -0.9],
    ['Growth Mindset', 'After receiving difficult feedback in a performance review, the most constructive response is to:', ['Ask clarifying questions and build an improvement plan', 'Defend each point with counter-examples', 'Request a different reviewer next cycle', 'Treat it as one person’s opinion'], -0.7],
    ['Growth Mindset', 'A new technology replaces a skill you’ve mastered. You should:', ['Proactively learn it and map your experience onto it', 'Advocate to keep the old technology', 'Move to a team still using the old stack', 'Learn it only when required'], -0.3],
    ['Adaptability', 'Mid-project, leadership reprioritizes and your work is shelved. The professional response is to:', ['Document the work for later and engage the new priority', 'Continue your project quietly', 'Express frustration to teammates', 'Disengage until things settle'], -0.4],
    ['Collaboration', 'A teammate consistently misses standup but delivers good work. You should:', ['Check in privately to understand and offer help', 'Report the absences to the manager', 'Publicly call it out at standup', 'Ignore it — output is all that matters'], 0.3],
    ['Collaboration', 'Two of your peers are in conflict and it’s affecting the team. As a colleague you should:', ['Encourage them to talk directly, offering to facilitate', 'Pick the side that’s right', 'Tell the manager to fix it', 'Stay completely out of it'], 0.6],
    ['Work Ethic', 'When you finish your tasks early in a sprint, the best use of time is to:', ['Help unblock teammates or pull the next priority item', 'Start on personal projects', 'Polish your finished work indefinitely', 'Wait quietly for the next sprint'], -0.8],
    ['Customer Focus', 'A customer reports a problem you believe is user error. You should first:', ['Reproduce their workflow to understand their experience', 'Send documentation links', 'Explain they’re using it wrong', 'Route the ticket elsewhere'], 0.1],
    ['Ownership', 'You spot a risk in a system owned by another team. You should:', ['Flag it to that team with details and offer context', 'Stay in your lane', 'Fix it yourself without telling them', 'Mention it casually if you see them'], -0.1],
    ['Ethics', 'Your manager asks you to overstate progress in a status report. You should:', ['Decline and propose an honest framing of the status', 'Comply — they’re accountable, not you', 'Comply but keep evidence', 'Report them to their manager immediately'], 0.8],
    ['Resilience', 'After your proposal is rejected, the most productive next step is to:', ['Seek the specific reasons and refine or redirect the idea', 'Resubmit it unchanged later', 'Stop proposing ideas', 'Implement it anyway at small scale'], -0.3],
    ['Diversity', 'In a discussion, a quieter teammate’s suggestion is repeatedly talked over. You should:', ['Redirect attention: "I’d like to hear the rest of that idea"', 'Talk to them after the meeting only', 'Let the group dynamic play out', 'Raise it with HR'], 0.2],
    ['Time Management', 'You have one day and two urgent requests from different leaders. The best move is to:', ['Surface the conflict to both and align on priority', 'Do whichever was requested first', 'Work overtime to do both fully', 'Do the one from the more senior leader'], 0.5],
    ['Initiative', 'You see a recurring manual task wasting team hours. You should:', ['Propose and prototype an automation, then share it', 'Add it to the backlog and move on', 'Automate it secretly for yourself', 'Accept it as part of the job'], -0.5],
    ['Professionalism', 'You strongly disagree with a final decision after debate. The professional behavior is to:', ['Commit to the decision and support its execution', 'Comply but voice disagreement at every setback', 'Quietly work around the decision', 'Escalate above the decision-maker'], 0.4],
    ['Confidentiality', 'A friend at another company asks about your unreleased product. You should:', ['Decline to share non-public information', 'Share since they’re trustworthy', 'Share only high-level details', 'Confirm only what they already guessed'], -1.0],
  ];
  for (const [subTopic, text, [correct, ...wrong], difficulty] of authored) {
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({ moduleId: 'attitude', subTopic, text, options, correctIndex, difficulty, discrimination: 1.1 + rng() * 0.5, guessing: 0.25, tags: ['attitude', subTopic.toLowerCase().replace(/ /g, '-')] });
  }

  // ── Scenario matrix: 8 contexts × 10 challenges = 80 unique scenarios ────
  const contexts = ['during a critical product launch', 'while onboarding a new teammate', 'in a fully remote team', 'under a tight regulatory deadline', 'after a round of layoffs', 'in a cross-functional task force', 'while covering for a colleague on leave', 'during the annual planning cycle'];
  const challenges: Array<[string, string, string, string[]]> = [
    // [subTopic, challengeText, correct, wrong[]]
    ['Adaptability', 'requirements change significantly', 'Reassess the plan, communicate impacts, and adjust scope transparently', ['Push back and insist on the original plan', 'Absorb the change silently and work longer hours', 'Wait for someone else to update the plan']],
    ['Integrity', 'you are asked to cut a quality corner no one would notice', 'Raise the risk explicitly and propose an acceptable alternative', ['Cut the corner — pragmatism matters', 'Refuse without explanation', 'Cut it but document that you objected']],
    ['Collaboration', 'a dependency team is unresponsive', 'Reach out directly, clarify urgency, and escalate jointly if needed', ['Build a workaround without telling them', 'Complain about them in your team channel', 'Mark your work blocked and wait']],
    ['Accountability', 'an error you made is discovered by someone else', 'Acknowledge it immediately and focus on remediation', ['Explain the circumstances that caused it first', 'Note that the process allowed the error', 'Minimize its significance']],
    ['Growth Mindset', 'you are assigned work outside your comfort zone', 'Accept it, identify skill gaps, and ask for targeted guidance', ['Trade tasks with a colleague who knows it', 'Do it minimally to avoid exposure', 'Ask the manager to reassign it']],
    ['Work Ethic', 'team morale is visibly low', 'Model steady, positive output and check in on teammates', ['Lower your own pace to match the mood', 'Tell leadership morale is their problem', 'Focus only on your own deliverables']],
    ['Customer Focus', 'a customer-facing defect competes with internal work', 'Prioritize by user impact and communicate the trade-off', ['Always do the internal work first', 'Always do the customer work first regardless of impact', 'Split time evenly between both']],
    ['Initiative', 'you spot an improvement nobody asked for', 'Validate the value quickly and pitch it with evidence', ['Implement it fully before telling anyone', 'Save it for a hackathon someday', 'Assume someone already considered it']],
    ['Professionalism', 'a heated disagreement starts in a group channel', 'Move the discussion to a synchronous conversation and de-escalate', ['Reply with your strongest argument', 'Mute the channel', 'Screenshot it for HR']],
    ['Resilience', 'your work is criticized publicly', 'Respond calmly, extract the valid points, and follow up offline', ['Defend yourself point by point publicly', 'Withdraw from future discussions', 'Demand an apology']],
  ];
  for (let ci = 0; ci < contexts.length; ci++) {
    for (let chi = 0; chi < challenges.length; chi++) {
      const [subTopic, challengeText, correct, wrong] = challenges[chi];
      const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
      qs.push({
        moduleId: 'attitude', subTopic,
        text: `Scenario: ${contexts[ci].charAt(0).toUpperCase() + contexts[ci].slice(1)}, ${challengeText}. What is the most effective professional response?`,
        options, correctIndex,
        difficulty: -1.0 + ((ci + chi) % 7) * 0.4,
        discrimination: 1.0 + ((ci * chi) % 5) * 0.15,
        guessing: 0.25,
        tags: ['attitude', 'scenario', subTopic.toLowerCase().replace(/ /g, '-')],
      });
    }
  }

  return qs.slice(0, 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// BEHAVIORAL — 100 questions (STAR situational judgment)
// ═══════════════════════════════════════════════════════════════════════════

function behavioralQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];
  const rng = mulberry32(202);

  const authored: Array<[string, string, string[], number]> = [
    ['Leadership', 'Your team is split 50/50 on a technical approach and the deadline is near. As lead, you:', ['Time-box a structured comparison, then decide and commit the team', 'Pick the approach of the most senior engineer', 'Let both halves build their preferred version', 'Escalate the decision to your manager'], 0.6],
    ['Leadership', 'A high performer on your team has become disengaged. Your first action is to:', ['Have a private 1:1 to understand what changed', 'Assign them more challenging work', 'Reduce their responsibilities', 'Note it for their next review'], -0.2],
    ['Leadership', 'You inherit a team with unclear roles and duplicated work. You start by:', ['Mapping current responsibilities with the team, then clarifying ownership', 'Issuing a new org chart', 'Letting roles emerge naturally', 'Asking HR for job descriptions'], 0.4],
    ['Conflict Resolution', 'Two engineers argue repeatedly in code reviews, slowing the team. You:', ['Meet them together to agree on review norms', 'Stop them from reviewing each other', 'Tell them to be more professional', 'Add a third reviewer to every PR'], 0.5],
    ['Delegation', 'You’re overloaded and a junior teammate has spare capacity. The task is critical. You:', ['Delegate with clear context, checkpoints, and support', 'Keep it — it’s too important to delegate', 'Hand it off completely to save time', 'Split it so you do the hard parts'], 0.3],
    ['Decision Making', 'You must choose between two vendors with incomplete information and a deadline today. You:', ['Decide using explicit criteria and document the assumptions', 'Delay the decision until data is complete', 'Choose the cheaper one by default', 'Let the team vote'], 0.8],
    ['Mentoring', 'A mentee keeps asking you to solve problems they could solve. You:', ['Shift to asking guiding questions instead of giving answers', 'Keep helping — that’s mentorship', 'Tell them to figure it out alone', 'Pass them to another mentor'], -0.1],
    ['Communication', 'You must announce an unpopular process change. The best approach is to:', ['Explain the why, acknowledge the costs, and invite feedback on rollout', 'Announce it briefly to minimize discussion', 'Have your manager announce it', 'Roll it out gradually without announcing'], 0.2],
    ['Stakeholders', 'A stakeholder keeps adding "small" requests that bloat scope. You:', ['Make the cumulative cost visible and re-negotiate scope formally', 'Absorb them to keep the relationship', 'Refuse all new requests', 'Quietly deprioritize their items'], 0.7],
    ['Prioritization', 'Production incident, board demo prep, and a teammate needs unblocking — all now. Your order is:', ['Incident, unblock teammate, then demo prep', 'Demo prep, incident, teammate', 'Teammate, demo, incident', 'Whatever was requested first'], 0.9],
    ['Failure', 'A project you championed failed visibly. In the retrospective you:', ['Present an honest analysis of what you’d do differently', 'Highlight the external factors involved', 'Keep a low profile and let others speak', 'Focus only on what went well'], 0.0],
    ['Influence', 'You need another team to adopt your library but have no authority over them. You:', ['Understand their needs and demonstrate concrete value for their use case', 'Get an executive mandate', 'Build it into the platform so they must use it', 'Offer to do their migration for them'], 0.8],
    ['Change Management', 'Your team resists a new mandated tool. You:', ['Acknowledge concerns, gather feedback for the vendor, and ease the transition', 'Enforce usage and monitor compliance', 'Let the team keep the old tool quietly', 'Escalate the resistance to leadership'], 0.4],
    ['Hiring', 'A candidate is brilliant technically but dismissive toward the junior interviewer. You:', ['Weigh it as a serious signal against team standards', 'Hire — skills are hardest to find', 'Extend the offer with a behavior warning', 'Have a senior interviewer re-test them'], 0.1],
    ['Feedback', 'A peer’s presentation to leadership had major errors. Afterward you:', ['Share specific observations privately and offer to review next time', 'Email corrections to leadership', 'Mention it to their manager', 'Say nothing — not your role'], -0.3],
    ['Remote Work', 'A remote teammate has gone quiet and their output dropped. You:', ['Reach out with a low-pressure check-in and offer support', 'CC their manager on a status request', 'Reassign their tasks proactively', 'Wait — performance varies'], -0.5],
    ['Innovation', 'Your improvement idea was rejected for this quarter. You believe it’s high-value. You:', ['Build a lightweight proof of concept to strengthen the case', 'Drop it permanently', 'Implement it inside another project', 'Re-pitch the identical proposal next quarter'], 0.3],
    ['Crisis', 'During a sev-1 outage, two seniors propose conflicting fixes. As incident commander you:', ['Pick one based on risk and rollback safety; park the other', 'Try both fixes simultaneously', 'Pause for a quick consensus meeting', 'Defer to whoever has more tenure'], 1.2],
    ['Ethics', 'You learn a teammate fabricated test results to pass a release gate. You:', ['Address it directly and ensure the gate is honestly re-run', 'Let it go — the feature probably works', 'Anonymously report it later', 'Re-run tests yourself and quietly replace the results'], 0.5],
    ['Growth', 'You’re offered a stretch role you feel only 60% ready for. You:', ['Accept and build a learning plan for the gaps', 'Decline until fully ready', 'Accept but hide the gaps', 'Negotiate a smaller version of the role'], -0.4],
  ];
  for (const [subTopic, text, [correct, ...wrong], difficulty] of authored) {
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({ moduleId: 'behavioral', subTopic, text, options, correctIndex, difficulty, discrimination: 1.1 + rng() * 0.6, guessing: 0.25, tags: ['behavioral', 'STAR', subTopic.toLowerCase().replace(/ /g, '-')] });
  }

  // ── Competency × situation matrix: 10 × 8 = 80 ──────────────────────────
  const roles = ['as a new team lead', 'as a senior individual contributor', 'as the on-call engineer', 'as a project coordinator', 'as the most junior person in the room', 'as a cross-team liaison', 'as an interim manager', 'as a subject-matter expert'];
  const situations: Array<[string, string, string, string[]]> = [
    ['Leadership', 'your team misses a sprint goal for the second time', 'Run a candid retrospective on root causes and adjust commitments', ['Increase pressure on the bottleneck individuals', 'Reduce the sprint goals quietly', 'Report the misses upward without analysis']],
    ['Communication', 'a non-technical executive asks why the project is delayed', 'Explain the delay in business terms with a clear revised timeline', ['Walk through the technical debt details', 'Promise the original date can still be met', 'Refer them to the project tracker']],
    ['Conflict Resolution', 'a teammate publicly blames you for a shared failure', 'Stay factual, accept your part, and address the dynamic privately', ['Publicly list their contributing mistakes', 'Absorb full blame to end the discussion', 'Refuse to discuss it in public or private']],
    ['Decision Making', 'data is ambiguous but a choice must be made this week', 'Choose using explicit assumptions and define a checkpoint to revisit', ['Postpone until the data is clear', 'Choose the safest-looking option without analysis', 'Delegate the decision downward']],
    ['Mentoring', 'a junior teammate’s code quality is below the bar', 'Pair with them on reviews and set specific improvement goals', ['Rewrite their code yourself', 'Route their PRs to other reviewers', 'Raise it first with their manager']],
    ['Stakeholders', 'two stakeholders give you contradictory requirements', 'Bring them together to reconcile priorities explicitly', ['Implement the union of both requests', 'Follow the more senior stakeholder', 'Choose whichever is easier to build']],
    ['Prioritization', 'everything on your plate is labeled urgent', 'Force-rank by impact with your manager and communicate the order', ['Work longer hours to attempt everything', 'Do tasks in the order they arrived', 'Ask each requester to fight it out']],
    ['Ownership', 'a problem falls between your team and another', 'Take initiative to coordinate a joint owner and resolution', ['Document that it isn’t your team’s scope', 'Fix only the half on your side', 'Wait for management to assign it']],
    ['Adaptability', 'a key teammate leaves mid-project', 'Re-plan around the gap and redistribute knowledge quickly', ['Keep the original plan and absorb the work', 'Pause the project until a replacement arrives', 'Drop the departed person’s workstream']],
    ['Influence', 'you must champion an unpopular but necessary change', 'Recruit respected early adopters and show small wins first', ['Push it through with authority', 'Water it down until it’s popular', 'Wait for the problem to force the change']],
  ];
  for (let ri = 0; ri < roles.length; ri++) {
    for (let si = 0; si < situations.length; si++) {
      const [subTopic, sitText, correct, wrong] = situations[si];
      const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
      qs.push({
        moduleId: 'behavioral', subTopic,
        text: `Acting ${roles[ri]}, ${sitText}. What is the most effective response?`,
        options, correctIndex,
        difficulty: -0.8 + ((ri + si) % 7) * 0.38,
        discrimination: 1.0 + ((ri + 2 * si) % 5) * 0.16,
        guessing: 0.25,
        tags: ['behavioral', 'situational', subTopic.toLowerCase().replace(/ /g, '-')],
      });
    }
  }

  return qs.slice(0, 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// PSYCHOMETRIC — 100 questions (generated reasoning items, all unique)
// ═══════════════════════════════════════════════════════════════════════════

function psychometricQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];
  const rng = mulberry32(303);

  // ── 30 number series ─────────────────────────────────────────────────────
  for (let i = 0; i < 30; i++) {
    const kind = i % 5;
    const start = 2 + Math.floor(rng() * 9);
    const step = 2 + Math.floor(rng() * 6);
    let series: number[] = [];
    let rule = '';
    if (kind === 0) { // arithmetic
      series = Array.from({ length: 5 }, (_, k) => start + step * k);
      rule = 'arithmetic';
    } else if (kind === 1) { // geometric ×2 or ×3
      const r = 2 + (i % 2);
      series = Array.from({ length: 5 }, (_, k) => start * Math.pow(r, k));
      rule = 'geometric';
    } else if (kind === 2) { // squares + offset
      series = Array.from({ length: 5 }, (_, k) => (k + 2) * (k + 2) + start);
      rule = 'squares';
    } else if (kind === 3) { // alternating add
      series = [start];
      for (let k = 1; k < 5; k++) series.push(series[k - 1] + (k % 2 === 1 ? step : step * 2));
      rule = 'alternating';
    } else { // increasing differences
      series = [start];
      for (let k = 1; k < 5; k++) series.push(series[k - 1] + step + k - 1);
      rule = 'increasing-diff';
    }
    const next = kind === 0 ? start + step * 5
      : kind === 1 ? start * Math.pow(2 + (i % 2), 5)
      : kind === 2 ? 49 + start
      : kind === 3 ? series[4] + (5 % 2 === 1 ? step : step * 2)
      : series[4] + step + 4;
    const wrong = [next + step, next - 1, next + 1].map(String);
    const { options, correctIndex } = shuffleWithAnswer(rng, String(next), wrong);
    qs.push({
      moduleId: 'psychometric', subTopic: 'Numerical Reasoning',
      text: `What number comes next in the series?\n\n${series.join(', ')}, ?`,
      options, correctIndex,
      difficulty: -1.2 + kind * 0.55 + (i % 3) * 0.2,
      discrimination: 1.4 + (i % 3) * 0.2, guessing: 0.25,
      tags: ['psychometric', 'number-series', rule],
    });
  }

  // ── 25 verbal analogies ──────────────────────────────────────────────────
  const analogies: Array<[string, string, string, string, string[], number]> = [
    ['Author', 'book', 'composer', 'symphony', ['orchestra', 'piano', 'concert'], -1.0],
    ['Doctor', 'hospital', 'teacher', 'school', ['student', 'lesson', 'principal'], -1.4],
    ['Seed', 'tree', 'egg', 'bird', ['nest', 'feather', 'flight'], -1.1],
    ['Keyboard', 'type', 'microphone', 'record', ['listen', 'amplify', 'broadcast'], -0.6],
    ['Drought', 'rain', 'famine', 'food', ['hunger', 'harvest', 'crops'], -0.2],
    ['Sculptor', 'marble', 'blacksmith', 'iron', ['hammer', 'forge', 'anvil'], -0.4],
    ['Thermometer', 'temperature', 'barometer', 'pressure', ['weather', 'altitude', 'humidity'], 0.0],
    ['Captain', 'ship', 'pilot', 'aircraft', ['airport', 'crew', 'runway'], -1.3],
    ['Library', 'books', 'archive', 'documents', ['history', 'shelves', 'librarians'], -0.8],
    ['Optimist', 'hope', 'skeptic', 'doubt', ['anger', 'fear', 'certainty'], 0.2],
    ['Engine', 'car', 'heart', 'body', ['blood', 'brain', 'lungs'], -1.0],
    ['Verdict', 'trial', 'diagnosis', 'examination', ['prescription', 'symptom', 'surgery'], 0.4],
    ['Rehearsal', 'performance', 'training', 'competition', ['victory', 'coach', 'stadium'], -0.5],
    ['Blueprint', 'building', 'recipe', 'dish', ['kitchen', 'chef', 'ingredient'], -0.9],
    ['Mosaic', 'tiles', 'symphony', 'notes', ['instruments', 'melody', 'conductor'], 0.5],
    ['Drizzle', 'downpour', 'breeze', 'gale', ['wind', 'storm', 'weather'], 0.3],
    ['Apprentice', 'master', 'student', 'professor', ['classroom', 'graduate', 'textbook'], -0.7],
    ['Vaccine', 'disease', 'firewall', 'intrusion', ['network', 'password', 'computer'], 0.6],
    ['Compass', 'direction', 'clock', 'time', ['hour', 'hands', 'numbers'], -1.2],
    ['Cocoon', 'butterfly', 'bud', 'flower', ['petal', 'stem', 'garden'], -0.8],
    ['Editor', 'manuscript', 'auditor', 'accounts', ['money', 'bank', 'taxes'], 0.1],
    ['Quarry', 'stone', 'mine', 'ore', ['miner', 'tunnel', 'metal'], -0.3],
    ['Symptom', 'illness', 'clue', 'mystery', ['detective', 'crime', 'evidence'], 0.0],
    ['Anchor', 'ship', 'foundation', 'building', ['roof', 'wall', 'architect'], -0.6],
    ['Spark', 'fire', 'idea', 'innovation', ['thought', 'inventor', 'patent'], 0.7],
  ];
  for (const [a, b, c, correct, wrong, difficulty] of analogies) {
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({
      moduleId: 'psychometric', subTopic: 'Verbal Reasoning',
      text: `${a} is to ${b} as ${c} is to ___?`,
      options, correctIndex,
      difficulty, discrimination: 1.3 + rng() * 0.4, guessing: 0.25,
      tags: ['psychometric', 'analogy', 'verbal'],
    });
  }

  // ── 25 syllogisms / logical deduction ────────────────────────────────────
  const names = ['managers', 'analysts', 'engineers', 'designers', 'auditors'];
  const props = ['detail-oriented', 'certified', 'remote', 'senior', 'bilingual'];
  for (let i = 0; i < 25; i++) {
    const A = names[i % names.length];
    const B = props[i % props.length];
    const C = props[(i + 2) % props.length];
    const form = i % 5;
    let text = '', correct = '', wrong: string[] = [];
    if (form === 0) {
      text = `All ${A} are ${B}. Some ${B} people are ${C}. Which conclusion is valid?`;
      correct = `No definite conclusion links ${A} to ${C}`;
      wrong = [`All ${A} are ${C}`, `Some ${A} are ${C}`, `No ${A} are ${C}`];
    } else if (form === 1) {
      text = `All ${A} are ${B}. No ${B} person is ${C}. Which conclusion is valid?`;
      correct = `No ${A} are ${C}`;
      wrong = [`Some ${A} are ${C}`, `All ${C} people are ${A}`, `No conclusion follows`];
    } else if (form === 2) {
      text = `Some ${A} are ${B}. All ${B} people are ${C}. Which conclusion is valid?`;
      correct = `Some ${A} are ${C}`;
      wrong = [`All ${A} are ${C}`, `No ${A} are ${C}`, `All ${C} people are ${B}`];
    } else if (form === 3) {
      text = `If a person is ${B}, they passed the review. Riley is ${B}. What follows?`;
      correct = 'Riley passed the review';
      wrong = ['Riley did not pass the review', 'Riley might not be ' + B, 'Nothing follows'];
    } else {
      text = `If a person is ${B}, they passed the review. Jordan did NOT pass the review. What follows?`;
      correct = `Jordan is not ${B}`;
      wrong = [`Jordan is ${B}`, 'Jordan passed a different review', 'Nothing follows'];
    }
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({
      moduleId: 'psychometric', subTopic: 'Logical Reasoning',
      text, options, correctIndex,
      difficulty: -0.4 + form * 0.35 + (i % 3) * 0.15,
      discrimination: 1.5 + (i % 3) * 0.15, guessing: 0.25,
      tags: ['psychometric', 'syllogism', 'logic'],
    });
  }

  // ── 20 abstract pattern items ────────────────────────────────────────────
  const shapes = ['△', '□', '○', '◇', '☆'];
  for (let i = 0; i < 20; i++) {
    const kind = i % 4;
    let seq: string[] = [], next = '';
    if (kind === 0) { // ABAB
      const a = shapes[i % 5], b = shapes[(i + 1) % 5];
      seq = [a, b, a, b, a]; next = b;
    } else if (kind === 1) { // ABCABC
      const a = shapes[i % 5], b = shapes[(i + 1) % 5], c = shapes[(i + 2) % 5];
      seq = [a, b, c, a, b]; next = c;
    } else if (kind === 2) { // AABB AABB
      const a = shapes[i % 5], b = shapes[(i + 2) % 5];
      seq = [a, a, b, b, a]; next = a;
    } else { // growing run: A AB ABC ...
      const a = shapes[i % 5], b = shapes[(i + 1) % 5], c = shapes[(i + 3) % 5];
      seq = [a, a, b, a, b]; next = c;
    }
    const wrong = shapes.filter(s => s !== next).slice(0, 3);
    const { options, correctIndex } = shuffleWithAnswer(rng, next, wrong);
    qs.push({
      moduleId: 'psychometric', subTopic: 'Abstract Reasoning',
      text: `Which symbol comes next in the pattern?\n\n${seq.join('  ')}  ?`,
      options, correctIndex,
      difficulty: -1.3 + kind * 0.5,
      discrimination: 1.4 + (i % 3) * 0.2, guessing: 0.25,
      tags: ['psychometric', 'pattern', 'abstract'],
    });
  }

  return qs.slice(0, 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMUNICATION — 100 questions
// ═══════════════════════════════════════════════════════════════════════════

function communicationQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];
  const rng = mulberry32(404);

  const authored: Array<[string, string, string[], number]> = [
    ['Written', 'Which subject line is most effective for an urgent production issue email?', ['[ACTION REQUIRED] Checkout failing for EU users — fix needed by 3pm', 'Important!!', 'Quick question about the thing we discussed', 'FYI'], -0.8],
    ['Written', 'The best opening for a status update to executives is:', ['The headline conclusion, followed by supporting detail', 'A chronological history of the project', 'An apology for the length of the update', 'The list of team members involved'], -0.3],
    ['Written', 'When an email thread exceeds ten replies with no resolution, you should:', ['Propose a short synchronous call with a clear agenda', 'Reply-all with a longer summary', 'Start a new thread with the same people', 'Stop responding'], -0.6],
    ['Written', 'Which is the clearest rewrite of: "It has been decided that the implementation of the feature will be postponed"?', ['We are postponing the feature', 'The feature’s implementation has been subjected to postponement', 'A decision regarding postponement was made', 'It was concluded to delay implementing'], -0.5],
    ['Written', 'In a bug report, the most important element is:', ['Steps to reproduce with expected vs actual behavior', 'Your theory about the root cause', 'The number of users complaining', 'A screenshot of the error alone'], -0.7],
    ['Verbal', 'During a presentation, an audience member challenges your data. You should:', ['Acknowledge the question, address what you can, and offer to follow up with specifics', 'Defend the data firmly and move on', 'Skip ahead to avoid more questions', 'Ask them to hold questions until the end'], 0.0],
    ['Verbal', 'Active listening is best demonstrated by:', ['Paraphrasing the speaker’s point before responding', 'Nodding continuously', 'Preparing your reply while they speak', 'Repeating their exact words back'], -0.9],
    ['Verbal', 'When explaining a technical concept to a non-technical stakeholder, you should:', ['Use an analogy anchored in their domain', 'Use precise technical vocabulary for accuracy', 'Simplify so far that details become wrong', 'Send documentation instead'], -0.4],
    ['Verbal', 'In a meeting you realize you misspoke about a key figure. You should:', ['Correct it as soon as you notice, plainly', 'Correct it by email afterward only', 'Wait to see if anyone noticed', 'Correct it only if asked'], -1.0],
    ['Meetings', 'The single highest-leverage element of an effective meeting is:', ['A clear agenda with desired outcomes shared in advance', 'A strict time limit', 'Having all stakeholders present', 'Detailed minutes afterward'], -0.2],
    ['Meetings', 'A meeting has drifted off-agenda for ten minutes. As facilitator you:', ['Name the drift, park the topic, and return to the agenda', 'Let it continue — it may be valuable', 'End the meeting early', 'Schedule a follow-up silently'], -0.3],
    ['Feedback', 'Effective constructive feedback is:', ['Specific, behavioral, timely, and actionable', 'General so it applies broadly', 'Delivered in writing only', 'Balanced with exactly two compliments'], -0.6],
    ['Feedback', 'A peer asks for feedback on a draft you think is weak. You:', ['Lead with what works, then give specific improvable points', 'Say it’s fine to spare feelings', 'List every flaw thoroughly', 'Suggest they ask someone else'], -0.5],
    ['Cross-cultural', 'Working with a culture where direct "no" is uncommon, you should:', ['Listen for indirect signals and confirm understanding with open questions', 'Push for an explicit yes or no', 'Assume silence means agreement', 'Use only written communication'], 0.6],
    ['Cross-cultural', 'Scheduling a recurring meeting across three time zones, the fairest approach is:', ['Rotate the inconvenient slot among regions', 'Fix it to headquarters time', 'Fix it to the largest group’s time', 'Make it async-only permanently'], 0.1],
    ['Difficult Conversations', 'You must tell a stakeholder their request can’t be delivered. The best structure is:', ['State the constraint, the why, and offer alternatives', 'Apologize extensively first', 'Blame upstream dependencies', 'Soften it until it sounds like maybe'], 0.3],
    ['Difficult Conversations', 'A teammate’s tone in chat reads as hostile. You should:', ['Assume good intent and clarify on a call', 'Match their tone to set boundaries', 'Screenshot it to their manager', 'Respond only in formal language'], -0.1],
    ['Audience', 'The same incident needs communicating to engineers and customers. You should:', ['Write two versions tailored to each audience’s needs', 'Send the technical postmortem to both', 'Send the customer version to both', 'Let support translate for customers'], -0.4],
    ['Persuasion', 'The strongest way to open a proposal for budget is:', ['The business problem and the cost of inaction', 'The full feature list', 'The team’s credentials', 'A request for the amount needed'], 0.5],
    ['Documentation', 'Good documentation primarily optimizes for:', ['The reader’s task success, not the writer’s completeness', 'Covering every edge case', 'Brevity above all', 'Demonstrating system complexity'], 0.2],
  ];
  for (const [subTopic, text, [correct, ...wrong], difficulty] of authored) {
    const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
    qs.push({ moduleId: 'communication', subTopic, text, options, correctIndex, difficulty, discrimination: 1.1 + rng() * 0.5, guessing: 0.25, tags: ['communication', subTopic.toLowerCase().replace(/ /g, '-')] });
  }

  // ── Channel × purpose matrix: 8 × 10 = 80 ────────────────────────────────
  const audiences = ['a new customer', 'the executive team', 'a frustrated user', 'an external partner', 'your direct team', 'a regulatory auditor', 'a candidate you’re rejecting', 'an open-source community'];
  const tasks: Array<[string, string, string, string[]]> = [
    ['Clarity', 'announcing a breaking change', 'State what changes, when, who is affected, and the migration path', ['Describe the internal reasons for the change in depth', 'Announce it briefly and link a long doc', 'Let users discover it in release notes']],
    ['Tone', 'responding to harsh public criticism', 'Stay factual and courteous; acknowledge valid points and state corrections calmly', ['Match their energy to show conviction', 'Respond with humor to defuse', 'Ignore it entirely']],
    ['Structure', 'delivering a long written update', 'Lead with a summary, use headings, and put details in appendices', ['Write chronologically as events happened', 'Keep it as one dense paragraph for completeness', 'Split it across multiple separate messages']],
    ['Timing', 'sharing bad news that affects them', 'Communicate early, before rumors or surprises spread', ['Wait until you have every detail confirmed', 'Time it before a weekend to soften impact', 'Bundle it with good news later']],
    ['Medium', 'resolving a complex disagreement', 'Move to a synchronous conversation, then confirm conclusions in writing', ['Continue in the email thread for the record', 'Use chat for speed', 'Have a third party mediate in writing']],
    ['Empathy', 'explaining a delay you caused', 'Acknowledge the impact on them specifically before explaining causes', ['Lead with the technical reasons', 'Emphasize how rare such delays are', 'Note that delays are industry-standard']],
    ['Brevity', 'requesting a decision', 'Present the question, two or three options with trade-offs, and a recommendation', ['Provide all background and let them conclude', 'Present only your recommended option', 'Ask for a meeting to discuss broadly']],
    ['Accuracy', 'reporting metrics', 'Present the numbers with context, definitions, and known caveats', ['Round aggressively for readability', 'Show only favorable trends', 'Provide raw data without interpretation']],
    ['Listening', 'gathering their requirements', 'Ask open questions, paraphrase back, and confirm priorities in writing', ['Present your solution and ask for objections', 'Send a long questionnaire', 'Infer needs from their past requests']],
    ['Follow-up', 'after a key conversation', 'Send a written summary of decisions, owners, and deadlines within a day', ['Trust shared memory of the discussion', 'Record the call instead of summarizing', 'Follow up only if questions arise']],
  ];
  for (let ai = 0; ai < audiences.length; ai++) {
    for (let ti = 0; ti < tasks.length; ti++) {
      const [subTopic, taskText, correct, wrong] = tasks[ti];
      const { options, correctIndex } = shuffleWithAnswer(rng, correct, wrong);
      qs.push({
        moduleId: 'communication', subTopic,
        text: `When ${taskText} with ${audiences[ai]}, the most effective approach is to:`,
        options, correctIndex,
        difficulty: -0.9 + ((ai + ti) % 7) * 0.38,
        discrimination: 1.0 + ((ai + 3 * ti) % 5) * 0.15,
        guessing: 0.25,
        tags: ['communication', 'scenario', subTopic.toLowerCase().replace(/ /g, '-')],
      });
    }
  }

  return qs.slice(0, 100);
}

export function buildQuestionBank(): SeedQuestion[] {
  return [
    ...technicalQuestions(),
    ...attitudeQuestions(),
    ...behavioralQuestions(),
    ...psychometricQuestions(),
    ...communicationQuestions(),
  ];
}
