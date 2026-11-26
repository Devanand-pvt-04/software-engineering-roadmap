import type { ExplainMap } from "./types";

// Ground-up explainers for Java + DSA Part B, object-oriented design (J37-J39). Keys: J<week>:<Must know topic index>.
export const EXPLAIN_JAVA_PART_B: ExplainMap = {
  // ---- Week 37: Design patterns that matter ----
  "J37:0": {
    why: "Programmers kept solving the same design problems again and again. Patterns give those solutions names, so they can be recognised and discussed quickly.",
    problem:
      "Without shared names, every developer reinvents solutions and explains them from scratch, and beginners copy patterns into code that doesn't need them, making it harder to read.",
    how: "A pattern is a named, proven solution to a recurring design problem, described together with when it fits and what it costs. You apply the idea, adapted to the code in front of you.",
    tech: [
      "Each pattern has a problem it solves, a solution structure, and consequences (trade-offs).",
      "The classic catalogue (the 'Gang of Four' book, 1994) groups them as creational, structural and behavioural.",
      "Patterns are a vocabulary: 'use a Strategy here' says a lot in three words.",
      "Use a pattern when its problem actually appears; adding one 'just in case' adds indirection with no benefit.",
      "Many patterns were workarounds for missing language features and are simpler in modern Java.",
    ],
    cost: "Every pattern adds classes and indirection. Overusing them produces code that's harder to follow than the simple version.",
    tryIt:
      "Look through one of your Part A projects and find a place where one class switches on a type or mode; note which pattern would remove the switch, and whether it's worth it.",
    buildsOn: "Java week 6: First design patterns",
  },
  "J37:1": {
    why: "Creating objects sounds trivial, but deciding which class to create, and with what settings, often shouldn't be hard-coded where the object is used.",
    problem:
      "Calling new ConcreteClass(...) everywhere ties code to specific classes, constructors with many parameters are unreadable, and global single instances make testing painful.",
    how: "Creational patterns move object creation behind a method or a separate object, so callers ask for what they need without knowing exactly how it's built.",
    tech: [
      "Factory Method: a method decides which subclass to create, such as Notification.of(type).",
      "Abstract Factory: an object that creates a family of related objects that must match (all the widgets for one UI theme).",
      "Builder: build an object step by step with named methods, ending in build(); great for many optional fields (Java week 6: First design patterns).",
      "Singleton: exactly one instance with global access; it hides dependencies and makes tests share state.",
      "Dependency injection usually replaces Singleton: create one instance at startup and pass it to whoever needs it (Spring does this for you).",
    ],
    cost: "Factories and builders add code and an extra place to look; for simple objects, a constructor is clearer.",
    tryIt:
      "Write a Pizza class with 6 optional toppings using a Builder, then compare its creation code with a 6-parameter constructor call.",
    buildsOn: "Java week 6: First design patterns",
  },
  "J37:2": {
    why: "Real code must fit together pieces that weren't designed for each other, add behaviour without editing classes, and hide complicated subsystems.",
    problem:
      "A library's interface doesn't match yours, adding logging or caching to many classes means editing all of them, and callers drown in details of a complex subsystem.",
    how: "Structural patterns wrap or combine objects to change how they look or behave from the outside, without changing the objects themselves.",
    tech: [
      "Adapter: wraps an object to give it the interface the caller expects (a third-party payment client adapted to your PaymentGateway interface).",
      "Decorator: wraps an object with the same interface and adds behaviour, and wrappers can stack (a caching repository around a real one).",
      "Facade: one simple class in front of a complex subsystem (a VideoConverter hiding codecs and buffers).",
      "Proxy: a stand-in with the same interface that controls access: lazy loading, remote calls, security checks.",
      "Composite: treats a single object and a group of objects the same way (a file and a folder both have size()).",
    ],
    cost: "Layers of wrappers make stack traces long and behaviour harder to trace, and Decorator and Proxy can look identical, which confuses readers.",
    tryIt:
      "Write a Repository interface with a slow in-memory implementation, then add a caching Decorator and a timing Decorator and stack both.",
    buildsOn: "Java week 5: Interfaces",
  },
  "J37:3": {
    why: "Much design is about who decides what happens and how objects tell each other about changes. Behavioural patterns cover the common shapes.",
    problem:
      "Large if/else or switch blocks choose behaviour, objects poll each other for changes, and request-handling steps are tangled together.",
    how: "Behavioural patterns move each varying behaviour into its own object, so it can be swapped, queued, chained or notified independently.",
    tech: [
      "Strategy: interchangeable algorithms behind one interface (pricing rules). Observer: subscribers are notified when a subject changes (Java week 6: First design patterns).",
      "Command: a request wrapped as an object, so it can be queued, logged or undone.",
      "State: an object's behaviour changes with its state, each state being its own class (an order that is Pending, Paid or Shipped).",
      "Template Method: a base class fixes the steps of an algorithm and subclasses fill in some of them.",
      "Iterator: walk a collection without knowing its structure. Chain of Responsibility: pass a request along handlers until one deals with it (servlet filters, middleware).",
    ],
    cost: "Spreading behaviour across many small classes makes the overall flow harder to see in one place.",
    tryIt:
      "Model a document's Draft, Review and Published states, first with a switch statement and then with the State pattern, and compare how adding an Archived state feels.",
    buildsOn: "Java week 37: Creational patterns",
  },
  "J37:4": {
    why: "You already use patterns every day through the JDK and frameworks. Recognising them makes those APIs much easier to understand.",
    problem:
      "APIs like new BufferedReader(new InputStreamReader(System.in)) or Spring's magic behaviour seem arbitrary until you see the pattern behind them.",
    how: "Spot the pattern in familiar APIs: what it wraps, what it hides and what it lets you swap.",
    tech: [
      "Iterator: every Collection's iterator(), and the for-each loop built on it.",
      "Decorator: java.io streams, where BufferedInputStream wraps a FileInputStream and adds buffering.",
      "Proxy: Spring wraps your beans in proxies to add transactions, security and caching around method calls (Java week 40 shows this).",
      "Template Method: Spring's JdbcTemplate runs connection, statement and cleanup steps, and you supply only the query and row mapping.",
      "Factory: List.of(...), Executors.newFixedThreadPool(...) and Calendar.getInstance() decide which class to create.",
    ],
    cost: "Framework patterns are mostly hidden, so when they misbehave (a proxy that doesn't apply to a self-call) you need to know they're there.",
    tryIt:
      "Open the JDK source of BufferedInputStream in your IDE and find the field holding the stream it wraps.",
    buildsOn: "Java week 37: Structural patterns",
  },
  "J37:5": {
    why: "Many classic patterns exist because older Java couldn't pass behaviour around or describe data shapes concisely. Modern Java can.",
    problem:
      "Writing a whole class for each one-method Strategy or Command, or a Visitor hierarchy to handle each type in a closed set, is a lot of code for a simple idea.",
    how: "Use lambdas and method references where a pattern only needs one function, and sealed interfaces with records and pattern-matching switch where you handle a fixed set of types.",
    tech: [
      "A Strategy with one method is just a functional interface: Comparator<T>, Function<A, B>, or your own; pass a lambda (Java week 8: Functional programming in Java).",
      "A Command can be a Runnable or Supplier stored in a list or queue.",
      "A sealed interface lists all its implementations: sealed interface Shape permits Circle, Square {}.",
      "Records give concise immutable data classes: record Circle(double r) implements Shape {}.",
      "A switch with pattern matching handles each case, and the compiler checks that none are missing, replacing many Visitor uses.",
    ],
    cost: "Lambdas can hide complex behaviour inline, and sealed hierarchies are harder to extend by others, which is the point but sometimes a limitation.",
    tryIt:
      "Rewrite a Strategy pattern from your code as lambdas, then write a sealed Shape hierarchy with records and an area() function using switch pattern matching.",
    buildsOn: "Java week 8: Functional programming in Java",
  },

  // ---- Week 38: Low-level design I: the method and first case studies ----
  "J38:0": {
    why: "Low-level design (LLD) interviews ask you to design classes for a parking lot or a library in 45 minutes. A fixed method keeps you from freezing or rambling.",
    problem:
      "Jumping straight into code produces a tangle of classes that can't handle the next requirement, and you run out of time before showing a design.",
    how: "Move through the same steps every time: clarify, find entities and behaviours, assign responsibilities, draw the class diagram, write the core code, and walk through use cases.",
    tech: [
      "Clarify requirements and scope: which features, how many users, what's out of scope.",
      "Find nouns (candidate classes: Vehicle, Spot, Ticket) and verbs (behaviours: park, pay, exit).",
      "Assign each behaviour to the class that owns the data it needs.",
      "Draw a class diagram with relationships and multiplicities (Java week 6: Reading and drawing UML class diagrams).",
      "Write the core classes and the key methods, not every getter.",
      "Walk through 2 or 3 use cases end to end to check the design works.",
    ],
    cost: "A method can feel slow for simple problems, but skipping steps is how interview designs fall apart.",
    tryIt:
      "Design a parking lot in 45 minutes following the six steps, and record yourself explaining each step.",
    buildsOn: "Java week 6: Reading and drawing UML class diagrams",
  },
  "J38:1": {
    why: "The main question in object design is which class should do what. Getting that right makes code easy to change; getting it wrong spreads every change everywhere.",
    problem:
      "Classes that only hold data, with the logic in big 'manager' classes, mean every rule is somewhere other than the data it protects.",
    how: "Give each class one clear responsibility (one reason to change), and put behaviour with the data it uses: tell objects what to do rather than asking for their data and deciding for them.",
    tech: [
      "Single Responsibility: a class should change for one kind of reason, such as pricing rules, not pricing and persistence and display.",
      "Tell, don't ask: account.withdraw(50) rather than if (account.getBalance() >= 50) account.setBalance(...).",
      "The object holding the data enforces its own rules (invariants) (Java week 4: Encapsulation).",
      "Information expert: assign a responsibility to the class with the information to fulfil it.",
      "Watch for 'Manager', 'Helper' and 'Util' classes doing everything; they usually hide missing objects.",
    ],
    cost: "Fine-grained responsibilities can produce many small classes, and judging 'one reason to change' takes experience.",
    tryIt:
      "Take a class from your projects that has many getters used by another class, and move the logic into the class that owns the data.",
    buildsOn: "Java week 6: SOLID",
  },
  "J38:2": {
    why: "Requirements change most in predictable places: how customers pay, how prices are calculated, how users are notified. Interfaces let those parts be swapped.",
    problem:
      "If the checkout code calls a specific CardPayment class directly, adding PayPal means editing checkout, and testing means charging real cards.",
    how: "Define an interface for each part likely to vary, have the core depend only on that interface, and write one implementation per variant.",
    tech: [
      "interface PaymentMethod { Receipt pay(Money amount); } with CardPayment and WalletPayment implementations.",
      "interface PricingRule { Money apply(Order o); } so discounts can be combined and added.",
      "interface NotificationChannel { void send(User u, String msg); } for email, SMS and push.",
      "The core receives implementations through its constructor (dependency injection).",
      "Tests pass in fakes, so no real payments or messages happen.",
    ],
    cost: "An interface with only one implementation forever is extra indirection; add interfaces where variation is real or likely.",
    tryIt:
      "Design a checkout with PaymentMethod and PricingRule interfaces, implement two of each, and write a test using a fake payment method.",
    buildsOn: "Java week 5: Interfaces",
  },
  "J38:3": {
    why: "Choosing between enums, records, value objects and entities shapes how safe and readable a design is.",
    problem:
      "Using strings for fixed choices allows typos, using mutable classes for simple values causes sharing bugs, and treating everything as an entity with an id adds needless complexity.",
    how: "Use enums for fixed sets of options, records or value objects for immutable values compared by content, and entities for things with an identity that persists as their data changes.",
    tech: [
      "enum VehicleType { CAR, BIKE, TRUCK }: the compiler rejects anything else, and enums can carry fields and methods.",
      "record Money(long cents, Currency currency) {}: immutable, with equals and hashCode based on its values.",
      "Value objects can validate in their constructor, so an invalid Money can never exist.",
      "Entities (a User, a Booking) have an id; two bookings with the same details are still different bookings.",
      "Prefer immutable values: they're safe to share and to use as map keys (Java week 5: The Object class).",
    ],
    cost: "Records can't be extended or have mutable state, and adding a value to an enum means recompiling all code that uses it.",
    tryIt:
      "Model a parking ticket with an enum for spot size, a record for the money amount and a Ticket entity with an id, and use the Money record as a HashMap key.",
    buildsOn: "Java week 5: The Object class",
  },
  "J38:4": {
    why: "Interviewers almost always ask 'now add X'. A good design takes the change by adding code, not rewriting what's there.",
    problem:
      "Designs built around switch statements and hard-coded types need edits in many places for every new feature, which is risky and slow.",
    how: "Apply the Open/Closed principle where change is likely: the core is closed for modification but open for extension, through interfaces, new classes and configuration.",
    tech: [
      "Common follow-ups: a new vehicle type, a new pricing rule, a new payment method, a new notification channel, multiple floors.",
      "If adding a feature means adding a class that implements an existing interface, the design passes.",
      "If it means editing a switch in several places, refactor to polymorphism (Java week 5: Polymorphism).",
      "Use registries or maps of strategies, keyed by type, instead of conditionals.",
      "Name the trade-off: designing for every possible change makes code complex, so extend where change is plausible.",
    ],
    cost: "Extensibility costs indirection, and guessing the wrong axis of change makes code harder to change in the direction that actually comes.",
    tryIt:
      "Add electric vehicle charging spots to your parking lot design and count how many existing classes you had to edit.",
    buildsOn: "Java week 6: SOLID",
  },
  "J38:5": {
    why: "Real systems have many users at once. Even a simple design must not sell the same seat or spot twice.",
    problem:
      "Two threads both check that a spot is free, both see 'yes', and both assign it, so two cars get the same spot (a race condition).",
    how: "Make the check and the update one atomic step, using locks, atomic operations or concurrent collections, or by letting a database constraint enforce uniqueness.",
    tech: [
      "Check-then-act is the classic race: if (spot.isFree()) spot.assign(car) isn't atomic.",
      "synchronized methods or a ReentrantLock make the check and assign happen together.",
      "ConcurrentHashMap.putIfAbsent or computeIfAbsent do atomic check-and-insert.",
      "AtomicInteger and compareAndSet for simple counters and flags.",
      "In real systems, a database unique constraint or a conditional update (UPDATE ... WHERE status = 'FREE') does the same job across many servers (the concurrency week in Part E goes deeper).",
    ],
    cost: "Locks reduce parallelism and can deadlock if taken in different orders; too coarse a lock makes everything wait.",
    tryIt:
      "Write a test where 100 threads try to book the same seat at once with a naive check-then-act, count the double bookings, then fix it with putIfAbsent.",
    buildsOn: "Java week 38: Modelling with interfaces",
  },

  // ---- Week 39: Low-level design II: harder case studies ----
  "J39:0": {
    why: "Splitting shared expenses (as in Splitwise) is a common LLD question because it combines clean modelling with a real algorithm.",
    problem:
      "After many shared expenses, everyone owes everyone small amounts, and settling them one by one takes far more payments than needed.",
    how: "Model expenses and splits cleanly, keep each person's net balance, and settle by matching the biggest debtors with the biggest creditors to reduce the number of payments.",
    tech: [
      "Expense: who paid, the amount, and a split strategy (equal, exact amounts, percentages), the split being a Strategy interface.",
      "Net balance per person = total paid − total owed; balances always sum to zero.",
      "The balances form a graph of who owes whom; simplifying keeps only net amounts.",
      "Greedy settling: repeatedly match the largest creditor with the largest debtor, using two priority queues (Java week 7: Implementations and their costs).",
      "Use integer cents to avoid rounding errors, and assign leftover cents deterministically.",
    ],
    cost: "Finding the true minimum number of payments is NP-hard in general; the greedy approach is good, not always optimal.",
    tryIt:
      "Implement equal and percentage splits, add 10 expenses among 4 people, and print the simplified settlements.",
    buildsOn: "Java week 38: The LLD method",
  },
  "J39:1": {
    why: "Booking systems (cinemas, flights, hotels) must let users pick something, pay, and never sell it twice, while many users compete for the same items.",
    problem:
      "If seats are only marked sold after payment, two users can both pay for the same seat; if they're marked sold as soon as they're picked, abandoned carts lock seats forever.",
    how: "Put a temporary hold on selected seats that expires after a few minutes, confirm the booking only after payment succeeds within the hold, and release expired holds automatically.",
    tech: [
      "Seat states: AVAILABLE, HELD (with holder and expiry time), BOOKED.",
      "Holding must be atomic: only one user can move a seat from AVAILABLE to HELD (Java week 38: Concurrency in LLD).",
      "Confirm only if the hold is still valid and belongs to this user.",
      "Expired holds are released by checking expiry on read, or by a scheduled cleanup task.",
      "Use an injected Clock so expiry can be tested (Java week 39: Designing for testability).",
    ],
    cost: "Holds reduce availability during busy periods, and the expiry time is a business trade-off between conversion and fairness.",
    tryIt:
      "Implement hold, confirm and expire for a small cinema hall, and test two concurrent users holding the same seat and a hold that expires before payment.",
    buildsOn: "Java week 38: Concurrency in LLD",
  },
  "J39:2": {
    why: "Elevator and scheduling problems test whether you can separate the mechanics of a system from the policy that decides what it does.",
    problem:
      "Hard-coding one dispatch rule into the elevator classes means trying a better rule requires rewriting them.",
    how: "Model elevators, floors and requests as classes, and put the decision of which car serves which request behind a swappable strategy.",
    tech: [
      "Elevator: current floor, direction, state (moving, idle, doors open) and a queue of stops.",
      "Requests: from a floor (with a direction) or from inside a car (to a floor).",
      "interface DispatchStrategy { Elevator choose(Request r, List<Elevator> cars); }",
      "Nearest car: pick the closest idle or passing car. Direction-aware (SCAN): keep moving one way serving requests, then reverse.",
      "The State pattern fits the elevator's own modes (Java week 37: Behavioural patterns).",
    ],
    cost: "Simulations with timing and concurrency become complex quickly; in an interview, keep the time model simple and explain the assumptions.",
    tryIt:
      "Implement nearest-car and direction-aware strategies, run the same 50 random requests through both, and compare the average wait.",
    buildsOn: "Java week 37: Behavioural patterns",
  },
  "J39:3": {
    why: "Rate limiters and LRU caches are classic interview designs that combine data structures, clean interfaces and thread safety.",
    problem:
      "A naive limiter or cache works for one thread but gives wrong results under concurrency, and mixing the algorithm with the callers' code makes both hard to change.",
    how: "Hide each behind a small interface, implement the core algorithm with the right data structures, then make it thread-safe with java.util.concurrent tools.",
    tech: [
      "interface RateLimiter { boolean tryAcquire(String key); } with token bucket or sliding window implementations.",
      "Token bucket: tokens refill at a fixed rate up to a capacity, and each request takes one.",
      "LRU cache: a HashMap for O(1) lookup plus a doubly linked list for recency order; LinkedHashMap with accessOrder = true gives this almost for free (you'll build a linked list yourself in Part C).",
      "Thread safety: ConcurrentHashMap for per-key state, plus a lock or synchronized block per key or around the list.",
      "Inject a Clock so refills and timeouts can be tested.",
    ],
    cost: "Coarse locks limit throughput, finer locking is error-prone, and in-memory designs don't work across several servers (Redis does that, Main week 35).",
    tryIt:
      "Implement an LRU cache with HashMap and your own doubly linked list, then a thread-safe version, and test it with 8 threads.",
    buildsOn: "Java week 7: Implementations and their costs",
  },
  "J39:4": {
    why: "Code that reads the current time or random numbers directly gives different results every run, so its tests are flaky or impossible.",
    problem:
      "You can't test that a hold expires after 10 minutes without waiting 10 minutes, or that a shuffle works without controlling the random numbers.",
    how: "Pass time and randomness in as dependencies, a java.time.Clock and a Random or supplier, so tests can supply fixed or controllable versions.",
    tech: [
      "Use Instant.now(clock) instead of Instant.now(); production passes Clock.systemUTC().",
      "Tests use Clock.fixed(...) or a mutable test clock they can advance by 10 minutes instantly.",
      "Pass a Random with a fixed seed (new Random(42)) so results repeat exactly.",
      "The same idea applies to IDs (an id generator), file systems and network calls.",
      "This is dependency injection used for determinism.",
    ],
    cost: "Extra constructor parameters, and the temptation to skip it for 'just one' Instant.now() call that later breaks a test.",
    tryIt:
      "Change your booking system to take a Clock, write a test that holds a seat, advances the clock 11 minutes, and checks the hold expired.",
    buildsOn: "Java week 9: Testing with JUnit",
  },
};
