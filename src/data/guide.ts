import "server-only";
import type { Day } from "@/lib/constants";
export { DEFAULT_START, DAYS, type Day } from "@/lib/constants";

// Hand-transcribed intro content from "Zero to Deep: 36-Week Software Engineering Plan".

export const PLAN_TITLE = "Zero to Deep";
export const PLAN_SUBTITLE = "36-Week Software Engineering Plan";

export const WHY_PAST_FAILED = [
  'They were lists of topics, not instructions. "Learn networking" is not something you can sit down and do on a Tuesday at 8 pm.',
  'They had no finish line per week, so you never knew if you were "done" and could move on.',
  "They assumed you already knew the basics underneath, so the first hard topic felt like hitting a wall.",
  "One bad week broke the whole chain, and there was no rule for catching up.",
];

export const WHATS_DIFFERENT = [
  "Every week is a short list of sessions, and the app puts them on your days. Open Today, do the session it shows, tick it. That's all you have to decide.",
  'Every week has a "Done when" test. If you pass it, move on, even if you didn\'t read every link.',
  "Every topic list has two levels. Must know is what you learn this week. Overlooked / niche is what most developers never learn; read it, note it, and come back later.",
  "Nothing assumes knowledge you haven't built yet. Java week 1 assumes zero. Main track week 1 assumes zero.",
  "There are rules for falling behind, so a bad week doesn't end the plan.",
];

export const ENCOURAGEMENT =
  "You are not a zero. You've been shipping code for 1.5 years without the foundations, which means once the foundations are in, everything you've seen at work will suddenly connect.";


export const SCHEDULE: { day: Day; track: string; time: string; what: string }[] = [
  { day: "Mon", track: "Main", time: "1.5 h", what: "Read / watch the week's first core resource. Take notes in your own words." },
  { day: "Tue", track: "Java + DSA", time: "1.5 h", what: "Learn the week's concept, type out every example yourself." },
  { day: "Wed", track: "Main", time: "1.5 h", what: "Second core resource + small experiments in the terminal or browser." },
  { day: "Thu", track: "Java + DSA", time: "1.5 h", what: "Implement the week's structure or program from scratch." },
  { day: "Fri", track: "Main", time: "1.5 h", what: "Start the week's build; write down what confuses you." },
  { day: "Sat", track: "Main", time: "4 h", what: 'Finish the build; write the week\'s "explain it to a junior" note.' },
  { day: "Sun", track: "Java + DSA, then review", time: "3 h + 1 h", what: "Practice problems; then 1 h: Done-when tests for both tracks, tick boxes, plan next week." },
];

export const SETUP_MAIN = [
  "Create a GitHub repo called foundations with folders main-track/ and java-dsa/",
  "Pick a notes tool (Obsidian is free and works offline). Make one folder per week.",
  "Install VS Code (main track) and IntelliJ IDEA Community (Java track)",
  "Install Anki on your phone; add 5 cards per week from your notes",
  "Block the time slots in your calendar as recurring events",
  "Tell one person (friend, colleague) you're doing this; send them your week's ticks every Sunday",
];

export const SETUP_JAVA = [
  "Install a JDK (the latest LTS release, e.g. via Adoptium Temurin or SDKMAN)",
  "Install IntelliJ IDEA Community Edition",
  "Create java-dsa/ in your foundations repo",
  "Create a LeetCode account (free tier is enough)",
  'Make a "patterns" note and a "mistakes" note; you\'ll add to both every week',
];

export const AI_TUTOR = {
  good: ['"Quiz me on TCP with 10 questions"', '"Here\'s my explanation of closures, what\'s wrong with it?"', '"Explain this a different way"'],
  bad: ["Generating your weekly build", "Solving your DSA problems"],
  rule: "If an AI wrote it, you didn't learn it.",
};

export const FALLING_BEHIND: { title: string; text: string }[] = [
  { title: "The minimum week", text: "In a terrible week (illness, deadline at work), do only two things: one Main track session and one DSA session. A minimum week still counts. Zero weeks are the only thing to avoid." },
  { title: "Never cram", text: "Missed a day? Don't double up. The app moves everything back to your next study day by itself and shows the new finish date. The plan has no deadline you have to hit; 40 weeks of real understanding beats 36 of skimming." },
  { title: "Reorder, don't skip", text: "Never skip a week to stay on schedule; each week is a foundation for later ones. If a session doesn't suit today, swap it with the next one or push it back. Do tomorrow's session today and everything just moves up." },
  { title: "The two-session rule for being stuck", text: "If a topic hasn't clicked after two sessions, write down the exact question, try one different resource (a video instead of a book, or vice versa), and if it still hasn't clicked, move on and mark it. Most confusion resolves itself two or three weeks later." },
  { title: "Done-when beats completeness", text: "You don't need to read every resource or tick every niche topic. If you pass the week's Done-when test, the week is done." },
  { title: "Keep the streak, not the calendar", text: "A week counts toward your streak when you do at least two sessions. That's the minimum week. Zero weeks are the only thing to avoid." },
  { title: "Restarting after a gap", text: "If you stop for two weeks or more, don't start where you left off. Spend one session re-doing the last week's Done-when test, then continue." },
];

export const STUCK_ORDER = [
  "Your own notes",
  "The resource's own explanation, reread slowly",
  "A second resource",
  'An AI tutor ("explain X; I understand Y but not Z")',
  "A person (colleague, or a community like r/learnprogramming or a Discord)",
];

export const PRACTICE_RULES = [
  "Read the problem, then write 2-3 examples by hand, including edge cases (empty, one element, duplicates, negatives).",
  "Say the brute-force solution and its time/space complexity before coding.",
  "Look for the pattern (write in your patterns note which signal pointed to it).",
  "Code it, then trace it by hand on one example.",
  "Stuck for 30-40 minutes? Read only the hint or the first part of an explanation, then try again.",
  "Re-solve every problem you needed help with 3 days later and again 2 weeks later, from a blank file.",
  "Log every mistake (off-by-one, wrong edge case, wrong pattern) in your mistakes note.",
];

export const MAIN_INTRO =
  "The Main track goes bottom-up: each phase explains the layer the next one sits on. By week 36 you can trace a request from a keypress, through the network and every piece of infrastructure, into your code and database, and back to pixels on the screen.";

export const JAVA_INTRO =
  "This track is about 6 hours a week (learn, build, solve), in parallel with the Main track. It starts from absolute zero: no Java, no OOP, no programming assumptions. By week 36 you'll be comfortable with Java, OOP and functional programming, and able to solve medium-level algorithm problems and reason about their cost.";

export const WHY_JAVA = [
  "It's statically typed and explicit: you see every type and every object, which makes OOP and data structures concrete.",
  "Its standard library (ArrayList, HashMap, TreeMap, PriorityQueue, ArrayDeque) is a textbook of data structures whose source code you can read.",
  "The best classic algorithms material (Sedgewick's Algorithms, Princeton's Coursera courses) is written in Java.",
  "It contrasts usefully with JavaScript on the Main track: classes vs prototypes, static vs dynamic typing, threads vs event loop.",
];

export const JAVA_CORE_RESOURCES = [
  "⭐ dev.java Learn (Oracle, free): the official tutorials for current Java. Your main guide for Part A.",
  "⭐ Exercism Java track (free): 159 exercises whose tests you run in IntelliJ, so you always know if you got it right",
  "Head First Java (3rd ed.): friendly explanations of OOP; read alongside dev.java",
  "⭐ Algorithms (Sedgewick & Wayne, 4th ed.) + the free Princeton Algorithms I & II courses on Coursera: main resource for Parts B and C, all in Java",
  "NeetCode (free): a clear video explanation for almost every problem in this plan. The plan's own problem list is your only list; use NeetCode to understand each one",
  "Striver's DP series (takeuforward, free): the core for the dynamic programming weeks; Kunal Kushwaha's recursion series for the recursion week",
  "Effective Java (Joshua Bloch, 3rd ed.): read after Part A, one item at a time",
  "VisuAlgo: animations of every structure and algorithm",
];

export const PHASE_SUMMARY: Record<string, { unlocks: string; milestone: string }> = {
  "Phase 1": { unlocks: "Nothing feels like magic below your code: processes, files, ports, packets, HTTP", milestone: 'Your own HTTP server on raw TCP + a written "What happens when I type a URL" (network half)' },
  "Phase 2": { unlocks: "You know what the browser does with every byte, and JS as a language and runtime", milestone: "A vanilla JS + TypeScript app with no frameworks; the URL note extended through rendering" },
  "Phase 3": { unlocks: "You can build and reason about a production-shaped API and database", milestone: "A Node + Postgres + Redis API with auth, jobs, tests and a design README" },
  "Phase 4": { unlocks: "React and Next.js stop being magic; you understand chunks, hydration and RSC", milestone: 'A mini bundler, a mini React, and a Next.js app with a "how this page loads" write-up' },
  "Phase 5": { unlocks: "NGINX, gateways, WAF, Docker, Kubernetes and Ingress become ordinary programs", milestone: "Your full app running in Kubernetes behind NGINX Ingress, deployed by CI/CD" },
  "Phase 6": { unlocks: "You can design a system for a given scale and defend every tradeoff", milestone: "Capstone project + design doc + a 20-minute talk" },
  "Part A": { unlocks: "Java from zero, OOP, paradigms, the JVM, Big-O", milestone: "Write well-structured Java programs and analyze their complexity" },
  "Part B": { unlocks: "Arrays, hashing, lists, stacks, recursion, sorting, binary search, trees, heaps", milestone: "Implement every core structure from scratch and solve easy/medium problems by pattern" },
  "Part C": { unlocks: "Tries, graphs, greedy, dynamic programming, strings, concurrency", milestone: "Solve medium problems reliably, attempt hard ones, and pass a DSA interview" },
};

export const URL_NOTE_SECTIONS = [
  { id: "p1", phase: "Phase 1", title: "Keypress to HTML bytes arriving", hint: "DNS → TCP → TLS → HTTP request → response. Processes, sockets, packets." },
  { id: "p2", phase: "Phase 2", title: "The browser half", hint: "Parsing, DOM/CSSOM, render tree, layout, paint, composite, JS execution." },
  { id: "p3", phase: "Phase 3", title: "Into your server and database", hint: "Node event loop, routing, auth, SQL, indexes, transactions, caches, queues." },
  { id: "p4", phase: "Phase 4", title: "How this page loads", hint: "Bundles and chunks, SSR/RSC, hydration, React reconciliation." },
  { id: "p5", phase: "Phase 5", title: "Through the infrastructure", hint: "CDN, WAF, gateway, NGINX/Ingress, load balancer, containers, Kubernetes." },
  { id: "p6", phase: "Phase 6", title: "At scale", hint: "Replication, partitioning, consistency, consensus, messaging." },
];

export const GLOSSARY: { term: string; meaning: string; weeks: string[] }[] = [
  { term: "Process / thread", meaning: "A running program / an independent line of execution inside it", weeks: ["M2"] },
  { term: "System call", meaning: "How a program asks the operating system to do something (read a file, open a socket)", weeks: ["M3"] },
  { term: "DNS", meaning: "The internet's phonebook: domain name to IP address", weeks: ["M6"] },
  { term: "TCP / UDP", meaning: "Reliable ordered byte stream / fast fire-and-forget packets", weeks: ["M6"] },
  { term: "HTTP", meaning: "The text request/response protocol browsers and servers speak", weeks: ["M7"] },
  { term: "TLS / HTTPS", meaning: "Encryption and identity proof wrapped around HTTP", weeks: ["M7"] },
  { term: "DOM", meaning: "The browser's in-memory tree of the page, built from HTML", weeks: ["M8"] },
  { term: "Event loop", meaning: "How single-threaded JS handles many async tasks", weeks: ["M13", "M15"] },
  { term: "API", meaning: "A defined way for one program to ask another for something; on the web usually HTTP endpoints", weeks: ["M16"] },
  { term: "REST / GraphQL / gRPC", meaning: "Three styles of API: resources over HTTP / query language / fast binary RPC", weeks: ["M16"] },
  { term: "JWT / OAuth / SSO", meaning: "A signed token / a delegated-access protocol / one login for many apps", weeks: ["M17"] },
  { term: "Index (DB)", meaning: "A sorted structure (usually a B-tree) that makes lookups fast", weeks: ["M19", "J22"] },
  { term: "Transaction / ACID", meaning: "A group of DB changes that succeed or fail together, safely", weeks: ["M19"] },
  { term: "Cache / Redis", meaning: "A faster copy of data kept close / a popular in-memory store used for it", weeks: ["M20"] },
  { term: "Message queue / Kafka", meaning: "A buffer where services drop work for others to pick up later / a popular event log", weeks: ["M20"] },
  { term: "Bundler / chunk", meaning: "Turns many source files into a few browser files / one such file, loaded on demand", weeks: ["M22"] },
  { term: "Virtual DOM / reconciliation", meaning: "React's in-memory UI tree / its algorithm for working out what changed", weeks: ["M23"] },
  { term: "Hydration", meaning: "React attaching interactivity to server-rendered HTML", weeks: ["M25"] },
  { term: "SSR / SSG / ISR", meaning: "Render HTML per request / at build time / at build time, refreshed periodically", weeks: ["M25"] },
  { term: "RSC", meaning: "React Server Components: run only on the server, ship no JS", weeks: ["M26"] },
  { term: "CMS", meaning: "Content Management System: lets non-developers edit site content (WordPress, Contentful, Strapi)", weeks: ["M26"] },
  { term: "Reverse proxy / NGINX", meaning: "A server that receives requests for your servers and forwards them / the most popular one", weeks: ["M27"] },
  { term: "Load balancer", meaning: "Spreads incoming requests across multiple servers", weeks: ["M27"] },
  { term: "CDN", meaning: "A worldwide network of caches serving content close to users", weeks: ["M28"] },
  { term: "API Gateway", meaning: "The single front door to many backend services: routing, auth, rate limits", weeks: ["M28"] },
  { term: "APIM", meaning: "API Management: a gateway plus developer portal, keys, analytics and policies", weeks: ["M28"] },
  { term: "WAF", meaning: "Web Application Firewall: blocks malicious HTTP requests before they reach you", weeks: ["M28"] },
  { term: "Container / Docker", meaning: "An isolated Linux process with its own filesystem view / the tool that builds and runs them", weeks: ["M29"] },
  { term: "Kubernetes (K8s)", meaning: "A system that runs and manages containers across many machines", weeks: ["M30"] },
  { term: "Ingress", meaning: "Kubernetes rules routing outside HTTP traffic to services, run by an Ingress controller (often NGINX)", weeks: ["M31"] },
  { term: "CI/CD", meaning: "Automated pipeline that tests, builds and deploys every change", weeks: ["M32"] },
  { term: "Sharding / replication", meaning: "Splitting data across machines / copying it to several machines", weeks: ["M33"] },
  { term: "CAP theorem", meaning: "During a network split, a distributed system must choose consistency or availability", weeks: ["M34"] },
  { term: "JVM / bytecode", meaning: "The virtual machine that runs Java / the portable instructions it runs", weeks: ["J1", "J9"] },
  { term: "OOP", meaning: "Organizing code as objects that bundle data and behavior", weeks: ["J4", "J5", "J6"] },
  { term: "Big-O", meaning: "How an algorithm's cost grows as input grows", weeks: ["J10"] },
];

export const AFTER_JAVA_RHYTHM = [
  "Learn (1.5 h): learn the concept (reading/video), type every example yourself.",
  "Build (1.5 h): implement the structure or algorithm from scratch, with tests.",
  "Solve (3 h): problems (number given each week), then 15 minutes reviewing your mistakes note.",
];
