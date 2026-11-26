import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's backend phase (original weeks 15-21, plus design kata 1, M38). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_BACKEND: ExplainMap = {
  // ---- Week 15: Node.js internals ----
  "M15:0": {
    why: "JavaScript was born inside browsers. In 2009, Node.js took Chrome's JavaScript engine out of the browser so the same language could run servers and command-line tools.",
    problem:
      "V8 by itself can only run JavaScript code: it has no way to open files, listen on a port or start a process. A server needs all of those.",
    how: "Wrap V8 with libuv, a C library that talks to the operating system for files, networking and timers, connect them with C++ bindings, and offer it all as JavaScript modules such as fs, net and http.",
    tech: [
      "V8 compiles and runs your JavaScript (Main week 13: V8 at a high level).",
      "libuv provides the event loop and does the slow work: it uses epoll or kqueue for network I/O (Main week 3: I/O models) and a thread pool for work the OS can't do asynchronously.",
      "C++ bindings connect JavaScript calls such as fs.readFile to libuv and the operating system.",
      "The standard library (fs, net, http, crypto, stream, events) is mostly written in JavaScript on top of the bindings.",
      "There is no DOM, window or document in Node; there are process, Buffer and the file system instead.",
    ],
    cost: "Node inherits JavaScript's single thread, so CPU-heavy work is a poor fit. Its huge npm ecosystem is a strength and also a supply-chain risk.",
    tryIt:
      'Run node -p "process.versions" to see the versions of V8, libuv and the other libraries inside your Node.',
    buildsOn: "Main week 13: V8 at a high level",
  },
  "M15:1": {
    why: "Node runs your callbacks on one thread. The event loop decides what runs next once the current code finishes, and its order explains many surprising outputs.",
    problem:
      "Without knowing the loop's phases, you can't predict whether a setTimeout, a setImmediate, a promise or a nextTick runs first, and code that depends on that order breaks unpredictably.",
    how: "libuv's loop cycles through fixed phases, each with its own queue of callbacks. Between callbacks, Node drains two special queues first: process.nextTick, then promise microtasks.",
    tech: [
      "timers: runs expired setTimeout and setInterval callbacks.",
      "pending callbacks: some deferred system callbacks, such as certain TCP errors.",
      "poll: waits for new I/O events and runs their callbacks (most of your server's work happens here).",
      "check: runs setImmediate callbacks, right after poll.",
      'close callbacks: runs handlers such as socket.on("close").',
      "After each callback, Node runs all process.nextTick callbacks, then all promise microtasks, before moving on.",
    ],
    cost: "A recursive nextTick or promise chain can starve the loop so no I/O is ever processed. Relying on the exact order between timers and setImmediate is fragile outside an I/O callback.",
    tryIt:
      "Run node -e \"setTimeout(()=>console.log('timeout'));setImmediate(()=>console.log('immediate'));Promise.resolve().then(()=>console.log('promise'));process.nextTick(()=>console.log('tick'))\" and explain the order.",
    buildsOn: "Main week 13: The runtime",
  },
  "M15:2": {
    why: "Operating systems can watch network sockets without blocking, but some tasks, such as most file system calls and DNS lookups, have no good non-blocking version everywhere.",
    problem:
      "If Node did those blocking calls on its one JavaScript thread, every request would freeze while one file was read or one password was hashed.",
    how: "libuv keeps a small pool of background threads. Blocking work is handed to the pool, and the result comes back to the event loop as a callback.",
    tech: [
      "The pool has 4 threads by default; UV_THREADPOOL_SIZE changes it (up to 1024), and it must be set before the pool is first used.",
      "Work that goes to the pool: most fs functions, dns.lookup (used by http.get), crypto functions such as pbkdf2 and scrypt, and zlib compression.",
      "Network sockets don't use the pool; they use epoll or kqueue directly.",
      "So 5 slow password hashes at once on a 4-thread pool means the 5th waits, and so does any file read queued behind it.",
    ],
    cost: "A busy pool causes mysterious slowdowns in unrelated file or DNS operations. Making the pool bigger uses more memory and doesn't help CPU-bound work beyond the number of cores.",
    tryIt:
      "Call crypto.pbkdf2 with 100,000 iterations 8 times at once, log when each finishes, then rerun with UV_THREADPOOL_SIZE=8 and compare.",
    buildsOn: "Main week 2: Threads",
  },
  "M15:3": {
    why: "Most server work is waiting: for the database, another API or the disk. Node's design lets one thread handle thousands of connections by never waiting itself.",
    problem:
      "A thread-per-connection server needs memory for every thread and slows down with context switches. But in Node, one slow calculation stops every connection, not just one.",
    how: "Start I/O, register a callback, and move on immediately. Keep JavaScript work per request short, and move heavy computation off the main thread.",
    tech: [
      "While a request waits for the database, the thread runs other requests' callbacks, so 10,000 open connections cost little more than their sockets.",
      "A CPU-heavy loop (parsing a 50 MB JSON, a synchronous hash, a bad regex) blocks the thread, so every other request waits until it ends.",
      "Synchronous APIs (fs.readFileSync, crypto.pbkdf2Sync) block too; use them only at startup.",
      "Measure blocking with event loop delay (perf_hooks.monitorEventLoopDelay).",
      "Fixes: split the work into chunks, use a worker thread (Main week 15: Scaling), or move it to a background job.",
    ],
    cost: "Callback-based concurrency is cheap but unforgiving: one mistake in one route degrades the whole server. Languages with many threads (Java, Go) are more forgiving of CPU-heavy work.",
    tryIt:
      "Add a route that busy-loops for 5 seconds to a tiny HTTP server, call it, and at the same time curl another route and time how long it takes.",
    buildsOn: "Main week 3: I/O models",
  },
  "M15:4": {
    why: "Data is often too big to hold in memory at once: a 2 GB video upload, a huge log file, a database export. It has to be processed piece by piece as it flows.",
    problem:
      "Reading a 2 GB file into memory before sending it can crash the server, and a fast producer feeding a slow consumer piles up data in memory until it runs out.",
    how: "Streams move data in chunks. Backpressure lets the consumer tell the producer to pause when it can't keep up, so memory stays flat.",
    tech: [
      "Readable streams produce data (fs.createReadStream, an incoming HTTP request); writable streams consume it (fs.createWriteStream, an HTTP response).",
      "Duplex streams do both independently (a TCP socket); transform streams change data as it passes (gzip compression).",
      "Backpressure: writable.write() returns false when its buffer is full; the producer should pause until the drain event.",
      "pipeline(source, transform, destination, callback) connects streams, handles backpressure and cleans up all of them on error. Prefer it over .pipe(), which doesn't forward errors.",
      "Streams are also async iterables: for await (const chunk of stream) { }.",
    ],
    cost: "Stream code is harder to write and debug than reading everything into memory. For small payloads, the simpler approach is fine.",
    tryIt:
      "Serve a 1 GB file with fs.readFile and then with fs.createReadStream piped into the response, and watch the process memory in top for each.",
    buildsOn: "Main week 3: Files and file systems",
  },
  "M15:5": {
    why: "Servers deal in raw bytes: network packets, images, files, encrypted data. JavaScript strings are for text, so Node needed a type for binary data.",
    problem:
      "Treating binary data as text corrupts it, and decoding text with the wrong encoding produces garbled characters.",
    how: "A Buffer is a fixed-size chunk of raw bytes. Convert between Buffers and strings explicitly, naming the encoding.",
    tech: [
      "Buffer is a subclass of Uint8Array: a list of numbers from 0 to 255.",
      'Buffer.from("héllo", "utf8") encodes a string to bytes; buf.toString("utf8") decodes them. Other encodings: base64, hex, latin1.',
      "UTF-8 uses 1 to 4 bytes per character (Main week 1: Information as bits), so a multibyte character can be split across two chunks. StringDecoder handles that safely.",
      "Buffer memory is allocated outside the V8 heap.",
      "Buffer.alloc(n) gives zero-filled memory; Buffer.allocUnsafe(n) is faster but may contain old data.",
    ],
    cost: "Converting between strings and buffers costs time and memory on hot paths. allocUnsafe can leak old memory contents if you send it before filling it.",
    tryIt:
      "Run node -p \"Buffer.from('héllo')\" and node -p \"Buffer.from('héllo').length\", then decode the same bytes as latin1 and see the garbage.",
    buildsOn: "Main week 1: Information as bits",
  },
  "M15:6": {
    why: "Many things in a server happen over time: data arrives, a connection closes, an error occurs. Node needed a common way for objects to announce events.",
    problem:
      "Without a shared pattern, every class would invent its own callback registration, and listeners couldn't be added or removed consistently.",
    how: "EventEmitter lets an object emit named events and any number of listeners subscribe to them. Streams, servers and sockets are all EventEmitters.",
    tech: [
      'emitter.on("data", fn) subscribes; emitter.once runs only the first time; emitter.off removes a listener; emitter.emit("data", x) calls every listener in order.',
      "Listeners run synchronously, inside emit, in the order they were added.",
      'An "error" event with no listener throws and crashes the process, so always listen for errors.',
      "Node warns when more than 10 listeners are added to one event, which usually means a leak.",
      'events.once(emitter, "ready") returns a promise, which works with await.',
    ],
    cost: "Events make control flow implicit: it's hard to see who reacts to what. Forgotten listeners hold memory and fire unexpectedly.",
    tryIt:
      'Create an EventEmitter, emit "error" with no listener and read the crash, then add a listener and emit again.',
    buildsOn: "Java week 6: First design patterns",
  },
  "M15:7": {
    why: "Real programs are split across files and depend on thousands of packages. Node has to find the right file for every require or import.",
    problem:
      "When two packages need different versions of the same library, or a file can't be found, programs break with confusing errors. Node also has two module systems that don't mix freely.",
    how: 'Node follows a fixed lookup algorithm: relative paths resolve from the current file, and bare names such as "express" are searched for in node_modules folders up the directory tree. package.json says which module system a package uses and what it exposes.',
    tech: [
      'require("./util") tries util.js, util.json, then util/index.js. require("express") looks in ./node_modules, then ../node_modules, and so on up to the root.',
      "CommonJS modules are cached after the first load; requiring them again returns the same object.",
      '"type": "module" in package.json makes .js files ES modules (Main week 13); .mjs and .cjs force one or the other.',
      'The "exports" field defines a package\'s public entry points, and blocks access to anything else inside the package.',
      "Duplicate packages in different node_modules folders can mean two copies of a library loaded at once.",
    ],
    cost: "The ESM and CommonJS split causes real friction: require() of ESM only became possible recently, and many libraries ship both formats. Deep node_modules trees take space and install time.",
    tryIt:
      "Run node -p \"require.resolve('express')\" in a project that uses it, then run npm ls express to see which versions are installed where.",
    buildsOn: "Main week 13: Error handling",
  },
  "M15:8": {
    why: "A server runs as an operating system process (Main week 2). It needs configuration, a way to report success or failure, and a way to stop cleanly when told to.",
    problem:
      "A server killed mid-request drops users' requests and can leave half-written data. Configuration hard-coded in the source can't change between laptop and production.",
    how: "Read configuration from environment variables, exit with a meaningful code, and handle shutdown signals by finishing in-flight work before exiting.",
    tech: [
      "process.env holds environment variables (Main week 4: Shell fundamentals); process.argv holds command-line arguments.",
      "process.exitCode = 1 marks failure; exit code 0 means success to shells, CI and container orchestrators.",
      "Signals (Main week 3: Inter-process communication): SIGINT is Ctrl+C; SIGTERM is the polite stop request that Docker and Kubernetes send; SIGKILL can't be caught.",
      "Graceful shutdown on SIGTERM: stop accepting new connections (server.close()), finish in-flight requests, close database pools, then exit, with a timeout as a safety net.",
      'process.on("uncaughtException") is a last-chance log-and-exit hook, not a way to keep running.',
    ],
    cost: "Shutdown logic adds code and must be tested. Without a timeout, one stuck request can stop the process from ever exiting.",
    tryIt:
      "Write a server that logs on SIGTERM and waits 2 seconds before exiting, run it, then send kill -TERM <pid> from another terminal.",
    buildsOn: "Main week 4: Processes from the shell",
  },
  "M15:9": {
    why: "A single Node process uses one CPU core for JavaScript. Machines have many cores, and some work is too heavy for the event loop.",
    problem:
      "A Node server on an 8-core machine leaves 7 cores idle, and a CPU-heavy task inside a request blocks everyone else.",
    how: "Run several copies of the server (cluster), run heavy computation on worker threads, or start separate programs as child processes.",
    tech: [
      "cluster forks several Node processes that share one listening port; the primary process distributes incoming connections.",
      "In production, running one process per core under a process manager, or several containers behind a load balancer (Main week 27), does the same job.",
      "worker_threads runs JavaScript on extra threads in the same process, communicating by messages, like Web Workers (Main week 14).",
      "child_process.spawn and exec start other programs (ffmpeg, a Python script) and stream their output.",
      "Processes don't share memory, so shared state (sessions, caches) must live in Redis or the database.",
    ],
    cost: "More processes mean more memory, and in-memory state no longer works across them. Worker threads add message-passing complexity.",
    tryIt:
      "Run a CPU-heavy route behind cluster with 1 worker and then with os.availableParallelism() workers, and load test both with autocannon.",
    buildsOn: "Main week 15: Non-blocking I/O",
  },
  "M15:10": {
    why: "Modern projects depend on hundreds of packages, each with its own dependencies. A package manager installs them, tracks versions and keeps installs reproducible.",
    problem:
      "Without exact versions, a dependency's new release can break your app overnight even though you changed nothing, and two developers can get different code from the same project.",
    how: "Declare allowed version ranges in package.json using semantic versioning, and let a lockfile record the exact versions actually installed, so every install is identical.",
    tech: [
      "Semver: MAJOR.MINOR.PATCH. Major breaks compatibility, minor adds features, patch fixes bugs.",
      "^1.2.3 allows any 1.x.x at or above 1.2.3; ~1.2.3 allows only 1.2.x.",
      "package-lock.json pins the exact version and integrity hash of every installed package. Commit it, and use npm ci in CI to install exactly what it lists.",
      "dependencies are needed at runtime; devDependencies only for building and testing.",
      "npx runs a package's command without installing it globally; npm audit reports known vulnerabilities.",
    ],
    cost: "Every dependency is code you trust without reading, and its own dependencies too. Malicious or hijacked packages are a real attack route (Main week 32).",
    tryIt:
      "Run npm ls --all | wc -l in a project to count its installed packages, then npm view express versions to see its release history.",
    buildsOn: "Main week 15: The module system",
  },

  // ---- Week 16: Building HTTP APIs ----
  "M16:0": {
    why: "Every Node web framework, from Express to NestJS, is built on the http module. Knowing it shows you what frameworks actually do for you.",
    problem:
      "Without understanding the raw layer, framework behaviour looks like magic, and bugs such as a request that never ends or a body read twice are hard to diagnose.",
    how: "http.createServer gives you a callback with two objects for every request: a readable stream for the request and a writable stream for the response.",
    tech: [
      "req has method, url and headers; its body arrives as a stream of chunks you must collect yourself.",
      "res.statusCode and res.setHeader set the response; res.write sends body chunks; res.end finishes. Forgetting res.end leaves the client waiting.",
      "Headers must be set before the first body bytes are sent.",
      "Bodies can be streamed both ways (Main week 15: Streams), for example piping a file into res.",
      "Node handles keep-alive and chunked encoding for you (Main week 7: Connection management).",
    ],
    cost: "The raw API is verbose: routing, body parsing and error handling all have to be written by hand, which is why frameworks exist.",
    tryIt:
      "Write a 10-line http server that echoes the method, URL and headers back as JSON, and call it with curl -X POST -d hi.",
    buildsOn: "Main week 7: HTTP/1.1 message anatomy",
  },
  "M16:1": {
    why: "Every API needs the same plumbing: matching URLs to handlers, reading bodies, checking auth and handling errors. Frameworks package it so each route contains only its own logic.",
    problem:
      "Without a framework, every handler repeats the same code to parse JSON, check the user and catch errors, and one forgotten check is a security hole.",
    how: "A router matches the method and path to a handler. A middleware chain runs shared steps in order before the handler, each deciding whether to pass control on by calling next().",
    tech: [
      'Routing turns patterns such as /users/:id into matchers, extracts params ({ id: "42" }), and picks the first route that matches.',
      "Middleware is a function (req, res, next); each can read or change req, end the response, or call next() to continue. Logging, auth and body parsing are all middleware.",
      "The chain is an array of functions; next() calls the next one, so order matters: put auth before the routes it protects.",
      "Error middleware (err, req, res, next) runs when anything calls next(err) or throws, giving one place to turn errors into responses.",
      "Body parsing middleware reads the request stream and sets req.body.",
    ],
    cost: "Middleware order is a common source of bugs, and global middleware runs on every request, adding latency. Implicit req mutation makes data flow hard to follow.",
    tryIt:
      "Add three middlewares that each log a line and call next(), then remove one next() call and see the request hang.",
    buildsOn: "Main week 16: Node's http module",
  },
  "M16:2": {
    why: "Many different clients (web, mobile, other teams) use the same API for years. A consistent, predictable design makes it easy to use correctly and safe to change.",
    problem:
      "Inconsistent APIs (verbs in URLs, 200 for errors, different error shapes per endpoint, unbounded lists) confuse clients, break caching and retries, and are hard to change without breaking someone.",
    how: "Model the API as resources at stable URLs, use HTTP methods and status codes for what they mean, page through large lists, and return errors in one standard format.",
    tech: [
      "Resources are nouns: GET /users/42/orders, not /getOrdersForUser. Methods carry the verbs (Main week 7: Methods).",
      "Status codes carry the outcome: 201 with a Location header on create, 404 when missing, 422 for invalid data (Main week 7: Status codes).",
      "Filtering and sorting through query parameters: ?status=open&sort=-created_at.",
      "Offset pagination (?page=3) is simple but slow and inconsistent on big or changing tables; cursor pagination (?after=<last id>) is stable and fast.",
      "Errors use one format, such as RFC 9457 Problem Details: { type, title, status, detail }.",
      "Versioning (/v2/ or a header) lets you make breaking changes without breaking old clients.",
    ],
    cost: "Strict REST can need many round trips for one screen, which is where GraphQL or BFF endpoints help (Main week 16: Alternatives). Every version you keep is code you maintain.",
    tryIt:
      "Explore the GitHub REST API with curl: list a repo's issues with ?per_page=5, then follow the Link header to the next page.",
    buildsOn: "Main week 7: Status codes",
  },
  "M16:3": {
    why: "Networks fail in the middle of requests. A client often can't tell whether its request reached the server before the connection dropped, so it retries.",
    problem:
      "Retrying a POST that actually succeeded creates a duplicate: two orders, two payments, two emails.",
    how: "Make retries harmless. The client sends a unique idempotency key with the request; the server remembers the key and the result, and returns the stored result for any repeat.",
    tech: [
      "Idempotent means doing it twice has the same effect as doing it once. GET, PUT and DELETE are idempotent by definition; POST isn't (Main week 7: Methods).",
      "The client generates a key (a UUID) per logical operation and sends it as an Idempotency-Key header, reusing it on retries.",
      "The server stores the key with the response, in the same database transaction as the work if possible. A repeat returns the stored response; a repeat while the first is still running gets 409.",
      "Keys expire after a window (often 24 hours).",
      "Stripe's API is the well-known example.",
    ],
    cost: "Storing keys and responses costs storage and adds a lookup to each request. Getting the edge cases right (concurrent duplicates, a crash between doing the work and saving the key) takes care.",
    tryIt:
      "Add an Idempotency-Key check to your create endpoint, then send the same POST twice with curl and confirm only one row exists.",
    buildsOn: "Main week 16: REST design",
  },
  "M16:4": {
    why: "Every request comes from outside your control: browsers, scripts, attackers. Anything can be in the body.",
    problem:
      "Unchecked input causes crashes (undefined where an object was expected), corrupt data and security holes, and errors appear deep in the code, far from the bad input.",
    how: "Validate every input at the edge of the system against a schema that describes exactly what's allowed. Reject anything else with a clear 400 or 422 before it reaches your logic.",
    tech: [
      "A schema describes the expected shape: types, required fields, lengths, formats and ranges.",
      "Zod (TypeScript) defines schemas in code: z.object({ email: z.string().email(), age: z.number().int().min(0) }). schema.parse(body) returns typed data or throws with the reasons.",
      "Zod also gives you the TypeScript type for free (z.infer), so the check and the type can't drift apart (Main week 14: TypeScript).",
      "JSON Schema is a language-neutral standard for the same thing, used by OpenAPI.",
      "Validate path params and query strings too, and strip unknown fields so clients can't set fields such as isAdmin.",
    ],
    cost: "Schemas are extra code to maintain, and over-strict validation can reject legitimate data. Validation at the edge doesn't replace database constraints, which protect against your own bugs.",
    tryIt:
      "Send your API a body with a missing field, a wrong type and an extra isAdmin: true, before and after adding a Zod schema.",
    buildsOn: "Main week 14: TypeScript",
  },
  "M16:5": {
    why: "Other people need to call your API without reading your code. Documentation that's written separately falls out of date almost immediately.",
    problem:
      "Without a precise, machine-readable description, client developers guess at fields, and every change risks breaking them without anyone noticing.",
    how: "Describe the API in OpenAPI, a standard YAML or JSON format, generate it from the code or the code from it, and let tools produce interactive docs, client libraries and tests.",
    tech: [
      "An OpenAPI document lists paths, methods, parameters, request and response schemas (in JSON Schema), status codes and auth methods.",
      "Swagger UI and Redoc render it as interactive docs where you can try requests.",
      "Code-first: generate the spec from your route definitions and Zod schemas. Spec-first: write the spec, then generate types and stubs.",
      "Generators create typed client libraries in many languages from the same spec.",
      "Checking the spec in CI catches breaking changes, such as a removed field, before they ship.",
    ],
    cost: "A spec that isn't generated or tested drifts from the real API and misleads people. Keeping it accurate needs tooling and discipline.",
    tryIt:
      "Open the Swagger Petstore demo (petstore.swagger.io), read the spec, and try a request from the browser.",
    buildsOn: "Main week 16: REST design",
  },
  "M16:6": {
    why: "REST over HTTP fits most APIs, but not all: some clients need flexible queries, some services need speed, and some data needs to be pushed rather than requested.",
    problem:
      "Forcing everything into REST means mobile apps making 10 requests per screen, services wasting bandwidth on JSON, and clients polling every second for updates.",
    how: "Pick the style that fits the communication pattern: GraphQL for flexible queries, gRPC for fast service-to-service calls, WebSockets or SSE for live updates, webhooks for notifying other systems.",
    tech: [
      "GraphQL: one endpoint and a typed schema; the client asks for exactly the fields it needs, avoiding over- and under-fetching. Each field has a resolver, and naive resolvers cause N+1 database queries (fix with batching, the DataLoader pattern).",
      "gRPC: methods defined in Protocol Buffers (a compact binary format), carried over HTTP/2 (Main week 7), with generated clients and streaming in both directions. Common between internal services.",
      "WebSockets: a long-lived two-way connection, upgraded from HTTP, for chat and collaboration.",
      "Server-Sent Events (SSE): a one-way stream from server to browser over plain HTTP, simple for live feeds and LLM token streaming.",
      "Webhooks: your server calls someone else's URL when something happens (payment succeeded), which they must verify with a signature.",
    ],
    cost: "GraphQL makes caching and rate limiting harder; gRPC isn't readable by humans or browsers without help; long-lived connections complicate scaling and load balancing.",
    tryIt:
      "Run a query in GitHub's GraphQL Explorer asking for only a repo's name and star count, and compare its size with the REST response for the same repo.",
    buildsOn: "Main week 16: REST design",
  },
  "M16:7": {
    why: "The same code runs on your laptop, in CI and in production, with different databases, keys and settings. Secrets such as passwords must never be in the code.",
    problem:
      "Hard-coded settings mean editing code per environment, and committed secrets leak to everyone who can read the repo, forever, even after deletion (Main week 5).",
    how: "Keep configuration in environment variables, read and validate it once at startup, and keep secrets out of git. The Twelve-Factor App describes this and other habits for deployable services.",
    tech: [
      "Read config from process.env at startup, validate it with a schema, and fail fast if anything is missing.",
      ".env files are for local development only and belong in .gitignore; commit a .env.example with dummy values instead.",
      "Twelve-factor highlights: one codebase with many deploys; config in the environment; backing services (databases, queues) as attached resources; stateless processes; logs written to stdout.",
      "In production, secrets come from a secrets manager (Main week 32) and are injected as environment variables or files.",
      "Leaked secrets must be rotated (replaced), not just deleted from the repo.",
    ],
    cost: "Environment variables are visible to the whole process and can end up in logs or crash reports. Many settings across many environments need tooling to manage.",
    tryIt:
      "Run git log -p | grep -iE 'password|secret|api_key' in one of your repos to check whether anything leaked.",
    buildsOn: "Main week 15: process",
  },

  // ---- Week 17: Authentication and web security ----
  "M17:0": {
    why: "Apps hold private data and allow powerful actions. They need to know who is making each request, and what that person is allowed to do.",
    problem:
      "Mixing the two questions causes the most common security bug on the web: checking that someone is logged in, but not that they're allowed to see this particular order.",
    how: "Authentication (authn) proves identity: who are you? Authorization (authz) decides permission: may you do this to this resource? Every request needs both.",
    tech: [
      "Authentication methods: password, one-time code, passkey, or a login with another provider (OAuth, OIDC).",
      "The result of authentication is usually a session or a token that identifies the user on later requests.",
      "Authorization runs on every request, on the server, for the specific resource: is user 7 allowed to read order 42?",
      "HTTP has separate codes: 401 means not authenticated, 403 means authenticated but not allowed (Main week 7: Status codes).",
      "Broken access control (missing authorization checks) is number one on the OWASP Top 10.",
    ],
    cost: "Checks on every request add code and latency, and missing one is a vulnerability. Centralising authorization logic makes it easier to get right.",
    tryIt:
      "In your API, log in as user A, then request user B's resource by changing the ID in the URL, and see whether your code stops it.",
  },
  "M17:1": {
    why: "Servers must check passwords without being able to reveal them. Databases get stolen, and people reuse passwords across sites.",
    problem:
      "Passwords stored in plain text or encrypted (and so reversible) are all exposed in a breach. Even hashed with a fast hash such as SHA-256, billions of guesses per second on a GPU crack most of them.",
    how: "Store a slow, salted hash. A hash can't be reversed; a unique salt per user stops precomputed attacks; a deliberately slow algorithm makes each guess expensive.",
    tech: [
      "Hashing is one-way; encryption is two-way with a key (Main week 7: TLS). Passwords need one-way.",
      "A salt is a random value stored with each hash, so identical passwords get different hashes and precomputed tables (rainbow tables) are useless.",
      "Password hashing functions are slow on purpose and tunable: bcrypt, scrypt, and Argon2id (the current recommendation), which also uses lots of memory to resist GPUs.",
      "To log in, hash the submitted password with the stored salt and settings, and compare the results in constant time.",
      "MD5 and plain SHA-256 are fast general-purpose hashes, which is exactly wrong for passwords.",
    ],
    cost: "Slow hashing costs server CPU on every login (aim for roughly 100 to 500 ms) and can be abused for denial of service without rate limiting. Raising the cost later means rehashing at the next login.",
    tryIt:
      "In Node, time crypto.createHash('sha256') on a password versus crypto.scryptSync with default settings, and work out the guesses per second for each.",
    buildsOn: "Main week 7: TLS",
  },
  "M17:2": {
    why: "HTTP is stateless: each request stands alone (Main week 7). After you log in, the server needs to recognise you on every later request.",
    problem:
      "Sending the password with every request is risky, and without a way to remember the login, users would have to log in on every page.",
    how: "After login, the server creates a session record and gives the browser a random session ID in a cookie. The browser sends it back automatically, and the server looks up who it belongs to.",
    tech: [
      "The session ID must be long, random and unguessable (128 bits or more from a secure random generator).",
      "The session data (user ID, expiry) is stored on the server, in memory for one server or in Redis or the database when there are several.",
      "Cookie flags (Main week 7: Cookies): HttpOnly so scripts can't steal it, Secure so it's HTTPS only, SameSite=Lax to block most CSRF.",
      "Issue a new session ID at login to prevent session fixation; delete the session on logout.",
      "Sessions can be revoked instantly by deleting the server record.",
    ],
    cost: "Every request needs a session lookup, and the store must be shared and highly available when you run several servers. Cookies also need CSRF protection on state-changing requests.",
    tryIt:
      "Log into any site, find its session cookie in DevTools, Application, Cookies, and note its flags. Delete it and reload.",
    buildsOn: "Main week 7: Cookies",
  },
  "M17:3": {
    why: "Sessions need a shared store that every server checks. For APIs used by many services, or mobile apps, teams wanted credentials that verify themselves.",
    problem:
      "Checking a central session store on every call between many services adds latency and a single point of failure.",
    how: "A token carries the user's identity and expiry inside it, signed by the server. Any service with the key can verify the signature without a lookup.",
    tech: [
      "A JWT (JSON Web Token) is three base64url parts: header.payload.signature. The payload is readable by anyone; the signature only proves it wasn't changed.",
      "HS256 signs with one shared secret; RS256 and ES256 sign with a private key and verify with a public key, so verifiers can't create tokens.",
      "Always verify the signature, the algorithm and the expiry (exp). Never put secrets in the payload.",
      "Short-lived access tokens (minutes) plus longer-lived refresh tokens (stored securely, rotated on use) limit the damage of a stolen token.",
      "The revocation problem: a valid JWT stays valid until it expires, unless you add a deny-list, which reintroduces a lookup.",
      "In browsers, an HttpOnly cookie is safer than localStorage, which any injected script can read (Main week 14: Storage).",
    ],
    cost: "Tokens are hard to revoke, larger than session IDs, and easy to misconfigure. For a single web app, a plain server-side session is often simpler and safer.",
    tryIt:
      "Paste a JWT into jwt.io, read its payload, change one character of the payload, and see the signature check fail.",
    buildsOn: "Main week 17: Sessions",
  },
  "M17:4": {
    why: "Apps often need to act on your data in another service: a calendar app reading your Google Calendar. Giving the app your Google password would hand it everything.",
    problem:
      "Sharing passwords gives full, unlimited, unrevocable access, and the app can't tell your password from an attacker's use of it.",
    how: "OAuth 2.0 lets you approve limited access on the provider's own site. The provider then gives the app an access token with only the permissions (scopes) you approved, which you can revoke later.",
    tech: [
      "Roles: the resource owner (you), the client (the app), the authorization server (Google's login) and the resource server (Google Calendar's API).",
      "Authorization code flow: the app redirects you to the provider with the scopes it wants; you log in and approve; the provider redirects back with a short-lived code; the app's server exchanges the code for tokens.",
      "PKCE: the app sends a hash of a random secret at the start and the secret itself at the exchange, so a stolen code is useless. It's now required for all clients.",
      "Client credentials flow: a server authenticates as itself, with no user involved, for service-to-service calls.",
      "Scopes (calendar.readonly) limit what the token can do; refresh tokens get new access tokens without asking you again.",
    ],
    cost: "OAuth has many moving parts and is easy to implement subtly wrong (missing state check, open redirects). Use a well-tested library or identity provider, not your own implementation.",
    tryIt:
      "Use the OAuth 2.0 Playground (developers.google.com/oauthplayground) to authorise a scope, see the code, and exchange it for a token.",
    buildsOn: "Main week 17: Tokens",
  },
  "M17:5": {
    why: "OAuth was designed for granting access, not for logging in. Apps started misusing access tokens as proof of identity, which was insecure, so a standard login layer was added.",
    problem:
      "An access token says what an app may do, not who the user is, and a token meant for one app could be replayed to log into another.",
    how: "OpenID Connect (OIDC) adds an ID token to OAuth: a signed JWT that states who the user is and which app it was issued for.",
    tech: [
      "The app asks for the openid scope (plus profile and email) in the normal authorization code flow (Main week 17: OAuth 2.0).",
      "The ID token's claims include iss (who issued it), sub (a stable user ID), aud (the app it's for), exp, and nonce (to stop replay).",
      "The app must check the signature using the provider's published keys, and check iss, aud, exp and nonce.",
      "Use sub, not email, as the stable user identifier, because emails can change.",
      '"Sign in with Google" and most "Sign in with X" buttons are OIDC.',
    ],
    cost: "You depend on the provider being available, and on users having an account there. Linking several providers to one user needs careful account-matching rules.",
    tryIt:
      "Open https://accounts.google.com/.well-known/openid-configuration and find the authorization endpoint, token endpoint and keys URL.",
    buildsOn: "Main week 17: OAuth 2.0",
  },
  "M17:6": {
    why: "People use dozens of apps at work and can't manage separate passwords for each. And passwords alone are routinely phished or leaked.",
    problem:
      "Separate logins everywhere mean weak, reused passwords and no central way to remove a leaver's access. A stolen password alone is enough to take over an account.",
    how: "Single sign-on (SSO) lets one identity provider log you into many apps. Multi-factor authentication (MFA) requires a second proof beyond the password. Passkeys replace passwords with device-held keys that can't be phished.",
    tech: [
      "SSO: apps trust a central identity provider (Okta, Microsoft Entra ID, Google Workspace) using OIDC or the older XML-based SAML, common in enterprises.",
      "MFA factors: something you know (password), have (phone, security key) or are (fingerprint).",
      "TOTP (authenticator app codes) derives a 6-digit code from a shared secret and the current time, changing every 30 seconds. SMS codes are weaker because SIMs can be hijacked.",
      "Passkeys (WebAuthn) store a private key on your device; the site keeps only the public key. Login signs a challenge tied to the site's domain, so a fake site can't use it.",
    ],
    cost: "SSO makes the identity provider a single point of failure and a prime target. MFA adds friction and account-recovery problems when a device is lost.",
    tryIt:
      "Create a passkey on a site that supports it (GitHub or Google) and look at what your device asks you to do, then check the site's security settings.",
    buildsOn: "Main week 17: OpenID Connect",
  },
  "M17:7": {
    why: 'Once you know who someone is, you need rules for what they may do. Those rules grow from "admins can do everything" into something more detailed as products grow.',
    problem:
      "Permission checks scattered through the code with ad hoc ifs are inconsistent, hard to audit, and easy to forget on a new endpoint.",
    how: "Choose a model and apply it consistently: roles for coarse permissions, attributes for context-dependent rules, and ownership checks for per-resource access.",
    tech: [
      "RBAC (role-based access control): users have roles (admin, editor, viewer); roles have permissions (posts:delete). Simple and widely used.",
      'ABAC (attribute-based access control): rules use attributes of the user, the resource and the context, such as "managers can approve expenses under ₹50,000 in their own department during work hours".',
      "Ownership checks: the resource's owner_id must match the requesting user, or the user must have a role that overrides it.",
      "Check authorization on the server for every request, in one shared place (middleware or a policy function), never only by hiding buttons in the UI.",
      "Deny by default: anything not explicitly allowed is refused.",
    ],
    cost: "RBAC leads to role explosion as exceptions pile up; ABAC is flexible but harder to reason about and audit. Both need tests for every rule.",
    tryIt:
      "Write a table of every endpoint in your API against each role, mark allowed or denied, and write a test for one denied case.",
    buildsOn: "Main week 17: Authentication vs authorization",
  },
  "M17:8": {
    why: "Sharing is everywhere: documents shared with people, folders inherited by files, teams owning projects. Roles alone can't express \"Asha can edit this one document because she's in a team that owns its folder\".",
    problem:
      'Encoding sharing rules in roles or in ad hoc SQL quickly becomes slow and inconsistent, and answering "who can see this?" becomes impossible.',
    how: "Store permissions as relationships between users and objects, and define rules over those relationships. To check access, the system follows the relationships. Google published this as Zanzibar, the system behind Drive and YouTube sharing.",
    tech: [
      "A relationship tuple: document:7 # editor @ user:asha, or folder:3 # owner @ team:design#member.",
      "An authorization model defines how relations combine: a viewer is anyone who is an editor, or a viewer of the parent folder.",
      "A check asks: is user:asha a viewer of document:7? The engine walks the graph of relationships to answer.",
      "OpenFGA (open source, from Auth0/Okta) and SpiceDB are Zanzibar-style services you can run.",
      "They also answer list queries: which documents can Asha view?",
    ],
    cost: "It's another service to run and keep in sync with your data, and its modelling language takes time to learn. For simple apps, RBAC plus ownership checks are enough.",
    tryIt:
      "Open the OpenFGA Playground, load the Google Drive sample model, and run a check that depends on a parent folder's permission.",
    buildsOn: "Main week 17: Authorization models",
  },
  "M17:9": {
    why: "Most breaches don't use clever new attacks; they use the same few mistakes again and again. OWASP lists the most common ones so developers know what to defend against.",
    problem:
      "Developers who don't know these attack classes write vulnerable code without realising it: a string-built SQL query, an unescaped comment, a missing ownership check.",
    how: "Learn each common attack, how it works, and the defence that stops the whole class (Main week 17: Defenses).",
    tech: [
      "Broken access control: missing authorization checks, such as changing an ID in the URL to see another user's data (called IDOR).",
      "Injection: user input is treated as code. SQL injection (' OR 1=1 --) and command injection (; rm -rf).",
      "XSS: an attacker's script runs in your page. Stored (saved in your database), reflected (in a URL) or DOM-based (inserted by your own JavaScript).",
      "CSRF: another site makes the user's browser send a request with their cookies. SSRF: your server is tricked into fetching an internal URL, such as a cloud metadata endpoint.",
      "Insecure deserialization (turning untrusted data back into objects that run code) and security misconfiguration (default passwords, verbose errors, open storage buckets).",
    ],
    cost: "No single list is complete, and attackers adapt. Security has to be part of design and code review, not a checklist done at the end.",
    tryIt:
      "Do PortSwigger Web Security Academy's first SQL injection lab: retrieve hidden data with a WHERE clause bypass.",
    buildsOn: "Main week 17: Authentication vs authorization",
  },
  "M17:10": {
    why: "Each attack class has a known defence that, applied consistently, stops the whole class rather than one bug at a time.",
    problem:
      "Defending case by case (blocking particular characters, hand-escaping in some places) always misses one, and one miss is enough.",
    how: "Use structural defences: keep code and data separate, encode output for its context, restrict what the browser will run, and limit how fast anyone can try.",
    tech: [
      "Parameterized queries: the SQL and the values travel separately (WHERE id = $1), so input can never become SQL.",
      "Output encoding: escape data for where it goes (HTML, attribute, URL, JavaScript). Templating engines and React do this by default; innerHTML doesn't (Main week 14: DOM API).",
      "Content Security Policy (CSP): a header listing which script sources may run, so injected inline scripts are blocked even if XSS slips through.",
      "CSRF defences: SameSite cookies plus a CSRF token, or a custom header that cross-site forms can't send.",
      "Rate limiting slows password guessing and abuse. Security headers: Strict-Transport-Security (always HTTPS), X-Content-Type-Options: nosniff, frame-ancestors (no embedding).",
    ],
    cost: "A strict CSP can break third-party scripts and needs tuning. Rate limits can block legitimate users behind one shared IP.",
    tryIt:
      "Scan your site's headers with securityheaders.com (or curl -I) and add the missing ones to your API.",
    buildsOn: "Main week 17: OWASP Top 10",
  },
  "M17:11": {
    why: "Fixing a security hole after launch is expensive and sometimes too late. Thinking through how a design could be attacked before building it is far cheaper.",
    problem:
      "Teams secure what they happen to think of and miss whole categories, such as forged audit logs or denial of service, because nobody looked systematically.",
    how: "Draw the system and where data crosses trust boundaries, then walk through STRIDE, six categories of threat, for each part, and decide how you'll prevent or detect each one.",
    tech: [
      "Start with a data-flow diagram: users, services, data stores, and the trust boundaries between them (the internet and your server, your server and the database).",
      "Spoofing (pretending to be someone else) is countered by authentication.",
      "Tampering (changing data) is countered by integrity checks, signatures and authorization.",
      "Repudiation (denying an action) is countered by audit logs. Information disclosure (leaking data) is countered by encryption and access control.",
      "Denial of service (making it unavailable) is countered by rate limits and quotas. Elevation of privilege (gaining more rights) is countered by least privilege and authorization checks.",
      "Write each threat, its mitigation and its owner in a short document, and revisit it when the design changes.",
    ],
    cost: "Threat modelling takes time and can turn into an endless list; prioritise by likelihood and impact. It's only useful if the mitigations actually get built.",
    tryIt:
      "Draw your API's data flow on paper and write one threat per STRIDE letter for it, with a mitigation for each.",
    buildsOn: "Main week 17: OWASP Top 10",
  },

  // ---- Week 18: SQL and data modeling ----
  "M18:0": {
    why: "Before relational databases, each program stored data in its own file format, and changing how data was stored meant rewriting every program that read it.",
    problem:
      "Data scattered across custom files is duplicated, inconsistent and hard to query in new ways, and nothing stops invalid data from being written.",
    how: "Store data as tables of rows and columns with declared types, link tables through keys, and let the database enforce rules (constraints) so invalid data can't get in.",
    tech: [
      "A table has columns with types; each row is one record.",
      "A primary key uniquely identifies each row. A surrogate key is a generated ID (bigint identity or UUID); a natural key is real data (an email), which can change.",
      "A foreign key references another table's primary key, and the database refuses rows that point to nothing (referential integrity).",
      "Constraints: NOT NULL, UNIQUE, CHECK (price > 0) and foreign keys make the database reject bad data even when the application has a bug.",
      "SQL is declarative: you describe the result, and the database's planner decides how to get it.",
    ],
    cost: "A fixed schema needs migrations to change (Main week 18: Migrations). Strict constraints can make bulk loads and some refactors slower.",
    tryIt:
      "In psql, create users and orders tables with a foreign key, then try to insert an order for a user ID that doesn't exist and read the error.",
  },
  "M18:1": {
    why: "Data is only useful if you can ask questions of it. SQL is the standard language for asking questions of relational data, used by almost every database and analytics tool.",
    problem:
      "Without SQL fluency, you pull whole tables into application code and filter there, which is slow, uses lots of memory, and misses what the database could do for you.",
    how: "Combine a few building blocks: filter rows, join tables, group and aggregate, and nest queries, letting the database do the heavy work.",
    tech: [
      "SELECT columns FROM table WHERE condition ORDER BY column LIMIT n.",
      "JOINs combine tables: INNER keeps matching rows only; LEFT keeps all rows from the left table, filling NULLs where there's no match; FULL keeps both sides; a self join joins a table to itself (employees and their managers).",
      "GROUP BY with aggregates (COUNT, SUM, AVG) summarises groups; HAVING filters groups after aggregation, WHERE filters rows before.",
      "Subqueries nest a query inside another; UNION stacks results with the same columns; CASE WHEN adds if-else logic inside a query.",
      "Logical order of evaluation: FROM and JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.",
    ],
    cost: "Complex queries can be hard to read and to optimise. Moving business logic into SQL makes it harder to test and to move to another database.",
    tryIt:
      "On pgexercises.com, solve one join and one aggregate exercise, and predict how many rows each returns before running it.",
    buildsOn: "Main week 18: The relational model",
  },
  "M18:2": {
    why: "Real reports need rankings, running totals, hierarchies and insert-or-update operations, which basic SQL handles badly.",
    problem:
      "Without these tools, you'd write several queries and stitch results together in code, or use correlated subqueries that are slow and unreadable.",
    how: "Use CTEs to name intermediate results, window functions to compute over related rows without collapsing them, and UPSERT to insert or update in one atomic statement.",
    tech: [
      "A CTE (WITH recent AS (SELECT ...) SELECT ... FROM recent) names a subquery for readability. WITH RECURSIVE walks hierarchies such as category trees or org charts.",
      "Window functions compute across rows related to the current row while keeping every row: ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at).",
      "RANK and DENSE_RANK handle ties; LAG and LEAD read the previous or next row; SUM(amount) OVER (ORDER BY day) gives a running total.",
      "UPSERT: INSERT ... ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name inserts, or updates if the row exists, atomically.",
    ],
    cost: "Window functions can be expensive on big partitions without the right index. Recursive CTEs can loop forever on cyclic data without a guard.",
    tryIt:
      "Write a query that returns each user's latest order using ROW_NUMBER() and a CTE, then the same with DISTINCT ON in Postgres.",
    buildsOn: "Main week 18: SQL fluency",
  },
  "M18:3": {
    why: "Real data has gaps: a user with no phone number, a measurement not yet taken. SQL represents an unknown value with NULL.",
    problem:
      "NULL doesn't behave like a value: WHERE phone = NULL finds nothing, NOT IN with a NULL in the list returns nothing, and counts come out different than expected.",
    how: "SQL uses three-valued logic: true, false and unknown. Any comparison with NULL is unknown, and WHERE keeps only rows where the condition is true.",
    tech: [
      "NULL = NULL is unknown, not true. Use IS NULL and IS NOT NULL.",
      "In WHERE, rows where the condition is unknown are dropped, just like false.",
      "x NOT IN (1, NULL) is never true, a classic bug; use NOT EXISTS instead.",
      "COUNT(*) counts rows; COUNT(column) skips NULLs. SUM and AVG ignore NULLs.",
      "COALESCE(phone, 'none') replaces NULL with a default. In Postgres, IS DISTINCT FROM compares with NULLs treated as values.",
    ],
    cost: "Nullable columns spread this complexity into every query that touches them. Prefer NOT NULL with sensible defaults where the data allows.",
    tryIt:
      "In psql, run SELECT NULL = NULL, NULL IS NULL, 1 NOT IN (2, NULL); and explain each result.",
    buildsOn: "Main week 18: SQL fluency",
  },
  "M18:4": {
    why: "Before writing tables, you need to understand the things in the domain and how they relate. Getting this wrong is very expensive to fix once data exists.",
    problem:
      "A badly modelled schema can't represent real cases (a product in two categories), duplicates data, or needs a painful migration when requirements grow.",
    how: "Identify the entities (things with identity), their attributes, and the relationships between them with their cardinality, then draw it as an ER diagram before writing SQL.",
    tech: [
      "Entities become tables, and attributes become columns.",
      "1:1: a user has one profile; store a unique foreign key, or merge the tables.",
      "1:N: a user has many orders; put user_id on orders.",
      "M:N: students take many courses and courses have many students; use a join table enrollments(student_id, course_id), which can carry its own data such as a grade.",
      'ER diagrams draw entities as boxes and relationships as lines, with crow\'s-foot marks for "many".',
    ],
    cost: "Modelling every nuance up front can over-engineer a young product. Some relationships only become clear with real usage, so expect to evolve the model.",
    tryIt:
      "Draw the ER diagram for a library (books, copies, members, loans) on paper, then compare with dbdiagram.io's sample schemas.",
    buildsOn: "Main week 18: The relational model",
  },
  "M18:5": {
    why: "If the same fact is stored in several places, the copies eventually disagree. Normalization is a set of rules for storing each fact once.",
    problem:
      "Storing a customer's address on every order means updating 500 rows when it changes; miss one and the data contradicts itself (an update anomaly).",
    how: "Split tables so every non-key column depends on the key, the whole key, and nothing but the key. Then deliberately denormalize where read performance justifies the duplication.",
    tech: [
      "1NF: each column holds a single value; no lists or repeating groups in one column.",
      "2NF: in a table with a composite key, no column depends on only part of the key.",
      "3NF: no column depends on another non-key column (city depending on postcode belongs in its own table).",
      "BCNF: a stricter 3NF, where every determinant is a candidate key.",
      "Denormalization adds controlled duplication, such as an order_count column or a copied price at the time of purchase, to avoid expensive joins, and must be kept in sync by code or triggers.",
    ],
    cost: "Highly normalized schemas need more joins to read. Denormalized ones risk inconsistency and need extra code to keep copies correct.",
    tryIt:
      "Take a spreadsheet-style orders table with customer name, address and product details in every row, and split it into 3NF tables.",
    buildsOn: "Main week 18: Data modeling",
  },
  "M18:6": {
    why: "The column type decides what values are allowed, how they're compared and how much space they take. The wrong type causes subtle bugs that surface much later.",
    problem:
      "Money stored as a float drifts by fractions of a paisa; times stored without a time zone shift by hours when servers move; IDs stored as text sort wrongly.",
    how: "Pick the type that matches the meaning of the data, and let the database enforce it.",
    tech: [
      "Money: numeric(12,2), or integers of the smallest unit (paise); never float (Main week 1: Information as bits).",
      "Time: timestamptz stores an absolute moment (kept in UTC) and converts for display; plain timestamp has no time zone and is ambiguous.",
      "Text: in Postgres, text and varchar perform the same; add a CHECK constraint for length limits.",
      "IDs: bigint identity columns are compact and fast; UUIDs can be generated anywhere and don't reveal counts. UUIDv7 is time-ordered, so it indexes well.",
      "jsonb stores flexible JSON that can be indexed and queried, for data whose shape really varies, not as a way to skip modelling.",
    ],
    cost: "Changing a column's type on a large table can lock it or rewrite it. jsonb used everywhere loses the safety of a schema.",
    tryIt:
      "In psql, run SELECT 0.1::float + 0.2::float, 0.1::numeric + 0.2::numeric; then compare now()::timestamp and now()::timestamptz after SET timezone = 'Asia/Kolkata'.",
    buildsOn: "Main week 18: The relational model",
  },
  "M18:7": {
    why: "Schemas change as products change, and the code that talks to the database needs a reliable way to build queries and map rows to objects.",
    problem:
      "Changing a production schema by hand is error-prone and can't be repeated on other environments. And code that runs one query per item in a list (N+1) is very slow.",
    how: "Change schemas through versioned migration files that every environment applies in order. Pick a data-access style (ORM, query builder or raw SQL) that fits the team, and watch the queries it generates.",
    tech: [
      "A migration is a numbered script (CREATE TABLE, ALTER TABLE) committed to git and applied by a tool, which records which migrations have run.",
      "Safe changes on live tables: add nullable columns first, backfill data, then add constraints; avoid long locks on big tables.",
      "ORMs (Prisma, Drizzle, TypeORM) map rows to objects and generate SQL; query builders (Kysely, Knex) build SQL in code with types; raw SQL gives full control.",
      "The N+1 problem: loading 100 posts with one query, then each post's author with another, makes 101 queries. Fix it with a JOIN or a batched WHERE id IN (...) query.",
      "Log the SQL your ORM generates during development so you can see N+1 problems.",
    ],
    cost: "ORMs hide expensive queries and make complex SQL awkward. Raw SQL is verbose and needs care to stay injection-safe and typed. Migrations need discipline and review.",
    tryIt:
      "Turn on query logging in your ORM, load a list page, count the queries, and then reduce them to one or two.",
    buildsOn: "Main week 18: Data modeling",
  },

  // ---- Week 19: Database internals ----
  "M19:0": {
    why: "Databases store far more data than fits in memory, so most of it lives on disk. How it's laid out there decides how fast queries can be.",
    problem:
      "Disks and SSDs are thousands of times slower than memory (Main week 1: Memory), and reading data in small random pieces is much slower than reading it in large sequential runs.",
    how: "Store rows in fixed-size pages, read and write whole pages, and keep hot pages cached in memory so most reads never touch the disk.",
    tech: [
      "A page (8 KB in Postgres) is the unit the database reads and writes. Each table is a heap file: a list of pages holding rows in no particular order.",
      "Each row has a physical address (in Postgres, the ctid: page number plus slot within the page).",
      "The buffer pool (shared_buffers in Postgres) caches pages in memory; the operating system's page cache sits behind it (Main week 3: Files and file systems).",
      "A sequential scan reads every page in order, which is efficient per byte but slow for big tables. Fetching scattered rows means many random page reads.",
      "This is why indexes, row width and access patterns matter so much for speed.",
    ],
    cost: "Every update can create a new row version and dead space (MVCC, Main week 19: Transactions), so tables bloat and need cleanup. Wide rows mean fewer rows per page and more I/O.",
    tryIt:
      "In psql, run SELECT ctid, * FROM users LIMIT 5; then update one row and select it again to see its ctid change.",
    buildsOn: "Main week 1: Memory",
  },
  "M19:1": {
    why: "Finding one row in a table of 100 million by checking every row is far too slow. Indexes are the database's way to jump straight to the rows you want, like a book's index.",
    problem:
      "Without the right index, a query reads the whole table on every call, and the app gets slower as the data grows.",
    how: "An index is a separate sorted structure that maps column values to row locations. The planner uses it when it estimates that's faster than scanning, and EXPLAIN shows you what it chose.",
    tech: [
      "B+trees (the default) keep keys sorted in a shallow tree of pages, so a lookup takes O(log n) page reads and range scans follow linked leaf pages (Java track week 21: Binary search trees).",
      "Composite index (a, b): usable for queries on a, or a and b, but not b alone (the leftmost prefix rule). Column order matters.",
      "A covering index includes every column the query needs, allowing an index-only scan with no table access. Partial indexes cover some rows (WHERE active); expression indexes cover a computed value (lower(email)).",
      "Every index slows writes, because each insert or update must also update it, and it takes disk space.",
      "EXPLAIN ANALYZE shows the actual plan and timings: Seq Scan, Index Scan, Index Only Scan or Bitmap Heap Scan, plus join methods (nested loop, hash join, merge join).",
    ],
    cost: "Too many indexes slow writes and waste memory; too few slow reads. The planner relies on statistics, and stale statistics lead to bad plans.",
    tryIt:
      "Load a million rows, run EXPLAIN ANALYZE on a WHERE email = '...' query, add an index on email, and run it again. Compare the plans and times.",
    buildsOn: "Main week 19: Storage",
  },
  "M19:2": {
    why: "B-trees update data in place, which needs random writes. Workloads that write huge volumes, such as logs, metrics and messaging, needed a structure that turns writes into fast sequential ones.",
    problem:
      "Under heavy writes, B-tree pages are rewritten constantly across the disk, and random writes become the bottleneck.",
    how: "An LSM tree (log-structured merge tree) buffers writes in memory, flushes them to disk as sorted files in one sequential write, and merges those files in the background.",
    tech: [
      "Writes go to a write-ahead log (for crash safety) and an in-memory sorted table (the memtable).",
      "When the memtable fills, it's written to disk as an immutable sorted file (an SSTable).",
      'Reads check the memtable, then SSTables from newest to oldest, using Bloom filters (a compact structure that says "definitely not here") to skip files.',
      "Compaction merges SSTables in the background, dropping overwritten and deleted values.",
      "Used by Cassandra, RocksDB, ScyllaDB, and many time-series and key-value stores (DDIA ch. 4).",
    ],
    cost: "Reads may check several files, so they can be slower than B-tree reads. Compaction uses CPU and disk bandwidth in the background and can cause latency spikes.",
    tryIt:
      "Draw what happens to the key user:7 after three updates and one delete in an LSM tree: which files hold which versions, and what compaction leaves.",
    buildsOn: "Main week 19: Indexes",
  },
  "M19:3": {
    why: "Many users change the same data at the same time, and servers crash mid-write. Without guarantees, data ends up half-updated or wrong.",
    problem:
      "A transfer that debits one account but crashes before crediting the other loses money. Two people booking the last seat at once can both succeed.",
    how: "A transaction groups operations so they all happen or none do, recovers after crashes, and controls what concurrent transactions see of each other through isolation levels.",
    tech: [
      "ACID: Atomicity (all or nothing), Consistency (constraints hold), Isolation (concurrent transactions don't interfere beyond the chosen level), Durability (committed data survives a crash).",
      "The write-ahead log (WAL) records every change before it's applied to data pages. After a crash, the database replays the log to recover.",
      "Isolation levels, from weakest: read uncommitted, read committed (Postgres's default), repeatable read, serializable. They differ in which anomalies they prevent: dirty reads, non-repeatable reads, phantoms, lost updates and write skew.",
      "MVCC (multi-version concurrency control): Postgres keeps old row versions (tagged xmin and xmax) so readers never block writers. VACUUM later removes versions nobody can see.",
      "Locking: SELECT ... FOR UPDATE locks rows you intend to change. Deadlocks happen when two transactions wait on each other; the database kills one. Optimistic concurrency checks a version number at write time instead of locking.",
    ],
    cost: "Stronger isolation means more waiting or more failed transactions you must retry. Long transactions hold locks and stop VACUUM from cleaning up.",
    tryIt:
      "Open two psql sessions, read the same row's balance in both, update it from both based on what you read, and watch the lost update. Then fix it with FOR UPDATE.",
    buildsOn: "Main week 3: Concurrency",
  },
  "M19:4": {
    why: "Postgres starts a separate operating system process for every client connection (Main week 2: Processes). Processes are expensive, so connections are a limited resource.",
    problem:
      "An app that opens a new connection per request, or hundreds of serverless functions each holding connections, exhausts the database's connection limit and wastes its memory.",
    how: "Reuse a small set of open connections through a pool. The app borrows a connection for a query and returns it, and a pooler such as PgBouncer can share connections across many app instances.",
    tech: [
      "Opening a Postgres connection costs a TCP and TLS handshake, authentication and a process fork, so it takes milliseconds, and each connection uses several MB of memory.",
      "max_connections defaults to 100. More connections than cores mostly adds contention, not speed.",
      "App-side pools (node-postgres Pool, HikariCP in Java) keep a fixed number of connections per app instance.",
      "PgBouncer sits between apps and Postgres. In transaction mode, a server connection is lent out only for the length of one transaction, so thousands of clients can share a few dozen connections.",
      "Transaction pooling breaks session features such as session-level SET and advisory locks.",
    ],
    cost: "Pools that are too small make requests queue; too large overloads the database. Another moving part (PgBouncer) can itself fail or be misconfigured.",
    tryIt:
      "In psql, run SELECT count(*) FROM pg_stat_activity; with your app idle and under load, then check ps aux | grep postgres to see one process per connection.",
    buildsOn: "Main week 2: Processes",
  },

  // ---- Week 20: Caching, Redis, queues and NoSQL ----
  "M20:0": {
    why: "Some data is read far more often than it changes, and computing or fetching it every time wastes time and load. Keeping a copy closer to where it's needed is caching.",
    problem:
      "Without caching, a popular page queries the database on every view, and a traffic spike overloads it. With careless caching, users see stale or even other users' data.",
    how: "Store results at the layer closest to the reader that's safe, decide how they expire or get invalidated, and protect the source from the stampede when a popular entry expires.",
    tech: [
      "Caches live at every layer: browser, CDN (Main week 27), reverse proxy, application memory, Redis, and the database's own buffer pool.",
      "Cache-aside: the app checks the cache, and on a miss reads the database and fills the cache. Read-through and write-through put the cache in charge of loading and writing. Write-behind writes to the cache and saves to the database later.",
      "Freshness comes from TTLs (expire after N seconds) or explicit invalidation on change. Eviction policies decide what to drop when full: LRU (least recently used) or LFU (least frequently used).",
      "Stampede (thundering herd): a hot key expires and thousands of requests hit the database at once. Fix with a lock so one request refills it, request coalescing, or jittered TTLs so keys don't expire together.",
      "Measure the hit rate; a cache with a low hit rate only adds latency and complexity.",
    ],
    cost: "Every cache can serve stale data and is one more thing to keep consistent. Invalidation bugs are notoriously hard to find. Cache only what's measurably slow.",
    tryIt:
      "Add cache-aside with a 60-second TTL to one slow endpoint, measure p95 latency with k6 before and after, and then change the data and observe the staleness.",
    buildsOn: "Main week 7: Caching",
  },
  "M20:1": {
    why: "Apps need a fast, shared place for small hot data: sessions, counters, rate limits, leaderboards, locks. A disk-based database is too slow for some of these and app memory isn't shared between servers.",
    problem:
      "Keeping sessions or rate-limit counters in one server's memory breaks as soon as you run two servers, and hitting Postgres for every counter increment is wasteful.",
    how: "Redis is an in-memory data structure server: it keeps everything in RAM, offers rich data types with atomic operations, and optionally saves to disk.",
    tech: [
      "One main thread runs commands one at a time, so each command is atomic without locks, and an event loop (Main week 3: I/O models) serves many clients.",
      "Types: strings (with INCR for counters), hashes (objects), lists (queues), sets, sorted sets (ZADD and ZRANGE for leaderboards), and streams (append-only logs).",
      "Persistence: RDB snapshots periodically, AOF logs every write; both, or neither for pure caching.",
      "EXPIRE gives keys a TTL. Pub/sub broadcasts messages to subscribers. Lua scripts run several commands atomically.",
      "Valkey is the open-source fork made after Redis changed its licence; the commands are the same.",
    ],
    cost: "Data is limited by RAM, and recent writes can be lost on a crash depending on persistence settings. One slow command (KEYS * on a big dataset) blocks everyone.",
    tryIt:
      "In redis-cli, run INCR visits a few times, then ZADD board 50 asha 80 ravi and ZREVRANGE board 0 -1 WITHSCORES.",
    buildsOn: "Main week 20: Caching",
  },
  "M20:2": {
    why: "Some work doesn't need to happen while the user waits: sending emails, resizing images, notifying other services. And some systems produce work faster than others can handle it.",
    problem:
      "Doing everything inside the request makes users wait and fails the request if any step fails. Calling other services directly couples them: if one is down or slow, everything is.",
    how: "Put work or events on a queue or log. Producers add messages and move on; consumers process them at their own pace, with retries for failures.",
    tech: [
      "Queues (RabbitMQ, SQS, BullMQ on Redis): each message goes to one consumer and is deleted after it's acknowledged.",
      "Logs or streams (Kafka): messages are kept in order in partitions for days. Each consumer group tracks its own position (offset), so many groups can read the same events independently and replay them.",
      "Delivery guarantees: at-most-once (may lose messages), at-least-once (may duplicate them, the usual choice), exactly-once (only within narrow limits).",
      "Because duplicates happen, consumers must be idempotent: processing a message twice has the same effect as once, for example by recording processed message IDs.",
      "Failed messages are retried with exponential backoff plus jitter (random spread); after N failures they go to a dead letter queue for inspection.",
    ],
    cost: "Asynchronous systems are harder to debug and test, and results arrive later. A queue is another system to run and monitor, and growing backlogs must be watched.",
    tryIt:
      "Move email sending into a BullMQ job, make the job fail randomly half the time, and watch it retry and finally land in the failed list.",
    buildsOn: "Main week 16: Idempotency",
  },
  "M20:3": {
    why: "Relational databases fit most data, but some workloads need different trade-offs: enormous scale, flexible documents, relationships many hops deep, full-text search or time-series metrics.",
    problem:
      "Forcing those workloads into Postgres can be slow or awkward, but picking a NoSQL database for the wrong reasons loses joins, transactions and constraints you needed.",
    how: "Each NoSQL family optimises for one access pattern. Choose by how you'll read and write the data, and default to a relational database unless a specific need says otherwise.",
    tech: [
      "Key-value (Redis, DynamoDB): get and put by key; extremely fast and scalable, but limited queries.",
      "Document (MongoDB): stores JSON-like documents with flexible shape; good when data is read as whole documents.",
      "Wide-column (Cassandra, ScyllaDB): huge write volumes spread across many machines; queries must be designed around the partition key (LSM-based, Main week 19).",
      "Graph (Neo4j): relationships many hops deep, such as friends of friends; search (Elasticsearch, OpenSearch): full-text search with relevance ranking using an inverted index; time-series (TimescaleDB, InfluxDB): metrics over time.",
      "Postgres covers many of these needs itself: jsonb, full-text search, and extensions such as PostGIS and pgvector.",
    ],
    cost: "Each extra database is another system to operate, back up and keep in sync. Many NoSQL systems give up joins, multi-row transactions or strong consistency.",
    tryIt:
      'Model the same blog data (posts and comments) as Postgres tables and as one MongoDB document per post, and write the query "all comments by user 7" for each.',
    buildsOn: "Main week 18: The relational model",
  },

  // ---- Week 21: Testing, logging, real-time ----
  "M21:0": {
    why: "Code changes constantly, and every change can break something that used to work. Tests are how you find out in seconds instead of from users.",
    problem:
      "Without tests, every change needs manual checking, so people stop changing code, or change it and ship bugs. Badly designed tests are slow and flaky and break on every refactor.",
    how: "Write mostly fast, focused tests, plus fewer broad ones that check the pieces work together. Test behaviour, not implementation details, and use real dependencies where it's practical.",
    tech: [
      "The test pyramid: many unit tests (one function or module, milliseconds each), fewer integration tests (real database or HTTP), few end-to-end tests (the whole app through a browser).",
      "Test doubles: a stub returns canned answers; a mock also checks that it was called; a fake is a working lightweight version (an in-memory repository); a spy records calls. Mocking things you own couples tests to the implementation.",
      "Integration tests against a real Postgres (Testcontainers starts one in Docker) catch the SQL and transaction bugs mocks hide.",
      "Coverage shows which lines ran, not whether the tests check anything meaningful; mutation testing measures that (Main week 39).",
      "TDD: write a failing test first, make it pass, then refactor; it shapes code into testable pieces. Contract tests (Pact) check that a consumer and a provider agree on an API without running both together.",
    ],
    cost: "Tests are code to maintain, and slow or flaky suites get ignored. Over-mocked tests pass while the real system is broken.",
    tryIt:
      "Break one line of your API's logic on purpose and see whether any test fails. If none does, write the test that would have caught it.",
    buildsOn: "Java week 9: Testing with JUnit",
  },
  "M21:1": {
    why: "When something goes wrong in production, logs are often the only record of what happened. They must be searchable and must connect related events.",
    problem:
      "Free-text logs from many servers are hard to search, and without a shared ID you can't tell which lines belong to the same failing request. Swallowed errors leave no trace at all.",
    how: "Log structured JSON with a level and a request ID on every line, send logs to a central store, and handle errors deliberately: recover from expected ones, crash and restart on bugs.",
    tech: [
      "Structured logs are JSON objects ({ level, time, msg, requestId, userId }) that tools can filter and aggregate. pino is a fast Node logger.",
      "Levels: debug, info, warn, error. Production usually logs info and above.",
      "Generate a request ID at the edge (or read one from a header), attach it to every log line for that request, and pass it to downstream services so you can follow one request everywhere (correlation).",
      "Operational errors (network timeout, invalid input) are expected: handle them and respond. Programmer errors (undefined is not a function) are bugs: log them and let the process restart cleanly.",
      "Never catch an error and do nothing with it. Never log passwords, tokens or personal data.",
    ],
    cost: "Logs cost storage and money at volume, and too much logging buries the signal. Accidentally logging personal data can be a legal problem.",
    tryIt:
      "Add pino with a request ID to your API, make a request that fails, and find every log line for that request by filtering on its ID.",
    buildsOn: "Main week 15: process",
  },
  "M21:2": {
    why: "Chat, live dashboards, notifications and collaborative editing need the server to push updates the moment they happen.",
    problem:
      "Polling every second wastes requests and still lags. And once you run several servers, a WebSocket on server A can't hear about a message that arrived at server B.",
    how: "Keep a long-lived connection open (WebSocket for two-way, SSE for one-way), and connect your servers through a pub/sub channel so any server can deliver any message.",
    tech: [
      "WebSockets start as an HTTP request with an Upgrade header, then become a two-way message channel on the same TCP connection.",
      "SSE (Server-Sent Events) is a text/event-stream HTTP response that stays open; the browser's EventSource reconnects automatically. It's simpler and one-way.",
      "With many servers, each holds only its own connections. Publish every event to Redis pub/sub (or a broker), and every server forwards it to its connected clients.",
      "Load balancers need long timeouts and WebSocket support (Main week 27); clients need reconnect logic with backoff and a way to catch up on missed messages.",
      "Heartbeats (ping and pong) detect dead connections that never closed properly.",
    ],
    cost: "Every open connection uses server memory and a file descriptor, and long-lived connections make deploys and scaling harder. Many apps only need SSE or even polling.",
    tryIt:
      "Run two instances of a small WebSocket chat on different ports, connect a client to each, and make messages cross between them using Redis pub/sub.",
    buildsOn: "Main week 16: Alternatives",
  },
  "M21:3": {
    why: '"It feels slow" isn\'t something you can fix. You need numbers that describe what users actually experience, and a way to find the breaking point before real traffic does.',
    problem:
      "Averages hide the pain: an average of 100 ms can hide that 1 in 100 requests takes 5 seconds. And untested systems fall over at the first traffic spike.",
    how: "Measure latency as percentiles, and load test with realistic traffic to find where it breaks and why.",
    tech: [
      "p50 (the median) is the typical request; p95 and p99 are the slowest 5% and 1%. Tail latency matters because one page makes many requests, so most users hit the slow tail somewhere.",
      "Throughput is requests per second; latency rises sharply as you approach a system's capacity.",
      "k6 scripts load tests in JavaScript with stages (ramp up, hold, ramp down) and thresholds that fail the test (p95 < 300 ms); autocannon is a quick Node HTTP benchmark.",
      "Find the bottleneck under load: CPU, the database, the connection pool, locks or the event loop (Main week 15).",
      "Coordinated omission: a load tool that waits for slow responses before sending more requests under-reports latency.",
    ],
    cost: "Load tests take effort to make realistic and can damage shared environments. Optimising code that isn't the bottleneck wastes time.",
    tryIt:
      "Run autocannon -c 50 -d 20 against one of your endpoints and read p50, p97.5 and p99. Then double the connections and compare.",
    buildsOn: "Main week 20: Caching",
  },
  "M21:4": {
    why: "Code shows what a system does, not why it was built that way. Six months later, nobody remembers why Postgres was chosen over MongoDB, or why a cache was added.",
    problem:
      "Without written reasons, new teammates can't get started, and old decisions get reversed or blindly copied because nobody knows the constraints behind them.",
    how: "Keep a README that gets anyone from zero to running, and write a short architecture decision record (ADR) for each significant decision, kept in the repository.",
    tech: [
      "A good README covers what the project is, how to run it locally in a few commands, how to run tests, configuration, an architecture diagram, and where to find more.",
      "An ADR is a short numbered file (docs/adr/0003-use-postgres.md) with: context (the situation and forces), the decision, the status, and the consequences, good and bad.",
      "ADRs are never edited after acceptance; a new ADR supersedes an old one, so the history of thinking is preserved.",
      "Diagrams as code (Mermaid, which GitHub renders) stay next to the code and can be updated in the same pull request.",
    ],
    cost: "Documentation takes time and goes stale if nobody owns it. Keep it short and close to the code so it's updated together.",
    tryIt:
      "Write ADR 0001 for one real decision in your API (for example cursor pagination) with context, decision and consequences, in under one page.",
    buildsOn: "Main week 5: Team workflows",
  },

  // ---- Design kata 1 ----
  "M38:0": {
    why: "Designing a system from a blank page is overwhelming without a structure. A fixed sequence of questions makes sure nothing important is skipped and lets you go deep where it matters.",
    problem:
      "Jumping straight to boxes and arrows produces designs that solve the wrong problem, can't handle the load, or fail in obvious ways nobody considered.",
    how: "Work through the same steps every time: requirements, estimates, API, data model, diagram, the hardest part, then what fails. Each step uses the answers from the one before.",
    tech: [
      "Requirements: what it must do (functional) and how well (non-functional: scale, latency, availability, consistency).",
      "Estimates: rough reads and writes per second, storage and bandwidth, to know whether one machine is enough.",
      "API: the endpoints and their inputs and outputs. Data model: the tables or documents and how they're accessed.",
      "Diagram: clients, load balancer, services, caches, databases, queues, each with a reason.",
      "Deep dive on the hardest part, then failure modes: what happens when each box is slow or down, and what's the bottleneck at 10 times the load.",
    ],
    cost: "A fixed process can feel mechanical, and time spent on easy steps leaves less for the hard part. Keep the early steps short.",
    tryIt:
      "Set a 90-minute timer and spend no more than 15 minutes on any one step while designing the pastebin.",
    buildsOn: "Main week 21: Writing a README and ADRs",
  },
  "M38:1": {
    why: "Every design decision depends on what the system must do and how well. Requirements that aren't written down get assumed differently by everyone involved.",
    problem:
      "Without clear requirements, you either over-build (global replication for 100 users) or under-build (no expiry when pastes must expire), and scope keeps creeping.",
    how: "List what the system must do, list the qualities it must have with numbers, and explicitly list what's out of scope.",
    tech: [
      "Functional requirements: create a paste, read it by short URL, optional expiry, optional private pastes.",
      "Non-functional requirements, with numbers: 10 million new pastes a month, reads 10 times writes, p99 read under 200 ms, 99.9% availability, pastes up to 1 MB.",
      "Out of scope: editing pastes, user accounts, syntax highlighting. Saying no is a design decision too.",
      "Note which requirement drives the design most; here it's read-heavy traffic and storage growth.",
    ],
    cost: "Pinning requirements early can miss what users really need; revisit them as you learn. Vague numbers lead to vague designs.",
    tryIt:
      "Write the requirements for a pastebin in five lines: three functional, two non-functional with numbers, and one out-of-scope line.",
    buildsOn: "Main week 38: The design process",
  },
  "M38:2": {
    why: "Whether you need one server or a hundred, a cache or not, depends on numbers. Rough arithmetic before designing stops you from guessing.",
    problem:
      "Without estimates, designs are either wildly over-engineered or collapse under real load, and you can't tell which.",
    how: "Use round numbers and simple multiplication to estimate requests per second, storage per year and bandwidth. Being within a factor of 10 is good enough.",
    tech: [
      "Seconds per day ≈ 100,000 (86,400 rounded). 10 million writes a month ≈ 330,000 a day ≈ 4 writes per second on average.",
      "Peak is often 2 to 5 times average, so plan for about 20 writes and 200 reads per second.",
      "Storage: 10 million pastes × 10 KB average ≈ 100 GB a month ≈ 1.2 TB a year.",
      "Compare with what one machine does: Postgres handles thousands of simple queries per second, and Redis tens of thousands.",
      "Latency numbers (Main week 1: Memory) tell you whether a design can meet its latency target at all.",
    ],
    cost: "Estimates are only as good as their assumptions, so write the assumptions down. Precision beyond a factor of two is wasted effort.",
    tryIt:
      "Estimate the storage a year of WhatsApp text messages in India would need, writing every assumption, in five minutes.",
    buildsOn: "Main week 38: Functional vs non-functional requirements",
  },
  "M38:3": {
    why: "Storage is the hardest part of a system to change later. Choosing it from the actual reads and writes, rather than from fashion, avoids painful migrations.",
    problem:
      "Picking a database before knowing the access patterns leads to slow queries, data that doesn't fit, or a system that can't grow.",
    how: "List every read and write with its frequency, its key and its size, then pick the store and the indexes that serve the most frequent ones cheaply.",
    tech: [
      "Pastebin access patterns: read by short ID (very frequent), write once (rare), delete expired (background). That's a key-value pattern.",
      "Small metadata (ID, created_at, expires_at, size) fits Postgres well, with a primary key on the ID.",
      "Large contents (up to 1 MB) are better in object storage such as S3, with the database holding only a pointer (Main week 48).",
      "Indexes follow the queries: the primary key for reads, and an index on expires_at for the cleanup job.",
      "Ask how it grows: 1.2 TB a year of metadata and blobs, and whether one database is still enough in three years.",
    ],
    cost: "Splitting data across a database and object storage means two systems to keep consistent. Designing for scale you won't reach adds cost now.",
    tryIt:
      "List the pastebin's top four access patterns with their frequency per second and the key each uses, and choose a store for each.",
    buildsOn: "Main week 18: Data modeling",
  },
  "M38:4": {
    why: "Short URLs need unique IDs that are short, hard to guess and generated quickly. Expiring data needs something to actually delete it.",
    problem:
      "Random IDs can collide; sequential IDs reveal how many pastes exist and let anyone enumerate them; expired data left in place fills the disk.",
    how: "Pick an ID scheme that balances length, collision risk and guessability, check for collisions on insert, and clean up expired data with a background job.",
    tech: [
      "Random IDs: 7 characters of base62 (a-z, A-Z, 0-9) give 62^7 ≈ 3.5 trillion possibilities. Collisions become likely around the square root of that (the birthday paradox), so check uniqueness on insert and retry.",
      "Counter-based IDs encoded in base62 never collide but are guessable and need a shared counter (a database sequence, or ranges handed out to servers).",
      "Hash-based IDs (a hash of the content) give the same ID for identical content, which deduplicates but leaks whether some text was pasted before.",
      "Expiry: store expires_at, hide expired pastes on read immediately, and delete them in batches with a scheduled job (or use TTLs if the store supports them).",
    ],
    cost: "Uniqueness checks add a write-time lookup. Cleanup jobs need monitoring, or they silently stop and storage grows.",
    tryIt:
      "Generate a million random 7-character base62 IDs in a script and count the collisions, then try with 5 characters.",
    buildsOn: "Main week 38: Choosing storage from access patterns",
  },
  "M38:5": {
    why: "Reads are 10 times writes, and popular pastes are read over and over. A cache can serve most reads without touching the database.",
    problem:
      "Without a cache, the database does all the reading. With a cache, a restart or a viral paste can still flood the database at the worst moment.",
    how: "Put a cache where it saves the most, size it from the estimates, and plan for what happens when it's empty (cold) or a key gets hugely popular.",
    tech: [
      "Options, from closest to the user: a CDN in front of public pastes, a Redis cache-aside layer in front of the database, and the database's own buffer pool.",
      "Pastes never change after creation, so they cache well: a long TTL, invalidated only on delete or expiry.",
      "Sizing: if 20% of pastes get 80% of reads, caching the hot 20% of a day's reads covers most traffic.",
      "Cold start: after a restart, every read misses and goes to the database, so the database must survive that briefly, or the cache is warmed first.",
      "Hot keys and stampedes: one viral paste expiring sends all its readers to the database at once (Main week 20: Caching), so use request coalescing.",
    ],
    cost: "A cache adds memory cost, another failure mode, and staleness. If the database can easily handle the read load, the cache may not be worth it yet.",
    tryIt:
      "Load test your API's read endpoint with k6 with the cache off, then on, and then right after flushing it, and compare database query counts.",
    buildsOn: "Main week 20: Caching",
  },
};
