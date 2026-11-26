import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's JavaScript weeks (original weeks 12-14). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_JS: ExplainMap = {
  // ---- Week 12: JavaScript, the language I ----
  "M12:0": {
    why: "Every value a program handles has a type, which decides what you can do with it. JavaScript decides types while the program runs, not before, so you need to know them well.",
    problem:
      "Without knowing the types, you can't predict what typeof says, why null behaves oddly, or why adding a number to a string glues them together instead of adding.",
    how: "JavaScript has seven primitive types for simple values, plus objects for everything else (arrays and functions are objects too). typeof tells you which one a value is, with a few historical quirks.",
    tech: [
      "The primitives are string, number, bigint, boolean, undefined, symbol and null.",
      "Everything else is an object: plain objects, arrays, functions, dates, maps.",
      'typeof returns "number", "string" and so on, but typeof null is "object" (a bug from 1995 that can never be fixed) and typeof a function is "function".',
      "Use Array.isArray(x) to check for arrays and x === null to check for null.",
      "undefined means a value was never set; null means something was deliberately set to nothing.",
    ],
    cost: "Checking types at runtime is your job in plain JavaScript; mistakes only show up when that line runs. TypeScript (Main week 14) moves many of these checks to before the program runs.",
    tryIt:
      'In the console, run typeof 42, typeof "hi", typeof null, typeof [], typeof function(){} and typeof undefined, and predict each first.',
    buildsOn: "Java week 1: Primitive types",
  },
  "M12:1": {
    why: "Copying a number and copying an object behave differently in almost every language, because objects can be big and are usually shared rather than duplicated.",
    problem:
      "You copy an array, change the copy, and the original changes too. Or you compare two identical-looking objects with === and get false.",
    how: "Primitives are copied by value. Objects are held by reference: a variable holds an arrow to the object, and copying the variable copies the arrow, not the object.",
    tech: [
      "let a = 1; let b = a; b = 2; leaves a as 1, because b got its own copy.",
      "const x = { n: 1 }; const y = x; y.n = 2; also changes x.n, because both point at the same object.",
      "=== on objects compares the arrows (is it the same object?), not the contents. { a: 1 } === { a: 1 } is false.",
      "Passing an object to a function passes a copy of the reference, so the function can change the object but can't make the caller's variable point somewhere else. Java works the same way (Java week 2).",
      "Spread ({ ...obj }, [...arr]) makes a shallow copy; structuredClone(obj) makes a deep one.",
    ],
    cost: "Shared references make accidental changes easy to cause and hard to trace. Copying everything to avoid it costs memory and time, which is why libraries such as React expect you to create new objects instead of changing old ones.",
    tryIt:
      "In the console, make an array, assign it to a second variable, push to the second, and print the first. Then repeat with [...arr].",
    buildsOn: "Main week 12: Values and types",
  },
  "M12:2": {
    why: "JavaScript was designed to be forgiving for small scripts in web pages. Instead of failing on mismatched types, it converts values automatically (coercion).",
    problem:
      'Automatic conversion gives results that look absurd: "5" - 1 is 4 but "5" + 1 is "51", and 0 == "" is true. Bugs hide inside these conversions.',
    how: "Learn the few rules coercion follows, use === to compare without coercion, and convert types explicitly when you mean to.",
    tech: [
      "+ with any string concatenates; other arithmetic operators convert to numbers.",
      "== converts both sides to a common type before comparing; === compares without converting. Use === (and !==) by default.",
      'Falsy values are false, 0, -0, 0n, "", null, undefined and NaN. Everything else is truthy, including "0", [] and {}.',
      "null == undefined is true, but neither equals anything else with ==, which is the one widely used == case: x == null checks for both.",
      "Convert on purpose with Number(x), String(x) or Boolean(x).",
    ],
    cost: "The rules are learnable but surprising, and code that leans on them is hard for others to read. TypeScript and linters catch most accidental coercion.",
    tryIt:
      'In the console, predict then run: "5" + 1, "5" - 1, [] + [], [] == false, null == 0, null == undefined.',
    buildsOn: "Main week 12: Values and types",
  },
  "M12:3": {
    why: "Early JavaScript had only var, whose scoping rules confused programmers coming from other languages. let and const were added in 2015 to fix that.",
    problem:
      "var ignores blocks such as if and for, so a variable declared inside a loop leaks out and is shared by every iteration, causing classic bugs.",
    how: "Use const for anything you won't reassign and let for anything you will. Both are scoped to the nearest block { }, like variables in Java.",
    tech: [
      "var is function-scoped: it exists throughout the whole function, whatever block it was written in.",
      "let and const are block-scoped: they exist only inside the nearest { }.",
      "const means the variable can't be reassigned; the object it points to can still be changed.",
      "The temporal dead zone (TDZ) is the stretch from the start of the block to the declaration: let and const exist there but throw a ReferenceError if you touch them.",
      "Rule of thumb: const by default, let when you need to reassign, never var in new code.",
    ],
    cost: "const can mislead beginners into thinking objects are frozen. Old code and some tutorials still use var, so you need to read it.",
    tryIt:
      "Run for (var i = 0; i < 3; i++) {} then console.log(i); then repeat with let and read the error.",
    buildsOn: "Java week 2: Scope",
  },
  "M12:4": {
    why: "JavaScript engines read a whole scope before running it, so they know every name declared in it in advance. That makes some names usable before the line that declares them, which is called hoisting.",
    problem:
      "You call a function above where it's written and it works, but call a function expression the same way and it crashes. Or a var reads as undefined instead of throwing an error.",
    how: "Understand what is set up before the code runs: function declarations are fully ready, var names exist as undefined, and let, const and class names exist but can't be touched yet.",
    tech: [
      "When a scope starts, the engine creates all its bindings first (the creation phase), then runs the code line by line.",
      "function foo() {} declarations are created with their body, so you can call foo() above the line.",
      "var x is created and set to undefined, so reading it early gives undefined, not an error.",
      "let, const and class are created but left uninitialised (the temporal dead zone), so reading them early throws a ReferenceError.",
      "const f = function () {} is a variable, so f follows the rules of const, not of function declarations.",
    ],
    cost: "Relying on hoisting makes code harder to read top to bottom. Most style guides say: declare before use.",
    tryIt:
      "In a file, call a() above function a() {} and call b() above const b = () => {}, run it with node, and compare the results.",
    buildsOn: "Main week 12: Variables",
  },
  "M12:5": {
    why: "In JavaScript, functions are values: you can store them in variables, pass them to other functions and return them. Much of the language's power comes from this.",
    problem:
      "Without first-class functions, you'd need a new loop for every way of filtering or transforming a list, instead of passing in the rule.",
    how: "Write functions in one of three forms, and pass them around like any other value. A function that takes or returns another function is a higher-order function.",
    tech: [
      "Declaration: function add(a, b) { return a + b; } (hoisted, has its own this).",
      "Expression: const add = function (a, b) { return a + b; };",
      "Arrow: const add = (a, b) => a + b; shorter, and it takes this from the surrounding code (Main week 13).",
      "Higher-order functions: [1, 2, 3].map(n => n * 2) passes a function to map; a function that returns a function builds new ones on demand.",
      "Default parameters (function f(x = 10)) fill in missing arguments; rest parameters (function f(...nums)) collect the remaining arguments into an array.",
    ],
    cost: "Code built from many small passed-in functions can be harder to step through in a debugger. Arrow functions can't be used as constructors and have no arguments object.",
    tryIt:
      'Write a function twice(f) that returns a new function calling f two times, and use it with a function that logs "hi".',
    buildsOn: "Java week 2: Methods",
  },
  "M12:6": {
    why: "When code uses a name, the language has to know which variable it means, especially when the same name exists in several places.",
    problem:
      "Without a fixed rule, a function might see different variables depending on who called it, and nobody could reason about what a name means.",
    how: "JavaScript uses lexical scope: a name means whatever it meant where the code was written. If it isn't found in the current scope, the engine looks in the enclosing scope, then the next one out, up to the global scope (the scope chain).",
    tech: [
      "Each function and each block creates a scope.",
      "Lookup walks outward from the current scope to the enclosing ones until it finds the name, or throws a ReferenceError at the global scope.",
      "Lexical means fixed by where the code sits in the source file, not by where the function is called from.",
      "An inner variable with the same name hides (shadows) the outer one.",
      "Assigning to an undeclared name in sloppy mode silently creates a global; strict mode (and every ES module) makes it an error.",
    ],
    cost: "Deep nesting makes it hard to see which variable a name refers to. Shadowing is legal but a common source of bugs.",
    tryIt:
      "Write a function inside a function that both declare let x with different values, and log x at each level.",
    buildsOn: "Main week 12: Variables",
  },
  "M12:7": {
    why: "Since functions can be passed around and called later (Main week 12: Functions), they need a way to keep using the variables that were around when they were created.",
    problem:
      "A click handler created inside a function runs long after that function has returned. Without closures, the variables it relies on would be gone.",
    how: "A function keeps a live link to the scope it was created in. That function plus its remembered scope is a closure, and the variables stay alive as long as the function does.",
    tech: [
      "function counter() { let n = 0; return () => ++n; } returns a function that still reaches n after counter() has returned. Each call to counter() creates a new, separate n.",
      "Closures capture the variable itself, not a snapshot of its value, so later changes are visible.",
      "The classic bug: for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); prints 3, 3, 3, because all three functions share one var i. With let, each iteration gets its own i, so it prints 0, 1, 2.",
      "Uses: private state (a counter no one else can touch), memoisation (a cache kept between calls), and factories that build configured functions.",
    ],
    cost: "A closure keeps its whole scope alive, so a long-lived closure (a forgotten event listener) can hold large objects in memory and leak it.",
    tryIt:
      "Run the var setTimeout loop in the console, then fix it twice: once with let and once with an IIFE or a helper function that takes i as a parameter.",
    buildsOn: "Main week 12: Scope chain and lexical scope",
  },
  "M12:8": {
    why: "Objects are how JavaScript groups related data, and the language has grown a lot of syntax to create, copy and read them safely.",
    problem:
      'Older code needed many lines to copy objects, pull out fields and guard against missing values; one missing nested property crashed the app with "Cannot read properties of undefined".',
    how: "Use object literals to create objects, destructuring and spread to read and copy them, and optional chaining and nullish coalescing to handle missing values safely.",
    tech: [
      "Literal: const user = { name, age: 30, greet() { } }. Getters and setters (get fullName() { }) run code when a property is read or written.",
      "Each property has a descriptor (writable, enumerable, configurable) that Object.defineProperty can set; Object.freeze makes all of them read-only, one level deep.",
      "Destructuring: const { name, age = 18 } = user; pulls fields into variables, with defaults. Spread: { ...user, age: 31 } copies with a change.",
      "Optional chaining: user?.address?.city returns undefined instead of throwing if anything along the way is null or undefined.",
      'Nullish coalescing: value ?? "default" uses the default only for null or undefined, unlike ||, which also replaces 0 and "".',
    ],
    cost: "Spread copies are shallow: nested objects are still shared. Overusing ?. can hide real bugs where a value should never be missing.",
    tryIt:
      "In the console, compare 0 || 5 with 0 ?? 5, then read user?.address?.city on an object with no address.",
    buildsOn: "Main week 12: Primitives vs references",
  },
  "M12:9": {
    why: "Most data comes as lists: rows, users, messages. Arrays and their built-in methods are how you transform them.",
    problem:
      "Writing a manual for loop for every filter, transformation and sum is repetitive and error-prone, and some methods quietly change the original array, which surprises the code that shared it.",
    how: "Use the array methods that each do one job and take a function describing what to do per element. Know which ones change the array in place and which return a new one.",
    tech: [
      "map transforms each element into a new array; filter keeps elements that pass a test; reduce folds the array into one value, such as a sum.",
      "find returns the first match; some and every answer whether any or all elements pass; flatMap maps and flattens one level.",
      "Mutating methods change the original: push, pop, shift, unshift, splice, sort, reverse.",
      "Non-mutating versions return a new array: slice, concat, and since 2023 toSorted, toReversed and toSpliced.",
      "Arrays are objects with numeric keys and a length, and engines store them compactly when they hold similar values.",
    ],
    cost: "Chaining map, filter and reduce makes several passes and creates intermediate arrays; for very large data, one loop is faster. sort() with no comparator sorts as strings, so [10, 9, 1].sort() gives [1, 10, 9].",
    tryIt:
      "In the console, run [10, 9, 1].sort(), then [10, 9, 1].sort((a, b) => a - b), then check whether the original array changed and try toSorted.",
    buildsOn: "Main week 12: Functions",
  },
  "M12:10": {
    why: "Text and numbers are the most common data. JavaScript's handling of both has quirks you need to know before they bite.",
    problem:
      "Building strings with + is messy, 0.1 + 0.2 isn't 0.3, and integers above about 9 quadrillion silently lose precision, which breaks large IDs.",
    how: "Use template literals for building strings, remember that every number is a 64-bit float, and use BigInt when you need exact large integers.",
    tech: [
      "Template literals: `Hello ${name}` insert values and can span lines.",
      "Strings are immutable sequences of UTF-16 code units, so some emoji have length 2 (Main week 1).",
      "All numbers are IEEE 754 doubles: integers are exact only up to Number.MAX_SAFE_INTEGER (2^53 - 1).",
      "NaN (not a number) results from invalid maths and is the only value not equal to itself; check with Number.isNaN.",
      "BigInt (123n) holds integers of any size exactly, but can't be mixed with ordinary numbers without converting.",
    ],
    cost: "Floats make money calculations unsafe (store paise or cents as integers). Large IDs from databases must travel as strings or BigInt, or JSON.parse silently rounds them.",
    tryIt:
      'In the console, run 2 ** 53 + 1, then 2n ** 53n + 1n, then "😀".length.',
    buildsOn: "Main week 1: Information as bits",
  },

  // ---- Week 13: JavaScript, the language II + the runtime ----
  "M13:0": {
    why: "Methods need a way to refer to the object they were called on. In JavaScript the same function can be attached to many objects, so this is decided at call time.",
    problem:
      "Passing a method as a callback (setTimeout(obj.method)) loses its object, so this becomes undefined and the code crashes, a bug every JavaScript developer hits.",
    how: "this is set by how a function is called, following four rules. Arrow functions don't have their own this; they use the surrounding one.",
    tech: [
      "new binding: new Foo() makes this the new object.",
      "Explicit binding: f.call(obj, a, b) and f.apply(obj, [a, b]) call f with this set to obj; f.bind(obj) returns a new function permanently bound to obj.",
      "Implicit binding: obj.method() sets this to obj, the thing before the dot.",
      "Default binding: a plain call f() sets this to undefined in strict mode (or the global object in sloppy mode).",
      "Arrow functions take this from where they were written, which is why they're used for callbacks inside methods.",
    ],
    cost: "this depends on the caller, not the code, so reading a function alone doesn't tell you what it is. That's a common source of bugs, and why many codebases prefer plain functions and closures.",
    tryIt:
      "Create const o = { n: 1, get() { return this.n; } }; then call o.get(), const g = o.get; g(), and o.get.bind(o)() and compare.",
    buildsOn: "Main week 12: Functions",
  },
  "M13:1": {
    why: "JavaScript was designed in 10 days in 1995 with a simple way for objects to share behaviour: instead of classes, an object can point to another object to borrow its properties.",
    problem:
      "Copying every method into every object wastes memory. Objects need a way to share one set of methods, and you need to know where obj.method comes from when it isn't on obj.",
    how: "Every object has a hidden link to another object, its prototype. If a property isn't found on the object, the lookup follows the link, then that object's link, and so on: the prototype chain.",
    tech: [
      "The hidden link is called [[Prototype]]. Read it with Object.getPrototypeOf(obj); __proto__ is an old accessor for the same thing.",
      "Functions have a .prototype property: the object that new will use as the [[Prototype]] of the objects it creates. So new Dog() gets Dog.prototype as its prototype.",
      "Arrays inherit from Array.prototype (where map and filter live), which inherits from Object.prototype (toString, hasOwnProperty).",
      "Object.create(proto) makes a new object with proto as its prototype.",
      "Writing a property always writes to the object itself, never to its prototype, so objects can override shared methods.",
    ],
    cost: "Long chains make lookups slower and harder to trace. Changing a built-in prototype (adding to Array.prototype) affects every array in the program and is considered bad practice.",
    tryIt:
      'In the console, make const arr = [], then run Object.getPrototypeOf(arr) === Array.prototype and arr.hasOwnProperty("map").',
    buildsOn: "Main week 13: this",
  },
  "M13:2": {
    why: "Programmers coming from Java and C# found prototypes awkward. ES2015 added class syntax so the same mechanism could be written in a familiar way.",
    problem:
      "Setting up inheritance with constructor functions and prototypes by hand was verbose and easy to get wrong.",
    how: "class gives a readable syntax for constructor functions and prototype methods. Underneath, it's still prototypes.",
    tech: [
      "class Dog extends Animal { constructor(name) { super(name); } speak() { } } creates a constructor function Dog with speak on Dog.prototype, linked to Animal.prototype.",
      "super(...) calls the parent constructor and must run before using this; super.method() calls the parent's version.",
      "Private fields (#count) can't be accessed from outside the class, enforced by the engine, not by convention.",
      "static methods and fields live on the class itself (Dog.create()), not on instances.",
      'typeof Dog is "function": a class is a special function.',
    ],
    cost: "Classes look like Java's but behave like prototypes, including this rules, so habits from Java can mislead. Deep class hierarchies are as hard to change in JavaScript as anywhere.",
    tryIt:
      "Define a class with a method, then run Object.getOwnPropertyNames(Dog.prototype) and typeof Dog in the console.",
    buildsOn: "Main week 13: Prototypes",
  },
  "M13:3": {
    why: "You're learning Java and JavaScript side by side. They both say class and extends, but the machinery underneath is different, and knowing the difference prevents confusion in both.",
    problem:
      "Assuming JavaScript classes work like Java's leads to bugs with this, with adding methods at runtime, and with type checks.",
    how: "In Java, a class is a fixed blueprint checked by the compiler. In JavaScript, objects inherit directly from other objects at runtime, and class is a convenience on top.",
    tech: [
      "Java: class-based. The class is defined at compile time; an object's class never changes; method calls are checked by the compiler (Java week 5).",
      "JavaScript: prototype-based. Objects link to other objects; you can add or change methods on a prototype while the program runs.",
      "Java's this always means the current object; JavaScript's this depends on how the function was called (Main week 13: this).",
      "Java checks types at compile time; JavaScript at runtime, unless you use TypeScript.",
      "Both pass objects by sharing a reference (Java week 2, Main week 12).",
    ],
    cost: "Neither model is better; each trades flexibility against predictability. JavaScript's flexibility makes monkey-patching possible, and also makes some bugs only show up at runtime.",
    tryIt:
      "Write the same Animal and Dog hierarchy in Java and in JavaScript, then add a new method to Animal at runtime in JavaScript and call it on an existing dog.",
    buildsOn: "Java week 5: Inheritance",
  },
  "M13:4": {
    why: "Many things can be looped over: arrays, strings, maps, sets, lines of a file, pages of an API. JavaScript needed one protocol so for...of works on all of them.",
    problem:
      "Without a common protocol, each collection needs its own looping code, and lazy sequences (computed one item at a time) can't be looped over at all.",
    how: "An object is iterable if it has a Symbol.iterator method returning an iterator: an object with a next() method that returns { value, done }. Generators write iterators for you.",
    tech: [
      "for...of, spread ([...x]) and destructuring all call x[Symbol.iterator]() and then next() until done is true.",
      "Arrays, strings, Map, Set and NodeList are built-in iterables; plain objects aren't (use Object.entries).",
      "function* nums() { yield 1; yield 2; } is a generator: calling it returns an iterator, and the function pauses at each yield until next() is called.",
      "Generators can produce infinite or lazy sequences, computing each value only when asked.",
      "Async generators (async function*) with for await...of handle streams of values that arrive over time.",
    ],
    cost: "Iterators are single-use and one-directional, and generator-based code is unfamiliar to many developers. For simple arrays, plain array methods are clearer.",
    tryIt:
      "Write a generator that yields the Fibonacci numbers forever, and take the first 10 with a for...of loop and a break.",
    buildsOn: "Main week 12: Arrays",
  },
  "M13:5": {
    why: "Programs fail: networks drop, input is bad, files are missing. Code needs a structured way to report and handle failures. Large programs also need to be split into files that share code safely.",
    problem:
      "Errors in asynchronous code can vanish silently if nobody catches them. And without modules, every script shared one global scope, where names collided and load order mattered.",
    how: "Use try/catch/finally and Error objects for failures, including with await. Use ES modules, where each file has its own scope and explicitly imports and exports names.",
    tech: [
      'throw new Error("msg") creates an error with a stack trace. Custom errors extend Error. finally runs whether or not an error occurred.',
      "With async/await, a rejected promise throws at the await, so try/catch works. A promise rejection nobody handles triggers an unhandledrejection event, and Node exits by default.",
      "ES modules (import/export) are static: imports are resolved before the code runs, which lets bundlers remove unused code (tree shaking, Main week 22).",
      "ESM imports are live bindings: if the exporting module changes a value, importers see the change.",
      "CommonJS (require / module.exports), Node's older system, loads files at runtime and copies the exported value at that moment.",
    ],
    cost: "Mixing ESM and CommonJS in Node causes confusing import errors. Catching errors too broadly hides bugs; catch only what you can handle.",
    tryIt:
      "Write an async function that fetches a URL that doesn't exist, call it without try/catch in Node, and read the crash. Then add try/catch.",
    buildsOn: "Java week 6: Exceptions",
  },
  "M13:6": {
    why: "JavaScript runs on a single thread (Main week 8: The main thread), yet it handles timers, network requests and clicks at the same time. The runtime and its event loop make this possible.",
    problem:
      "If JavaScript waited for every network response, the page would freeze for seconds. Callbacks solved that but led to deeply nested, error-prone code (callback hell).",
    how: "Slow work is handed to the browser or to Node, outside JavaScript. When it finishes, a callback is queued, and the event loop runs queued callbacks one at a time whenever the call stack is empty. Promises and async/await make this readable.",
    tech: [
      "The call stack holds the functions currently running (Java week 2: The call stack); the heap holds objects.",
      "Web APIs (timers, fetch, DOM events) or Node's libuv do the waiting outside JavaScript.",
      "The event loop: run one task (a macrotask, such as a timer callback or a click) → run every queued microtask (promise callbacks) → maybe render → take the next task.",
      "A Promise is an object for a future value, pending then fulfilled or rejected; .then chains steps. async/await is syntax over promises: await pauses only that function, and the thread keeps running other code.",
      "Promise.all waits for all (fails if any fails), allSettled for all regardless, race for the first to settle, any for the first success.",
    ],
    cost: "A microtask that keeps queueing microtasks starves rendering and freezes the page. Forgetting await, or running awaits one after another when they could run in parallel with Promise.all, makes code slower.",
    tryIt:
      "Predict, then run: console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);",
    buildsOn: "Main week 3: I/O models",
  },
  "M13:7": {
    why: "JavaScript is dynamically typed, which used to make it slow. Engines such as V8 (in Chrome and Node) got fast by watching how code actually runs and compiling the hot parts.",
    problem:
      "An engine can't compile JavaScript well ahead of time, because the same variable might hold a number now and a string later.",
    how: "Start quickly with an interpreter, collect information about the types actually seen, compile hot functions to optimised machine code based on those observations, and fall back if the assumptions break.",
    tech: [
      "The parser turns source into an AST (abstract syntax tree, a tree form of the code); Ignition, V8's interpreter, compiles that to bytecode and runs it.",
      "Hot functions are compiled by TurboFan into optimised machine code that assumes the types seen so far. If a different type shows up, V8 deoptimises back to bytecode.",
      "Hidden classes (shapes): objects created with the same properties in the same order share a shape, so property positions are known.",
      "Inline caches remember the shape seen at each property access, making repeated accesses nearly as fast as in C.",
      "Garbage collection is generational, like the JVM's (Java week 9): most objects die young in a small, quickly collected area; survivors move to the old generation, collected by mark-and-sweep.",
    ],
    cost: "Code that keeps changing object shapes or argument types defeats optimisation and can run many times slower. JIT compilation costs memory and warm-up time.",
    tryIt:
      "Run node --trace-opt --trace-deopt on a small file with a hot function, then call it once with a string instead of a number and find the deoptimisation in the output.",
    buildsOn: "Java week 9: Bytecode interpretation and the JIT compiler",
  },

  // ---- Week 14: The DOM, Web APIs and TypeScript ----
  "M14:0": {
    why: "HTML arrives once, but pages need to change after loading: new messages, a menu opening, a list growing. The DOM is how JavaScript reads and changes the page.",
    problem:
      "Without an API to the page, every change would need a full reload from the server. And inserting user text as HTML lets attackers run their own scripts on your page.",
    how: "The browser exposes the parsed page as a tree of objects (the DOM, Main week 8). JavaScript selects nodes, creates new ones and changes them, and the browser re-renders what changed.",
    tech: [
      'Select: document.querySelector(".item") returns the first match; querySelectorAll returns all matches.',
      'Create and insert: const li = document.createElement("li"); list.append(li); remove with li.remove().',
      "textContent sets text safely: anything that looks like a tag is shown as text.",
      "innerHTML parses a string as HTML, so inserting user input with it lets an attacker inject <img onerror=...> and run code (XSS, Main week 7).",
      "Each change can trigger style, layout and paint (Main week 8), so batch changes, for example by building a DocumentFragment and appending it once.",
    ],
    cost: "Manual DOM updates get complicated as the UI grows, because you must keep the page and your data in sync yourself. That pain is the reason frameworks such as React exist (Main week 23).",
    tryIt:
      'On any page, run document.body.innerHTML += "<img src=x onerror=alert(1)>" in the console, then do the same with textContent and compare.',
    buildsOn: "Main week 8: The critical rendering path",
  },
  "M14:1": {
    why: "Pages react to people: clicks, key presses, scrolling, form submissions. Events are how the browser tells your code that something happened.",
    problem:
      "A list with 1,000 items and a listener on each wastes memory, and items added later have no listener. A form's default submission reloads the page when you wanted to handle it in JavaScript.",
    how: "Register listeners for events. Each event travels down the tree to its target and back up, so a single listener on a parent can handle events from all its children (event delegation).",
    tech: [
      'el.addEventListener("click", handler) runs handler with an event object holding the target, coordinates, keys and more.',
      "Propagation has three phases: capture (from window down to the target), target, then bubble (back up to window). Listeners run during bubble by default.",
      "event.preventDefault() stops the browser's default action (following a link, submitting a form); event.stopPropagation() stops the event travelling further.",
      'Event delegation: one listener on the <ul> checks event.target.closest("li") to handle clicks on any item, including items added later.',
      "Remove listeners you no longer need with removeEventListener or an AbortController signal, or they keep their closures alive (Main week 12: Closures).",
    ],
    cost: "stopPropagation can break other code that relies on bubbling, such as analytics or menus that close on outside clicks. Delegated handlers need care to find the right element.",
    tryIt:
      "Put click listeners on a button and on its parent div, once with capture: true and once without, and log the order they fire in.",
    buildsOn: "Main week 14: DOM API",
  },
  "M14:2": {
    why: "Browsers provide many built-in APIs beyond the DOM: making requests, parsing URLs, timers, watching elements. Using them saves code and is usually faster than libraries.",
    problem:
      "Hand-built URL strings break on special characters, requests can't be cancelled when the user moves on, and checking element positions on every scroll is slow.",
    how: "Use the platform's purpose-built APIs: fetch for HTTP, URL for building URLs, FormData for forms, and observers that tell you when something changes instead of you polling for it.",
    tech: [
      "fetch(url, options) returns a promise of a Response; check response.ok, because 404 and 500 don't reject. An AbortController's signal cancels a request.",
      'new URL("/search", base) builds URLs safely; url.searchParams.set("q", "a&b") encodes values correctly.',
      "new FormData(form) collects a form's fields, ready to send with fetch.",
      "setTimeout and setInterval schedule callbacks as tasks (Main week 13: The runtime); delays are minimums, not guarantees.",
      "IntersectionObserver reports when an element enters or leaves the viewport (lazy loading, infinite scroll); ResizeObserver reports when an element's size changes.",
    ],
    cost: "fetch doesn't time out by default and doesn't reject on HTTP errors, two common surprises. Some newer APIs need checking for browser support.",
    tryIt:
      'In the console, start const c = new AbortController(); fetch("https://httpbin.org/delay/5", { signal: c.signal }); then call c.abort() and read the error.',
    buildsOn: "Main week 7: HTTP/1.1 message anatomy",
  },
  "M14:3": {
    why: "Web apps need to remember things in the browser: a login session, user preferences, a shopping cart, offline data.",
    problem:
      "Each storage option has different limits and risks. Putting a login token in localStorage exposes it to any injected script, and storing large data synchronously freezes the page.",
    how: "Pick storage by need: cookies for small data the server must see, localStorage and sessionStorage for small client-only data, and IndexedDB for large structured data.",
    tech: [
      "Cookies (Main week 7): about 4 KB each, sent automatically with every request to the site; HttpOnly ones can't be read by JavaScript, which makes them the safer place for session IDs.",
      "localStorage: about 5 MB per origin, strings only, synchronous (it blocks the main thread), and kept until cleared. Any script on the page can read it.",
      "sessionStorage: the same API, but per tab and cleared when the tab closes.",
      "IndexedDB: an asynchronous database in the browser for large structured data and files, often hundreds of MB, used for offline apps.",
      "All are scoped to an origin (scheme + host + port), and browsers may clear them under storage pressure or in private mode.",
    ],
    cost: "Anything stored client-side can be read by an XSS attack (except HttpOnly cookies) and can disappear. Never treat browser storage as the only copy of important data.",
    tryIt:
      'In DevTools, Application tab, look at a site\'s cookies, localStorage and IndexedDB, then run localStorage.setItem("x", "1") and find it there.',
    buildsOn: "Main week 7: Cookies",
  },
  "M14:4": {
    why: "JavaScript on a page runs on the main thread, which also handles input and rendering (Main week 8: The main thread). Heavy computation there freezes the page.",
    problem:
      "Parsing a large file, resizing an image or running a complex calculation in the page makes it unresponsive for seconds.",
    how: "Run the heavy work in a Web Worker: a separate JavaScript thread with its own event loop. The page and the worker talk by sending messages.",
    tech: [
      'const w = new Worker("worker.js", { type: "module" }); starts a worker on another OS thread (Main week 2: Threads).',
      "w.postMessage(data) sends data; the worker replies with postMessage, received in an onmessage handler.",
      "Messages are copied using the structured clone algorithm. Large binary data can be transferred instead of copied, which moves ownership with no copy.",
      "Workers have no access to the DOM or window, but can use fetch, timers and IndexedDB.",
      "SharedArrayBuffer and Atomics allow true shared memory between threads, with the same race conditions as any threads (Main week 3: Concurrency).",
    ],
    cost: "Starting a worker and copying data to it cost time, so it only pays off for real work. Code is split across files and message passing makes it harder to follow.",
    tryIt:
      "Run a 3-second busy loop on the main thread and try to type in an input; then move the loop into a worker and try again.",
    buildsOn: "Main week 8: The main thread",
  },
  "M14:5": {
    why: "Websites used to be useless offline or on a flaky connection, while installed apps kept working. Service workers let web apps behave more like installed ones.",
    problem:
      "Without control over the network, a web page can't serve itself from a cache when offline, can't make repeat visits instant, and can't receive push notifications.",
    how: "A service worker is a script that sits between your page and the network like a programmable proxy. It can answer requests from a cache, fetch them, or do both.",
    tech: [
      'It\'s registered with navigator.serviceWorker.register("/sw.js") and runs separately from the page, even after the page closes.',
      "Lifecycle: install (pre-cache the app's files), activate (clean up old caches), then fetch events for every request the page makes.",
      "In the fetch handler, the Cache API lets you choose a strategy: cache first (fast, maybe stale), network first (fresh, slower) or stale-while-revalidate (serve the cache, update it in the background).",
      "Service workers require HTTPS and only control pages within their scope.",
      "Together with a web app manifest, they make a progressive web app (PWA) that can be installed and work offline.",
    ],
    cost: "Caching bugs are painful: a broken service worker can keep serving old files to users until it updates. Updating needs a careful versioning strategy.",
    tryIt:
      "In DevTools, Application tab, Service workers, find a site that uses one (many news and documentation sites do), tick Offline and reload.",
    buildsOn: "Main week 7: Caching",
  },
  "M14:6": {
    why: "JavaScript finds type mistakes only when the faulty line runs, often in front of users. As codebases grew to millions of lines, teams needed those mistakes caught earlier.",
    problem:
      "Renaming a field or passing the wrong argument type breaks code far away, and nothing tells you until that path runs in production.",
    how: "TypeScript adds type annotations to JavaScript and checks them before the code runs. Then it removes the types and outputs plain JavaScript, so nothing changes at runtime.",
    tech: [
      "Types are erased: the output contains no type information, so TypeScript can't check data arriving at runtime (from an API or a form). Validate that with a schema library such as Zod.",
      'Building blocks: string, number, boolean, arrays (string[]), unions ("a" | "b"), intersections (A & B) and literal types. type and interface both describe object shapes.',
      'Narrowing: inside if (typeof x === "string"), x is known to be a string. A discriminated union (a shared kind field) narrows objects in a switch.',
      "unknown is a value you must check before using; any switches checking off, so avoid it. never is a value that can't exist, used to prove a switch is exhaustive.",
      "Generics (function first<T>(xs: T[]): T) work like Java's (Java week 7). Utility types such as Partial, Pick, Omit and Record derive new types from existing ones. In tsconfig.json, always set strict: true.",
    ],
    cost: "Types take time to write and learn, and complex generic types can become hard to read. Type checks can give false confidence about data from outside, which still needs runtime validation.",
    tryIt:
      "In the TypeScript Playground (typescriptlang.org/play), write a function that takes a string, call it with a number, read the error, then look at the JavaScript output panel.",
    buildsOn: "Java week 7: Generics",
  },
  "M14:7": {
    why: "As soon as code has tests and a type checker, someone has to run them on every change. People forget, so teams let a server do it automatically.",
    problem:
      "Without automation, a broken test or a type error is found days later, after other work has piled on top, and nobody knows which change caused it.",
    how: "Continuous integration (CI) runs your checks automatically on every push and pull request, and marks the change red or green. GitHub Actions is GitHub's built-in CI.",
    tech: [
      "A workflow is a YAML file in .github/workflows/ describing when to run (on: push, pull_request) and what to run.",
      "A job runs on a fresh virtual machine (runs-on: ubuntu-latest) and has steps: check out the code, install Node, install dependencies, then run lint, the type check and the tests.",
      "If any step exits with a non-zero code (Main week 4: Shell fundamentals), the job fails and GitHub shows a red cross on the commit and the pull request.",
      "Caching dependencies (actions/setup-node with cache: npm) makes runs faster.",
      "Branch protection can require CI to pass before anything merges into main.",
    ],
    cost: "CI minutes cost money beyond the free tier, and slow or flaky pipelines make developers wait or start ignoring failures. Keep the pipeline fast and fix flaky tests immediately.",
    tryIt:
      "Add a workflow that runs npm test to your foundations repo, push a commit with a failing test, and watch the red cross appear on GitHub.",
    buildsOn: "Main week 5: Team workflows",
  },
};
