import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's system design, capstone and career phase (M33-M35, M50-M53). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_DESIGN: ExplainMap = {
  // ---- Week 33: Distributed data: replication and partitioning ----
  "M33:0": {
    why: "Every design question in this phase starts here: why spread data across several machines at all, when one machine is so much simpler?",
    problem:
      "One database server has a ceiling on load and storage, takes the whole app down when it fails, and is far away from users on other continents.",
    how: "Distribute data for three reasons, and know which one you're solving for: handle more load (scalability), keep working when machines fail (availability), and be close to users (latency).",
    tech: [
      "Scalability: more reads, writes or data than one machine can handle.",
      "Availability: copies on other machines keep serving when one dies (Main week 49: Availability targets).",
      "Latency: copies in several regions answer nearby users faster, since a cross-ocean round trip costs 100 ms or more.",
      "Replication (copies of the same data) and partitioning (splitting data into pieces) are the two tools, and are usually combined.",
      "Distribution adds new failure modes: networks drop or delay messages, clocks disagree, and machines fail partway through work.",
    ],
    cost: "Distributed data is much harder to reason about and operate. Many apps never need it beyond a managed database with a standby and read replicas.",
    tryIt:
      "For your capstone, write down which of the three reasons (if any) would make you distribute its data, and at what number of users.",
    buildsOn: "Main week 49: Availability targets and what they cost",
  },
  "M33:1": {
    why: "When a system gets busy, there are two ways to grow it: a bigger machine or more machines. Which one works depends on whether the part holds state.",
    problem:
      "Adding app servers is easy, but the database behind them becomes the bottleneck, and it can't simply be copied without consistency problems.",
    how: "Scale vertically (a bigger machine) as long as it's affordable; scale horizontally (more machines) for stateless services first, and for data only when you must.",
    tech: [
      "Vertical scaling: more CPU, RAM and faster disks; no code changes, but there's a limit and one machine is still one point of failure.",
      "Horizontal scaling: more machines behind a load balancer (Main week 27: Load balancing).",
      "Stateless services keep no data between requests (sessions in Redis or tokens), so any server can answer any request and you just add more.",
      "Data is stateful: adding database machines means deciding where each piece lives and how copies stay in sync.",
      "Common path: scale app servers horizontally, scale the database vertically, add a cache and read replicas, and partition only when that's not enough.",
    ],
    cost: "Big machines get expensive fast; horizontal data scaling brings all the complexity of the rest of this week.",
    tryIt:
      "Run two copies of your API behind NGINX with sessions stored in memory, log in, and see what breaks; then move sessions to Redis.",
    buildsOn: "Main week 27: Load balancing",
  },
  "M33:2": {
    why: "Keeping copies of data on several machines gives you availability and read capacity, but keeping those copies in sync is one of the hardest problems in computing.",
    problem:
      "When a write reaches one copy, the others are briefly out of date. Users can see their own changes disappear, and if the main copy fails, two machines may both think they're in charge.",
    how: "Choose a replication model: one leader takes writes and followers copy it; several leaders take writes; or no leader, with reads and writes going to several replicas at once.",
    tech: [
      "Leader-follower: synchronous replication waits for followers (safer, slower); asynchronous doesn't (faster, can lose recent writes on failover).",
      "Replication lag causes anomalies; read-your-writes (read your own data from the leader) and monotonic reads (stick a user to one replica) are the usual fixes.",
      "Failover promotes a follower when the leader dies; split brain is when two nodes both act as leader and accept conflicting writes.",
      "Leaderless systems (Dynamo-style) write to W replicas and read from R of N; if W + R > N, every read overlaps at least one up-to-date copy.",
      "Concurrent writes conflict: last-write-wins silently drops one; CRDTs (conflict-free replicated data types) are structures designed to merge automatically.",
    ],
    cost: "Every model trades consistency, availability and latency differently, and replication bugs are subtle and rare, which makes them hard to test.",
    tryIt:
      "Set up Postgres with one streaming replica in Docker Compose, write to the primary and immediately read from the replica in a loop, and measure the lag.",
    buildsOn: "Main week 19: Transactions",
  },
  "M33:3": {
    why: "When data or write traffic is too big for one machine, even with replicas, you have to split it up.",
    problem:
      "A naive split puts all of today's data or one celebrity's posts on one machine (a hot spot), and moving data when machines are added can mean reshuffling everything.",
    how: "Partition (shard) data by a key, either by ranges of keys or by a hash of the key, route each request to the right partition, and rebalance gradually when the cluster changes.",
    tech: [
      "Key-range partitioning keeps nearby keys together (good for range scans) but sequential keys such as timestamps create hot spots.",
      "Hash partitioning spreads keys evenly but loses range queries.",
      "Consistent hashing places nodes and keys on a ring, so adding a node moves only about 1/N of the keys (you'll implement it in the Java track).",
      "Secondary indexes: local indexes per partition need a query to every partition (scatter-gather); global indexes are partitioned separately and are slower to update.",
      "Routing: the client, a routing tier or any node forwards requests to the right partition, often using a coordination service to know the current layout.",
    ],
    cost: "Queries across partitions and transactions across partitions become slow or impossible, and choosing the wrong partition key is very expensive to undo.",
    tryIt:
      "Write a small function that assigns 10,000 user ids to 4 shards with hash mod N and with consistent hashing, add a 5th shard, and count how many keys move in each case.",
    buildsOn: "Main week 19: Indexes",
  },
  "M33:4": {
    why: "Quick estimates tell you whether a design needs one server or a thousand before you draw a single box.",
    problem:
      "Without numbers, designs are either wildly overbuilt or fall over at launch, and in interviews you can't justify any choice.",
    how: "Multiply a few assumptions (users, actions per user, bytes per action) to estimate requests per second, storage, bandwidth and cache memory, using powers of two and known latency numbers.",
    tech: [
      "QPS (queries per second): daily active users × actions per day ÷ 86,400 seconds (about 10⁵); peak is often 2 to 10 times the average.",
      "Storage per year: writes per day × bytes per write × 365, plus replicas and indexes.",
      "Bandwidth: QPS × response size.",
      "Cache memory: often enough for the hottest 20% of data.",
      "Powers of two: 2¹⁰ ≈ a thousand (KB), 2²⁰ ≈ a million (MB), 2³⁰ ≈ a billion (GB).",
      "Latency numbers (Main week 1: Memory): memory about 100 ns, SSD read about 100 µs, same-region round trip about 0.5 ms, cross-continent about 100 ms.",
    ],
    cost: "Estimates are only as good as the assumptions, so say them out loud and round boldly; precision here is false comfort.",
    tryIt:
      "Estimate QPS, yearly storage and cache size for a photo-sharing app with 10 million daily users who each view 50 photos and upload 1 per day.",
    buildsOn: "Main week 38: Back-of-envelope sizing",
  },

  // ---- Week 34: Consistency, consensus and messaging patterns ----
  "M34:0": {
    why: "'Consistent' means different things in different systems. Consistency models are the precise vocabulary for what a read is guaranteed to see.",
    problem:
      "With replicas, a read can return old data, and two users can see events in different orders. Unless you know the guarantee, you can't tell a bug from expected behaviour.",
    how: "Each model is a promise about which values reads can return, from strongest (behaves like one copy) to weakest (copies agree eventually).",
    tech: [
      "Linearizability: once a write completes, every later read sees it, as if there were a single copy. Needed for locks and unique usernames.",
      "Sequential consistency: everyone sees operations in the same order, though not necessarily in real-time order.",
      "Causal consistency: if one event caused another (a reply to a post), everyone sees them in that order; unrelated events may appear in any order.",
      "Eventual consistency: if writes stop, replicas eventually agree; meanwhile reads may be stale.",
      "Stronger models need more coordination between replicas, which costs latency and availability.",
    ],
    cost: "Strong consistency is slower and less available; weak consistency pushes complexity into the application and the user experience.",
    tryIt:
      "For a social app, decide which model each feature needs: username registration, like counts, comment threads and the account balance for paid features.",
    buildsOn: "Main week 33: Replication",
  },
  "M34:1": {
    why: "CAP is the most quoted and most misunderstood idea in distributed systems. Stated precisely, it's simple and useful.",
    problem:
      "People say 'pick two of three', which suggests you can give up partition tolerance. You can't: networks do fail.",
    how: "CAP says that during a network partition, a system must choose between consistency (linearizability) and availability. PACELC adds that even without a partition, it trades latency against consistency.",
    tech: [
      "A partition is when nodes can't reach each other; it will happen.",
      "During a partition, a CP system refuses some requests to stay consistent; an AP system answers everything, possibly with stale or conflicting data.",
      "PACELC: if Partition, choose Availability or Consistency; Else, choose Latency or Consistency.",
      "Examples: a single-leader database with synchronous replicas is PC/EC; Cassandra with low quorum settings is PA/EL.",
      "Many systems let you choose per operation, for example by quorum size.",
    ],
    cost: "CAP is a narrow theorem: it ignores latency and other failure types, so use it to name a trade-off, not to design a system alone.",
    tryIt:
      "Classify Postgres with a synchronous replica, DynamoDB with eventually consistent reads, and etcd under PACELC, and give one sentence of reasoning for each.",
    buildsOn: "Main week 34: Consistency models",
  },
  "M34:2": {
    why: "Some decisions must be made by exactly one node: who the leader is, who holds a lock. Consensus algorithms make several machines agree safely despite failures.",
    problem:
      "With unreliable networks and crashing nodes, simple voting can produce two leaders or lose decisions, causing split brain and corrupted data.",
    how: "Raft elects a leader for a numbered term by majority vote, the leader appends commands to a replicated log, and an entry is committed once a majority has stored it.",
    tech: [
      "Terms: numbered periods, each with at most one leader; a higher term always wins.",
      "Elections: a follower that hears nothing from the leader for a random timeout becomes a candidate and asks for votes; a majority makes it leader.",
      "Log replication: the leader sends entries to followers and commits them once a majority acknowledges.",
      "A cluster of 2f + 1 nodes survives f failures, so 3 nodes survive 1 and 5 survive 2.",
      "You rarely implement Raft; you use etcd or ZooKeeper (or a database built on them) for leader election, locks and configuration (Main week 30: Architecture).",
    ],
    cost: "Consensus needs a majority of nodes reachable and adds round trips to every decision, so it's kept for small, critical data, not bulk storage.",
    tryIt:
      "Open the Raft visualisation at raft.github.io, stop the leader, and watch a new election and the log catch up.",
    buildsOn: "Main week 30: Architecture",
  },
  "M34:3": {
    why: "Once data lives in several services or databases, one business action ('place order') can span all of them, and you still need it to either happen fully or be undone.",
    problem:
      "A database transaction can't span separate services, so a failure halfway through leaves money charged but no order, or stock reserved forever.",
    how: "Two-phase commit locks every participant until all agree, which is fragile. Sagas instead run a series of local transactions, each with a compensating action that undoes it if a later step fails.",
    tech: [
      "Two-phase commit (2PC): a coordinator asks all participants to prepare, then to commit. If the coordinator dies after prepare, participants stay blocked holding locks.",
      "Saga: a sequence of local transactions, such as reserve stock, charge card, create shipment.",
      "Compensating actions undo completed steps in reverse: refund the card, release the stock.",
      "Choreography: each service reacts to the previous service's event; simple but hard to follow.",
      "Orchestration: one coordinator tells each service what to do next; easier to see and change.",
    ],
    cost: "Sagas give up isolation: other requests can see intermediate states, and compensations must be carefully designed and idempotent.",
    tryIt:
      "Write the saga for booking a trip (flight, hotel, car) with a compensation for each step, and walk through what happens if the car booking fails.",
    buildsOn: "Main week 19: Transactions",
  },
  "M34:4": {
    why: "Services that call each other directly become tightly coupled. Events let services react to what happened without knowing who's listening.",
    problem:
      "If the order service must call billing, email, analytics and stock directly, adding a new consumer means changing it, and any slow consumer slows orders.",
    how: "Publish events (facts that happened) for others to react to, and send commands (requests to do something) only to the service responsible. Some systems go further and store the events themselves as the source of truth.",
    tech: [
      "Event: a past-tense fact anyone may consume (OrderPlaced). Command: a request addressed to one owner (ChargeCard).",
      "Event-driven architecture: producers publish to a broker such as Kafka or SQS, and consumers subscribe (Main week 20: Messaging).",
      "Event sourcing: store every change as an event and rebuild state by replaying them, which gives a full history and the ability to rebuild views.",
      "CQRS (command query responsibility segregation): separate models for writes and for reads, with read models built from events.",
      "Worth it for audit-heavy domains or very different read and write needs; overkill for most CRUD.",
    ],
    cost: "Events make the flow of a business process harder to follow and debug, read models are eventually consistent, and changing old events is hard.",
    tryIt:
      "Change one direct call in your API (sending a welcome email after sign-up) into an event on a queue consumed by a separate worker.",
    buildsOn: "Main week 20: Messaging",
  },
  "M34:5": {
    why: "Data outlives code. A message written today may be read by next year's version of a service, or by a different service entirely.",
    problem:
      "Renaming or removing a field breaks every consumer still on the old version, and stored data in an old format can become unreadable.",
    how: "Choose an encoding, define schemas, and change them only in compatible ways, checked by a schema registry before anything is published.",
    tech: [
      "JSON: readable and flexible, but verbose and with no enforced schema.",
      "Protobuf and Avro: compact binary formats with schemas; Protobuf identifies fields by number, Avro by name with the writer's schema available.",
      "Backward compatible: new code can read old data. Forward compatible: old code can read new data.",
      "Safe changes: add optional fields with defaults; never reuse a removed field number or change a field's type.",
      "A schema registry stores schema versions and rejects incompatible changes.",
    ],
    cost: "Binary formats need tooling to read and generate code, and schema governance adds process to every change.",
    tryIt:
      "Define a Protobuf message, serialise some data, add a new optional field and remove an old one, and check that old and new code can read each other's output.",
    buildsOn: "Main week 16: Input validation and schemas",
  },
  "M34:6": {
    why: "Sagas and business processes can run for minutes or days, with retries and timers. Writing that reliably by hand is very hard.",
    problem:
      "If the process running a saga crashes between steps, it loses track: which steps ran, which to retry, which timers were waiting.",
    how: "Use a durable workflow engine such as Temporal, which records each step's result so a workflow can resume exactly where it stopped after a crash, or a simpler job table in Postgres for basic cases.",
    tech: [
      "A workflow is ordinary code; each external call is an activity whose result is saved.",
      "On a crash, the engine replays the workflow's history to rebuild its state and continues from the next step.",
      "Retries with backoff and timeouts are configured per activity.",
      "Durable timers ('wait 3 days, then send a reminder') survive restarts.",
      "A Postgres job table (status, attempts, next_run_at, with SELECT ... FOR UPDATE SKIP LOCKED) covers simple background jobs without a new system.",
    ],
    cost: "Workflow engines are significant infrastructure, and workflow code must be deterministic, which is a new constraint to learn.",
    tryIt:
      "Run Temporal's local dev server and write a workflow with two activities and a 1-minute timer, then kill the worker midway and restart it.",
    buildsOn: "Main week 34: Distributed transactions",
  },
  "M34:7": {
    why: "In distributed systems, other services will be slow or fail. These patterns stop one failure from spreading through everything.",
    problem:
      "A slow dependency ties up all your threads or connections, retries from every client multiply the load on a struggling service, and the whole system goes down together.",
    how: "Bound how long you wait, retry carefully, stop calling services that are failing, isolate resources, make operations safe to repeat, and park messages that keep failing.",
    tech: [
      "Timeouts on every network call; no timeout means waiting forever.",
      "Retries with exponential backoff and jitter (random spread), so clients don't retry in sync; only retry idempotent operations.",
      "Circuit breaker: after repeated failures, stop calling for a while and fail fast, then test with a few requests.",
      "Bulkheads: separate pools of connections or threads per dependency, so one slow service can't use them all.",
      "Idempotency keys make retries safe (Main week 16: Idempotency); dead letter queues hold messages that keep failing (Main week 20: Messaging).",
    ],
    cost: "Each pattern adds configuration to tune, and wrong settings, such as aggressive retries, can make outages worse.",
    tryIt:
      "Put a fake dependency behind your API that is slow 30% of the time, and add a timeout, retries with jitter and a circuit breaker, measuring error rate and latency at each step.",
    buildsOn: "Main week 16: Idempotency and idempotency keys",
  },
  "M34:8": {
    why: "'Should we use microservices?' is one of the most common and most costly architecture decisions teams make.",
    problem:
      "Teams split into many services too early and get all the costs of distribution (network failures, distributed transactions, complex deploys) without the benefits.",
    how: "Start with a well-structured monolith, draw module boundaries along bounded contexts, and split out a service only when there's a clear reason: independent scaling, deployment or team ownership.",
    tech: [
      "Monolith: one deployable; simple to develop, test and deploy, but can become tangled.",
      "Microservices: many independently deployable services, each owning its data; teams move independently, at a high operational cost.",
      "Modular monolith: one deployable with strict module boundaries (Main week 41: The modular monolith).",
      "Good boundaries follow bounded contexts from domain-driven design (Main week 41: Domain-driven design basics).",
      "Reasons to split: very different scaling needs, different release cadences, separate teams, or isolation for security.",
    ],
    cost: "Microservices need mature CI/CD, observability and on-call; a distributed monolith (services that must deploy together) is the worst of both.",
    tryIt:
      "For your capstone, write a short ADR (architecture decision record) choosing monolith, modular monolith or services, with the conditions that would change your mind.",
    buildsOn: "Main week 41: The modular monolith",
  },

  // ---- Week 50: Data systems: batch, streams, warehouses ----
  "M50:0": {
    why: "The database that runs your app is the wrong tool for questions like 'revenue by region by month for three years'.",
    problem:
      "Analytics queries scan millions of rows and only a few columns; on the app's database they're slow and they slow down real users.",
    how: "Separate OLTP (many small reads and writes for the app) from OLAP (large scans for analysis), and store analytical data column by column so queries read only what they need.",
    tech: [
      "OLTP (online transaction processing): fetch or update one order; row storage keeps each row's fields together (Main week 19: Storage).",
      "OLAP (online analytical processing): aggregate millions of rows; read a few columns of many rows.",
      "Columnar storage keeps each column together, so a query reads only the columns it uses.",
      "Columns of similar values compress very well and can be processed in batches (vectorised execution).",
      "Data is copied from OLTP systems into analytical stores by pipelines.",
    ],
    cost: "Columnar stores are slow for single-row updates, and copying data means analytics are slightly behind and need pipelines to maintain.",
    tryIt:
      "Export a large table to CSV and to Parquet, and compare file sizes and the time to compute one column's average with DuckDB.",
    buildsOn: "Main week 19: Storage",
  },
  "M50:1": {
    why: "Some jobs process all the data at once: nightly reports, rebuilding search indexes, training data. Batch processing runs them across many machines.",
    problem:
      "A terabyte of logs takes hours on one machine and doesn't fit in memory, and a crash near the end means starting over.",
    how: "Split the input into pieces, process each piece in parallel (map), group results by key and combine them (reduce), and rerun only failed pieces. Dataflow engines such as Spark generalise this.",
    tech: [
      "MapReduce: map turns each record into key-value pairs, a shuffle groups them by key, and reduce combines each group.",
      "Inputs are immutable and outputs are written fresh, so failed tasks can simply rerun.",
      "Spark keeps intermediate data in memory and plans whole chains of operations (a dataflow), which is much faster than writing to disk between steps.",
      "ETL: extract, transform, then load into the warehouse. ELT: load raw data first, transform it inside the warehouse with SQL (common today, with tools such as dbt).",
    ],
    cost: "Batch results are only as fresh as the last run, and distributed jobs are slow to start and hard to debug.",
    tryIt:
      "Write a word count in plain Python as map and reduce functions over a folder of text files, then do the same in one DuckDB SQL query.",
  },
  "M50:2": {
    why: "Companies want all their data in one place to analyse. Warehouses and lakehouses are where it goes.",
    problem:
      "Data spread across app databases, logs and third-party tools can't be joined, and storing it all in an expensive database doesn't scale.",
    how: "A warehouse is a managed columnar database for analytics. A lakehouse stores open columnar files in cheap object storage and adds a table format so they behave like database tables.",
    tech: [
      "Warehouses such as BigQuery and Snowflake separate storage from compute and scale queries across many machines.",
      "Parquet is an open columnar file format with compression and per-column statistics.",
      "A data lake is files in object storage (S3); cheap, but without transactions or schemas it turns into a mess.",
      "Table formats (Apache Iceberg, Delta Lake) add a metadata layer over Parquet files: schemas, atomic commits, time travel and schema evolution.",
      "Many engines (Spark, Trino, DuckDB, warehouses) can read the same Iceberg tables.",
    ],
    cost: "Warehouses can get expensive per query, and lakehouses need careful file management (small files, compaction) and governance.",
    tryIt:
      "Query a public Parquet dataset in place over HTTPS with DuckDB, and look at the file's metadata with parquet_metadata().",
  },
  "M50:3": {
    why: "You don't need a cluster to learn analytics. DuckDB runs fast analytical SQL on your laptop, directly on files.",
    problem:
      "Loading CSVs into Postgres or pandas for a quick question is slow and fiddly, and big files don't fit in memory.",
    how: "DuckDB is an in-process columnar database: run SQL directly over CSV, Parquet and JSON files, with vectorised execution that uses all your cores.",
    tech: [
      "SELECT region, sum(amount) FROM 'sales/*.parquet' GROUP BY region reads files directly.",
      "It runs inside your process (CLI, Python, Node, Java), with no server to set up.",
      "Columnar and vectorised execution make scans of millions of rows take moments.",
      "It can handle data larger than memory by spilling to disk.",
      "COPY (SELECT ...) TO 'out.parquet' converts and exports data.",
    ],
    cost: "DuckDB is single-machine and not designed for many concurrent writers, so it complements rather than replaces a warehouse or OLTP database.",
    tryIt:
      "Download a public dataset such as NYC taxi trips in Parquet and answer three questions about it with DuckDB SQL.",
    buildsOn: "Main week 18: SQL fluency",
  },
  "M50:4": {
    why: "Batch answers questions about yesterday. Stream processing handles data as it arrives, for fraud detection, live dashboards and keeping systems in sync.",
    problem:
      "Waiting for a nightly job is too slow for many uses, and a plain queue deletes messages once consumed, so several systems can't read the same events or replay them.",
    how: "Kafka stores events in an append-only, partitioned log that many consumers read at their own pace; stream processors compute results over time windows as events flow.",
    tech: [
      "A topic is a named log split into partitions; order is guaranteed only within a partition, chosen by the message key.",
      "Consumers in a group share partitions, so more consumers (up to the partition count) process in parallel.",
      "Each consumer tracks its offset (position) in each partition, so it can resume or replay from any point.",
      "Windowing groups events by time: tumbling (fixed, non-overlapping), hopping (overlapping) and session windows.",
      "'Exactly-once' in Kafka means transactional writes plus offset commits within Kafka; side effects outside Kafka still need idempotency.",
    ],
    cost: "Kafka is complex to run (managed services help), and stream processing brings late data, reordering and state management problems.",
    tryIt:
      "Run Kafka (or Redpanda) in Docker, produce events to a topic with 3 partitions, run two consumers in one group, and watch the partitions being shared and rebalanced.",
    buildsOn: "Main week 20: Messaging",
  },
  "M50:5": {
    why: "Many systems need to know when data changes in your database: the search index, the cache, the warehouse.",
    problem:
      "Writing to the database and also publishing an event in app code fails when one succeeds and the other doesn't (the dual-write problem), so systems drift apart.",
    how: "Change data capture (CDC) reads the database's own replication log and turns every committed change into an event, in order, without touching app code.",
    tech: [
      "Databases already log every change for replication (the Postgres WAL, the MySQL binlog).",
      "Debezium reads that log through logical replication and publishes each insert, update and delete to Kafka.",
      "Consumers update search indexes, caches or warehouses from the change stream.",
      "Only committed changes appear, in commit order, so consumers stay consistent with the database.",
      "The outbox pattern: write an event row to an outbox table in the same transaction as the change, and let CDC publish it.",
    ],
    cost: "CDC adds infrastructure and couples consumers to your table structure unless you publish through an outbox.",
    tryIt:
      "Run Postgres, Kafka and Debezium with Docker Compose, insert and update rows, and read the change events from the topic.",
    buildsOn: "Main week 33: Replication",
  },
  "M50:6": {
    why: "When analytics, machine learning and other teams consume your data, its shape becomes an interface, just like an API.",
    problem:
      "A developer renames a column or changes an event field, and dashboards and pipelines downstream break silently, sometimes for days.",
    how: "Treat data shapes as contracts: define them as versioned schemas with owners, check compatibility automatically in CI, and evolve them with the same rules as APIs.",
    tech: [
      "A data contract states the schema, meaning, owner, freshness and quality expectations of a dataset or event stream.",
      "Avro or Protobuf schemas in a schema registry enforce compatibility modes such as backward or full (Main week 34: Encoding and schema evolution).",
      "CI checks that proposed schema changes are compatible before merging.",
      "Breaking changes get a new version, published alongside the old one during migration.",
      "Data quality checks (null rates, value ranges, row counts) catch problems schemas can't.",
    ],
    cost: "Contracts add process and coordination between teams, and enforcing them across many producers takes organisational effort.",
    tryIt:
      "Write a data contract for one event your capstone publishes: schema, owner, meaning of each field, and which changes are allowed.",
    buildsOn: "Main week 34: Encoding and schema evolution",
  },

  // ---- Week 35: System design practice I: the classics ----
  "M35:0": {
    why: "System design interviews and real design reviews both reward a clear, repeatable process more than clever ideas.",
    problem:
      "Without a process, people jump straight to drawing boxes, miss requirements, run out of time and can't explain their choices.",
    how: "Follow the same seven steps every time: requirements, estimates, API, data model, high-level diagram, deep dives, and bottlenecks and trade-offs, keeping time for each.",
    tech: [
      "Requirements and estimates: about 5 to 10 minutes.",
      "API, data model and high-level diagram: about 10 to 15 minutes.",
      "Deep dives on the hardest parts: about 15 to 20 minutes.",
      "Bottlenecks, failures and trade-offs: the remaining time.",
      "Talk through your reasoning throughout; the interviewer grades how you think as much as the final design.",
    ],
    cost: "A fixed process can feel rigid for unusual problems; treat it as a checklist, not a script.",
    tryIt:
      "Design a URL shortener in 45 minutes on a timer, following the seven steps, and record yourself explaining it.",
    buildsOn: "Main week 38: The design process, short version",
  },
  "M35:1": {
    why: "The same product can need a tiny or an enormous system depending on its requirements. Getting them clear first stops you designing the wrong thing.",
    problem:
      "'Design Twitter' could mean posting, the timeline, search, ads or DMs, for a thousand users or a billion. Guessing wastes the whole session.",
    how: "Ask about features (functional requirements) and qualities (non-functional requirements), agree a short list in scope, and write down what's out of scope.",
    tech: [
      "Functional: what users can do (post a tweet, follow someone, see a home timeline).",
      "Scale: daily users, read-to-write ratio, data size, growth.",
      "Latency: for example, timeline loads in under 200 ms at p99.",
      "Consistency: can a timeline be a few seconds stale? Can a payment?",
      "Availability: the target, and which features may degrade first.",
      "Out of scope: written down explicitly (Main week 38: Functional vs non-functional requirements).",
    ],
    cost: "Clarifying takes time from the design itself, and too many questions can look like stalling; ask the ones that change the design.",
    tryIt:
      "For 'design a chat app', write 3 functional requirements, 4 non-functional requirements with numbers, and 3 out-of-scope items.",
    buildsOn: "Main week 38: Functional vs non-functional requirements",
  },
  "M35:2": {
    why: "Numbers decide the architecture: whether you need a cache, sharding or a CDN.",
    problem:
      "Without estimates, you add complex components because they sound impressive, or miss that the data won't fit on one machine.",
    how: "Turn the requirements into QPS for reads and writes, storage over several years and bandwidth, and let the numbers point to where the design must be strong.",
    tech: [
      "Read and write QPS separately, average and peak (Main week 33: Back-of-envelope estimation).",
      "Storage: records per day × size × retention, plus replication.",
      "Bandwidth: QPS × payload size, especially for media.",
      "Compare with what one machine handles (roughly thousands of simple database queries per second, a few TB of SSD) to see what must scale out.",
      "State the result and its implication, such as 'reads are 100 times writes, so caching matters most'.",
    ],
    cost: "Spending too long on arithmetic eats design time; round to one significant figure.",
    tryIt:
      "Estimate read QPS, write QPS and 5-year storage for a URL shortener with 100 million new links a month and a 100:1 read-to-write ratio.",
    buildsOn: "Main week 33: Back-of-envelope estimation",
  },
  "M35:3": {
    why: "The API pins down exactly what the system does, and every later choice must support it.",
    problem:
      "Designs without an API stay vague: it's unclear what data each request needs, so the data model and caching can't be checked.",
    how: "Write the main endpoints with methods, parameters and responses for each functional requirement, including pagination and error cases.",
    tech: [
      "One endpoint per core action: POST /tweets, GET /timeline?cursor=..., POST /follows.",
      "Use REST conventions (Main week 16: REST design), or gRPC or WebSockets where they fit.",
      "Cursor pagination for feeds, idempotency keys for writes that might be retried.",
      "Authentication: which user is making the request.",
      "Note anything that's expensive to serve; it'll be a deep-dive candidate.",
    ],
    cost: "The API is easy to over-specify in an interview; cover the core endpoints and move on.",
    tryIt:
      "Write the API for a ride-sharing app's rider side: request a ride, get its status, cancel it, and rate the driver.",
    buildsOn: "Main week 16: REST design",
  },
  "M35:4": {
    why: "Where and how data is stored decides what's fast, what's slow and what's possible at all.",
    problem:
      "Picking a database by brand rather than by access pattern leads to queries that can't be served efficiently at scale.",
    how: "List the entities and the queries the API needs, then choose storage that serves those access patterns: relational, key-value, wide-column, search or object storage.",
    tech: [
      "Entities and relationships first (Main week 18: Data modeling).",
      "For each query: what you look up by, how often and how much data (Main week 38: Choosing storage from access patterns).",
      "Relational for transactions and flexible queries; key-value for lookups by id at huge scale; wide-column for time-ordered writes; search engines for text; object storage for files.",
      "Choose a partition key if the data will be sharded (Main week 33: Partitioning).",
      "Denormalise deliberately for hot read paths, such as precomputed timelines.",
    ],
    cost: "Every additional store adds operational work and consistency questions between stores.",
    tryIt:
      "Design the tables or collections for a URL shortener and state the partition key and the main index you'd need.",
    buildsOn: "Main week 18: Data modeling",
  },
  "M35:5": {
    why: "A diagram shows the whole system at once and gives the conversation something concrete to point at.",
    problem:
      "Talking through components without a picture loses the listener, and missing connections go unnoticed.",
    how: "Draw the main components and the path of the key requests: client, load balancer, services, caches, queues and databases. Keep it simple and explain each box.",
    tech: [
      "Start with the read path and the write path for the most important feature.",
      "Show clients, the CDN, load balancers, services, caches, queues, databases and object storage as needed.",
      "Label arrows with what flows (HTTP request, event, query).",
      "Every box must answer a requirement or an estimate; remove the rest.",
      "Keep it at the level of components; details come in the deep dive.",
    ],
    cost: "Diagrams hide complexity in arrows; a box labelled 'cache' says nothing about invalidation until you explain it.",
    tryIt:
      "Draw the high-level diagram for a news feed system with separate read and write paths, in under 10 minutes.",
    buildsOn: "Main week 49: The full request path",
  },
  "M35:6": {
    why: "Every system has one or two genuinely hard parts. That's where real design work, and most interview points, happen.",
    problem:
      "Spending the time on easy parts, such as the login flow, leaves no time for the part that actually decides whether the system works.",
    how: "Pick the hardest parts (by scale, correctness or latency), propose options for each, compare them, and choose with reasons.",
    tech: [
      "Common deep dives: feed fan-out (on write versus on read), hot keys, ID generation, rate limiting, search indexing, exactly-once processing.",
      "Show at least two options and their trade-offs before choosing.",
      "Use your estimates to justify the choice.",
      "Address consistency and failure within the deep dive.",
      "Follow the interviewer's interest, but propose your own priorities first.",
    ],
    cost: "Going deep on one part means less coverage elsewhere; that's the right trade-off, but say what you're skipping.",
    tryIt:
      "For a Twitter-like timeline, compare fan-out on write and on read, and design the hybrid for users with millions of followers.",
    buildsOn: "Main week 35: High-level diagram",
  },
  "M35:7": {
    why: "Every design has weak points. Naming them yourself shows you understand the system and its trade-offs.",
    problem:
      "A design presented as perfect is not believable, and unexamined single points of failure or hot spots cause real outages.",
    how: "Walk through what fails or saturates first as load grows, what happens when each component dies, and what you traded away for your choices.",
    tech: [
      "Bottlenecks: the database write path, hot partitions, fan-out, a single queue consumer.",
      "Failure modes: what happens if the cache, a replica, a region or a dependency fails (Main week 34: Reliability patterns).",
      "Single points of failure and how to remove them, or why it's acceptable to keep one.",
      "Trade-offs made: consistency for latency, cost for availability, simplicity for scale.",
      "What you'd monitor and alert on.",
    ],
    cost: "Analysing everything is impossible in the time; focus on the most likely and most damaging cases.",
    tryIt:
      "Take a design you drew this week and list its 3 biggest bottlenecks and 3 most damaging failures, with a mitigation for each.",
    buildsOn: "Main week 34: Reliability patterns",
  },
  "M35:8": {
    why: "Most system designs are assembled from the same dozen building blocks. Knowing each one's job and limits makes designs fast and sound.",
    problem:
      "Reinventing each component in every design wastes time and misses well-known pitfalls.",
    how: "Learn each block's purpose, typical scale, and failure modes, so you can place it with a reason.",
    tech: [
      "Load balancers and CDNs (Main week 27: Load balancing); caches (Main week 20: Caching); queues (Main week 20: Messaging).",
      "Object storage (S3) for files and large blobs, with presigned uploads.",
      "Search: an inverted index (Elasticsearch, OpenSearch) for text queries.",
      "Rate limiters: token bucket or sliding window counters, usually in Redis.",
      "Unique ID generators: Snowflake-style IDs pack a timestamp, a machine id and a sequence number into 64 bits, so they're unique without coordination and roughly time-ordered.",
      "Notification systems: a queue plus workers per channel (push, email, SMS), with retries and user preferences.",
    ],
    cost: "Every block adds operational load and failure modes; use one only when the requirements call for it.",
    tryIt:
      "Implement a token bucket rate limiter in Redis with a Lua script, and a Snowflake-style ID generator in your API's language.",
    buildsOn: "Main week 20: Caching",
  },
  "M35:9": {
    why: "In real jobs, designs are written down and reviewed before anyone builds them. The doc is the design.",
    problem:
      "Designs discussed only in meetings are forgotten, re-argued and misremembered, and alternatives that were rejected get proposed again.",
    how: "Write a short doc with a standard structure: the context, goals and non-goals, the options considered, the decision and why, the risks, and how it'll be rolled out.",
    tech: [
      "Context: what exists today and why change is needed.",
      "Goals and non-goals: what success looks like, and what this explicitly won't do.",
      "Options considered: at least two, with honest pros and cons.",
      "Decision: the chosen option and the reasons tied to goals.",
      "Risks and open questions; rollout plan with milestones, migration and rollback.",
      "Share it early for comments (Main week 42: Writing for engineers).",
    ],
    cost: "Docs take time and can become ceremony for small changes; scale the doc to the size and risk of the decision.",
    tryIt:
      "Write a two-page design doc for your capstone's hardest component using this structure, and ask someone to comment on it.",
    buildsOn: "Main week 42: Writing for engineers",
  },

  // ---- Week 51: System design practice II: more building blocks ----
  "M51:0": {
    why: "File storage and sync (as in Dropbox or Google Drive) combine large data, many devices and conflicting edits.",
    problem:
      "Uploading whole large files through your API servers is slow and expensive, re-uploading a whole file for a small change wastes bandwidth, and two devices editing offline produce conflicts.",
    how: "Split files into chunks stored in object storage, let clients upload directly with presigned URLs, keep metadata in a database, and detect and resolve conflicts on sync.",
    tech: [
      "Blob storage (S3) holds the bytes; a metadata database holds files, versions, chunk lists and permissions.",
      "Chunking: split files into blocks (for example 4 MB) identified by their hash; only changed chunks are uploaded, and identical chunks are stored once (deduplication).",
      "Presigned URLs let clients upload directly to object storage (Main week 48: Storage and data).",
      "Sync: clients learn about changes through long polling, WebSockets or push notifications, then download changed chunks.",
      "Conflicts: when two devices change the same version, keep both (a 'conflicted copy') or merge if the format allows.",
    ],
    cost: "Chunking and deduplication add complexity and metadata volume, and conflict handling is never perfect for users.",
    tryIt:
      "Write a script that splits a file into 4 MB chunks named by SHA-256, change a few bytes in the middle, and count how many chunks change.",
    buildsOn: "Main week 48: Storage and data",
  },
  "M51:1": {
    why: "Search boxes and autocomplete are everywhere, and users expect results as they type, in milliseconds.",
    problem:
      "Scanning every document with LIKE '%term%' is far too slow, and suggestions need to be ranked by popularity, not just alphabetically.",
    how: "Use a trie (prefix tree) of popular queries for typeahead, an inverted index from words to documents for search, rank results by relevance and popularity, and update indexes in the background.",
    tech: [
      "A trie stores strings by character so all completions of a prefix share one path; each node can cache its top-k suggestions (Java week 24: Tries).",
      "An inverted index maps each term to the list of documents containing it, like the index at the back of a book.",
      "Ranking: relevance (such as BM25) combined with signals like popularity and freshness.",
      "Indexes are rebuilt or updated in batches from logs and data changes, not on every keystroke.",
      "Typeahead is cached heavily, at the CDN or the client, with debounced requests.",
    ],
    cost: "Indexes use a lot of memory and lag behind writes, and good ranking is an endless tuning problem.",
    tryIt:
      "Build a trie of 10,000 search terms with frequencies, store the top 5 completions at each node, and time lookups for short prefixes.",
    buildsOn: "Java week 24: Tries",
  },
  "M51:2": {
    why: "'Find what's near me' powers maps, delivery and ride-sharing. Ordinary indexes can't answer it efficiently.",
    problem:
      "A B-tree index on latitude or longitude alone can't find points near a location in two dimensions, and scanning every driver for every rider doesn't scale.",
    how: "Turn two-dimensional locations into keys that keep nearby points close together, using geohashes or quadtrees, then search the user's cell and its neighbours.",
    tech: [
      "Geohash: recursively divide the map into a grid and encode a cell as a string; points sharing a longer prefix are close.",
      "Search the user's cell and its 8 neighbours, since a nearby point can sit just across a cell boundary.",
      "Quadtree: split a region into four whenever it holds too many points, so dense cities get small cells and empty areas big ones.",
      "Postgres with PostGIS, and Redis GEO commands, implement these for you.",
      "Ride matching: drivers send location updates every few seconds, stored in memory by cell; a matcher finds nearby available drivers and offers the ride.",
    ],
    cost: "Location updates from many drivers mean very high write rates, and grid boundaries and uneven density need careful handling.",
    tryIt:
      "Store 10,000 random points in Redis with GEOADD and query everything within 1 km of a location with GEOSEARCH.",
  },
  "M51:3": {
    why: "Money must never be lost, created or moved twice. Payment systems use centuries-old accounting ideas to guarantee that.",
    problem:
      "A retried request charges a customer twice, a crash between two updates loses money, and without an audit trail nobody can prove what happened.",
    how: "Record every movement as balanced double-entry ledger lines, make every operation idempotent, and reconcile your records against the payment provider's regularly.",
    tech: [
      "Double-entry bookkeeping: every transfer debits one account and credits another by the same amount, so the total always balances.",
      "Ledger entries are append-only; mistakes are fixed with new reversing entries, never edits.",
      "Store amounts as integers in minor units (cents) with a currency, never floats (Main week 1: Information as bits).",
      "Idempotency keys on every payment request and every call to the provider (Main week 16: Idempotency and idempotency keys).",
      "Reconciliation compares your ledger with the bank's or provider's records and flags differences.",
      "'Exactly-once' money movement is at-least-once delivery plus idempotent processing.",
    ],
    cost: "Ledgers grow forever and need careful design for balances and reporting, and reconciliation catches problems after the fact rather than preventing them.",
    tryIt:
      "Model a wallet transfer in Postgres as two ledger rows inside one transaction with an idempotency key, and test that a retried request doesn't move money twice.",
    buildsOn: "Main week 16: Idempotency and idempotency keys",
  },
  "M51:4": {
    why: "Many systems need to run work at particular times or in the background, reliably, across many machines.",
    problem:
      "Cron on one server is a single point of failure, while cron on several servers runs every job several times; jobs that crash halfway are lost.",
    how: "Store jobs in a durable store, let workers claim jobs with time-limited leases, retry failures with backoff, and accept that a job may run more than once, so make jobs idempotent.",
    tech: [
      "Jobs live in a database or queue with their schedule, status, attempt count and next run time.",
      "A worker claims a job with a lease (for example 5 minutes); if it dies, the lease expires and another worker takes the job.",
      "This gives at-least-once execution, so jobs must be idempotent.",
      "Retries with backoff, a maximum attempt count and a dead letter list for jobs that keep failing.",
      "For cron at scale, one scheduler (chosen by leader election) creates job instances when they're due, and the workers run them.",
    ],
    cost: "Leases that are too short cause duplicate runs and too long delay recovery, and clock differences between machines cause edge cases.",
    tryIt:
      "Build a job table in Postgres, run three workers claiming jobs with SELECT ... FOR UPDATE SKIP LOCKED and a lease, and kill one worker mid-job to watch another take over.",
    buildsOn: "Main week 34: Durable workflows",
  },
  "M51:5": {
    why: "Monitoring systems such as Prometheus ingest millions of data points per second. Designing one teaches high-volume write paths and time-series storage.",
    problem:
      "Every server reports many metrics every few seconds; storing each point as a row in a normal database is far too slow and large, and queries over months would scan billions of rows.",
    how: "Store each series (metric name plus labels) as compressed, time-ordered chunks, keep high resolution only for recent data, and downsample older data into coarser summaries.",
    tech: [
      "A time series is identified by a metric name and labels, such as http_requests_total{service=api,status=500}.",
      "Points arrive in time order, so they're appended to in-memory chunks and flushed to immutable blocks.",
      "Compression stores differences between timestamps and values, often under 2 bytes per point.",
      "Downsampling: keep raw data for days, 5-minute averages for months and hourly averages for years.",
      "Cardinality (the number of distinct label combinations) is the main scaling limit, so labels like user id are banned.",
    ],
    cost: "Downsampling loses detail permanently, and high-cardinality labels can bring the whole system down.",
    tryIt:
      "Estimate the data points per second and storage per month for 500 servers each reporting 200 metrics every 15 seconds, before and after downsampling.",
    buildsOn: "Main week 32: Observability",
  },
  "M51:6": {
    why: "Real systems, and the papers and postmortems written about them, are the best design teachers. They show what actually breaks at scale.",
    problem:
      "Interview prep material repeats the same simplified designs, which hide the hard trade-offs real engineers faced.",
    how: "Read one foundational paper closely and several public postmortems, asking what problem each design solved, what it traded away and what failed.",
    tech: [
      "Dynamo (Amazon, 2007): leaderless replication, consistent hashing, quorums and conflict resolution.",
      "GFS (Google, 2003): a single metadata master with large chunks spread across many machines.",
      "Kafka (LinkedIn, 2011): a distributed, partitioned commit log.",
      "Spanner (Google, 2012): globally distributed transactions using tightly synchronised clocks (TrueTime).",
      "Public postmortems (Cloudflare, AWS, GitHub, Google Cloud) show real failure chains: config pushes, retry storms, expired certificates.",
    ],
    cost: "Papers are dense and assume background; read with notes and expect to reread sections.",
    tryIt:
      "Read the Dynamo paper and write one page: the problem, three key techniques, and one trade-off you'd make differently today.",
    buildsOn: "Main week 33: Replication",
  },

  // ---- Week 52: Operating the capstone ----
  "M52:0": {
    why: "Running your own service for real users, even a few, is the best way to learn what reliability means.",
    problem:
      "Without stated targets, you don't know whether the service is healthy, and you'll either ignore problems or panic over noise.",
    how: "Define SLIs and SLOs for your capstone's key journeys, track an error budget, and alert only when users are actually affected.",
    tech: [
      "Pick 2 or 3 key user journeys, such as sign in, the main action and loading the main page.",
      "SLIs for each: success rate and latency at p95 or p99 (Main week 32: Dashboards and alerting).",
      "SLOs with realistic targets, such as 99.5% success over 30 days.",
      "The error budget tells you when to stop shipping features and fix reliability.",
      "Alerts on SLO burn rate, sent somewhere you'll actually see them.",
    ],
    cost: "Setting this up for a small project feels like overhead, but it's the same work at any scale, and it's what interviewers ask about.",
    tryIt:
      "Write your capstone's SLO document with SLIs, targets and alert rules, and implement them in Grafana.",
    buildsOn: "Main week 32: Dashboards and alerting",
  },
  "M52:1": {
    why: "When an alert fires, you want a checklist, not a blank page.",
    problem:
      "During an incident, stress makes people forget the obvious checks, and knowledge lives only in the head of whoever built the system.",
    how: "For each alert, write a runbook: what it means, how bad it is, what to check first and the safe steps to mitigate.",
    tech: [
      "What the alert means and the user impact.",
      "First checks: recent deploys, the dashboard to open, dependency status pages.",
      "Diagnostic commands and queries, ready to copy.",
      "Mitigations in order of safety: roll back, flip a flag, scale up, fail over.",
      "When and how to escalate, and links to related runbooks.",
    ],
    cost: "Runbooks go stale as systems change; review them after every incident and every game day.",
    tryIt:
      "Write runbooks for your capstone's top 3 alerts and link each from the alert itself.",
    buildsOn: "Main week 42: On-call",
  },
  "M52:2": {
    why: "You don't know how your system fails until it does. Breaking it on purpose, when you're ready, is far better than finding out at 3 a.m.",
    problem:
      "Untested failure handling (retries, failover, timeouts) often doesn't work, and nobody knows until a real outage.",
    how: "Plan experiments that inject specific failures, predict what should happen, run them in a controlled way, and fix what surprises you.",
    tech: [
      "Write a hypothesis first: 'if one pod dies, users see no errors'.",
      "Inject failures: kill pods, add latency to the database, fill a disk, block a dependency with a network policy.",
      "Tools: kubectl delete, tc for network delay, Chaos Mesh or LitmusChaos in Kubernetes.",
      "Limit the blast radius: staging first, a small share of traffic, a clear abort plan.",
      "Record what happened, what alerted and what didn't, and turn surprises into fixes.",
    ],
    cost: "Chaos experiments can cause real outages if run carelessly, and they need time and a stable system to be useful.",
    tryIt:
      "Run a game day on your capstone: kill a pod, add 500 ms latency to the database, and cut one dependency, checking alerts and user impact for each.",
    buildsOn: "Main week 34: Reliability patterns",
  },
  "M52:3": {
    why: "In an incident, coordination matters as much as technical skill. Clear roles stop chaos.",
    problem:
      "Everyone debugs in parallel, nobody updates users, and people chase the root cause while the outage continues.",
    how: "Assign roles, keep a timeline, communicate regularly and focus on restoring service before understanding the cause.",
    tech: [
      "Incident commander: coordinates, decides and delegates; doesn't debug.",
      "Communicator: posts status updates to users and stakeholders on a regular schedule.",
      "Responders investigate and act on the commander's direction.",
      "Keep a timeline of observations and actions as you go; it becomes the postmortem's backbone.",
      "Mitigate first: roll back, fail over or disable a feature, then find the root cause.",
    ],
    cost: "Formal roles feel heavy for a one-person project; practise them anyway on a game day with a friend.",
    tryIt:
      "During your next game day, act as incident commander and have someone else respond, keeping a written timeline throughout.",
    buildsOn: "Main week 32: Incident basics",
  },
  "M52:4": {
    why: "Every incident is a chance to make the system stronger, but only if people feel safe telling the full story.",
    problem:
      "Blaming individuals leads people to hide mistakes, so the real causes, usually in systems and processes, stay unfixed.",
    how: "Write a postmortem that describes what happened, why the system allowed it, and action items that change the system, not people's behaviour.",
    tech: [
      "Summary and user impact: duration, users affected, data lost if any.",
      "Timeline from the incident log.",
      "Contributing factors: technical, process and organisational; usually several, not one 'root cause'.",
      "What went well and where you got lucky.",
      "Action items with owners and dates, focused on making the failure impossible, detectable or less damaging.",
    ],
    cost: "Good postmortems take time, and their value depends on action items actually being completed.",
    tryIt:
      "Write a full postmortem for your game day's worst result, with at least three action items, and complete one of them.",
    buildsOn: "Main week 42: On-call",
  },
  "M52:5": {
    why: "Knowing how much load your system can take, and what breaks first, lets you plan instead of react.",
    problem:
      "Without a load test, the first time you learn your limit is when real users hit it, usually at the worst moment.",
    how: "Increase load step by step until latency or errors break your SLOs, watch which resource saturates first, and fix or plan around it.",
    tech: [
      "Use a realistic mix of requests and data, not a single endpoint (Main week 21: Performance basics).",
      "Ramp up gradually with k6 and watch p95 and p99 latency and error rate, not just averages.",
      "Watch saturation: CPU, memory, database connections, connection pools, queue depth.",
      "The first thing to fail is often a pool or a limit (database connections, file descriptors), not raw CPU.",
      "Record the breaking point and the headroom over your expected peak.",
    ],
    cost: "Realistic load tests need realistic data and environments, and testing production carelessly can cause the outage you're trying to prevent.",
    tryIt:
      "Load test your capstone with k6 until it breaks your latency SLO, and write down the maximum requests per second and the first resource to saturate.",
    buildsOn: "Main week 21: Performance basics",
  },

  // ---- Week 53: Getting hired ----
  "M53:0": {
    why: "Interviews are a skill separate from engineering. Knowing each stage lets you prepare for what's actually tested.",
    problem:
      "Candidates prepare only for coding questions and are surprised by design, behavioural or hiring manager rounds.",
    how: "Learn the usual stages, what each measures and how this plan prepared you for it, then practise each one deliberately.",
    tech: [
      "Online assessment: timed coding problems, usually automated.",
      "DSA rounds: solve and explain problems live (the Java track).",
      "Low-level design: classes and interfaces for a small system (Java week 38: Low-level design I).",
      "System design: a scalable architecture, more common for experienced roles (Main week 35).",
      "Behavioural and hiring manager rounds: your past work, collaboration and motivation.",
      "Ask the recruiter which rounds the company uses; it varies a lot.",
    ],
    cost: "Interview preparation takes weeks of focused practice that doesn't directly improve your engineering, but it's unavoidable for most jobs.",
    tryIt:
      "Pick three companies you'd like to work at, look up their interview process, and map each round to the part of this plan that prepares you.",
  },
  "M53:1": {
    why: "Without professional experience, your projects are your evidence. A focused portfolio shows you can build and explain real systems.",
    problem:
      "Dozens of half-finished tutorial projects look like no projects; reviewers spend about a minute and can't tell what you actually did.",
    how: "Polish three substantial projects from this plan, each with a clear README, an architecture diagram and a design doc that explains your decisions.",
    tech: [
      "Your capstone: the most complete, deployed and operated.",
      "Your Phase 4 API: shows backend fundamentals, testing and data modelling.",
      "One Java project: shows a second language and strong data structures or Spring Boot.",
      "Each README: what it does, a screenshot or demo link, how to run it, the architecture diagram, and key decisions (Main week 21: Writing a README).",
      "Link the design docs, ADRs and postmortems; they're rare in junior portfolios and stand out.",
    ],
    cost: "Polishing takes time you could spend building, but three finished projects beat ten unfinished ones.",
    tryIt:
      "Rewrite the README of one project so a stranger understands what it does and why it's built that way in under two minutes, and ask someone to test that.",
    buildsOn:
      "Main week 21: Writing a README and architecture decision records (ADRs)",
  },
  "M53:2": {
    why: "A resume gets about 10 seconds of attention. It has to show impact quickly and give interviewers good things to ask about.",
    problem:
      "Lists of technologies and duties say nothing about what you achieved, and anything you can't discuss in depth becomes a liability in interviews.",
    how: "Keep it to one page, lead each line with what you did and its effect, use numbers where you have them, and include only what you can talk about for 10 minutes.",
    tech: [
      "One page, simple layout, readable by applicant tracking systems (plain text, standard headings).",
      "Bullet structure: action, what you built, the result, such as 'Cut API p99 latency from 800 ms to 120 ms by adding Redis caching'.",
      "Projects section with links to the repos and live demos.",
      "Skills grouped briefly; don't list anything you can't use.",
      "Tailor the top lines to each role's requirements.",
    ],
    cost: "Tailoring for each application takes time, and resume advice varies by country and company.",
    tryIt:
      "Rewrite three resume bullets about your capstone in action-result form with a number, and practise talking about each for 5 minutes.",
  },
  "M53:3": {
    why: "Behavioural rounds decide many offers. Interviewers want evidence of how you've actually worked, not how you would.",
    problem:
      "Unprepared answers ramble, lack specifics or describe what 'we' did, so the interviewer can't assess you.",
    how: "Prepare 8 to 10 true stories in advance, each told in the STAR format, and map them to common question themes.",
    tech: [
      "STAR: Situation (brief context), Task (your goal), Action (what you specifically did, the longest part), Result (outcome, with numbers and what you learned).",
      "Themes: conflict, failure, ownership, ambiguity, learning quickly, disagreeing with a decision, helping others.",
      "Draw on this plan: capstone incidents, open-source reviews, design decisions, hard bugs.",
      "Say 'I' for your own actions; be honest about mistakes and what changed afterwards.",
      "Keep each story to about 2 minutes, with details ready for follow-ups.",
    ],
    cost: "Preparing stories feels artificial, but without them good experiences come out badly under pressure.",
    tryIt:
      "Write 8 STAR stories from your work on this plan, tag each with the themes it fits, and tell two of them out loud on a timer.",
  },
  "M53:4": {
    why: "Solving problems silently at a desk is different from solving them out loud under time pressure with someone watching.",
    problem:
      "Candidates who practise only alone freeze, forget to explain their thinking, or run out of time in real interviews.",
    how: "Practise full interviews out loud, timed, with another person or a mock interview platform, and use the feedback to fix specific weaknesses.",
    tech: [
      "Simulate the real format: 45 minutes, a shared editor, talking throughout.",
      "For coding: clarify, give examples, state the approach and complexity, code, then test with cases (Java week 35: Mixed practice and mock interviews).",
      "For design: follow the seven-step process on a timer (Main week 35: The design process).",
      "Get written feedback on communication as well as correctness.",
      "Track recurring weaknesses and practise them specifically.",
    ],
    cost: "Mocks are uncomfortable and need a partner's time or money for a platform, but they're the closest thing to the real test.",
    tryIt:
      "Do two mock interviews this week, one coding and one system design, with a peer or a free platform, and write down three things to improve.",
    buildsOn: "Java week 35: Mixed practice and mock interviews",
  },
  "M53:5": {
    why: "Most jobs are filled through networks and targeted applications, not by sending the same resume everywhere.",
    problem:
      "Cold applications have low response rates, and without tracking you lose follow-ups and can't tell what's working.",
    how: "Use referrals and visible work, apply in focused batches, and track every application like a small sales pipeline.",
    tech: [
      "Referrals from people you know or have worked with have much higher response rates than cold applications.",
      "Open-source contributions are public proof of skill and can lead to introductions (Main week 40: Open source).",
      "Apply in batches of 10 to 20 tailored applications, so interviews and offers overlap.",
      "Track company, role, date, contact, stage and next step in a spreadsheet.",
      "Review results every couple of weeks: if no responses, fix the resume; if no offers, practise interviews.",
    ],
    cost: "Job searching is slow and full of rejection; plan for it to take months, and keep building meanwhile.",
    tryIt:
      "Set up an application tracker, list 20 target companies, and find one person to ask about each of three of them.",
    buildsOn: "Main week 40: Open source",
  },
  "M53:6": {
    why: "Salary and terms are set once and affect years of earnings. A short, polite negotiation is normal and expected.",
    problem:
      "Comparing offers by base salary alone ignores much of their value, and accepting the first number usually leaves money behind.",
    how: "Compare total compensation over the first few years, research market rates, and negotiate politely with specific reasons and competing offers where you have them.",
    tech: [
      "Total compensation: base salary, bonus, equity (vesting schedule, and whether it's liquid), signing bonus and benefits.",
      "Equity at startups may be worth nothing; value it cautiously.",
      "Research ranges with levels.fyi, Glassdoor and peers, for your location and level.",
      "Negotiate after the written offer: be enthusiastic, give a specific number with reasons, mention competing offers truthfully.",
      "Ask about non-salary terms too: start date, remote work, learning budget, level.",
    ],
    cost: "Negotiation can feel uncomfortable, and pushing too hard with weak leverage can occasionally sour an offer; stay polite and specific.",
    tryIt:
      "Build a spreadsheet comparing two sample offers by 4-year total compensation, and write a short negotiation email for the one you'd prefer.",
  },
};
