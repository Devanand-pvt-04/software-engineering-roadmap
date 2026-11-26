import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's engineering craft phase (M39-M42). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_CRAFT: ExplainMap = {
  // ---- Week 39: Writing code people can change ----
  "M39:0": {
    why: "Most of a program's life is spent being changed, not written. The real measure of code quality is how cheap the next change is.",
    problem:
      "As a codebase grows, small changes start taking days: you touch one thing and three others break, or you can't tell what a change will affect.",
    how: "Name the three symptoms of complexity so you can spot them early, and treat every design decision as a way to reduce one of them.",
    tech: [
      "Change amplification: a simple change needs edits in many places (for example, a colour hard-coded in 40 files).",
      "Cognitive load: how much a developer must hold in their head to make a change safely.",
      "Unknown unknowns: you can't even tell which code needs to change, the worst of the three.",
      "Complexity comes from two sources: dependencies (code that can't be understood alone) and obscurity (important information that isn't obvious).",
      "Complexity is incremental: no single shortcut ruins a codebase, but hundreds of them do.",
    ],
    cost: "Fighting complexity takes time now for a payoff later, and the payoff is invisible when it works. Over-designing for changes that never come is complexity too.",
    tryIt:
      "Pick a change you made recently in one of your projects and count the files you had to touch. For each one, write down which of the three symptoms it shows.",
    buildsOn: "Main week 21: Testing",
  },
  "M39:1": {
    why: "A module (a function, class or package) is useful when using it is much simpler than writing it yourself.",
    problem:
      "Many small classes that each do almost nothing (shallow modules) force callers to learn many interfaces and to wire them together, so the complexity moves to every caller.",
    how: "Prefer deep modules: a small, simple interface that hides a lot of work behind it. Hide every design decision that callers don't need to know.",
    tech: [
      "Depth is the benefit (work hidden) divided by the cost (interface to learn). Unix file I/O, with five calls (open, read, write, lseek, close) hiding disks, caches and file systems, is the classic deep module.",
      "Information hiding: a decision such as a file format or a retry policy lives in exactly one module.",
      "Information leakage: the same decision appears in two modules, so a change to it must be made in both.",
      "Temporal decomposition (splitting code by the order things happen, such as read then parse then write) often leaks the shared format across steps.",
      "Pull complexity downward: it's better for the module's author to handle a hard case once than for every caller to handle it.",
    ],
    cost: "Deep modules take more design thought, and a hidden decision is harder to customise when a caller really does need control. Some flexibility has to be given up.",
    tryIt:
      "Find a class in your API project with a method that only forwards its arguments to another method. Merge or remove it and see whether any caller got harder to read.",
    buildsOn: "Main week 12: Functions",
  },
  "M39:2": {
    why: "Code is read far more often than it is written, so the words in it are the main way the next person (often you) understands it.",
    problem:
      "Vague names (data, temp, handle) and long functions force the reader to reconstruct intent from the details, and comments that repeat the code go stale and mislead.",
    how: "Choose names that say what a thing is or does, keep each function at one level of detail, and use comments for what the code can't say: why.",
    tech: [
      "A good name is precise and consistent: if it's a userId in one place, it isn't a uid or an accountId elsewhere.",
      "Booleans read as questions (isExpired, hasAccess); functions read as actions (sendInvoice).",
      "A function should do one thing at one level of abstraction; extract a block when you can give it a name that explains it.",
      "Length alone isn't the problem: a long, straight sequence can be clearer than 10 tiny functions you have to jump between.",
      "Good comments explain why (a workaround, a business rule, a non-obvious constraint) or describe an interface; bad comments restate the line below.",
    ],
    cost: "Good names take time to find, and renaming across a codebase touches many files. Too many tiny functions can scatter logic as badly as one huge one.",
    tryIt:
      "Take your longest function, extract two blocks into well-named functions, and delete any comment that only repeats what the code now says.",
  },
  "M39:3": {
    why: "A system is easy to change when its parts can change independently. Coupling and cohesion are the two words for how far that's true.",
    problem:
      "When every module knows about every other, a change ripples everywhere, and you can't test, replace or understand any part alone.",
    how: "Keep things that change together in the same module (high cohesion), keep the connections between modules few and explicit (low coupling), and make dependencies flow in one direction.",
    tech: [
      "Cohesion: how strongly the contents of a module belong together, for example everything about billing in one place.",
      "Coupling: how much one module must know about another to work, through shared data, internal details or call order.",
      "Dependencies should point from less stable code (UI, HTTP handlers) toward more stable code (business rules).",
      "A dependency cycle (A uses B, B uses A) means neither can change or be tested alone; break it by moving shared code out or adding an interface.",
      "Tools such as dependency-cruiser (JS/TS) or ArchUnit (Java) can fail the build when a forbidden dependency appears.",
    ],
    cost: "Decoupling usually adds an interface or an extra layer, which is more code to read. Splitting too early guesses the wrong boundaries and creates coupling of a worse kind.",
    tryIt:
      "Run npx madge --circular src in a JS/TS project of yours and fix one cycle it reports.",
    buildsOn: "Main week 39: Deep vs shallow modules",
  },
  "M39:4": {
    why: "Code smells are named patterns that usually signal a design problem. Having names for them makes problems quicker to spot and easier to discuss in review.",
    problem:
      "Without shared vocabulary, 'this feels messy' starts an argument; with it, 'this is feature envy' points straight at the fix.",
    how: "Learn a short list of the most common smells, each with the refactoring that usually fixes it.",
    tech: [
      "Duplicated code: the same logic in several places, so a fix must be made in all of them.",
      "Long function: too much to hold in your head; extract named pieces.",
      "Long parameter list: hard to call correctly; group related values into one object.",
      "Feature envy: a function that uses another object's data more than its own, which usually belongs on that object.",
      "Primitive obsession: plain strings and numbers for domain ideas such as money, email or a user id; a small type catches mistakes.",
      "Shotgun surgery: one change needs small edits in many classes, so the logic should be gathered together.",
    ],
    cost: "A smell is a hint, not a rule: some duplication is cheaper than the wrong abstraction. Chasing every smell wastes time on code that never changes.",
    tryIt:
      "Pick one file from your Phase 4 API and list every smell you can find in it, with the line and the fix you'd make.",
  },
  "M39:5": {
    why: "Design is never right the first time. Refactoring is how code improves as you learn more, without a risky rewrite.",
    problem:
      "Improving structure by rewriting big chunks at once mixes design changes with behaviour changes, so when something breaks you can't tell why.",
    how: "Change structure in tiny steps that each keep behaviour exactly the same, and run the tests after every step.",
    tech: [
      "Extract function and inline function: give a block a name, or remove a function that adds nothing.",
      "Rename: the cheapest and most valuable refactoring; let the IDE update every use.",
      "Introduce parameter object: replace a group of parameters that travel together with one object.",
      "Replace conditional with polymorphism: a switch on a type becomes a method each type implements.",
      "Move function: put a function next to the data it uses most.",
      "Never refactor and change behaviour in the same commit; reviewers and git bisect both depend on that.",
    ],
    cost: "Refactoring needs good tests first; without them it's just editing. It also competes with feature work for time, so it's best done as part of a feature that touches the code.",
    tryIt:
      "In your Phase 4 API, apply three different refactorings from the list, committing after each one with the tests green.",
    buildsOn: "Main week 21: Testing",
  },
  "M39:6": {
    why: "Code coverage tells you which lines ran during the tests, not whether the tests would notice a bug in them.",
    problem:
      "A test suite can reach 100% coverage with tests that check nothing, so a bug slips through even though every line was 'tested'.",
    how: "A mutation testing tool makes small changes (mutants) to your code, one at a time, and runs the tests. If the tests still pass, that mutant 'survived' and shows a gap.",
    tech: [
      "Typical mutants: change > to >=, + to -, true to false, remove a function call, or return an empty value.",
      "Mutation score = killed mutants ÷ all mutants; surviving mutants point at missing assertions.",
      "Stryker runs mutation testing for JavaScript and TypeScript; PIT (pitest) does it for Java.",
      "Some mutants are equivalent (they change nothing observable) and can't be killed; ignore them.",
    ],
    cost: "Mutation testing is slow, since it runs the test suite once per mutant, so it's usually run on changed files or nightly rather than on every commit.",
    tryIt:
      "Run npx stryker init and then npx stryker run on one module of your API, and add a test that kills one surviving mutant.",
    buildsOn: "Main week 21: Testing",
  },
  "M39:7": {
    why: "Teams waste a surprising amount of review time on spacing, quotes and import order. Tools can settle all of that automatically.",
    problem:
      "When style is checked by people, reviews fill up with nitpicks, real problems get less attention, and every file looks a bit different.",
    how: "A formatter rewrites code into one fixed style; a linter flags likely bugs and risky patterns. Both run in the editor, before commit and in CI.",
    tech: [
      "Prettier is an opinionated formatter: it reprints your code from its syntax tree, with very few options to argue about.",
      "ESLint parses code and runs rules such as no-unused-vars or no-floating-promises (with typescript-eslint, which uses type information).",
      "Formatter for layout, linter for correctness; turn off lint rules that only concern layout.",
      "Run them on save in the editor, in a pre-commit hook (husky and lint-staged), and in CI so nothing unformatted merges.",
      "Biome is a newer, faster tool that does both jobs; the idea is the same.",
    ],
    cost: "Adding them to an old codebase creates a huge one-time diff, and overly strict rules generate noise that people learn to ignore or disable.",
    tryIt:
      "Add Prettier and ESLint with typescript-eslint to your API, run both across the whole project, and add a CI step that fails on any error.",
    buildsOn: "Main week 5: Team workflows",
  },

  // ---- Week 40: Debugging, real codebases, open source and code review ----
  "M40:0": {
    why: "Debugging is most of a developer's working day. Doing it methodically is the difference between ten minutes and two days.",
    problem:
      "Random changes ('let me try this') can hide a bug instead of fixing it, and changing several things at once means you never learn which one mattered.",
    how: "Treat a bug like a science experiment: make it happen reliably, guess a cause, design a check that proves or disproves the guess, and narrow the search each time.",
    tech: [
      "Reproduce: find steps that trigger the bug every time; a bug you can't reproduce, you can't confirm you fixed.",
      "Hypothesise: state a specific, testable cause ('the cache returns stale data after an update').",
      "Test the hypothesis: one change or one observation, then check the result.",
      "Narrow down: halve the search space each time (which input, which commit, which function), as in binary search.",
      "Write down what you tried; it stops you going in circles and helps whoever you ask for help.",
      "After the fix, add a test that fails without it.",
    ],
    cost: "Being methodical feels slower for easy bugs, and building a reliable reproduction can take longer than the fix itself, but it pays off on every hard one.",
    tryIt:
      "Next time you hit a bug, keep a short log: reproduction steps, each hypothesis, the test you ran and the result, until it's fixed.",
  },
  "M40:1": {
    why: "Bugs hide in large amounts of code. The less code involved, the easier the cause is to see, and the easier it is for someone else to help.",
    problem:
      "A bug report that says 'my app breaks' with 5,000 lines attached rarely gets fixed; maintainers can't run it and the cause is buried.",
    how: "Remove everything that isn't needed to trigger the bug, step by step, checking after each removal that it still happens, until only the cause is left.",
    tech: [
      "Start from a fresh, empty project with only the library in question, if you can.",
      "Delete code, data, dependencies and configuration in halves, keeping whatever is needed to reproduce.",
      "Hard-code inputs instead of reading them from a database or an API.",
      "A good reproduction fits in one file or a small repo, with exact versions and the expected versus the actual result.",
      "Very often, you find the bug yourself while cutting it down.",
    ],
    cost: "Building a minimal reproduction takes time, and some bugs (timing, load, specific data) disappear when you remove context.",
    tryIt:
      "Take a bug from one of your projects and reduce it to a reproduction under 30 lines that someone else could run.",
  },
  "M40:2": {
    why: "console.log shows you what you thought to print. A debugger lets you stop the program and look at everything.",
    problem:
      "Adding and removing print statements is slow, and you often need a value you didn't log, so you run the program again and again.",
    how: "Run the program under a debugger, pause it at chosen lines, and step through it while inspecting variables and the call stack.",
    tech: [
      "Breakpoint: pause when execution reaches a line. Conditional breakpoint: pause only when an expression is true (for example, id === 42).",
      "Step over runs the current line; step into enters the function it calls; step out finishes the current function.",
      "Watch expressions keep showing a value as you step; the call stack shows how you got here (Main week 13: The runtime).",
      "In VS Code, use a JavaScript Debug Terminal or a launch config to debug Node and Jest; IntelliJ does the same for Java with its Debug button.",
      "Logpoints print a message without editing the code; exception breakpoints pause when an error is thrown.",
    ],
    cost: "Debuggers can change timing, so race conditions may disappear while you watch, and they're hard to attach in production, where logs and traces take over.",
    tryIt:
      "Set a conditional breakpoint in a request handler of your API that fires only for one user id, send that request, and inspect the call stack.",
    buildsOn: "Main week 37: Bugs are normal",
  },
  "M40:3": {
    why: "When something breaks, the program usually tells you where. Stack traces, logs and the git history are the three fastest clues.",
    problem:
      "Beginners skip the error and guess; the answer is often in the first line of the trace or the log line just before the failure.",
    how: "Read the stack trace from the error message down to the first line in your own code, check the logs around that time, and if it used to work, let git bisect find the commit that broke it.",
    tech: [
      "A stack trace lists frames from the innermost call outward; look for the first frame in your code, not in a library.",
      "'Caused by' (Java) or the error's cause property (JS) shows the original error that was wrapped.",
      "Structured logs with a request id let you follow one failing request through the system (Main week 21: Logging and errors).",
      "git bisect start, git bisect bad, git bisect good <commit>, then git marks each midpoint until it names the first bad commit.",
      "git bisect run <test command> automates the whole search.",
    ],
    cost: "Async code and minified bundles produce confusing traces (source maps help), and bisect needs a reliable test and commits that each build.",
    tryIt:
      "Introduce a bug in an old commit of a project, add 20 commits after it, then use git bisect run with a test to find it automatically.",
    buildsOn: "Main week 5: Operations",
  },
  "M40:4": {
    why: "Your first job will drop you into a codebase with hundreds of thousands of lines that you didn't write.",
    problem:
      "Reading a big codebase from the top is hopeless: there's too much of it, and most of it doesn't matter to your task.",
    how: "Start from somewhere concrete, such as the entry point, a route or a test, follow one request all the way through, and draw a map as you go.",
    tech: [
      "Find the entry point: main, the server start, the route table or package.json scripts.",
      "Follow one real request end to end: route, handler, service, database query, response.",
      "Tests show how code is meant to be used, with real inputs and expected outputs.",
      "Use go to definition, find all references and global text search instead of reading files in order.",
      "git log -p and git blame on a file show why code changed and who knows about it.",
      "Keep a short map of folders, key modules and the request path; it becomes your onboarding notes.",
    ],
    cost: "Tracing takes time and you'll go down dead ends. The map gets out of date, and some knowledge only lives in people's heads, so you'll need to ask.",
    tryIt:
      "Clone a medium open-source project, such as Express or a small NestJS app, and draw the path of one HTTP request from the socket to the response.",
  },
  "M40:5": {
    why: "Most companies run important code that has no tests. You'll have to change it without breaking things nobody remembers.",
    problem:
      "To refactor safely you need tests, but to add tests you often need to refactor, because the code is tangled with the database, time and the network.",
    how: "First write characterisation tests that pin down what the code does now, right or wrong. Then find seams, places where you can swap a dependency without editing the code around it, and use them to get the code under test.",
    tech: [
      "Legacy code, in Michael Feathers' definition, is simply code without tests.",
      "Characterisation test: call the code with real inputs and assert whatever it currently returns, even if that looks wrong.",
      "A seam is a place where behaviour can change without editing that spot: a parameter, an interface or a module import.",
      "Common moves: pass the clock or the database in as a parameter, extract a pure function out of a big method, wrap a static call.",
      "Approval (snapshot) tests capture large outputs quickly when writing assertions by hand is impractical.",
    ],
    cost: "Characterisation tests lock in existing bugs until you decide to fix them, and making the first seams means touching untested code carefully.",
    tryIt:
      "Take a function that reads the current time and a database directly, write a characterisation test for it, then pass both in as parameters.",
    buildsOn: "Main week 21: Testing",
  },
  "M40:6": {
    why: "Contributing to open source shows employers real work in a real codebase, reviewed by strangers.",
    problem:
      "Beginners open large, unrequested PRs that ignore project conventions, and they get closed without being merged.",
    how: "Learn how a project organises itself, pick a small issue the maintainers want done, follow their contribution guide, and send a focused PR.",
    tech: [
      "Read README, CONTRIBUTING.md and the code of conduct, and look at recently merged PRs to see what gets accepted.",
      "Labels such as good first issue and help wanted mark work the maintainers want done.",
      "Comment on the issue before starting, so you don't duplicate someone else's work.",
      "Fork, branch, make one focused change with tests, and make CI pass.",
      "A good PR description says what changed, why, how you tested it, and links the issue (Fixes #123).",
      "Docs fixes, failing test reproductions and small bug fixes are all real contributions.",
    ],
    cost: "Reviews can take days or weeks, maintainers may ask for big changes or decline, and large projects take time to set up locally.",
    tryIt:
      "Find a good first issue in a project you've used during this roadmap, comment to claim it, and open a PR.",
    buildsOn: "Main week 5: Team workflows",
  },
  "M40:7": {
    why: "Code review catches bugs, spreads knowledge across the team and keeps the codebase consistent. Junior engineers both give and get reviews from the first week.",
    problem:
      "Reviews that only check style miss real bugs, and harsh or vague comments make people defensive and slow everything down.",
    how: "Review in order of importance, from correctness to design to tests to naming, write specific, kind comments that explain why, and treat comments on your own code as information, not attacks.",
    tech: [
      "Correctness first: edge cases, error handling, concurrency, security.",
      "Design: is it in the right place, is it simpler than it needs to be, does it fit the codebase?",
      "Tests: do they cover the change and would they fail if it broke?",
      "Mark how much each comment matters: blocking, suggestion, or nit (a minor point).",
      "Ask questions rather than give orders ('What happens if the list is empty?').",
      "As the author: keep PRs small, explain the context, reply to every comment and don't take it personally.",
    ],
    cost: "Reviews slow merging, and waiting for review is a common bottleneck. Too many reviewers or nitpicks drive people to make bigger, rarer PRs, which are worse.",
    tryIt:
      "Review a recent PR on an open-source project you use (without posting), writing three comments: one on correctness, one on design and one on tests.",
    buildsOn: "Main week 5: Team workflows",
  },

  // ---- Week 41: Application architecture, then NestJS ----
  "M41:0": {
    why: "Frameworks, databases and delivery methods change every few years; the business rules of an application often outlive them all.",
    problem:
      "When rules like 'a refund can't exceed the payment' are written inside HTTP handlers and SQL, you can't test them alone, reuse them from a queue worker, or change the database without rewriting them.",
    how: "Separate policy (the business rules) from details (HTTP, the database, queues, the UI), and make the details depend on the policy, not the other way round.",
    tech: [
      "Policy: rules and decisions that would still exist if the software were done on paper.",
      "Details: how input arrives and output leaves, how data is stored, which framework is used.",
      "Architecture is mostly about where the boundaries go and which way dependencies cross them.",
      "A good boundary lets you test the core with plain function calls, without a server or a database.",
      "Decisions about details can be delayed: start with an in-memory store and plug in Postgres later.",
    ],
    cost: "Boundaries add interfaces and mapping code, which is overkill for small CRUD apps where the business rules are thin.",
    tryIt:
      "Find one business rule in your Phase 4 API and list every place it's written: handler, service, SQL, client.",
    buildsOn: "Main week 39: Coupling and cohesion",
  },
  "M41:1": {
    why: "Layers are the most common way to organise a backend, and almost every codebase you join will use some version of them.",
    problem:
      "Without layers, HTTP parsing, rules and SQL mix in one function, so nothing can be reused or tested on its own.",
    how: "Split the code into a controller that handles HTTP, a service that holds the business logic, and a repository that talks to the database. Each layer only calls the one below it.",
    tech: [
      "Controller: parses and validates the request, calls a service, maps the result to an HTTP response. No business rules.",
      "Service: the use cases and rules ('place order'), transactions, and calls to other services. No HTTP or SQL details.",
      "Repository: loads and saves data, hiding queries and the ORM. No business decisions.",
      "Data crosses layers as plain objects (DTOs, data transfer objects), not as request objects or raw database rows.",
      "Warning signs: a controller importing the database, or a service reading request headers.",
    ],
    cost: "Simple endpoints become three files of pass-through code, and services can turn into huge 'manager' classes if the domain isn't modelled.",
    tryIt:
      "Restructure one feature of your API into controller, service and repository files, and write a unit test for the service with a fake repository.",
    buildsOn: "Main week 16: Framework internals",
  },
  "M41:2": {
    why: "In plain layering the business logic still depends on the database layer below it. Hexagonal and clean architecture flip that, so the core depends on nothing.",
    problem:
      "If your service imports the Postgres repository directly, you can't test it without a database, and swapping storage means editing the core.",
    how: "The core defines interfaces (ports) for what it needs; adapters on the outside implement them for real technologies. All source-code dependencies point inward, toward the core.",
    tech: [
      "Port: an interface the core owns, such as OrderRepository with save and findById.",
      "Adapter: an implementation of a port for one technology, such as PostgresOrderRepository, or an HTTP controller that calls the core.",
      "Driving adapters (HTTP, CLI, queue consumers) call into the core; driven adapters (database, email, payments) are called by it.",
      "This is the dependency inversion principle: high-level policy and low-level details both depend on an abstraction.",
      "Clean architecture draws the same idea as rings: entities, use cases, interface adapters, frameworks and drivers.",
      "Tests swap real adapters for in-memory fakes, so the core is tested in milliseconds.",
    ],
    cost: "More interfaces and more mapping between core models and database or HTTP models. Teams sometimes create ports with only one implementation forever.",
    tryIt:
      "Define an OrderRepository interface in your core, write an in-memory and a Postgres implementation, and run the same tests against both.",
    buildsOn: "Main week 41: Layered architecture",
  },
  "M41:3": {
    why: "Hexagonal architecture needs the right adapter plugged into each port at runtime. Dependency injection is how that wiring happens.",
    problem:
      "If a class calls new PostgresRepository() itself, it's tied to Postgres, can't be tested with a fake, and every class repeats setup such as connection details.",
    how: "Pass each object its dependencies, usually through the constructor, and build the whole object graph in one place. A DI container can do the building for you.",
    tech: [
      "Constructor injection: class OrderService { constructor(private repo: OrderRepository) {} }.",
      "The composition root is the one place, near main, where real implementations are created and connected.",
      "A DI container (NestJS's injector, Spring in Java) reads declared dependencies and builds objects automatically.",
      "Scopes control lifetime: singleton (one for the app), request-scoped (one per request), or transient (new each time).",
      "In tests, you pass fakes directly; no container needed.",
    ],
    cost: "Containers add magic: wiring errors show up at startup, and it can be hard to see where an object came from. Manual wiring is clearer in small apps.",
    tryIt:
      "Remove every new for a service or repository from your API's business code and wire them all in one file instead.",
  },
  "M41:4": {
    why: "When the business is complex (insurance, logistics, finance) the hard part isn't the technology; it's modelling the business correctly.",
    problem:
      "Code that's just tables and CRUD scatters business rules everywhere and uses different words than the business does, so misunderstandings become bugs.",
    how: "Domain-driven design (DDD) builds the code around a model of the business, in the business's own words, with clear rules about which objects protect which invariants.",
    tech: [
      "Ubiquitous language: the same words in conversations, code and tests ('policy', 'claim', not 'record', 'item').",
      "Entity: has an identity that stays the same as its data changes (a Customer). Value object: defined only by its values and immutable (Money, Address).",
      "Aggregate: a cluster of objects changed together through one root that enforces the rules (an Order and its lines); one transaction per aggregate.",
      "Repository: loads and saves whole aggregates.",
      "Bounded context: a part of the system where a model and its words have one meaning; 'customer' can mean different things in Billing and in Support.",
    ],
    cost: "DDD is heavy for simple apps and needs real access to domain experts. Its vocabulary is easy to adopt on the surface without the modelling work that makes it valuable.",
    tryIt:
      "Model a Money value object (amount and currency, no mixing currencies) and an Order aggregate that refuses to add a line once it's been paid.",
  },
  "M41:5": {
    why: "Microservices get a lot of attention, but most successful systems start as one deployable application. The question is how to keep it from becoming a tangled mess.",
    problem:
      "In a big monolith with no internal boundaries, any code can call any other code and use any table, so it slowly becomes impossible to change.",
    how: "Split the single application into modules along bounded contexts. Each module has a public interface, keeps its internals and its data private, and talks to others only through that interface.",
    tech: [
      "One codebase, one build, one deployment, but folders such as billing, catalog and orders with an index file that exports their public API.",
      "Modules don't import each other's internals or query each other's tables; lint rules or tests enforce it.",
      "Modules can talk through in-process calls or in-process events.",
      "If a module later needs to scale or deploy on its own, its clear boundary makes it much easier to extract into a service.",
      "Shopify and many others run large modular monoliths in production.",
    ],
    cost: "Boundaries need active enforcement or they erode. The whole app still deploys and scales as one, and one module's bug can crash everything.",
    tryIt:
      "Split your API into two modules with explicit public interfaces, and add a dependency-cruiser rule that fails if one imports the other's internals.",
    buildsOn: "Main week 41: Domain-driven design basics",
  },
  "M41:6": {
    why: "Express gives you routing and little else, so every team invents its own structure. NestJS is an opinionated Node framework that builds in modules, DI and layering.",
    problem:
      "Large Express apps drift: validation, auth and error handling are done differently in every route, and wiring is manual.",
    how: "NestJS uses TypeScript decorators to declare modules, controllers and providers, and a DI container to wire them. A fixed request pipeline handles cross-cutting work.",
    tech: [
      "Module (@Module): groups controllers and providers and declares what it imports and exports.",
      "Controller (@Controller, @Get, @Post): maps routes to methods. Provider (@Injectable): a service or repository the container injects.",
      "Request order: middleware → guards → interceptors (before) → pipes → handler → interceptors (after) → exception filters on error.",
      "Pipes validate and transform input (ValidationPipe with class-validator, or a Zod pipe).",
      "Guards decide whether a request may proceed (authentication, roles). Interceptors wrap the handler (logging, timing, caching).",
      "Exception filters turn thrown errors into consistent HTTP responses.",
    ],
    cost: "More concepts and decorator magic than Express, slower startup, and its class-heavy style can feel like Java. Errors in wiring can be cryptic.",
    tryIt:
      "Port one resource of your Phase 4 API to NestJS with a module, controller, service, a validation pipe and an auth guard.",
    buildsOn: "Main week 16: Framework internals",
  },
  "M41:7": {
    why: "TypeScript only protects you as much as you let it. Loose settings and unchecked data from outside quietly remove its guarantees.",
    problem:
      "With strict mode off, any spreads silently and null crashes return. And types say nothing about JSON from a request or an API, which can be anything at runtime.",
    how: "Turn on strict checking everywhere and validate every piece of outside data once, at the boundary, so everything inside can trust its types.",
    tech: [
      "strict: true enables noImplicitAny, strictNullChecks and other checks; add noUncheckedIndexedAccess so array[i] may be undefined.",
      "Ban explicit any with a lint rule; use unknown and narrow it.",
      "Edges are request bodies, query strings, environment variables, API responses, database rows and message payloads.",
      "Zod (Main week 16: Input validation and schemas) parses data and returns a typed value or an error: const body = Schema.parse(req.body).",
      "z.infer<typeof Schema> derives the TypeScript type from the schema, so the two never drift apart.",
    ],
    cost: "Turning on strict mode in an existing codebase can mean hundreds of errors to fix, and validating at every edge adds a small runtime cost.",
    tryIt:
      "Turn on strict and noUncheckedIndexedAccess in your API, fix the errors, and validate process.env with a Zod schema at startup.",
    buildsOn: "Main week 14: TypeScript",
  },

  // ---- Week 42: Working on a team ----
  "M42:0": {
    why: "Software is built by teams, and teams need a shared rhythm for deciding what to do next and checking how it's going.",
    problem:
      "Without a process, work is invisible, priorities change every day, and problems surface only when a deadline is missed.",
    how: "Scrum works in fixed time boxes (sprints); Kanban works as a continuous flow with limits on work in progress. Most teams mix pieces of both.",
    tech: [
      "Sprint: usually 1 or 2 weeks, starting with planning and ending with a review of what shipped and a retrospective.",
      "Stand-up: a short daily check on progress and blockers, not a status report to a manager.",
      "Retrospective: what went well, what didn't, and one or two changes to try next time.",
      "Kanban board: columns such as To do, In progress, In review, Done, with a work-in-progress (WIP) limit per column.",
      "Teams adapt: many keep stand-ups and retros but drop formal sprints; what matters is visible work and regular reflection.",
    ],
    cost: "Ceremonies take time and can become empty rituals. Heavy process slows small teams, and no process leaves big teams confused.",
    tryIt:
      "Set up a Kanban board (GitHub Projects works) for your capstone ideas with a WIP limit of 2 in progress, and use it for a week.",
  },
  "M42:1": {
    why: "Big pieces of work are hard to estimate, hard to review and risky to ship. Splitting them well is a core engineering skill.",
    problem:
      "Splitting by layer (all the database work, then the API, then the UI) means nothing works until everything is done, and problems appear at the end.",
    how: "Break an epic into stories, each a thin vertical slice that delivers something usable through every layer, and break stories into tasks.",
    tech: [
      "Epic: a large goal (users can pay by card). Story: a user-visible slice (a user can save one card). Task: a technical step (add the cards table).",
      "A vertical slice touches UI, API and database for a small piece of behaviour, so it can be demoed and shipped.",
      "A useful story is small enough to finish in a few days and has clear acceptance criteria.",
      "Split by workflow step, by business rule, by data variation, or by doing the simple case first.",
      "Spikes are time-boxed investigations for when you don't know enough to split yet.",
    ],
    cost: "Slicing takes planning time, and early slices can feel too small to matter. Some work, such as a migration, genuinely resists slicing.",
    tryIt:
      "Take your capstone idea and write it as one epic with 5 vertical-slice stories, each with acceptance criteria.",
  },
  "M42:2": {
    why: "Others plan around your estimates: releases, marketing and other teams' work. Honest estimates make you trustworthy.",
    problem:
      "Single-number estimates are almost always wrong, and pressure to give one leads to promises that slip.",
    how: "Estimate relative size rather than hours, give ranges with your confidence, and when you can't estimate, say what you'd need to find out and how long that will take.",
    tech: [
      "Relative sizing: compare tasks to each other (story points, T-shirt sizes) rather than guessing hours.",
      "A range such as '3 to 6 days, likely 4' carries more truth than '4 days'.",
      "The cone of uncertainty: estimates get more accurate as you learn, so revisit them.",
      "Unknowns drive error: new technology, unclear requirements and external dependencies widen the range.",
      "'I don't know yet; give me a day to spike it and I'll have a range' is a professional answer.",
    ],
    cost: "Estimation itself takes time, and numbers are often treated as promises regardless. Some teams drop estimates and just measure throughput.",
    tryIt:
      "For your next five tasks, write a range estimate before starting and record the actual time; compare after a week.",
  },
  "M42:3": {
    why: "Most of an engineer's influence travels through writing: PRs, commits, bug reports and design docs reach more people than meetings do.",
    problem:
      "Vague commits ('fix stuff'), empty PR descriptions and bug reports without steps waste everyone's time and lose the history of why things changed.",
    how: "Use simple, standard structures for each kind of writing, and lead with what the reader needs to know or decide.",
    tech: [
      "Commit message: a short imperative subject ('Add retry to payment client') and a body explaining why.",
      "PR description: what changed, why, how it was tested, risks, and screenshots for UI changes.",
      "Bug report: steps to reproduce, expected result, actual result, environment and versions, logs.",
      "Design doc or RFC (request for comments): context, goals and non-goals, proposed design, alternatives considered, risks; shared before building.",
      "Write for a reader who lacks your context; shorter is kinder.",
    ],
    cost: "Writing well takes time and practice, and design docs can become bureaucracy if they're required for small changes.",
    tryIt:
      "Write a one-page design doc for a feature of your capstone, with at least two alternatives and why you rejected them.",
  },
  "M42:4": {
    why: "Teams are spread across time zones and calendars. Asynchronous communication, which doesn't need everyone present at once, keeps work moving.",
    problem:
      "Questions like 'it doesn't work, any ideas?' trigger a slow back-and-forth, and decisions made in calls are lost to anyone who wasn't there.",
    how: "Write messages that can be acted on without a follow-up: context, what you tried, what you expected, and what you need. Write decisions down where people will find them.",
    tech: [
      "A good question: the goal, what you tried, what happened versus what you expected, the error text, and the specific ask.",
      "A status update: what's done, what's next, what's blocked, and any change in dates.",
      "Default to public channels over private messages, so others learn and can help.",
      "Documentation: a README for setup, ADRs (architecture decision records) for why a choice was made, runbooks for operations.",
      "Know when to switch to a call: if a thread passes three rounds without progress.",
    ],
    cost: "Async is slower for urgent or emotional topics, and writing everything down takes discipline.",
    tryIt:
      "Rewrite the last question you asked someone in the format above, and compare it with what you actually sent.",
  },
  "M42:5": {
    why: "How a team uses branches decides how often code is integrated, and therefore how big and painful merges get.",
    problem:
      "Long-lived feature branches drift from main for weeks, and merging them causes conflicts and surprise breakages right before a release.",
    how: "In trunk-based development, everyone merges small changes into main at least daily. Unfinished features are hidden behind flags, and protected branches keep main always deployable.",
    tech: [
      "Short-lived branches (hours to a couple of days) with clear names such as feat/card-payments or fix/login-redirect.",
      "Protected branches: main requires a PR, passing CI and an approving review; nobody pushes directly.",
      "Feature flags turn code paths on or off at runtime, per user or per percentage, so merging isn't the same as releasing.",
      "Release trains ship whatever is in main on a fixed schedule; features that aren't ready stay behind their flag.",
      "Remove a flag once its feature is fully launched.",
    ],
    cost: "Flags add branches in code and need cleanup or they pile up as debt. Trunk-based work needs strong CI and good tests to be safe.",
    tryIt:
      "Add a simple feature flag (an environment variable or a config row) to your API, merge an unfinished endpoint behind it, and protect your main branch on GitHub.",
    buildsOn: "Main week 5: Team workflows",
  },
  "M42:6": {
    why: "Production systems break at 3 a.m. On-call is how teams make sure someone responds quickly, and postmortems are how they stop the same failure happening again.",
    problem:
      "Without clear alerts and procedures, incidents depend on one hero who knows the system, and blaming people makes everyone hide mistakes.",
    how: "Alert only on symptoms users feel, give each alert a runbook, define who to escalate to, and after every incident write a blameless postmortem focused on the system.",
    tech: [
      "Good alerts are actionable and urgent: 'error rate above 2% for 5 minutes', not 'CPU at 80%'.",
      "A runbook lists, for one alert, what it means, how to check, and the steps to mitigate.",
      "Escalation: primary on-call, then secondary, then the owning team or a manager, with time limits.",
      "Mitigate first (roll back, turn off a flag), find the root cause later.",
      "Blameless postmortem: timeline, impact, contributing causes, what went well, and action items with owners. Ask 'how did the system allow this?', not 'who did this?'.",
    ],
    cost: "On-call is tiring and noisy alerts burn people out. Postmortems take time, and their action items often get dropped unless tracked.",
    tryIt:
      "Write a runbook for 'API error rate is high' for your Phase 4 API, and a short blameless postmortem for a real bug you've had.",
  },
};
