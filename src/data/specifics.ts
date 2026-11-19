import "server-only";
// Exact chapters / sections / modules for resources the plan describes loosely.
// Every chapter number and title here was taken from the resource's own table of contents
// (publisher or official site), checked November 2026.
//
// Each entry attaches to a week item: a resource line (matched by a substring of its text)
// or a daily checklist day.

export interface SpecLink {
  label: string;
  url: string;
}
export interface Spec {
  track: "main" | "java";
  week: number;
  /** "res" matches a resource line containing `match`; "day" matches a checklist day (Mon, Tue...). */
  where: "res" | "day";
  match: string;
  detail: string;
  links?: SpecLink[];
}

const PETZOLD = "https://www.oreilly.com/library/view/code-the-hidden/9780137909261/";
const pz = (n: number, t: string): SpecLink => ({ label: `Ch ${n} ${t}`, url: `${PETZOLD}ch${String(n).padStart(2, "0")}.xhtml` });
const OSTEP = "https://pages.cs.wisc.edu/~remzi/OSTEP/";
const os = (n: number, t: string, f: string): SpecLink => ({ label: `${n} ${t}`, url: OSTEP + f });
const hp = (n: number, t: string, slug: string): SpecLink => ({ label: `Ch ${n} ${t}`, url: `https://hpbn.co/${slug}/` });
const git = (s: string, t: string, slug: string): SpecLink => ({ label: `${s} ${t}`, url: `https://git-scm.com/book/en/v2/${slug}` });
const ms = (n: number, t: string, slug: string): SpecLink => ({ label: `L${n} ${t}`, url: `https://missing.csail.mit.edu/2020/${slug}/` });
const mdn = (t: string, slug: string): SpecLink => ({ label: t, url: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/${slug}` });
const html = (n: number, t: string, slug: string): SpecLink => ({ label: `${n}. ${t}`, url: `https://web.dev/learn/html/${slug}` });
const a11y = (n: number, t: string, slug: string): SpecLink => ({ label: `${n}. ${t}`, url: `https://web.dev/learn/accessibility/${slug}` });
const css = (t: string, slug: string): SpecLink => ({ label: t, url: `https://web.dev/learn/css/${slug}` });
const ji = (t: string, slug: string): SpecLink => ({ label: t, url: `https://javascript.info/${slug}` });
const yd = (book: string, n: number, t: string): SpecLink => ({ label: `Ch ${n} ${t}`, url: `https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/${book}/ch${n}.md` });
const DDIA = "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/";
const dd = (n: number, t: string): SpecLink => ({ label: `Ch ${n} ${t}`, url: `${DDIA}ch${String(n).padStart(2, "0")}.html` });
const sre = (n: number, t: string, slug: string): SpecLink => ({ label: `Ch ${n} ${t}`, url: `https://sre.google/sre-book/${slug}/` });
const algs = (s: string, t: string, slug: string): SpecLink => ({ label: `${s} ${t}`, url: `https://algs4.cs.princeton.edu/${slug}` });
const mooc = (n: number): SpecLink => ({ label: `Part ${n}`, url: `https://java-programming.mooc.fi/part-${n}` });
const HFJ = "https://www.oreilly.com/library/view/head-first-java/9781492091646/";
const hfj = (n: number, t: string): SpecLink => ({ label: `Ch ${n} ${t}`, url: `${HFJ}ch${String(n).padStart(2, "0")}.html` });
const react = (t: string, slug: string): SpecLink => ({ label: t, url: `https://react.dev/learn/${slug}` });
const bbg = (t: string, slug: string): SpecLink => ({ label: t, url: `https://bytebytego.com/courses/system-design-interview/${slug}` });
const owasp = (t: string, slug: string): SpecLink => ({ label: t, url: `https://cheatsheetseries.owasp.org/cheatsheets/${slug}.html` });

const CRASH = "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo";

export const SPECIFICS: Spec[] = [
  // ---------- Main week 1 ----------
  {
    track: "main", week: 1, where: "res", match: "Hidden Language",
    detail: "2nd edition: ch 6, 8 (logic), 9-13 (number systems, binary, hex, text), 14 (adders), 17, 19 (memory), 20-24 (ALU, registers, CPU). Skim the rest.",
    links: [pz(9, "Our Ten Digits"), pz(11, "Bit by Bit by Bit"), pz(14, "Adding with Logic Gates"), pz(19, "An Assemblage of Memory"), pz(23, "CPU Control Signals")],
  },
  {
    track: "main", week: 1, where: "res", match: "CS50",
    detail: "Week 0 (Scratch) and Week 1 (C) lectures.",
    links: [{ label: "Week 0 Scratch", url: "https://cs50.harvard.edu/x/weeks/0/" }, { label: "Week 1 C", url: "https://cs50.harvard.edu/x/weeks/1/" }],
  },
  {
    track: "main", week: 1, where: "res", match: "Crash Course Computer Science",
    detail: "Episodes 1-10: Early Computing; Electronic Computing; Boolean Logic & Logic Gates; Representing Numbers and Letters with Binary; How Computers Calculate (the ALU); Registers and RAM; The CPU; Instructions & Programs; Advanced CPU Designs; Early Programming.",
    links: [{ label: "Playlist", url: CRASH }],
  },
  { track: "main", week: 1, where: "day", match: "Mon", detail: "Petzold ch 9 Our Ten Digits, 10 Alternative 10s, 11 Bit by Bit by Bit, 12 Bytes and Hexadecimal.", links: [pz(9, "Our Ten Digits"), pz(10, "Alternative 10s"), pz(11, "Bit by Bit by Bit"), pz(12, "Bytes and Hexadecimal")] },
  { track: "main", week: 1, where: "day", match: "Wed", detail: "Petzold ch 6 Logic with Switches, 8 Relays and Gates, 14 Adding with Logic Gates (ch 16 on subtraction if time).", links: [pz(6, "Logic with Switches"), pz(8, "Relays and Gates"), pz(14, "Adding with Logic Gates")] },
  { track: "main", week: 1, where: "day", match: "Fri", detail: "Petzold ch 17 Feedback and Flip-Flops, 19 An Assemblage of Memory, 21 The Arithmetic Logic Unit, 22 Registers and Busses, 23 CPU Control Signals. Or Crash Course CS episodes 5-9 (ALU → Advanced CPU Designs).", links: [pz(17, "Feedback and Flip-Flops"), pz(19, "An Assemblage of Memory"), pz(21, "The Arithmetic Logic Unit"), pz(22, "Registers and Busses"), pz(23, "CPU Control Signals")] },

  // ---------- Main week 2 (OSTEP) ----------
  {
    track: "main", week: 2, where: "res", match: "OSTEP",
    detail: "Ch 4 Processes, 5 Process API, 6 Direct Execution, 7 CPU Scheduling, 13 Address Spaces, 14 Memory API, 15 Address Translation, 16 Segmentation, 18 Introduction to Paging, 26 Concurrency and Threads.",
    links: [os(4, "Processes", "cpu-intro.pdf"), os(5, "Process API", "cpu-api.pdf"), os(6, "Direct Execution", "cpu-mechanisms.pdf"), os(7, "CPU Scheduling", "cpu-sched.pdf"), os(13, "Address Spaces", "vm-intro.pdf"), os(14, "Memory API", "vm-api.pdf"), os(15, "Address Translation", "vm-mechanism.pdf"), os(16, "Segmentation", "vm-segmentation.pdf"), os(18, "Paging", "vm-paging.pdf"), os(26, "Threads", "threads-intro.pdf")],
  },
  { track: "main", week: 2, where: "day", match: "Mon", detail: "", links: [os(4, "Processes", "cpu-intro.pdf"), os(5, "Process API", "cpu-api.pdf")] },
  { track: "main", week: 2, where: "day", match: "Wed", detail: "", links: [os(6, "Direct Execution", "cpu-mechanisms.pdf"), os(7, "CPU Scheduling", "cpu-sched.pdf")] },
  { track: "main", week: 2, where: "day", match: "Fri", detail: "", links: [os(13, "Address Spaces", "vm-intro.pdf"), os(14, "Memory API", "vm-api.pdf"), os(15, "Address Translation", "vm-mechanism.pdf"), os(16, "Segmentation", "vm-segmentation.pdf"), os(18, "Paging", "vm-paging.pdf")] },
  { track: "main", week: 2, where: "day", match: "Sat", detail: "", links: [os(26, "Concurrency and Threads", "threads-intro.pdf")] },

  // ---------- Main week 3 ----------
  {
    track: "main", week: 3, where: "res", match: "OSTEP",
    detail: "Ch 28 Locks, 29 Locked Data Structures, 30 Condition Variables, 31 Semaphores, 32 Concurrency Bugs, 33 Event-based Concurrency, 39 Files and Directories, 40 File System Implementation.",
    links: [os(28, "Locks", "threads-locks.pdf"), os(29, "Locked Data Structures", "threads-locks-usage.pdf"), os(30, "Condition Variables", "threads-cv.pdf"), os(31, "Semaphores", "threads-sema.pdf"), os(32, "Concurrency Bugs", "threads-bugs.pdf"), os(33, "Event-based Concurrency", "threads-events.pdf"), os(39, "Files and Directories", "file-intro.pdf"), os(40, "FS Implementation", "file-implementation.pdf")],
  },
  { track: "main", week: 3, where: "day", match: "Mon", detail: "", links: [os(39, "Files and Directories", "file-intro.pdf")] },
  { track: "main", week: 3, where: "day", match: "Wed", detail: "", links: [os(28, "Locks", "threads-locks.pdf"), os(29, "Locked Data Structures", "threads-locks-usage.pdf"), os(30, "Condition Variables", "threads-cv.pdf")] },
  { track: "main", week: 3, where: "day", match: "Fri", detail: "", links: [os(31, "Semaphores", "threads-sema.pdf"), os(32, "Concurrency Bugs", "threads-bugs.pdf"), os(33, "Event-based Concurrency", "threads-events.pdf")] },

  // ---------- Main week 4 ----------
  {
    track: "main", week: 4, where: "res", match: "Missing Semester",
    detail: "Use the 2020 edition, which matches these lecture numbers (the 2026 edition reorganised them): L1 Course Overview + The Shell, L2 Shell Tools and Scripting, L3 Editors (Vim), L4 Data Wrangling, L5 Command-line Environment.",
    links: [ms(1, "The Shell", "course-shell"), ms(2, "Shell Tools and Scripting", "shell-tools"), ms(3, "Editors (Vim)", "editors"), ms(4, "Data Wrangling", "data-wrangling"), ms(5, "Command-line Environment", "command-line")],
  },
  { track: "main", week: 4, where: "day", match: "Mon", detail: "", links: [ms(1, "The Shell", "course-shell"), ms(2, "Shell Tools and Scripting", "shell-tools")] },
  { track: "main", week: 4, where: "day", match: "Wed", detail: "", links: [ms(4, "Data Wrangling", "data-wrangling")] },
  { track: "main", week: 4, where: "day", match: "Fri", detail: "", links: [ms(5, "Command-line Environment", "command-line")] },
  { track: "main", week: 4, where: "day", match: "Sat", detail: "Bandit levels 0-15.", links: [{ label: "Bandit level 0", url: "https://overthewire.org/wargames/bandit/bandit0.html" }] },

  // ---------- Main week 5 ----------
  {
    track: "main", week: 5, where: "res", match: "Pro Git",
    detail: "Ch 2 Git Basics (2.1-2.8), ch 3 Git Branching (3.1-3.7), ch 10 Git Internals (10.1-10.9).",
    links: [git("2.1", "Getting a Repository", "Git-Basics-Getting-a-Git-Repository"), git("3.1", "Branches in a Nutshell", "Git-Branching-Branches-in-a-Nutshell"), git("3.6", "Rebasing", "Git-Branching-Rebasing"), git("10.1", "Plumbing and Porcelain", "Git-Internals-Plumbing-and-Porcelain"), git("10.4", "Packfiles", "Git-Internals-Packfiles")],
  },
  { track: "main", week: 5, where: "day", match: "Mon", detail: "10.1 Plumbing and Porcelain, 10.2 Git Objects, 10.3 Git References.", links: [git("10.1", "Plumbing and Porcelain", "Git-Internals-Plumbing-and-Porcelain"), git("10.2", "Git Objects", "Git-Internals-Git-Objects"), git("10.3", "Git References", "Git-Internals-Git-References")] },
  { track: "main", week: 5, where: "day", match: "Fri", detail: "3.1 Branches in a Nutshell, 3.2 Basic Branching and Merging, 3.5 Remote Branches, 3.6 Rebasing.", links: [git("3.1", "Branches in a Nutshell", "Git-Branching-Branches-in-a-Nutshell"), git("3.2", "Branching and Merging", "Git-Branching-Basic-Branching-and-Merging"), git("3.5", "Remote Branches", "Git-Branching-Remote-Branches"), git("3.6", "Rebasing", "Git-Branching-Rebasing")] },

  // ---------- Main week 6 ----------
  {
    track: "main", week: 6, where: "res", match: "High Performance Browser Networking",
    detail: "Ch 1 Primer on Latency and Bandwidth, 2 Building Blocks of TCP, 3 Building Blocks of UDP.",
    links: [hp(1, "Latency and Bandwidth", "primer-on-latency-and-bandwidth"), hp(2, "Building Blocks of TCP", "building-blocks-of-tcp"), hp(3, "Building Blocks of UDP", "building-blocks-of-udp")],
  },
  {
    track: "main", week: 6, where: "res", match: "Kurose",
    detail: "Ch 1 Computer Networks and the Internet, ch 3 Transport Layer, ch 4 The Network Layer: Data Plane.",
    links: [{ label: "Kurose lecture videos", url: "https://gaia.cs.umass.edu/kurose_ross/lectures.php" }],
  },
  { track: "main", week: 6, where: "day", match: "Wed", detail: "", links: [hp(1, "Latency and Bandwidth", "primer-on-latency-and-bandwidth"), hp(2, "Building Blocks of TCP", "building-blocks-of-tcp")] },

  // ---------- Main week 7 ----------
  {
    track: "main", week: 7, where: "res", match: "MDN HTTP guide",
    detail: "Six guide pages:",
    links: [mdn("Overview", "Overview"), mdn("Messages", "Messages"), mdn("Caching", "Caching"), mdn("Cookies", "Cookies"), mdn("CORS", "CORS"), mdn("Redirections", "Redirections")],
  },
  {
    track: "main", week: 7, where: "res", match: "HPBN chapters 4",
    detail: "Ch 4 Transport Layer Security, 9 Brief History of HTTP, 10 Primer on Web Performance, 11 HTTP/1.X, 12 HTTP/2.",
    links: [hp(4, "TLS", "transport-layer-security-tls"), hp(9, "Brief History of HTTP", "brief-history-of-http"), hp(10, "Web Performance", "primer-on-web-performance"), hp(11, "HTTP/1.X", "http1x"), hp(12, "HTTP/2", "http2")],
  },
  { track: "main", week: 7, where: "day", match: "Mon", detail: "", links: [mdn("Overview", "Overview"), mdn("Messages", "Messages")] },
  { track: "main", week: 7, where: "day", match: "Wed", detail: "", links: [mdn("Caching", "Caching"), mdn("Cookies", "Cookies"), mdn("CORS", "CORS")] },
  { track: "main", week: 7, where: "day", match: "Fri", detail: "", links: [hp(4, "TLS", "transport-layer-security-tls")] },

  // ---------- Main week 8 ----------
  {
    track: "main", week: 8, where: "res", match: "Inside look",
    detail: "Part 1 CPU, GPU, memory and multi-process architecture · Part 2 What happens in navigation · Part 3 Inner workings of a renderer process · Part 4 Input is coming to the compositor.",
    links: [1, 2, 3, 4].map((n) => ({ label: `Part ${n}`, url: `https://developer.chrome.com/blog/inside-browser-part${n}` })),
  },
  { track: "main", week: 8, where: "day", match: "Mon", detail: "", links: [1, 2].map((n) => ({ label: `Part ${n}`, url: `https://developer.chrome.com/blog/inside-browser-part${n}` })) },
  { track: "main", week: 8, where: "day", match: "Wed", detail: "", links: [3, 4].map((n) => ({ label: `Part ${n}`, url: `https://developer.chrome.com/blog/inside-browser-part${n}` })) },

  // ---------- Main week 9 ----------
  {
    track: "main", week: 9, where: "day", match: "Mon",
    detail: "Learn HTML modules 1-8: Welcome, Overview, Document structure, Metadata, Semantic HTML, Headings and sections, Attributes, Text basics.",
    links: [html(2, "Overview", "overview"), html(3, "Document structure", "document-structure"), html(4, "Metadata", "metadata"), html(5, "Semantic HTML", "semantic-html"), html(6, "Headings and sections", "headings-and-sections"), html(7, "Attributes", "attributes"), html(8, "Text basics", "text-basics")],
  },
  { track: "main", week: 9, where: "day", match: "Wed", detail: "Learn HTML module 13 Forms and module 14 Images.", links: [html(13, "Forms", "forms"), html(14, "Images", "images")] },
  {
    track: "main", week: 9, where: "day", match: "Fri",
    detail: "Learn Accessibility first half: modules 1-10 (Welcome through Color and contrast).",
    links: [a11y(2, "Why it matters", "why"), a11y(3, "Measuring", "measure"), a11y(4, "ARIA and HTML", "aria-html"), a11y(5, "Content structure", "structure"), a11y(6, "The Document", "more-html"), a11y(7, "Keyboard focus", "focus"), a11y(8, "JavaScript", "javascript"), a11y(9, "Images", "images"), a11y(10, "Color and contrast", "color-contrast")],
  },

  // ---------- Main week 10-11 (CSS) ----------
  {
    track: "main", week: 10, where: "res", match: "Learn CSS",
    detail: "The course has since added a Nesting module, so match by name: Box Model, Selectors, Nesting, The cascade, Specificity, Inheritance, Color, Sizing Units, Layout, plus Z-index and stacking contexts.",
  },
  { track: "main", week: 10, where: "day", match: "Mon", detail: "", links: [css("Box Model", "box-model"), css("Selectors", "selectors"), css("The cascade", "the-cascade"), css("Specificity", "specificity")] },
  { track: "main", week: 10, where: "day", match: "Wed", detail: "", links: [css("Inheritance", "inheritance"), css("Color", "color"), css("Sizing Units", "sizing"), css("Layout", "layout")] },
  { track: "main", week: 10, where: "day", match: "Fri", detail: "", links: [css("Z-index and stacking contexts", "z-index"), { label: "Comeau: What the heck, z-index??", url: "https://www.joshwcomeau.com/css/stacking-contexts/" }] },
  { track: "main", week: 11, where: "day", match: "Mon", detail: "", links: [{ label: "Comeau: Interactive Guide to Flexbox", url: "https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/" }, css("Flexbox", "flexbox")] },
  { track: "main", week: 11, where: "day", match: "Wed", detail: "", links: [{ label: "Comeau: Interactive Guide to CSS Grid", url: "https://www.joshwcomeau.com/css/interactive-guide-to-grid/" }, css("Grid", "grid")] },
  { track: "main", week: 11, where: "day", match: "Fri", detail: "Learn CSS has no separate media-queries module now; responsive design is covered across these:", links: [css("Container queries", "container-queries"), css("Logical Properties", "logical-properties"), css("Transitions", "transitions"), css("Animations", "animations")] },

  // ---------- Main week 12-14 (JS) ----------
  {
    track: "main", week: 12, where: "res", match: "javascript.info Part 1, sections 1-6",
    detail: "Sections 1 An introduction, 2 JavaScript Fundamentals, 3 Code quality, 4 Objects: the basics, 5 Data types, 6 Advanced working with functions.",
    links: [ji("1 Introduction", "getting-started"), ji("2 Fundamentals", "first-steps"), ji("3 Code quality", "code-quality"), ji("4 Objects: the basics", "object-basics"), ji("5 Data types", "data-types"), ji("6 Advanced functions", "advanced-functions")],
  },
  {
    track: "main", week: 12, where: "res", match: "You Don't Know JS Yet",
    detail: "Get Started ch 1-4; Scope & Closures ch 1-8.",
    links: [{ label: "Get Started", url: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/get-started/README.md" }, { label: "Scope & Closures", url: "https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/README.md" }],
  },
  { track: "main", week: 12, where: "day", match: "Mon", detail: "", links: [ji("2 Fundamentals", "first-steps"), ji("4 Objects: the basics", "object-basics")] },
  { track: "main", week: 12, where: "day", match: "Wed", detail: "Scope & Closures: 1 What's the Scope?, 2 Illustrating Lexical Scope, 3 The Scope Chain, 4 Around the Global Scope.", links: [yd("scope-closures", 1, "What's the Scope?"), yd("scope-closures", 2, "Illustrating Lexical Scope"), yd("scope-closures", 3, "The Scope Chain"), yd("scope-closures", 4, "Around the Global Scope")] },
  { track: "main", week: 12, where: "day", match: "Fri", detail: "Scope & Closures: 5 The (Not So) Secret Lifecycle of Variables, 6 Limiting Scope Exposure, 7 Using Closures.", links: [yd("scope-closures", 5, "Lifecycle of Variables"), yd("scope-closures", 6, "Limiting Scope Exposure"), yd("scope-closures", 7, "Using Closures"), ji("6 Advanced functions", "advanced-functions")] },
  {
    track: "main", week: 13, where: "res", match: "javascript.info Part 1 sections 8-11",
    detail: "Sections 8 Prototypes, inheritance, 9 Classes, 10 Error handling, 11 Promises, async/await, 12 Generators, advanced iteration, 13 Modules.",
    links: [ji("8 Prototypes", "prototypes"), ji("9 Classes", "classes"), ji("10 Error handling", "error-handling"), ji("11 Promises, async/await", "async"), ji("12 Generators", "generators-iterators"), ji("13 Modules", "modules")],
  },
  { track: "main", week: 13, where: "res", match: "YDKJSY Objects & Classes", detail: "Ch 1 Object Foundations, 2 How Objects Work, 3 Classy Objects, 4 This Works, 5 Delegation.", links: [1, 2, 3, 4, 5].map((n) => yd("objects-classes", n, ["Object Foundations", "How Objects Work", "Classy Objects", "This Works", "Delegation"][n - 1])) },
  { track: "main", week: 13, where: "res", match: "V8 blog", detail: "", links: [{ label: "Launching Ignition and TurboFan", url: "https://v8.dev/blog/launching-ignition-and-turbofan" }, { label: "Fast properties in V8", url: "https://v8.dev/blog/fast-properties" }] },
  { track: "main", week: 13, where: "day", match: "Mon", detail: "", links: [ji("Prototypal inheritance", "prototype-inheritance"), ji("Class basic syntax", "class"), ji("Class inheritance", "class-inheritance")] },
  { track: "main", week: 13, where: "day", match: "Fri", detail: "", links: [ji("11 Promises, async/await", "async"), ji("Microtasks", "microtask-queue"), ji("13 Modules", "modules")] },
  {
    track: "main", week: 14, where: "res", match: "javascript.info Part 2",
    detail: "Part 2 sections: Document, Introduction to Events, UI Events, Forms and controls, Document and resource loading.",
    links: [ji("Document", "document"), ji("Introduction to Events", "events"), ji("UI Events", "event-details"), ji("Forms, controls", "forms-controls"), ji("Document and resource loading", "loading"), ji("Event loop: micro/macrotasks", "event-loop")],
  },

  // ---------- Main week 15 ----------
  {
    track: "main", week: 15, where: "res", match: "Node.js Design Patterns",
    detail: "3rd ed. ch 1 The Node.js Platform, 2 The Module System, 3 Callbacks and Events, 4 Async Control Flow Patterns with Callbacks, 5 Async Control Flow Patterns with Promises and Async/Await, 6 Coding with Streams.",
  },

  // ---------- Main week 17 ----------
  {
    track: "main", week: 17, where: "res", match: "OWASP Cheat Sheet",
    detail: "The six cheat sheets:",
    links: [owasp("Authentication", "Authentication_Cheat_Sheet"), owasp("Session Management", "Session_Management_Cheat_Sheet"), owasp("Password Storage", "Password_Storage_Cheat_Sheet"), owasp("JWT", "JSON_Web_Token_for_Java_Cheat_Sheet"), owasp("XSS Prevention", "Cross_Site_Scripting_Prevention_Cheat_Sheet"), owasp("CSRF Prevention", "Cross-Site_Request_Forgery_Prevention_Cheat_Sheet")],
  },

  // ---------- Main week 19-21 ----------
  { track: "main", week: 19, where: "res", match: "DDIA chapters 3", detail: "1st edition: ch 3 Storage and Retrieval, ch 7 Transactions.", links: [dd(3, "Storage and Retrieval"), dd(7, "Transactions")] },
  { track: "main", week: 19, where: "res", match: "PostgreSQL docs: MVCC", detail: "", links: [{ label: "Concurrency Control (MVCC)", url: "https://www.postgresql.org/docs/current/mvcc.html" }, { label: "Using EXPLAIN", url: "https://www.postgresql.org/docs/current/using-explain.html" }] },
  { track: "main", week: 20, where: "res", match: "DDIA chapters 1-2", detail: "1st edition: ch 1 Reliable, Scalable, and Maintainable Applications, ch 2 Data Models and Query Languages, ch 11 Stream Processing (first half).", links: [dd(1, "Reliable, Scalable, Maintainable"), dd(2, "Data Models and Query Languages"), dd(11, "Stream Processing")] },
  { track: "main", week: 21, where: "res", match: "Khorikov", detail: "First half = Part 1 The bigger picture (ch 1 The goal of unit testing, 2 What is a unit test?, 3 The anatomy of a unit test) and Part 2 Making your tests work for you (ch 4 The four pillars of a good unit test, 5 Mocks and test fragility, 6 Styles of unit testing, 7 Refactoring toward valuable unit tests)." },

  // ---------- Main week 23-26 ----------
  { track: "main", week: 23, where: "res", match: "react.dev: Describing the UI", detail: "", links: [react("Describing the UI", "describing-the-ui"), react("Render and Commit", "render-and-commit"), react("Preserving and Resetting State", "preserving-and-resetting-state"), react("Your UI as a Tree", "understanding-your-ui-as-a-tree")] },
  {
    track: "main", week: 24, where: "res", match: "react.dev: Adding Interactivity",
    detail: "Adding Interactivity (7 pages), Managing State (7 pages), Escape Hatches (8 pages).",
    links: [react("Adding Interactivity", "adding-interactivity"), react("Managing State", "managing-state"), react("Escape Hatches", "escape-hatches"), react("You Might Not Need an Effect", "you-might-not-need-an-effect"), react("Lifecycle of Reactive Effects", "lifecycle-of-reactive-effects")],
  },
  { track: "main", week: 26, where: "res", match: "Josh Comeau's Making Sense", detail: "", links: [{ label: "Making Sense of React Server Components", url: "https://www.joshwcomeau.com/react/server-components/" }] },

  // ---------- Main week 32-35 ----------
  { track: "main", week: 32, where: "res", match: "Site Reliability Engineering", detail: "Ch 4 Service Level Objectives, ch 6 Monitoring Distributed Systems, ch 15 Postmortem Culture: Learning from Failure.", links: [sre(4, "Service Level Objectives", "service-level-objectives"), sre(6, "Monitoring Distributed Systems", "monitoring-distributed-systems"), sre(15, "Postmortem Culture", "postmortem-culture")] },
  { track: "main", week: 33, where: "res", match: "DDIA chapters 5", detail: "1st edition: ch 5 Replication, 6 Partitioning, 8 The Trouble with Distributed Systems.", links: [dd(5, "Replication"), dd(6, "Partitioning"), dd(8, "The Trouble with Distributed Systems")] },
  { track: "main", week: 33, where: "res", match: "System Design Interview Vol. 1", detail: "Vol. 1 ch 1 Scale From Zero To Millions Of Users, ch 2 Back-of-the-envelope Estimation, ch 5 Design Consistent Hashing.", links: [bbg("Scale From Zero To Millions", "scale-from-zero-to-millions-of-users"), bbg("Back-of-the-envelope Estimation", "back-of-the-envelope-estimation"), bbg("Consistent Hashing", "design-consistent-hashing")] },
  { track: "main", week: 34, where: "res", match: "DDIA chapters 9", detail: "1st edition: ch 9 Consistency and Consensus, 11 Stream Processing, 12 The Future of Data Systems.", links: [dd(9, "Consistency and Consensus"), dd(11, "Stream Processing"), dd(12, "The Future of Data Systems")] },
  { track: "main", week: 35, where: "res", match: "System Design Interview Vol. 1 and Vol. 2", detail: "Vol. 1 ch 3 is the 4-step framework used every session.", links: [bbg("A Framework For System Design Interviews", "a-framework-for-system-design-interviews")] },
  { track: "main", week: 35, where: "day", match: "Mon", detail: "Compare with Vol. 1 ch 8 Design A URL Shortener.", links: [bbg("Design A URL Shortener", "design-a-url-shortener")] },
  { track: "main", week: 35, where: "day", match: "Wed", detail: "Vol. 1 ch 4 Design A Rate Limiter and ch 10 Design A Notification System.", links: [bbg("Design A Rate Limiter", "design-a-rate-limiter"), bbg("Design A Notification System", "design-a-notification-system")] },
  { track: "main", week: 35, where: "day", match: "Fri", detail: "Compare with Vol. 1 ch 12 Design A Chat System.", links: [bbg("Design A Chat System", "design-a-chat-system")] },
  { track: "main", week: 35, where: "day", match: "Sat", detail: "Compare with Vol. 1 ch 11 Design A News Feed System.", links: [bbg("Design A News Feed System", "design-a-news-feed-system")] },

  // ---------- Java Part A ----------
  { track: "java", week: 1, where: "res", match: "MOOC", detail: "", links: [mooc(1)] },
  { track: "java", week: 1, where: "res", match: "Head First Java", detail: "3rd ed. ch 1 Breaking the Surface, ch 2 A Trip to Objectville.", links: [hfj(1, "Breaking the Surface"), hfj(2, "A Trip to Objectville")] },
  { track: "java", week: 2, where: "res", match: "MOOC", detail: "", links: [mooc(2)] },
  { track: "java", week: 2, where: "res", match: "Head First Java", detail: "3rd ed. ch 3 Know Your Variables, ch 4 How Objects Behave, ch 5 Extra-Strength Methods.", links: [hfj(3, "Know Your Variables"), hfj(4, "How Objects Behave"), hfj(5, "Extra-Strength Methods")] },
  { track: "java", week: 3, where: "res", match: "MOOC", detail: "", links: [mooc(3)] },
  { track: "java", week: 3, where: "res", match: "Head First Java", detail: "3rd ed. has no single arrays/strings chapter: arrays are in ch 3 Know Your Variables, ArrayList and the String API in ch 6 Using the Java Library.", links: [hfj(3, "Know Your Variables"), hfj(6, "Using the Java Library")] },
  { track: "java", week: 4, where: "res", match: "MOOC", detail: "", links: [mooc(4), mooc(5)] },
  { track: "java", week: 4, where: "res", match: "Head First Java", detail: "3rd ed. ch 2 A Trip to Objectville (classes and objects), ch 4 How Objects Behave, ch 9 Life and Death of an Object (constructors).", links: [hfj(2, "A Trip to Objectville"), hfj(4, "How Objects Behave"), hfj(9, "Life and Death of an Object")] },
  { track: "java", week: 5, where: "res", match: "MOOC", detail: "", links: [mooc(9), mooc(5)] },
  { track: "java", week: 5, where: "res", match: "Head First Java", detail: "3rd ed. ch 7 Better Living in Objectville (inheritance and polymorphism), ch 8 Serious Polymorphism (interfaces and abstract classes).", links: [hfj(7, "Inheritance and Polymorphism"), hfj(8, "Interfaces and Abstract Classes")] },
  { track: "java", week: 6, where: "res", match: "MOOC", detail: "", links: [mooc(6), mooc(11)] },
  { track: "java", week: 6, where: "res", match: "Head First Design Patterns", detail: "2nd ed. ch 1 Strategy (Welcome to Design Patterns), ch 2 Observer, ch 3 Decorator, ch 4 Factory. Exceptions: Head First Java ch 13 Risky Behavior.", links: [hfj(13, "Risky Behavior (exceptions)")] },
  { track: "java", week: 7, where: "res", match: "MOOC", detail: "Head First Java ch 11 Data Structures (Collections and Generics) covers the same ground.", links: [mooc(8), mooc(12), hfj(11, "Collections and Generics")] },
  { track: "java", week: 8, where: "res", match: "MOOC", detail: "Head First Java ch 12 Lambdas and Streams is a gentler intro.", links: [mooc(10), hfj(12, "Lambdas and Streams")] },
  { track: "java", week: 8, where: "res", match: "Modern Java in Action", detail: "Ch 1 Java 8, 9, 10, and 11: what's happening?, 2 Passing code with behavior parameterization, 3 Lambda expressions, 4 Introducing streams, 5 Working with streams, 6 Collecting data with streams." },
  { track: "java", week: 9, where: "res", match: "Java Performance", detail: "2nd ed. ch 4 Working with the JIT Compiler, ch 5 An Introduction to Garbage Collection, ch 6 Garbage Collection Algorithms." },
  { track: "java", week: 10, where: "res", match: "Sedgewick", detail: "", links: [algs("1.4", "Analysis of Algorithms", "14analysis")] },

  // ---------- Java Parts B and C (Sedgewick booksite sections) ----------
  { track: "java", week: 11, where: "res", match: "Sedgewick", detail: "", links: [algs("1.3", "Bags, Queues, and Stacks (resizing arrays)", "13stacks")] },
  { track: "java", week: 13, where: "res", match: "Sedgewick", detail: "", links: [algs("3.4", "Hash Tables", "34hash")] },
  { track: "java", week: 15, where: "res", match: "Sedgewick", detail: "", links: [algs("1.3", "Linked lists", "13stacks")] },
  { track: "java", week: 16, where: "res", match: "Sedgewick", detail: "", links: [algs("1.3", "Stacks and Queues", "13stacks")] },
  { track: "java", week: 18, where: "res", match: "Sedgewick", detail: "2.1 Elementary Sorts, 2.2 Mergesort, 2.3 Quicksort.", links: [algs("2.1", "Elementary Sorts", "21elementary"), algs("2.2", "Mergesort", "22mergesort"), algs("2.3", "Quicksort", "23quicksort")] },
  { track: "java", week: 19, where: "res", match: "Sedgewick", detail: "", links: [algs("2.5", "Sorting Applications", "25applications"), algs("3.1", "Symbol Tables (binary search)", "31elementary")] },
  { track: "java", week: 22, where: "res", match: "Sedgewick", detail: "", links: [algs("3.2", "Binary Search Trees", "32bst"), algs("3.3", "Balanced Search Trees", "33balanced")] },
  { track: "java", week: 23, where: "res", match: "Sedgewick", detail: "", links: [algs("2.4", "Priority Queues", "24pq")] },
  { track: "java", week: 24, where: "res", match: "Sedgewick", detail: "", links: [algs("5.2", "Tries", "52trie")] },
  { track: "java", week: 25, where: "res", match: "Sedgewick", detail: "", links: [algs("4.1", "Undirected Graphs", "41graph")] },
  { track: "java", week: 26, where: "res", match: "Sedgewick", detail: "", links: [algs("1.5", "Union-Find", "15uf"), algs("4.2", "Directed Graphs", "42digraph")] },
  { track: "java", week: 27, where: "res", match: "Sedgewick", detail: "", links: [algs("4.3", "Minimum Spanning Trees", "43mst"), algs("4.4", "Shortest Paths", "44sp")] },
  { track: "java", week: 33, where: "res", match: "Sedgewick", detail: "", links: [algs("5.3", "Substring Search", "53substring")] },
  { track: "java", week: 34, where: "res", match: "Java Concurrency in Practice", detail: "Ch 1 Introduction, then Part I Fundamentals: 2 Thread Safety, 3 Sharing Objects, 4 Composing Objects, 5 Building Blocks." },
];

/** Links derived from the text itself, e.g. "MOOC Part 4" → that part's page. */
function autoSpecs(track: "main" | "java", week: number, where: "res" | "day", text: string): Spec[] {
  if (!/\bMOOC\b/.test(text)) return [];
  const parts = [...new Set(Array.from(text.matchAll(/\bParts? (\d+)/g), (m) => Number(m[1])).filter((n) => n >= 1 && n <= 14))];
  return parts.length ? [{ track, week, where, match: "", detail: "", links: parts.map(mooc) }] : [];
}

/** `text` is the day name (Mon…) or resource text; `fullText` is the item's text for auto links. */
export function specsFor(track: "main" | "java", week: number, where: "res" | "day", text: string, fullText?: string): Spec[] {
  const manual = SPECIFICS.filter((s) => s.track === track && s.week === week && s.where === where && (where === "day" ? s.match === text : text.includes(s.match)));
  if (manual.some((s) => s.links?.some((l) => l.url.includes("java-programming.mooc.fi")))) return manual;
  return [...manual, ...autoSpecs(track, week, where, fullText ?? text)];
}
