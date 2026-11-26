import type { ExplainMap } from "./types";

// Ground-up explainers for Java + DSA Part D, Java backend with Spring Boot (J40-J42). Keys: J<week>:<Must know topic index>.
export const EXPLAIN_JAVA_PART_D: ExplainMap = {
  // ---- Week 40: Spring Boot I: the framework, dependency injection and REST ----
  "J40:0": {
    why: "Spring is the most widely used Java backend framework. Its core idea is letting the framework create and connect your objects.",
    problem:
      "In a large app, every class creating its own dependencies with new ties it to specific implementations, repeats setup code, and makes testing with fakes hard.",
    how: "Inversion of control: your classes declare what they need, usually as interfaces in their constructor, and the framework creates the implementations and passes them in (dependency injection).",
    tech: [
      "Without IoC: OrderService creates new JdbcOrderRepository(new DataSource(...)) itself.",
      "With IoC: OrderService(OrderRepository repo) only declares the dependency, and Spring supplies one.",
      "Classes depend on interfaces, so implementations can be swapped (Java week 38: Modelling with interfaces).",
      "The framework controls object lifecycles: creation, configuration and shutdown.",
      "The same idea powers NestJS on the Main track (Main week 41: Dependency injection).",
    ],
    cost: "Wiring happens out of sight, so errors appear at startup with long messages, and it can be hard to see where an object came from.",
    tryIt:
      "Write a small app wiring three classes by hand in main, then let Spring do it, and compare the two.",
    buildsOn: "Java week 38: Modelling with interfaces",
  },
  "J40:1": {
    why: "The application context is Spring's container. Knowing how it finds and builds objects explains most Spring behaviour and errors.",
    problem:
      "Spring needs to know which classes to manage, how to create them, and which implementation to inject where.",
    how: "At startup, Spring scans your packages for annotated classes, creates one object (a bean) for each, and injects beans into each other's constructors by type.",
    tech: [
      "The application context holds all beans and their dependencies.",
      "Component scanning finds classes annotated with @Component or its specialisations under your main class's package.",
      "@Service marks business logic, @Repository marks data access (and translates database exceptions), and @Controller or @RestController handles web requests.",
      "Constructor injection: with a single constructor, Spring injects its parameters automatically; fields can be final.",
      "Beans are singletons by default: one shared instance, so they must not hold per-request state.",
      "@Bean methods in a @Configuration class create beans for classes you can't annotate, such as library classes.",
    ],
    cost: "Two beans of the same type cause 'expected single matching bean' errors that need @Primary or @Qualifier, and classes outside the scanned package are silently ignored.",
    tryIt:
      "Create two implementations of one interface as beans, read the startup error, and fix it with @Primary and then with @Qualifier.",
    buildsOn: "Java week 40: What Spring solves",
  },
  "J40:2": {
    why: "Plain Spring needed a lot of configuration before you could serve a single request. Spring Boot removes almost all of it.",
    problem:
      "Setting up a web server, JSON handling, database connections and logging by hand meant pages of configuration that differed slightly in every project.",
    how: "Spring Boot uses starters (dependency bundles) and auto-configuration (sensible defaults that switch on when a library is present), runs an embedded server, and reads settings from application.yml.",
    tech: [
      "Starters: spring-boot-starter-web brings Spring MVC, Jackson and an embedded Tomcat in one dependency.",
      "Auto-configuration: if a library is on the classpath and you haven't defined the bean yourself, Boot configures it for you.",
      "application.yml (or .properties) holds settings such as server.port and database URLs; environment variables override them.",
      "Profiles: application-dev.yml and application-prod.yml, chosen with spring.profiles.active.",
      "The app is a single runnable JAR with the server inside: java -jar app.jar.",
      "Current versions are Spring Boot 4 on Spring Framework 7, requiring Java 17 or later.",
    ],
    cost: "Auto-configuration feels like magic until it guesses wrong; then you need --debug or the conditions report to see why.",
    tryIt:
      "Start an app with --debug and read the conditions report to see which auto-configurations were applied and which were skipped.",
    buildsOn: "Java week 40: The application context",
  },
  "J40:3": {
    why: "Most Spring Boot services expose a REST API. Controllers map HTTP requests to Java methods.",
    problem:
      "Parsing URLs, reading JSON bodies, setting status codes and turning errors into responses by hand is repetitive and error-prone.",
    how: "Annotate a class with @RestController and its methods with mappings; Spring parses parameters and bodies into Java objects and turns return values and exceptions into HTTP responses.",
    tech: [
      "@RestController combines @Controller and @ResponseBody, so return values are written as JSON.",
      '@GetMapping("/orders/{id}") with @PathVariable long id; @RequestParam for query parameters.',
      "@RequestBody CreateOrder req maps JSON to a record such as record CreateOrder(String item, int qty) {}.",
      "ResponseEntity.status(201).body(order), or @ResponseStatus, sets status codes (Main week 16: REST design).",
      "@RestControllerAdvice with @ExceptionHandler methods turns exceptions into consistent error responses, such as Problem Details (RFC 9457).",
    ],
    cost: "Annotations hide the HTTP details, so mistakes such as a wrong content type or missing body show up as confusing 400 or 415 errors.",
    tryIt:
      "Build a /orders API with GET by id, POST and DELETE, and a @RestControllerAdvice that returns 404 Problem Details for a missing order.",
    buildsOn: "Main week 16: REST design",
  },
  "J40:4": {
    why: "Every API must reject bad input before it reaches business logic or the database.",
    problem:
      "Checking every field by hand in each controller is repetitive, inconsistent and easy to forget.",
    how: "Declare rules as annotations on request records with Jakarta Bean Validation, add @Valid to the controller parameter, and Spring rejects invalid requests with a 400 before your method runs.",
    tech: [
      "Constraints: @NotBlank, @NotNull, @Size(max = 100), @Email, @Min, @Max, @Positive, @Pattern.",
      "record CreateUser(@NotBlank String name, @Email String email) {}.",
      "@Valid @RequestBody CreateUser req triggers validation; failures throw MethodArgumentNotValidException.",
      "Handle it in @RestControllerAdvice to return field-by-field errors.",
      "Custom constraints cover business rules; @Validated on a class validates method parameters too.",
      "It's the same idea as Zod on the Main track (Main week 16: Input validation and schemas).",
    ],
    cost: "Annotations can't express every rule, especially ones involving several fields or the database; those still need code in the service.",
    tryIt:
      "Add validation to your create-order request, send invalid JSON with curl, and shape the error response to list each invalid field.",
    buildsOn: "Main week 16: Input validation and schemas",
  },
  "J40:5": {
    why: "A smooth setup and debugging workflow makes learning Spring far less frustrating.",
    problem:
      "Hand-writing a Spring Boot build file and project layout is fiddly, and debugging through framework code is confusing without good tools.",
    how: "Generate the project with Spring Initializr, build it with Maven or Gradle, and run and debug it from IntelliJ like any Java program.",
    tech: [
      "Spring Initializr (start.spring.io, or built into IntelliJ) creates the project with chosen starters, Java version and build tool.",
      "Maven: ./mvnw spring-boot:run; Gradle: ./gradlew bootRun; the wrapper scripts pin the build tool version (Java week 9: Build tools).",
      "Run or debug the main class from IntelliJ; breakpoints work in controllers and services (Main week 40: Debuggers).",
      "spring-boot-devtools restarts the app automatically when classes change.",
      "IntelliJ's Spring support shows bean wiring and endpoint mappings.",
    ],
    cost: "Large dependency trees make first builds slow, and debugging into framework internals can be overwhelming; step over framework frames.",
    tryIt:
      "Generate a project with Initializr (Web, Validation), set a breakpoint in a controller, call it with curl, and inspect the request in the debugger.",
    buildsOn: "Java week 9: Build tools",
  },
  "J40:6": {
    why: "Spring apps need tests at different levels: fast tests of one layer, and slower tests of the whole app wired together.",
    problem:
      "Starting the whole application for every test is slow, but testing classes alone misses wiring and HTTP mapping bugs.",
    how: "Use plain JUnit for business logic, slice tests that load only one layer for the web or data layer, and @SpringBootTest for a few full end-to-end checks.",
    tech: [
      "Plain unit tests: new OrderService(fakeRepo) with JUnit 6, no Spring at all (Java week 9: Testing with JUnit).",
      "@WebMvcTest(OrderController.class) loads only the web layer; dependencies are replaced with @MockitoBean.",
      'MockMvc sends fake HTTP requests: mockMvc.perform(get("/orders/1")).andExpect(status().isOk()).',
      "@SpringBootTest starts the full context, optionally with a real server on a random port.",
      "Slices such as @DataJpaTest test repositories against a database (Java week 41: Integration tests).",
    ],
    cost: "Context startup makes Spring tests slower than plain unit tests, and heavy mocking can hide real integration problems.",
    tryIt:
      "Write a @WebMvcTest for your order controller covering a 200, a 404 and a validation 400, and a plain unit test for the service.",
    buildsOn: "Java week 9: Testing with JUnit",
  },

  // ---- Week 41: Spring Boot II: data, JPA and transactions ----
  "J41:0": {
    why: "Java objects and relational tables are shaped differently. JPA maps between them so you can work with objects instead of hand-written SQL for every query.",
    problem:
      "Writing SQL and copying every column into object fields by hand is tedious, and tracking which objects changed and need saving is error-prone.",
    how: "Annotate classes as entities mapped to tables. Hibernate, the JPA implementation, loads rows into objects, tracks changes to them within a transaction, and writes the changes back automatically.",
    tech: [
      "@Entity class Order { @Id @GeneratedValue Long id; String item; } maps to an orders table.",
      "The persistence context (EntityManager) holds the managed entities for the current transaction, one object per row.",
      "Dirty checking: at commit, Hibernate compares managed entities with their loaded state and issues UPDATEs for changed fields, without a save call.",
      "Entity lifecycle: new (transient), managed, detached (after the context closes), removed.",
      "It's an ORM (object-relational mapper), like Prisma or Drizzle on the Main track (Main week 18: SQL fluency).",
    ],
    cost: "JPA hides the SQL being run, which leads to slow queries and surprises such as changes saved without an explicit save.",
    tryIt:
      "Turn on SQL logging (spring.jpa.show-sql=true), load an entity in a @Transactional method, change one field without calling save, and watch the UPDATE appear.",
    buildsOn: "Main week 18: SQL fluency",
  },
  "J41:1": {
    why: "Most data is related: orders have lines, users have roles. JPA maps these relationships to object references.",
    problem:
      "Mapping foreign keys to object references raises questions: which side updates the foreign key, and when is related data loaded?",
    how: "Annotate fields with relationship types. The side holding the foreign key owns the relationship, and the fetch type decides whether related entities load immediately or on first access.",
    tech: [
      "@ManyToOne on OrderLine.order: the order_lines table holds the order_id foreign key, so this side owns it.",
      '@OneToMany(mappedBy = "order") on Order.lines is the inverse side; changing only this side doesn\'t update the database.',
      "@ManyToMany uses a join table; often better modelled as an explicit entity when the link has its own data.",
      "Lazy loading (the default for collections) loads related data on first access; eager loading loads it with the parent.",
      "Accessing a lazy relationship after the transaction ends throws LazyInitializationException.",
    ],
    cost: "Eager loading everywhere loads huge object graphs; lazy loading causes N+1 queries and exceptions outside transactions.",
    tryIt:
      "Map Order and OrderLine both ways, save an order with lines, and trigger a LazyInitializationException by reading lines outside a transaction.",
    buildsOn: "Main week 18: Data modeling",
  },
  "J41:2": {
    why: "Most data access is the same few operations. Spring Data writes the repository code for you from an interface.",
    problem:
      "Writing find, save, delete and paging code for every entity is repetitive boilerplate.",
    how: "Declare an interface extending JpaRepository; Spring generates the implementation at runtime, including queries derived from method names.",
    tech: [
      "interface OrderRepository extends JpaRepository<Order, Long> {} gives save, findById, findAll, deleteById and more.",
      "Derived queries: List<Order> findByCustomerIdAndStatus(Long id, Status s) builds the query from the method name.",
      '@Query("select o from Order o where o.total > :min") for anything more complex, in JPQL or native SQL.',
      'Pageable and Sort: findAll(PageRequest.of(0, 20, Sort.by("createdAt").descending())) returns a Page.',
      "Projections return only the fields you need, as an interface or a record.",
    ],
    cost: "Long derived method names get unreadable, and generated queries can be inefficient; check the SQL they produce.",
    tryIt:
      "Add a derived query, an @Query method and a paginated endpoint to your orders API, and read the SQL each one generates.",
    buildsOn: "Java week 41: JPA and Hibernate",
  },
  "J41:3": {
    why: "The N+1 problem is the most common JPA performance bug, and it's invisible until the data grows.",
    problem:
      "Loading 100 orders and then touching each order's lines runs 1 query for the orders plus 100 more, one per order, so a page that was fast in testing becomes slow in production.",
    how: "Read the SQL Hibernate generates, and load related data in one query when you know you'll need it, using fetch joins or entity graphs.",
    tech: [
      "Symptom: a burst of identical SELECTs differing only in an id in the logs.",
      'Fetch join: @Query("select o from Order o join fetch o.lines where ...") loads orders and lines together.',
      '@EntityGraph(attributePaths = "lines") on a repository method does the same declaratively.',
      "@BatchSize or default batch fetching loads lazy collections in batches of ids, reducing 100 queries to a few.",
      "DTO projections avoid loading entities at all for read-only views.",
      "It's the same N+1 problem as with GraphQL resolvers (Main week 16: Alternatives).",
    ],
    cost: "Fetch-joining several collections at once multiplies rows, and pagination with collection fetch joins happens in memory; pick the fix for each case.",
    tryIt:
      "Load 50 orders and print their line counts, count the queries in the SQL log, then fix it with a fetch join and count again.",
    buildsOn: "Java week 41: Relationships",
  },
  "J41:4": {
    why: "Business operations often change several rows that must succeed or fail together. @Transactional gives you database transactions without boilerplate.",
    problem:
      "Opening, committing and rolling back transactions by hand in every service method is repetitive, and forgetting one leaves data half-updated.",
    how: "Annotate a service method with @Transactional; Spring wraps it in a proxy that starts a transaction before the method and commits after, or rolls back on an exception.",
    tech: [
      "Spring wraps the bean in a proxy, so @Transactional only applies to calls that go through the proxy, not to calls between methods of the same class.",
      "By default, rollback happens on unchecked exceptions (RuntimeException), not checked ones; change it with rollbackFor.",
      "Propagation: REQUIRED (join an existing transaction, the default), REQUIRES_NEW (suspend it and start a separate one).",
      "Isolation levels (READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE) control what concurrent transactions see (Main week 19: Transactions).",
      "@Transactional(readOnly = true) lets Hibernate skip dirty checking on reads.",
    ],
    cost: "Self-invocation and checked-exception rules surprise everyone once, and long transactions hold database locks and connections.",
    tryIt:
      "Write a transfer method that debits one account and then throws, check nothing changed, then call it from another method in the same class and see the proxy rule.",
    buildsOn: "Main week 19: Transactions",
  },
  "J41:5": {
    why: "The database schema changes as the app evolves, and every environment must apply the same changes in the same order.",
    problem:
      "Letting Hibernate update the schema automatically is unsafe in production, and hand-run SQL scripts get applied inconsistently across environments.",
    how: "Write each schema change as a versioned migration file in the repo; Flyway or Liquibase applies the pending ones in order at startup and records which have run.",
    tech: [
      "Flyway: SQL files named V1__create_orders.sql, V2__add_status.sql in db/migration.",
      "A history table (flyway_schema_history) records applied versions and checksums.",
      "Spring Boot runs pending migrations on startup when Flyway is on the classpath.",
      "Never edit an applied migration; add a new one.",
      "Set spring.jpa.hibernate.ddl-auto=validate so Hibernate only checks the schema matches.",
      "Write backward-compatible migrations for zero-downtime deploys (Main week 49: Deploys without downtime).",
    ],
    cost: "Migrations must be written and reviewed by hand, and rolling back a bad one usually means writing another forward migration.",
    tryIt:
      "Add Flyway to your app with V1 creating orders and V2 adding a status column with a default, and check the history table after startup.",
    buildsOn: "Java week 41: JPA and Hibernate",
  },
  "J41:6": {
    why: "Tests against a fake or in-memory database pass while the real one fails. Testcontainers runs real dependencies in tests.",
    problem:
      "H2 and other in-memory databases differ from Postgres in SQL dialect, types and behaviour, so tests miss real bugs.",
    how: "Testcontainers starts a real Postgres in Docker for the tests, points Spring at it, and removes it afterwards.",
    tech: [
      '@Testcontainers and @Container static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17").',
      "@ServiceConnection (Spring Boot) wires the container's URL and credentials into the app automatically.",
      "@DataJpaTest with a real container tests repositories and migrations against real Postgres.",
      "Reuse one container across test classes to keep the suite fast.",
      "The same approach works for Kafka, Redis and other dependencies.",
    ],
    cost: "Tests need Docker available locally and in CI, and starting containers adds seconds to the suite.",
    tryIt:
      "Write a @DataJpaTest using a Postgres Testcontainer that runs your Flyway migrations and tests a custom @Query.",
    buildsOn: "Java week 40: Testing",
  },

  // ---- Week 42: Spring Boot III: security, messaging and production ----
  "J42:0": {
    why: "Every real API needs authentication and authorization. Spring Security is the standard way to add them to Spring apps.",
    problem:
      "Checking tokens and permissions by hand in every controller is repetitive and easy to forget on one endpoint, which is a security hole.",
    how: "Spring Security runs a chain of servlet filters before your controllers. They authenticate the request (for example, by validating a JWT) and enforce access rules by URL or by method.",
    tech: [
      "The security filter chain processes each request; you configure it with a SecurityFilterChain bean.",
      "Authentication: who is this? Authorization: are they allowed? (Main week 17: Authentication vs authorization).",
      "OAuth 2.0 resource server: validates JWT access tokens from an identity provider and builds the authenticated user from their claims (Main week 17: Tokens).",
      'URL rules: requestMatchers("/admin/**").hasRole("ADMIN").',
      "Method security: @PreAuthorize(\"hasRole('ADMIN') or #id == authentication.name\") on service methods, with @EnableMethodSecurity.",
    ],
    cost: "Spring Security's configuration and defaults are complex, and a misconfigured filter chain can silently leave endpoints open or block everything.",
    tryIt:
      "Configure your API as a JWT resource server, protect /orders with a scope, and test with a token from a local Keycloak or a test token issuer.",
    buildsOn: "Main week 17: Tokens",
  },
  "J42:1": {
    why: "Services often need to tell each other about events without waiting for a response. Kafka is a common choice, and Spring makes it easy to use.",
    problem:
      "Producing and consuming messages by hand means handling serialisation, consumer groups, retries and failures yourself.",
    how: "Send with KafkaTemplate and consume with @KafkaListener methods; Spring manages consumer groups, retries and sending failed messages to a dead-letter topic.",
    tech: [
      'kafkaTemplate.send("orders", order.id(), event) publishes with the order id as the key, keeping one order\'s events in order (Main week 50: Stream processing).',
      '@KafkaListener(topics = "orders", groupId = "billing") consumes; instances in the same group share partitions.',
      "Retries with backoff, then a dead-letter topic for messages that keep failing (DefaultErrorHandler, or @RetryableTopic).",
      "Delivery is at least once, so consumers must be idempotent, for example by recording processed event ids (Main week 20: Messaging).",
      "Use the transactional outbox when a database change and a message must both happen (Main week 50: Change data capture).",
    ],
    cost: "Kafka adds infrastructure, and async flows are harder to debug and test than direct calls.",
    tryIt:
      "Publish an OrderPlaced event and consume it in a listener that fails twice before succeeding, then make one message fail permanently and find it in the dead-letter topic.",
    buildsOn: "Main week 20: Messaging",
  },
  "J42:2": {
    why: "Services call other services over the network, which is slow and sometimes fails. Those calls need protection.",
    problem:
      "A call with no timeout hangs a request thread forever, and blind retries against a struggling service make its outage worse.",
    how: "Use RestClient for HTTP calls with timeouts set, retry only safe operations with backoff, and wrap fragile dependencies in a circuit breaker with Resilience4j.",
    tech: [
      'RestClient is Spring\'s modern synchronous HTTP client: restClient.get().uri("/users/{id}", id).retrieve().body(User.class).',
      "Set connect and read timeouts on the underlying request factory.",
      "Retry with exponential backoff and jitter, only for idempotent requests (Main week 34: Reliability patterns).",
      "Resilience4j circuit breaker: after too many failures, fail fast for a while instead of calling (@CircuitBreaker with a fallback method).",
      "Bulkheads and rate limiters from the same library limit how much one dependency can consume.",
    ],
    cost: "Each layer adds configuration to tune, and fallbacks must still give users something sensible.",
    tryIt:
      "Call a fake slow service from your app, add a 2-second timeout, retries and a circuit breaker, and watch the breaker open in the logs during a load test.",
    buildsOn: "Main week 34: Reliability patterns",
  },
  "J42:3": {
    why: "A service in production must report whether it's healthy and what it's doing, in formats monitoring systems understand.",
    problem:
      "Without built-in health checks, metrics and traces, you add them by hand to every service, inconsistently.",
    how: "Spring Boot Actuator exposes health and metrics endpoints, Micrometer records metrics in a vendor-neutral way, and OpenTelemetry tracing follows requests across services.",
    tech: [
      "Actuator: /actuator/health (with liveness and readiness groups for Kubernetes probes, Main week 30: Probes), /actuator/info and /actuator/metrics.",
      "Micrometer records counters, timers and gauges and exports them to Prometheus at /actuator/prometheus.",
      "HTTP server requests, JVM memory, garbage collection and connection pools are measured automatically.",
      "Tracing with OpenTelemetry propagates trace ids across HTTP and Kafka calls (Main week 32: Observability).",
      "Expose only the endpoints you need, and secure them.",
    ],
    cost: "Exposing too many Actuator endpoints leaks information, and high-cardinality metric tags can overwhelm a metrics system.",
    tryIt:
      "Enable Actuator and Prometheus metrics, add a custom counter for orders placed, scrape it with a local Prometheus, and graph it in Grafana.",
    buildsOn: "Main week 32: Observability",
  },
  "J42:4": {
    why: "Traditional Java servers use one platform thread per request, which limits how many slow requests can run at once. Virtual threads remove that limit cheaply.",
    problem:
      "Each platform thread costs memory and an OS thread, so a server waiting on slow databases or APIs runs out of threads, while async code that avoids this is harder to write.",
    how: "Virtual threads are lightweight threads managed by the JVM. Blocking code parks the virtual thread cheaply and frees the OS thread, so you keep simple blocking code but handle many more concurrent requests.",
    tech: [
      "spring.threads.virtual.enabled=true makes Tomcat and Spring's task executors use virtual threads.",
      "Millions of virtual threads can exist; they're mounted on a small pool of OS (carrier) threads.",
      "They help I/O-bound work (waiting on databases and HTTP), not CPU-bound work.",
      "Limits move elsewhere: the database connection pool now becomes the bottleneck, so size it deliberately.",
      "Pinning, where a virtual thread can't unmount, was largely fixed for synchronized blocks in Java 24 (Java week 34 covers concurrency in depth).",
    ],
    cost: "Old libraries may still pin threads or use ThreadLocal heavily, and unlimited concurrency can overwhelm downstream systems without explicit limits.",
    tryIt:
      "Load-test an endpoint that sleeps 200 ms with platform threads and then with virtual threads enabled, and compare throughput.",
    buildsOn: "Main week 2: Threads",
  },
  "J42:5": {
    why: "Your service must run the same way on every machine and be configured differently per environment without rebuilding.",
    problem:
      "Hand-written Dockerfiles for Java apps are often large and slow to rebuild, and configuration baked into the JAR forces a rebuild per environment.",
    how: "Build a container image with Cloud Native Buildpacks or a layered multi-stage Dockerfile, and supply all environment-specific settings through environment variables.",
    tech: [
      "./mvnw spring-boot:build-image (or ./gradlew bootBuildImage) builds an optimised image with Buildpacks, no Dockerfile needed.",
      "Or a multi-stage Dockerfile: build with a JDK image, run with a smaller JRE image, using Spring Boot's layered JAR so dependencies are cached in their own layer (Main week 29: Multi-stage builds).",
      "Spring maps environment variables to properties: SPRING_DATASOURCE_URL sets spring.datasource.url.",
      "Secrets come from the platform's secret store at runtime, never from the image (Main week 32: Secrets management).",
      "Set memory limits and let the JVM size its heap from the container limit (-XX:MaxRAMPercentage).",
    ],
    cost: "Java images are larger and start slower than Go or Node images; GraalVM native images start fast but take long to build and have limits.",
    tryIt:
      "Build your app's image with Buildpacks, run it with docker run and the database URL passed as an environment variable, and check its health endpoint.",
    buildsOn: "Main week 29: Multi-stage builds",
  },
};
