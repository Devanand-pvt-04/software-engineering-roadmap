import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's build tools, React and Next.js phase (M22-M25, M47). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_FRONTEND: ExplainMap = {
  // ---- Week 22: Modules, bundlers and chunks ----
  "M22:0": {
    why: "Every modern front-end build exists because browsers had no module system for most of the web's history. Knowing that history explains why the tools look the way they do.",
    problem:
      "With plain script tags, every file shared one global scope: names collided, files had to be loaded in exactly the right order, and a big app meant dozens of requests.",
    how: "Developers invented a series of workarounds, each fixing the last one's problems, until the language got its own module system (ES modules). Bundlers appeared to package many modules into a few files for browsers.",
    tech: [
      "Script tags and globals: every top-level variable went on window, so two libraries could overwrite each other.",
      "IIFEs (immediately invoked function expressions) wrapped each file in a function to get a private scope (Main week 12: Closures).",
      "CommonJS (require, module.exports) gave Node real modules, but loads synchronously, which doesn't suit browsers.",
      "AMD loaded modules asynchronously in browsers, with a verbose callback syntax.",
      "ES modules (import, export) are part of the language, statically analysable and supported natively by browsers and Node.",
      "Bundlers combined modules into a few files because many small requests were slow over HTTP/1.1 (Main week 7: HTTP/2 and HTTP/3).",
    ],
    cost: "The two systems, CommonJS and ESM, still coexist in Node, which causes confusing interop errors and dual-package setups.",
    tryIt:
      'Create an HTML page with two plain scripts that both declare var count, and see one overwrite the other; then change both to type="module" and see the problem disappear.',
    buildsOn: "Main week 15: The module system",
  },
  "M22:1": {
    why: "Bundlers turn your source files into the files a browser actually downloads. When a build is slow, broken or too big, you need to know what happens inside.",
    problem:
      "Your app is hundreds of modules plus npm packages, written in TypeScript and JSX that browsers can't run, with CSS and images imported from JavaScript.",
    how: "Starting from entry points, the bundler reads every file, follows the imports to build a graph of modules, transforms each file into plain JavaScript, and writes out bundles with a small runtime that connects them.",
    tech: [
      "Entry points: the files to start from, such as src/main.tsx.",
      "Parse each file into an AST (abstract syntax tree) and find its import statements.",
      "Build the module dependency graph by traversing those imports, a graph traversal like BFS or DFS (Java week 25: BFS and DFS).",
      "Resolve each import path to a real file: relative paths, node_modules lookup, the package.json exports field and configured aliases.",
      "Transform files with loaders or plugins: TypeScript and JSX via Babel, SWC or esbuild; CSS; images to URLs.",
      "Wrap each module in a function, add a small runtime that wires imports to exports, and emit the bundles.",
    ],
    cost: "Every step costs build time, and plugins and configuration can become complex. Bundled output is harder to read and debug without source maps.",
    tryIt:
      "Run npx esbuild src/index.ts --bundle --outfile=out.js on a small project, open out.js, and find where each of your modules was wrapped.",
    buildsOn: "Main week 22: History of JavaScript modules",
  },
  "M22:2": {
    why: "Every kilobyte of JavaScript has to be downloaded, parsed and run, which is slow on cheap phones. Bundlers can remove a lot of it automatically.",
    problem:
      "If you import one function from a big library, a naive bundle includes the whole library, plus comments, long names and code that can never run.",
    how: "The bundler shrinks code (minification), drops exports nobody imports (tree shaking), merges modules into fewer scopes (scope hoisting), and removes unreachable code.",
    tech: [
      "Minification: removes whitespace and comments and renames local variables to short names; tools such as Terser, esbuild and SWC do it.",
      "Tree shaking: removes unused exports. It needs ES modules, because static import and export can be analysed without running the code.",
      'The sideEffects field in package.json ("sideEffects": false) tells the bundler that unused files can be dropped safely.',
      "Scope hoisting puts many modules into one function scope, which removes wrapper overhead and helps minification.",
      "Dead code elimination removes branches that can never run, such as if (process.env.NODE_ENV !== 'production') in a production build.",
    ],
    cost: "Optimisations make builds slower and output harder to read. Tree shaking silently fails for CommonJS packages or code with side effects.",
    tryIt:
      "Import one function from lodash-es versus lodash in a small app, build both, and compare the bundle sizes with a bundle analyser.",
    buildsOn: "Main week 22: What a bundler does",
  },
  "M22:3": {
    why: "A single big bundle makes every user download code for pages they never visit. Code splitting sends only what's needed now.",
    problem:
      "A 2 MB bundle delays the first page even if that page needs only 200 KB, and any change invalidates the cache for all of it.",
    how: "The bundler splits the graph at certain points into separate files called chunks, loads each chunk only when needed, and names files by their content so browsers can cache them forever.",
    tech: [
      "Split points: each entry point, every dynamic import() call, and shared vendor code (webpack's splitChunks).",
      "Each split produces a chunk: a separate JavaScript file with an id.",
      "The runtime keeps a manifest mapping chunk ids to URLs, loads a chunk on demand by injecting a <script> tag or calling import(), and then registers its modules.",
      "Content hashes in file names (app.3f9a1c.js) change only when the content changes.",
      "So hashed files can be served with Cache-Control: max-age=31536000, immutable (Main week 7: Caching).",
    ],
    cost: "Too many small chunks cause request waterfalls, where one chunk must load before the next is discovered. Splitting also makes loading behaviour harder to predict.",
    tryIt:
      "Change a route in a React app to load with lazy(() => import('./Page')), build it, and watch the new chunk load in the DevTools Network tab when you navigate.",
    buildsOn: "Main week 7: Caching",
  },
  "M22:4": {
    why: "The code that runs in the browser has been transformed and minified, so errors point to line 1, column 48,213 of a file you didn't write.",
    problem:
      "Without a way back to the original source, debugging production errors or stepping through bundled code is nearly impossible.",
    how: "The bundler writes a source map: a JSON file that maps each position in the output back to a file, line and column in the original source. DevTools and error trackers read it.",
    tech: [
      "A source map lists the original sources and an encoded mapping from output positions to source positions.",
      "The output file ends with a //# sourceMappingURL=app.js.map comment, or the server sends a SourceMap header.",
      "DevTools then shows your original TypeScript files and lets you set breakpoints in them.",
      "Error trackers such as Sentry use uploaded source maps to show readable stack traces.",
      "Options trade build speed against accuracy, for example cheaper line-only maps during development.",
    ],
    cost: "Source maps slow builds, and publishing them exposes your original source code, so many teams upload them only to the error tracker.",
    tryIt:
      "Build a small app with and without source maps, throw an error in a component, and compare the stack traces in DevTools.",
    buildsOn: "Main week 22: What a bundler does",
  },
  "M22:5": {
    why: "Waiting for a full rebuild and a page reload after every edit breaks your flow and throws away the state of the page.",
    problem:
      "Reloading the page on every change loses form input, open dialogs and scroll position, and rebuilding a big bundle can take many seconds.",
    how: "A dev server rebuilds only what changed and pushes the update to the browser over a WebSocket. Hot module replacement (HMR) swaps the changed module in place without a reload.",
    tech: [
      "The dev server watches files, rebuilds the changed modules, and serves them from memory.",
      "A WebSocket connection tells the browser which modules changed (Main week 21: Real-time).",
      "The HMR runtime fetches the new module and re-runs it; modules that accept updates (via import.meta.hot or a framework plugin) apply them in place.",
      "React Fast Refresh keeps component state while swapping component code.",
      "If no module accepts the update, the runtime falls back to a full reload.",
    ],
    cost: "HMR can leave the app in a state that couldn't happen after a fresh load, causing confusing bugs; reload when things look odd.",
    tryIt:
      "Start a Vite React app, type into a text field, edit a component's text, and see the field keep its value; then change a non-component module and watch what happens.",
    buildsOn: "Main week 21: Real-time",
  },
  "M22:6": {
    why: "You'll meet several bundlers in different codebases. Knowing what each one is good at helps you choose and debug them.",
    problem:
      "Older JavaScript-based bundlers became slow on large apps, with cold starts measured in minutes.",
    how: "Newer tools are written in Go or Rust for speed, and some skip bundling in development by serving native ES modules to the browser.",
    tech: [
      "webpack: the most configurable and still common in older apps; slower on large projects.",
      "Rollup: produces clean, small bundles; popular for libraries.",
      "esbuild: written in Go, extremely fast, with fewer features; often used inside other tools.",
      "Vite: serves native ESM in development and bundles with Rollup (moving to the Rust-based Rolldown) for production; the default for many new projects.",
      "Turbopack (Next.js) and Rspack (webpack-compatible) are Rust bundlers.",
      "Rust and Go tools are faster because they compile to native code, use all CPU cores in parallel, and share one AST between steps.",
    ],
    cost: "Fast new tools have smaller plugin ecosystems and occasional differences in output between development and production.",
    tryIt:
      "Build the same small project with webpack and with Vite, and compare cold build time and output size.",
  },
  "M22:7": {
    why: "You want to write modern JavaScript and TypeScript, but some of your users have older browsers.",
    problem:
      "New syntax such as optional chaining crashes old browsers, and new APIs such as structuredClone simply don't exist there.",
    how: "A transpiler rewrites new syntax into older equivalent syntax; a polyfill adds missing APIs at runtime. A browserslist query defines which browsers you support, so tools do only what's needed.",
    tech: [
      "Babel (JavaScript) and SWC (Rust) parse code and rewrite syntax: arrow functions, class fields, optional chaining.",
      "They can also strip TypeScript types and compile JSX.",
      "Transpiling handles syntax; polyfills (such as core-js) are code that implements missing APIs like Promise.any.",
      'browserslist (for example "> 0.5%, last 2 versions, not dead") tells tools which browsers to target.',
      "Targeting only modern browsers produces smaller, faster code.",
    ],
    cost: "Polyfills and transpiled code add size and run slower, and supporting very old browsers costs the majority of users who don't need it.",
    tryIt:
      "Transpile a file using ?. and ?? with SWC or Babel for an old target and for a modern one, and compare the output.",
  },

  // ---- Week 23: React internals I: elements, reconciliation, Fiber ----
  "M23:0": {
    why: "React is the most widely used UI library. It exists to solve one problem you met in your vanilla JavaScript todo app.",
    problem:
      "With manual DOM updates, every change in data needs code that finds and updates exactly the right nodes. As features grow, the UI drifts out of sync with the data and bugs multiply.",
    how: "You describe what the UI should look like for the current state, as a function of that state, and React works out the DOM changes needed to get there.",
    tech: [
      "UI = f(state): a component is a function that returns a description of the UI.",
      "When state changes, React calls the function again to get a new description.",
      "React compares the new description with the previous one and applies only the differences to the DOM.",
      "This is declarative (say what you want) rather than imperative (say each step), like SQL compared with a loop.",
      "One-way data flow: data goes down through props; changes go up through callbacks.",
    ],
    cost: "React adds a library to download and a layer of indirection between your code and the DOM. Its abstraction can hide performance problems until they're severe.",
    tryIt:
      "Rebuild your vanilla JavaScript todo app from Main week 14 in React, and count the lines of DOM-updating code you no longer need.",
    buildsOn: "Main week 14: DOM API",
  },
  "M23:1": {
    why: "JSX looks like HTML inside JavaScript, which hides what it actually is: ordinary function calls.",
    problem:
      "If you think JSX is HTML, things like className, curly braces for expressions and the need for one root element seem arbitrary.",
    how: "A compiler turns each JSX tag into a function call, jsx() in the modern transform or React.createElement in the classic one, which returns a plain JavaScript object called an element.",
    tech: [
      '<button className="x" onClick={f}>Hi</button> compiles to jsx("button", { className: "x", onClick: f, children: "Hi" }).',
      "An element is a plain, immutable object: { type, props, key }.",
      "type is a string for DOM tags and a function or class for components.",
      "Attributes use JavaScript names (className, htmlFor) because they become object keys.",
      "Curly braces hold any JavaScript expression; statements such as if need to go outside or become a ternary.",
    ],
    cost: "JSX needs a build step, and mixing markup with logic can grow into large, hard-to-read components.",
    tryIt:
      "Paste a JSX snippet into the Babel REPL online with the React preset, read the output, then console.log an element in a running app.",
    buildsOn: "Main week 22: Transpilers",
  },
  "M23:2": {
    why: "React's documentation and error messages use these four words precisely, and mixing them up makes the internals impossible to follow.",
    problem:
      "It's natural to think a component 'is' what's on screen, but React separates the description, the definition, the live state and its own work tracking.",
    how: "Learn the four terms: an element describes, a component produces elements, an instance holds state between renders, and a fiber is React's internal record for each node.",
    tech: [
      "Element: a plain object describing what to show, recreated on every render.",
      "Component: your function (or class) that returns elements.",
      "Instance: a component's identity at one place in the tree, which keeps its state across renders.",
      "Fiber: React's internal object for each node in the tree, holding its type, props, state, hooks and links to its neighbours.",
      "State belongs to the position in the tree, not to the element object.",
    ],
    cost: "This is mostly vocabulary, but it matters: most confusing state bugs come from React treating two things as the same position or as different ones.",
    tryIt:
      "Install React DevTools, select a component, and find its props, state and hooks; these are read from its fiber.",
  },
  "M23:3": {
    why: "'Rendering' in React doesn't mean painting pixels. Knowing what it does mean explains most performance questions.",
    problem:
      "People assume a re-render rebuilds the DOM, so they over-optimise, or they don't realise their function runs on every render and put slow or side-effecting work in it.",
    how: "Rendering is React calling your component function to get new elements. React then compares them with the previous result and only touches the DOM where something differs.",
    tech: [
      "A render is triggered by the first mount, or by a state update in that component or any of its ancestors.",
      "When a component renders, by default all its children render too.",
      "Your component function must be pure: same props and state, same output, with no side effects during render.",
      "Comparing new elements with old ones is cheap; DOM updates are the expensive part, and only differences are applied.",
      "StrictMode calls components twice in development to expose impure renders.",
    ],
    cost: "Many renders are wasted work that produces the same output; usually it's cheap, but in large trees it adds up.",
    tryIt:
      "Turn on 'Highlight updates when components render' in React DevTools and type into an input at the top of an app to see which components re-render.",
    buildsOn: "Main week 23: Elements vs components vs instances vs fibers",
  },
  "M23:4": {
    why: "Comparing two trees perfectly takes O(n³) time, far too slow for a UI. React uses simple rules to do it in O(n).",
    problem:
      "React needs to decide quickly which DOM nodes to keep, update, move or replace, without an expensive general tree-diff algorithm.",
    how: "React compares the old and new trees level by level using a few heuristics: different types replace the whole subtree, same types update props, and keys identify children in lists.",
    tech: [
      "Different type at the same position (<div> becomes <span>, or ComponentA becomes ComponentB): unmount the old subtree, losing its state, and mount a new one.",
      "Same DOM type: keep the node and update only the changed attributes.",
      "Same component type: keep the instance and its state, and render it with new props.",
      "Children are compared in order; with key props, React matches children by key instead of position.",
      "These assumptions make diffing O(n) and are right for almost all real UIs.",
    ],
    cost: "When the assumptions don't hold, such as a component type defined inside another component and recreated each render, React remounts and loses state.",
    tryIt:
      "Conditionally render <input /> inside a <div> or a <section>, type into it, toggle the condition, and watch the text disappear.",
    buildsOn: "Main week 23: Rendering",
  },
  "M23:5": {
    why: "Keys are the only way React can tell which item in a list is which after the list changes.",
    problem:
      "With array indexes as keys, inserting or reordering items makes React attach one item's state, such as typed text or a checkbox, to a different item.",
    how: "Give each list item a key that's stable and unique among its siblings, usually the item's id from your data.",
    tech: [
      "React matches old and new children by key; same key means same instance and same state.",
      "Index keys mean 'the first item', not 'this item', so inserting at the top shifts every item's state down by one.",
      "Keys must be stable (not Math.random()) and unique among siblings, not globally.",
      "Changing a component's key on purpose forces a fresh instance, a handy way to reset its state.",
      "Index keys are fine only for static lists that never reorder, filter or insert.",
    ],
    cost: "You need a stable id in your data, which sometimes means generating one when items are created.",
    tryIt:
      "Render a list of inputs with index keys, type in each, add an item at the top, and see the text land in the wrong rows; then switch to id keys.",
    buildsOn: "Main week 23: Reconciliation",
  },
  "M23:6": {
    why: "Before Fiber (2017), React rendered a whole tree in one uninterruptible pass. Large updates froze the page.",
    problem:
      "A recursive render of a big tree can take hundreds of milliseconds on the main thread, during which typing and clicks don't respond (Main week 8: The main thread).",
    how: "Fiber turns rendering into many small units of work, one per node, linked in a tree that React can walk with a loop instead of recursion. It can pause between units, handle urgent input, and resume.",
    tech: [
      "Each element becomes a fiber, linked to its first child, its next sibling and its parent (return).",
      "Walking the tree with a loop over these pointers, instead of the call stack, lets React stop and continue at any fiber.",
      "Each fiber is one unit of work; React checks the time between units and yields to the browser when needed.",
      "Two trees exist: current (on screen) and work-in-progress (being built); they swap when the work is committed.",
      "Updates have priorities (lanes), so a keystroke can interrupt a slow background render.",
    ],
    cost: "Fiber's complexity is mostly hidden, but it's why render must be pure: React may start, pause, discard and redo your component's render.",
    tryIt:
      "Record a React app in the DevTools Performance panel while typing during a heavy render, and look for React's work split into small tasks.",
    buildsOn: "Main week 8: The main thread",
  },
  "M23:7": {
    why: "React splits each update into two phases with very different rules, and many effect and timing bugs come from not knowing which phase code runs in.",
    problem:
      "If DOM changes happened while React was still working out the new tree, users would see half-updated screens, and pausing or discarding work would be unsafe.",
    how: "In the render phase, React calls components and computes changes without touching the DOM; this can be paused or thrown away. In the commit phase, it applies all DOM changes at once, synchronously, and then runs effects.",
    tech: [
      "Render phase: call components, diff, mark fibers with the changes needed. Must be pure; may run more than once.",
      "Commit phase: apply DOM mutations, update refs, run layout effects; can't be interrupted, so the screen never shows a half-applied update.",
      "After the browser paints, React runs useEffect callbacks.",
      "Side effects in render (fetching, subscriptions, mutating variables) can run twice or for renders that are never committed.",
    ],
    cost: "A slow commit can't be interrupted, so huge DOM changes still cause jank. The two-phase model forces side effects into effects or event handlers.",
    tryIt:
      "Put console.log in a component body, a useLayoutEffect and a useEffect, and read the order in the console, with and without StrictMode.",
    buildsOn: "Main week 23: Fiber architecture",
  },
  "M23:8": {
    why: "React's core doesn't know about the DOM. That separation lets the same component model drive web pages, mobile apps and more.",
    problem:
      "If reconciliation were tied to the DOM, building native mobile apps, terminal UIs or 3D scenes with React would mean rewriting React.",
    how: "The reconciler (react-reconciler) works out what changed; a separate renderer applies those changes to a particular host. react-dom is the web renderer.",
    tech: [
      "The react package holds the component API: hooks, createElement, context.",
      "The reconciler computes the work (Fiber, diffing, scheduling).",
      "A renderer implements host operations such as createInstance, appendChild and commitUpdate for its platform.",
      "react-dom renders to the browser DOM; React Native renders to native iOS and Android views.",
      "Other renderers target PDFs, terminals (Ink) and WebGL (react-three-fiber).",
    ],
    cost: "Each renderer has its own primitives (<View> instead of <div>), so components that use DOM elements don't move between platforms unchanged.",
    tryIt:
      "Install Ink and render a small counter component in your terminal, then compare it with the same component in react-dom.",
    buildsOn: "Main week 23: Fiber architecture",
  },

  // ---- Week 24: React internals II: hooks, effects, concurrency, state ----
  "M24:0": {
    why: "Hooks let function components keep state between renders. The way React stores them explains the Rules of Hooks.",
    problem:
      "A function component is called again on every render, so its local variables reset. React needs to give each call back the right state.",
    how: "React stores each component's hooks as an ordered list on its fiber. On every render, each useState or useEffect call takes the next item in that list, so hooks must be called in the same order every time.",
    tech: [
      "First render: each hook call appends an entry to the fiber's hook list.",
      "Later renders: React walks the same list in order, handing each call its saved state.",
      "Hooks are identified by call order, not by name.",
      "Rules of Hooks: call them only at the top level of a component or custom hook, never inside conditions, loops or after an early return.",
      "The eslint-plugin-react-hooks lint rules enforce this.",
    ],
    cost: "The rules feel arbitrary until you know the cause, and conditional logic sometimes has to be restructured around them.",
    tryIt:
      "Put a useState inside an if statement, toggle the condition at runtime, and read React's error message.",
    buildsOn: "Main week 23: Fiber architecture",
  },
  "M24:1": {
    why: "State updates in React don't happen when you call setState. That timing surprises everyone at first.",
    problem:
      "Calling setCount(count + 1) three times adds 1, not 3, and logging count right after setCount shows the old value.",
    how: "React queues updates, batches them, and applies them in the next render. Each render sees a fixed snapshot of state. Updater functions let you compute from the latest queued value.",
    tech: [
      "setState schedules a re-render; it doesn't change the variable in the current render.",
      "Each render's state is a snapshot: event handlers from that render always see those values.",
      "React batches all updates in the same event (and since React 18, in timeouts and promises too) into one render.",
      "setCount(c => c + 1) passes an updater function that gets the latest pending value, so three calls add 3.",
      "Update objects and arrays immutably (spread a copy), because React compares references to detect changes (Main week 12: Primitives vs references).",
    ],
    cost: "The snapshot model takes getting used to, and immutable updates of deeply nested state are verbose.",
    tryIt:
      "Write a button that calls setCount(count + 1) three times, then change it to setCount(c => c + 1) three times, and explain the difference.",
    buildsOn: "Main week 12: Closures",
  },
  "M24:2": {
    why: "Components sometimes need to sync with something outside React: a subscription, a timer or a non-React widget. useEffect is for that.",
    problem:
      "Side effects can't run during render, and effects that read old values or never clean up cause leaks and stale data.",
    how: "useEffect runs your code after React has updated the screen. It re-runs when a value in its dependency array changes, and the function it returns cleans up before the next run and on unmount.",
    tech: [
      "Effects run after the commit and after the browser paints, so they don't block the screen update.",
      "The dependency array lists every value from render the effect uses; [] means only after mount.",
      "Return a cleanup function to unsubscribe, clear timers or abort requests (AbortController, Main week 14: Web APIs).",
      "Stale closures: an effect captures the props and state of the render it was created in, so missing dependencies mean it reads old values (Main week 12: Closures).",
      "In StrictMode development, React mounts, unmounts and remounts once to check your cleanup works.",
    ],
    cost: "Effects are easy to overuse and hard to get right; missing or extra dependencies cause bugs or loops.",
    tryIt:
      "Write an effect that starts a setInterval logging a count, leave out the dependency, and watch it log a stale value; then fix it two different ways.",
    buildsOn: "Main week 12: Closures",
  },
  "M24:3": {
    why: "Beyond useState and useEffect, a few hooks cover timing, mutable values and memoisation, and they're often misused.",
    problem:
      "Using useEffect to measure the DOM causes a visible flicker, storing timers in state causes extra renders, and wrapping everything in useMemo adds cost for no gain.",
    how: "useLayoutEffect runs before paint for DOM measurement; useRef holds a mutable value that doesn't trigger renders; useMemo and useCallback cache values and functions between renders when that's actually useful.",
    tech: [
      "useLayoutEffect runs synchronously after DOM changes but before the browser paints; use it to measure and adjust layout without flicker.",
      "useRef returns an object whose .current persists across renders; changing it doesn't re-render. It's used for DOM nodes, timers and previous values.",
      "useMemo(() => compute(a), [a]) caches a computed value until a changes.",
      "useCallback(fn, deps) caches a function, useful when passing it to a memo() child or into an effect's dependencies.",
      "They're pointless when the computation is cheap or the result is passed to a component that isn't memoised.",
    ],
    cost: "Memoisation costs memory and comparison time and makes code harder to read; layout effects block painting.",
    tryIt:
      "Profile a list with React DevTools Profiler, add memo and useCallback to its items, and measure whether render time actually drops.",
    buildsOn: "Main week 24: useEffect",
  },
  "M24:4": {
    why: "Many effects in real codebases don't need to exist. Removing them makes components simpler and faster.",
    problem:
      "Using effects to derive data or respond to events causes extra renders, flicker and chains of effects triggering each other.",
    how: "If a value can be computed from props or state, compute it during render. If code runs because the user did something, put it in the event handler. Keep effects only for syncing with external systems.",
    tech: [
      "Derived state: const fullName = first + ' ' + last during render, not an effect that sets a fullName state.",
      "Expensive derived values: useMemo, not an effect.",
      "User actions (submit, click, buy) belong in event handlers, which know what happened.",
      "Resetting state when a prop changes: pass a key to remount, rather than an effect.",
      "Fetching data: prefer a framework's data loading or a library such as TanStack Query over hand-written fetch effects.",
    ],
    cost: "Unlearning the effect habit takes practice, and some genuinely external syncing still needs effects.",
    tryIt:
      "Find every useEffect in your React project and classify each as derived state, event logic or external sync; remove the first two kinds.",
    buildsOn: "Main week 24: useEffect",
  },
  "M24:5": {
    why: "Passing props through many layers just to reach a deep component (prop drilling) is tedious and fragile. Context is React's built-in alternative.",
    problem:
      "Theme, current user or locale is needed in many places, and threading it through every intermediate component clutters them all.",
    how: "A Provider puts a value into the tree; any descendant reads it with useContext. When the value changes, every component that reads it re-renders.",
    tech: [
      "createContext(default) creates the context; <Ctx value={v}> provides it to everything below.",
      "useContext(Ctx) reads the nearest provider's value above the component.",
      "When the value changes (by reference), all consumers re-render, even if they use only part of it.",
      "Creating a new object as the value on every render re-renders all consumers every time; memoise it or split contexts.",
      "Context is best for rarely changing values; frequently changing shared state usually belongs in a store.",
    ],
    cost: "Overused context hides data flow and causes wide re-renders. Components that rely on it are harder to reuse outside their provider.",
    tryIt:
      "Put a frequently changing value and a rarely changing one in one context, profile the re-renders, then split them into two contexts and compare.",
    buildsOn: "Main week 23: Rendering",
  },
  "M24:6": {
    why: "Some updates are urgent (typing) and some can wait (filtering 10,000 rows). Concurrent React lets you tell them apart.",
    problem:
      "If every update has the same priority, a slow render triggered by typing makes the input itself lag.",
    how: "Mark slow updates as transitions so React can interrupt them for urgent input, defer expensive values, and use Suspense to show a fallback while something loads.",
    tech: [
      "useTransition: startTransition(() => setFilter(v)) marks the update as non-urgent; isPending tells you it's in progress.",
      "useDeferredValue(value) gives you a copy that lags behind during heavy renders, so the urgent UI stays responsive.",
      "Both rely on Fiber's interruptible rendering (Main week 23: Fiber architecture).",
      "<Suspense fallback={<Spinner />}> shows the fallback while a child is waiting for code (lazy) or data.",
      "Transitions keep showing the old UI instead of a fallback when switching to content that suspends.",
    ],
    cost: "Concurrent behaviour is harder to reason about, intermediate states can appear, and it doesn't make slow code faster, only less blocking.",
    tryIt:
      "Build a search box over 20,000 items, feel the input lag, then wrap the filter update in startTransition and compare.",
    buildsOn: "Main week 23: Fiber architecture",
  },
  "M24:7": {
    why: "Choosing where state lives is one of the biggest design decisions in a React app.",
    problem:
      "Putting everything in a global store makes every change ripple everywhere, while keeping server data in useState means writing caching, loading and refetching by hand.",
    how: "Keep state as local as possible, lift it only as far as needed, use reducers for complex updates, use an external store for truly shared client state, and use a server-state library for data from APIs.",
    tech: [
      "Lifting state: move it to the closest common parent of the components that need it.",
      "useReducer centralises complex update logic in a pure function: (state, action) => newState.",
      "External stores (Zustand, Redux Toolkit) hold shared client state with fine-grained subscriptions, so only affected components re-render.",
      "Server state (data from APIs) is a cache of something you don't own; TanStack Query handles fetching, caching, deduplication, refetching and stale data.",
      "Client state (UI toggles, form drafts) and server state need different tools.",
    ],
    cost: "Each library adds concepts and dependencies; too many places to keep state makes the app hard to follow.",
    tryIt:
      "Replace one hand-written fetch-in-useEffect in your app with TanStack Query and list what you got for free (caching, retries, refetch on focus).",
    buildsOn: "Main week 20: Caching",
  },
  "M24:8": {
    why: "Forms are where users give you data, and React offers two ways to manage their inputs.",
    problem:
      "Controlling every keystroke through state can be slow and verbose in big forms, while leaving inputs alone makes validation and conditional fields harder.",
    how: "A controlled input takes its value from React state and reports changes; an uncontrolled input keeps its own value in the DOM, read when needed via a ref or FormData.",
    tech: [
      "Controlled: <input value={name} onChange={e => setName(e.target.value)} />; React is the single source of truth.",
      'Uncontrolled: <input defaultValue="x" name="email" /> and read new FormData(form) on submit (Main week 14: Web APIs).',
      "Controlled inputs suit live validation, formatting and fields that depend on each other.",
      "Uncontrolled inputs suit simple forms and work with native form submission and Server Actions.",
      "Libraries such as React Hook Form use uncontrolled inputs for speed, with schema validation (Zod).",
    ],
    cost: "Controlled forms re-render on every keystroke; uncontrolled forms make instant validation and dependent fields more work.",
    tryIt:
      "Build the same sign-up form controlled and uncontrolled, add validation that an email is valid, and compare the code.",
    buildsOn: "Main week 9: Forms in depth",
  },
  "M24:9": {
    why: "Manual useMemo, useCallback and memo calls clutter code and are easy to get wrong. The React Compiler adds memoisation automatically.",
    problem:
      "Developers either forget to memoise and get wasted re-renders, or memoise everywhere and make code noisy and brittle.",
    how: "The React Compiler analyses components at build time and inserts fine-grained caching, so values, functions and JSX are reused when their inputs haven't changed.",
    tech: [
      "It runs as a build plugin (for Babel, or built into frameworks such as Next.js) and rewrites components into memoised code.",
      "It caches at a finer grain than you'd write by hand, down to individual JSX expressions.",
      "It depends on your code following the Rules of React: pure render, no mutating props or state.",
      "Components it can't prove safe are left unoptimised rather than broken.",
      "Most manual useMemo and useCallback become unnecessary, though they still work.",
    ],
    cost: "Code that breaks the rules may misbehave once compiled, and generated code is harder to inspect when debugging.",
    tryIt:
      "Turn on the React Compiler in a small app, open React DevTools, and look for the 'Memo ✨' badge on compiled components.",
    buildsOn: "Main week 24: useMemo and useCallback",
  },

  // ---- Week 25: Next.js: rendering, hydration, Server Components and caching ----
  "M25:0": {
    why: "Frameworks such as Next.js exist because a plain React single-page app (SPA) has a slow, empty first load.",
    problem:
      "A React SPA sends an almost empty HTML page and a large JavaScript bundle. Users see a blank screen until it downloads and runs, search engines see little content, and slow phones suffer most.",
    how: "Render the HTML on the server (or at build time) so the page shows content immediately, then send JavaScript to make it interactive, and send less JavaScript overall.",
    tech: [
      "In a client-rendered SPA, nothing useful paints until the JavaScript bundle is downloaded, parsed and run (Main week 8: The critical rendering path).",
      "Data requests start only after the JavaScript runs, adding another round trip.",
      "Crawlers and link previews may not run JavaScript, so they see an empty page.",
      "Cheap phones parse and run JavaScript several times slower than a developer's laptop.",
      "Server rendering and smaller bundles attack each of these delays.",
    ],
    cost: "Server rendering needs servers (or a build pipeline) and adds complexity: two environments, hydration and caching.",
    tryIt:
      "Load a client-only React app with DevTools throttled to 'Slow 4G' and 4x CPU slowdown, and note when the first content appears.",
    buildsOn: "Main week 8: The critical rendering path",
  },
  "M25:1": {
    why: "There's no single best way to render a page; each strategy trades freshness against speed and cost.",
    problem:
      "Rendering every page on every request is costly and slow, but building every page ahead of time makes data stale.",
    how: "Choose per page among client-side rendering, server rendering per request, static generation at build time, incremental regeneration, and streaming.",
    tech: [
      "CSR (client-side rendering): the browser builds the page with JavaScript. Cheap servers, slow first paint.",
      "SSR (server-side rendering): HTML is built for each request. Fresh and personalised, but costs server time on every request.",
      "SSG (static site generation): HTML is built once at build time and served from a CDN. Fastest, but stale until rebuilt.",
      "ISR (incremental static regeneration): static pages that regenerate in the background after a time or on demand.",
      "Streaming SSR: send the page shell immediately and stream slower parts as they're ready.",
    ],
    cost: "Mixing strategies makes behaviour harder to predict, and the wrong choice either serves stale data or overloads servers.",
    tryIt:
      "Make one Next.js page static, one revalidated every 60 seconds and one dynamic, and compare their response headers and build output.",
  },
  "M25:2": {
    why: "Server rendering turns your React tree into HTML on the server. How it's sent decides how soon users see anything.",
    problem:
      "If the server waits for every piece of data before sending any HTML, one slow query delays the whole page.",
    how: "renderToString builds the whole HTML string at once; streaming APIs such as renderToPipeableStream send HTML in pieces as each part is ready, using chunked transfer encoding.",
    tech: [
      "renderToString: synchronous, waits for everything, returns one string.",
      "renderToPipeableStream (Node) and renderToReadableStream (web streams) send the shell first.",
      "Parts wrapped in <Suspense> stream in later, with a small inline script that moves them into place.",
      "The HTTP response uses chunked transfer encoding, so the browser starts parsing before it's complete (Main week 7: Connection management).",
      "Streaming uses Node streams under the hood (Main week 15: Streams).",
    ],
    cost: "Once the first byte is sent, the status code and headers can't change, so errors and redirects in late parts need special handling.",
    tryIt:
      "Create a Next.js page with a component that awaits a 3-second delay inside <Suspense>, then run curl -N on it and watch the HTML arrive in two parts.",
    buildsOn: "Main week 7: Connection management",
  },
  "M25:3": {
    why: "Server-rendered HTML looks finished but can't respond to clicks until React takes it over. That takeover is hydration.",
    problem:
      "Re-creating the whole DOM in the browser would waste the server's work and cause a flash, but the existing HTML has no event handlers attached.",
    how: "The HTML is shown immediately; then the JavaScript chunks download, React renders the tree in memory, matches it against the existing DOM, and attaches event listeners without recreating nodes.",
    tech: [
      "HTML arrives and is painted: users see content but can't interact yet.",
      "JavaScript chunks download and run; React renders the component tree in memory.",
      "React walks the existing DOM alongside its tree and attaches listeners instead of creating nodes.",
      "Hydration mismatch: the server and client render different output, for example from Date.now(), Math.random(), window checks or locale formatting; React warns and may re-render that part on the client.",
      "Selective hydration hydrates Suspense boundaries separately and prioritises the part the user interacts with.",
    ],
    cost: "Users can see a page that doesn't respond yet, and hydration repeats the rendering work on the client, which is slow on cheap phones.",
    tryIt:
      "Render new Date().toLocaleTimeString() in a server-rendered component, open the console to see the hydration warning, then fix it.",
    buildsOn: "Main week 25: SSR mechanics",
  },
  "M25:4": {
    why: "Next.js's App Router uses your folder structure as the route table and adds shared layouts and loading states.",
    problem:
      "Hand-written routing config grows large, and shared layouts, loading spinners and error pages get repeated for every route.",
    how: "Each folder under app/ is a URL segment; special files in it define the page, the layout around it, and what to show while loading or on error.",
    tech: [
      "app/blog/page.tsx serves /blog; app/blog/[slug]/page.tsx is a dynamic segment for /blog/anything.",
      "layout.tsx wraps a segment and all its children, and keeps its state across navigation within it.",
      "loading.tsx becomes a Suspense fallback for the segment; error.tsx becomes an error boundary.",
      "Nested folders give nested layouts; route groups (folder) organise files without changing the URL.",
      "route.ts files define API endpoints for a segment.",
    ],
    cost: "File conventions are implicit, so behaviour depends on knowing which special file names exist, and deep nesting is hard to follow.",
    tryIt:
      "Add a dynamic [slug] route with its own layout.tsx, loading.tsx and error.tsx, and trigger each state.",
  },
  "M25:5": {
    why: "Much of a page doesn't need to be interactive, yet a normal React app sends JavaScript for all of it. Server Components send none for those parts.",
    problem:
      "Shipping components that just render text from a database means sending their code, their libraries and their data to every browser.",
    how: "Server Components run only on the server and send a serialised description of their output. Components marked 'use client' are bundled into chunks and hydrated as usual.",
    tech: [
      "Server components run only on the server: they can await data and use secrets, and their code is never sent as JavaScript.",
      "The RSC payload is a serialised description of the rendered tree, with references to client components and the props to pass them.",
      '"use client" at the top of a file marks a boundary: that module and its imports are bundled into client chunks.',
      "Props crossing the boundary must be serialisable (no functions, except Server Actions).",
      "On navigation, the router fetches the RSC payload for the next route and merges it into the page without a full reload.",
    ],
    cost: "Two kinds of components with different rules is a real mental load; mistakes show up as confusing errors or bundles that grow silently.",
    tryIt:
      "Render a markdown article with a heavy markdown library in a server component, then move it to a client component and compare the JavaScript bundle size.",
    buildsOn: "Main week 25: Hydration",
  },
  "M25:6": {
    why: "Server Components can read data directly, and Server Actions let forms change data, without writing a separate API for your own UI.",
    problem:
      "Fetching from the browser adds round trips and loading spinners, and every mutation needs an API route, a fetch call and manual error handling.",
    how: "Server components await data directly from the database or APIs while rendering; Server Actions are server functions the client can call, often straight from a form.",
    tech: [
      "async function Page() { const posts = await db.post.findMany(); ... } fetches while rendering on the server.",
      "Start independent requests in parallel (Promise.all) to avoid waterfalls.",
      '"use server" marks a function as a Server Action; passing it to <form action={fn}> makes a form work even before JavaScript loads.',
      "A Server Action is a public HTTP endpoint: validate its input and check authorisation inside it, every time.",
      "After a mutation, revalidate the affected data so pages show the change.",
    ],
    cost: "Data access spreads into components, making layering harder, and it's easy to forget that a Server Action is reachable by anyone.",
    tryIt:
      "Build a comment form with a Server Action that validates input with Zod, checks the user is logged in, writes to the database and revalidates the page.",
    buildsOn: "Main week 17: Authentication vs authorization",
  },
  "M25:7": {
    why: "Rendering and fetching on every request is slow and expensive. Caching reuses results, as long as you control when they go stale.",
    problem:
      "Caching too much shows users old data; caching too little makes every request do the full work.",
    how: "In Next.js 16 with Cache Components, pages are dynamic by default; you mark what may be cached with 'use cache', set how long it lives, and invalidate it by time or by tag.",
    tech: [
      '"use cache" on a function, component or page caches its output, keyed by its inputs.',
      "cacheLife sets how long cached output is fresh (seconds, minutes, hours, days or a custom profile).",
      "cacheTag('posts') labels cached output; revalidateTag('posts') or updateTag invalidates every entry with that label after a change.",
      "Parts that can't be cached, such as per-user data, are rendered per request and streamed into a cached shell (partial prerendering).",
      "It's the same freshness-versus-speed trade-off as HTTP caching (Main week 7: Caching) and Redis (Main week 20: Caching).",
    ],
    cost: "Cache bugs are hard to see: stale data, or user-specific data leaking into a shared cache. Framework caching APIs have changed between versions.",
    tryIt:
      "Cache a posts list with 'use cache' and cacheTag('posts'), add a post through a Server Action that calls revalidateTag, and confirm the list updates.",
    buildsOn: "Main week 20: Caching",
  },
  "M25:8": {
    why: "Google's Core Web Vitals are a shared, measurable definition of whether a page feels fast, and they affect search ranking.",
    problem:
      "'Fast' means different things to different people, and a page that's fast on your laptop can be slow for real users on real phones.",
    how: "Measure three user-centred metrics, collected from real users (field data) and from controlled tests (lab data), and work on the worst.",
    tech: [
      "LCP (Largest Contentful Paint): when the main content appears; good is under 2.5 s.",
      "INP (Interaction to Next Paint): how quickly the page responds to clicks and taps throughout the visit; good is under 200 ms.",
      "CLS (Cumulative Layout Shift): how much content jumps around unexpectedly; good is under 0.1.",
      "Field data (real users, the CrUX dataset, the web-vitals library) shows what users actually get; it's judged at the 75th percentile.",
      "Lab data (Lighthouse, DevTools Performance) is repeatable and good for debugging but isn't what users experience.",
    ],
    cost: "Lab and field results often disagree, and chasing a score can distract from what users actually need.",
    tryIt:
      "Add the web-vitals library to your Next.js app and log LCP, INP and CLS, then run Lighthouse and compare the numbers.",
    buildsOn: "Main week 8: Using DevTools",
  },
  "M25:9": {
    why: "Unit tests check pieces; end-to-end tests check that a user can actually complete a task in a real browser.",
    problem:
      "All the units can pass while the page is broken: a button hidden behind a modal, a wrong route, or a server and client that disagree.",
    how: "Playwright drives real browsers (Chromium, Firefox, WebKit) through user flows, finding elements the way users do, by role and label, and asserting on what's visible.",
    tech: [
      "Locate by user-facing attributes: page.getByRole('button', { name: 'Sign in' }) instead of CSS classes, which also checks accessibility (Main week 9: Accessibility).",
      "Auto-waiting: actions and expect assertions retry until the element is ready, which removes most flaky sleeps.",
      "Test isolation: each test gets a fresh browser context, with no shared cookies or storage.",
      "Traces record every step with screenshots and DOM snapshots for debugging CI failures.",
      "Keep end-to-end tests few and focused on key journeys (sign up, checkout); the testing pyramid still applies (Main week 21: Testing).",
    ],
    cost: "End-to-end tests are slower and more fragile than unit tests, need a running app and test data, and are costly to maintain.",
    tryIt:
      "Write a Playwright test that signs up, creates an item and sees it in a list, and run it in GitHub Actions.",
    buildsOn: "Main week 21: Testing",
  },

  // ---- Design kata 2: a news site that loads fast everywhere ----
  "M47:0": {
    why: "A news site has pages with very different needs: the home page changes every minute, old articles almost never, and the account page is personal.",
    problem:
      "One rendering strategy for the whole site either serves stale news or renders millions of identical pages on every request.",
    how: "For each page type, ask how fresh it must be, whether it's personalised, and how much traffic it gets, then choose static, revalidated, per-request or streamed rendering.",
    tech: [
      "Static: about pages and old articles, built once and served from the CDN.",
      "Revalidated: the home page and section fronts, regenerated every minute or when an article is published.",
      "Per-request: account settings and paywall checks, which depend on the user.",
      "Streamed: fast static shell first, with slower parts such as comments or recommendations streamed in.",
      "Write the choice and the reason for each page type in the design doc.",
    ],
    cost: "More strategies mean more behaviours to test and explain, and each boundary between them is a possible source of stale or leaked data.",
    tryIt:
      "List the 6 main page types of a news site and pick a strategy for each, with the freshness requirement that justifies it.",
    buildsOn: "Main week 25: Rendering strategies",
  },
  "M47:1": {
    why: "A fast site caches at every layer between the user and the database. Each layer catches traffic the layer behind it would otherwise handle.",
    problem:
      "Without a layered view, teams add caches in random places, then can't tell which layer served stale data or why the database is still overloaded.",
    how: "Trace a request from the browser to the database and decide what each layer caches, for how long, and who can invalidate it.",
    tech: [
      "Browser cache: hashed static assets cached for a year; HTML usually revalidated (Main week 7: Caching).",
      "CDN: caches pages and assets near users; s-maxage and stale-while-revalidate control it.",
      "Framework cache: rendered pages and data in Next.js.",
      "API or application cache: Redis for hot query results (Main week 20: Caching).",
      "Database: its own buffer cache, plus read replicas for heavy read traffic.",
      "Estimate the hit rate at each layer to see how much load reaches the database (Main week 38: Back-of-envelope sizing).",
    ],
    cost: "Each layer is another place data can be stale, and debugging needs to know which layer answered.",
    tryIt:
      "Draw the request path for an article page with every cache layer, its TTL and its expected hit rate, and estimate the database queries per second at 10,000 page views per second.",
    buildsOn: "Main week 38: Where the cache goes",
  },
  "M47:2": {
    why: "Caching is easy; knowing when cached copies are wrong is the hard part. A news site must show corrections fast.",
    problem:
      "An article with a mistake keeps showing the old version from browser, CDN and server caches until each one expires.",
    how: "Tag cached content so related entries can be invalidated together, purge CDN entries when content changes, and give static assets new names instead of invalidating them.",
    tech: [
      "Tag-based invalidation: tag article pages with article:123 and section:politics, then revalidate both tags on edit.",
      "CDN purge by URL or by surrogate key (a tag the CDN understands) when an article is published or updated.",
      "Versioned assets: new content gets a new hashed filename, so old copies don't need purging (Main week 22: Code splitting and chunks).",
      "Short TTLs with stale-while-revalidate limit the damage when a purge is missed.",
      "Event-driven invalidation: the CMS publishes an 'article updated' event and a worker purges every layer.",
    ],
    cost: "Purges can be slow or fail, tags must be applied consistently everywhere, and over-purging throws away the cache's benefit.",
    tryIt:
      "Write the exact sequence of invalidations needed when an editor fixes a headline that appears on the article, the home page and two section pages.",
    buildsOn: "Main week 25: Caching in Next.js 16",
  },
  "M47:3": {
    why: "Performance degrades one small addition at a time. A budget turns 'keep it fast' into numbers that a build can check.",
    problem:
      "Each new script or image seems harmless, but over months the page gets twice as slow and nobody notices until users leave.",
    how: "Set numeric limits for JavaScript size and Core Web Vitals on a realistic slow phone, check them in CI, and treat breaking the budget like a failing test.",
    tech: [
      "JavaScript budget: for example under 150 KB compressed for the initial route, checked with a bundle size tool in CI.",
      "Metric budgets: LCP under 2.5 s and INP under 200 ms on a mid-range phone over a slow 4G connection (Main week 25: Core Web Vitals).",
      "Run Lighthouse CI on every pull request with throttling turned on.",
      "Watch real-user field data to catch what the lab misses.",
      "A budget forces trade-offs: adding something means removing or deferring something else.",
    ],
    cost: "Budgets can block legitimate features, lab checks can be noisy, and keeping them meaningful needs ongoing attention.",
    tryIt:
      "Add a bundle size check and Lighthouse CI with an LCP budget to your Next.js project's GitHub Actions workflow, and make a change that fails it.",
    buildsOn: "Main week 25: Core Web Vitals",
  },
  "M47:4": {
    why: "Most of a news page is the same for everyone, but some parts aren't: the user's name, their paywall status or recommendations.",
    problem:
      "If one personalised element makes the whole page dynamic, the page can't be cached and every view hits the servers.",
    how: "Cache and serve the shared page, and render the small personalised parts separately: streamed in per request, or loaded on the client as independent islands.",
    tech: [
      "Islands architecture: a static page with small, independently hydrated interactive parts.",
      "Partial prerendering: a cached static shell with dynamic holes streamed in per request (Main week 25: Caching in Next.js 16).",
      "Client-side islands fetch personal data after load, with fixed-size placeholders to avoid layout shift (CLS).",
      "Edge logic can choose between a few cached variants (logged in or not, region) without full per-user rendering.",
      "Never put personalised data in a shared cache entry.",
    ],
    cost: "Islands add requests and complexity and can flicker if not sized correctly, and personalised parts still need their own scaling.",
    tryIt:
      "Sketch an article page, mark which parts are shared and which are personal, and decide how each personal part is delivered without making the page uncacheable.",
    buildsOn: "Main week 25: React Server Components",
  },
};
