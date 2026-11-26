import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's infrastructure and deployment phase (M27, M29-M32, M48, M49). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_INFRA: ExplainMap = {
  // ---- Week 27: The edge stack ----
  "M27:0": {
    why: "Almost every production web app sits behind at least one proxy. It's the first program your users' requests actually reach.",
    problem:
      "Exposing an app server directly means it must handle TLS, slow clients, static files and load spreading itself, and every internal detail is visible to the internet.",
    how: "A proxy is a server that forwards requests on someone else's behalf. A forward proxy acts for clients going out; a reverse proxy acts for servers, receiving requests from the internet and passing them to the apps behind it.",
    tech: [
      "Forward proxy: sits in front of clients (a company network or the agent proxy in a sandbox); servers see the proxy, not the client.",
      "Reverse proxy: sits in front of servers; clients see the proxy, not the servers.",
      "TLS termination: the proxy handles encryption (Main week 7: TLS), so apps behind it speak plain HTTP on a private network.",
      "Buffering slow clients: the proxy absorbs slow uploads and downloads so app processes aren't tied up waiting on a phone's bad connection.",
      "It also serves static files, compresses responses, spreads load across servers and hides internal addresses and software versions.",
    ],
    cost: "Another hop adds a little latency and is one more component to configure, monitor and keep available. Apps must read the real client IP from headers.",
    tryIt:
      "Run your API on port 3000, put NGINX in front of it on port 8080 with proxy_pass, and compare the response headers with and without the proxy.",
    buildsOn: "Main week 7: TLS",
  },
  "M27:1": {
    why: "NGINX serves a huge share of the web and can hold tens of thousands of connections with little memory. Its design is the reason.",
    problem:
      "Older servers used one process or thread per connection, so 10,000 idle keep-alive connections meant 10,000 threads, each with its own memory and scheduling cost.",
    how: "NGINX runs a few worker processes, usually one per CPU core, and each runs an event loop that handles thousands of connections without blocking, the same idea as Node's event loop.",
    tech: [
      "The master process reads configuration, opens ports and manages workers; it doesn't handle requests.",
      "Each worker is single-threaded and uses epoll on Linux (kqueue on BSD) to wait on all its sockets at once (Main week 3: I/O models).",
      "A connection costs a small amount of memory for its state rather than a whole thread.",
      "Reloading configuration (nginx -s reload) starts new workers and lets old ones finish their requests, so there's no downtime.",
      "Blocking work in a worker, such as slow disk reads, stalls every connection on it; thread pools exist for those cases.",
    ],
    cost: "Extending NGINX with custom logic is harder than in an application language, and some features are only in the commercial NGINX Plus.",
    tryIt:
      "Run ps -ef | grep nginx to see the master and workers, then open 1,000 idle connections with a load tool and watch memory stay low.",
    buildsOn: "Main week 3: I/O models",
  },
  "M27:2": {
    why: "Most NGINX setups you'll meet are a few dozen lines of configuration. Reading and writing them is a day-one skill on many teams.",
    problem:
      "Configuration mistakes cause wrong routing, lost client IPs, broken HTTPS redirects or no protection against floods, and they're easy to make.",
    how: "Configuration is nested blocks: http holds global settings, each server block is a site (by port and host name), and location blocks inside choose what to do for each path.",
    tech: [
      "Location matching order: an exact match (=) wins; otherwise the longest prefix is remembered, ^~ on it stops the search, then regex locations (~, ~*) are tried in file order, and the longest prefix is used if none match.",
      "proxy_pass http://app; forwards to an upstream block that lists the backend servers.",
      "Set X-Forwarded-For and X-Forwarded-Proto (and Host) so the app knows the real client IP and that the original request was HTTPS.",
      "gzip compresses responses; proxy_cache caches upstream responses on disk.",
      "limit_req applies rate limits per key, such as per client IP.",
      "TLS: ssl_certificate, ssl_certificate_key and ssl_protocols TLSv1.2 TLSv1.3, plus a server block that redirects HTTP to HTTPS.",
    ],
    cost: "The matching rules are subtle and silent mistakes are common; run nginx -t before every reload, and keep configs in version control.",
    tryIt:
      "Write a config that serves /static from disk, proxies /api to your API with forwarding headers, rate-limits /api/login, and test each with curl -i.",
    buildsOn: "Main week 7: Headers",
  },
  "M27:3": {
    why: "One server can't handle all traffic or survive its own failure. A load balancer spreads requests across many and routes around broken ones.",
    problem:
      "Without one, adding servers doesn't help because clients don't know about them, and when a server dies its users get errors.",
    how: "The load balancer receives every request, picks a healthy backend using an algorithm, and stops sending traffic to backends that fail health checks.",
    tech: [
      "L4 (TCP) load balancers forward connections without reading HTTP: fast, but can't route by path or header. L7 (HTTP) balancers read requests and can route by host, path or cookie.",
      "Algorithms: round robin, weighted (bigger servers get more), least connections, IP hash, and consistent hashing (keeps most keys on the same server when servers change).",
      "Active health checks poll an endpoint; passive health checks watch real requests for failures.",
      "Connection draining stops new requests to a server being removed while letting current ones finish.",
      "Sticky sessions pin a user to one server, which breaks when that server dies; stateless apps keep sessions in Redis or a token so any server can answer.",
    ],
    cost: "The load balancer itself must be highly available, and L7 balancing costs more CPU. Uneven requests can still overload one server.",
    tryIt:
      "Run three copies of your API behind NGINX with least_conn, kill one during a load test, and look at the error count with and without passive health checks.",
    buildsOn: "Main week 27: NGINX configuration",
  },
  "M27:4": {
    why: "Light from New York to Sydney takes about 80 ms each way, before any processing. A CDN puts copies of your content close to users.",
    problem:
      "Serving everything from one region makes faraway users wait on every round trip, and a traffic spike hits your origin servers directly.",
    how: "A content delivery network (CDN) runs servers in many cities. Users are routed to the nearest one, which serves cached content or fetches it from your origin once and keeps it.",
    tech: [
      "Edge locations, or PoPs (points of presence), are CDN data centres in many cities.",
      "Anycast: many PoPs announce the same IP address, and internet routing sends each user to the nearest (Main week 6: Network layer).",
      "The origin is your server; an origin shield is one middle cache layer that protects it from every PoP asking separately.",
      "The cache key (usually URL plus some headers) decides what counts as the same object; Cache-Control, s-maxage and stale-while-revalidate decide how long (Main week 7: Caching).",
      "Purge by URL or tag when content changes, or use versioned URLs so you never need to.",
      "Edge compute (Cloudflare Workers, Vercel Edge Functions) runs small pieces of code at the PoP.",
    ],
    cost: "Cache mistakes can serve stale or even private data to the wrong users, CDNs charge by traffic, and edge runtimes support only some APIs.",
    tryIt:
      "Run curl -I against a big site's static file and look for cache headers such as age, x-cache or cf-cache-status; request it twice and compare.",
    buildsOn: "Main week 7: Caching",
  },
  "M27:5": {
    why: "When an app is split into several services, clients shouldn't need to know about each one, and every service shouldn't re-implement authentication and rate limits.",
    problem:
      "Without a single entry point, each service handles token checking, quotas and logging differently, and clients must track many addresses.",
    how: "An API gateway is one front door for many services: it routes each request to the right service and applies shared policies such as JWT validation, rate limits and request transformation.",
    tech: [
      "Routing by path or host: /orders goes to the orders service, /users to the users service.",
      "JWT validation at the gateway, so services receive only authenticated requests (Main week 17: Tokens).",
      "Rate limits and quotas per API key or per user.",
      "Transformation: rewriting paths and headers, or combining calls.",
      "API management products add a developer portal, API key issuing and usage analytics.",
      "Examples: Kong, AWS API Gateway, Envoy-based gateways.",
    ],
    cost: "A gateway is a single point of failure and a possible bottleneck, and putting business logic in it spreads that logic into hard-to-test configuration.",
    tryIt:
      "Put a gateway such as Kong (in Docker) in front of two small services and configure path routing and a per-key rate limit.",
    buildsOn: "Main week 27: Forward proxy vs reverse proxy",
  },
  "M27:6": {
    why: "Many attacks look like normal HTTP requests. A web application firewall (WAF) inspects requests and blocks common attack patterns before they reach your code.",
    problem:
      "Your code may have a vulnerability you don't know about yet, and some attacks are simply huge floods of traffic.",
    how: "A WAF inspects HTTP requests (L7) against rules such as the OWASP Core Rule Set, and logs or blocks matches. Separate protections absorb network-level floods.",
    tech: [
      "The OWASP Core Rule Set has patterns for SQL injection, XSS, path traversal and more (Main week 17: OWASP Top 10).",
      "Detection mode only logs matches; blocking mode rejects them. Start in detection mode.",
      "False positives block real users (a blog post about SQL can look like injection), so rules need tuning per app.",
      "L3/L4 DDoS (distributed denial of service) floods the network with packets; it's absorbed by large networks and CDNs, not by your server.",
      "L7 DDoS sends many valid-looking requests; rate limits, bot detection and challenges help.",
    ],
    cost: "A WAF is a safety net, not a fix: it adds latency, needs tuning, and attackers find ways around generic rules. Secure code is still required.",
    tryIt:
      "Run the OWASP ModSecurity CRS Docker image in front of your API, send a request with ' OR 1=1-- in a query parameter, and find the rule that matched in the log.",
    buildsOn: "Main week 17: OWASP Top 10",
  },
  "M27:7": {
    why: "These layers are usually described one at a time. In production they form a single chain, and you need to know the order and what each adds.",
    problem:
      "Small teams copy a big company's architecture and run five layers they don't need, or skip a layer that would have prevented an outage.",
    how: "Follow a request in order: DNS, CDN, WAF, load balancer, API gateway, service. Then decide which layers your scale and risks actually need.",
    tech: [
      "DNS resolves the name, often to the CDN (Main week 6: DNS).",
      "The CDN serves cached content and passes the rest through; WAF rules often run in the CDN.",
      "The load balancer spreads traffic across healthy servers and usually terminates TLS.",
      "An API gateway routes to services and applies shared policies; with one service, the load balancer or app often does this job.",
      "A small company usually needs a managed CDN with a WAF, one load balancer and the app; gateways and multiple proxy layers come later.",
    ],
    cost: "Each layer adds latency, cost, configuration and another place for problems to hide; each missing layer is a risk you accept knowingly.",
    tryIt:
      "Draw the path of a request to one of your own deployed apps, name the product at each layer, and mark which layers you could remove or would need to add at 100 times the traffic.",
  },

  // ---- Week 29: Containers and Docker ----
  "M29:0": {
    why: "Before containers, deploying meant hoping the server had exactly the right versions of everything. Containers package an app with everything it needs.",
    problem:
      "'It works on my machine' happens because machines differ in OS packages, language versions and config. Two apps on one server may need conflicting versions, and full virtual machines per app are heavy and slow to start.",
    how: "Package the app with its runtime, libraries and files into an image, and run it as an isolated process that sees only its own files, on any machine with a container runtime.",
    tech: [
      "An image bundles the app, its runtime (Node, Java) and its system libraries.",
      "The same image runs on a laptop, in CI and in production, so environments match.",
      "Each container has its own filesystem, so apps can't conflict over library versions.",
      "Containers start in milliseconds to seconds and use much less memory than virtual machines, because they share the host kernel.",
    ],
    cost: "Containers add an image build step, a registry and new tools to learn, and they don't remove differences in kernel, CPU architecture or configuration.",
    tryIt:
      "Run docker run --rm node:22 node -v and docker run --rm node:20 node -v on the same machine to see two versions side by side.",
  },
  "M29:1": {
    why: "A container isn't a small virtual machine. It's an ordinary Linux process with a restricted view of the system, and knowing that demystifies most container behaviour.",
    problem:
      "If containers seem like magic boxes, their limits (shared kernel, memory kills, PID 1 behaviour) are confusing and security risks go unnoticed.",
    how: "The kernel gives the process its own view of system resources with namespaces, caps its resource use with cgroups, and gives it a different root filesystem built from image layers.",
    tech: [
      "Namespaces give the process its own view of: process IDs (PID, so it's PID 1 inside), mounts, network interfaces, hostname (UTS), IPC and user IDs.",
      "cgroups (control groups) limit and account for CPU, memory and I/O; going over the memory limit gets the process killed (Main week 2: Memory).",
      "The root filesystem is the image's layers stacked with OverlayFS, made the process's / with pivot_root (a stronger form of chroot).",
      "It's still a normal process on the host: ps on the host shows it.",
      "Extra hardening: dropping Linux capabilities, seccomp syscall filters and running as a non-root user.",
    ],
    cost: "All containers share the host kernel, so a kernel vulnerability can let a process escape. Isolation is weaker than a VM's.",
    tryIt:
      "Start a container running sleep 1000, then run ps aux | grep sleep on the host, and compare its PID on the host with ps inside the container.",
    buildsOn: "Main week 2: Processes",
  },
  "M29:2": {
    why: "Containers and virtual machines both isolate workloads, at different levels and different costs. Real systems often use both.",
    problem:
      "Choosing the wrong one gives you either weak isolation for untrusted code or wasted resources and slow starts for ordinary apps.",
    how: "A virtual machine emulates a whole computer with a hypervisor and runs its own kernel; a container shares the host's kernel and isolates only the process's view.",
    tech: [
      "VM: hypervisor (KVM, Hyper-V, Xen) plus a full guest OS per VM; strong isolation, boots in seconds to minutes, uses GBs.",
      "Container: shared kernel, isolated process; starts in milliseconds, uses MBs.",
      "A container can only run software for the host's kernel: Linux containers need a Linux kernel (Docker Desktop runs a small Linux VM for you).",
      "Cloud providers run your containers inside VMs, so you get both layers.",
      "MicroVMs (Firecracker, used by AWS Lambda and Fargate) and gVisor sit in between for running untrusted code.",
    ],
    cost: "VMs waste memory and time on duplicate kernels; containers trade some isolation for density and speed.",
    tryIt:
      "Run uname -r on your host and inside a container, and see that they report the same kernel.",
    buildsOn: "Main week 29: What a container really is",
  },
  "M29:3": {
    why: "Images are how containers are shipped. Understanding layers explains slow builds, huge images and 'it's a different version in production'.",
    problem:
      "Rebuilding and uploading whole images on every change would be slow, and a tag such as latest can point at different contents tomorrow.",
    how: "An image is a stack of read-only layers, one per filesystem-changing build step, each identified by a hash. Registries store layers once and share them between images.",
    tech: [
      "Each RUN, COPY or ADD step creates a layer; unchanged layers are reused from the cache on the next build.",
      "Layers are content-addressed by SHA-256, so identical layers are stored and downloaded once.",
      "A registry (Docker Hub, GitHub Container Registry, ECR) stores and serves images.",
      "A tag (myapp:1.4) is a movable label; a digest (myapp@sha256:...) names exact contents and never changes.",
      "OCI (Open Container Initiative) standardises the image format and runtime, so images work across tools.",
    ],
    cost: "Deleting a file in a later layer doesn't shrink the image, since it's still in the earlier layer, and pinning digests means updating them deliberately.",
    tryIt:
      "Run docker history on an image you built to see each layer and its size, then docker inspect to find its digest.",
  },
  "M29:4": {
    why: "A Dockerfile is the recipe for an image. Its order and instructions decide how fast you build, how big the image is and how secure it runs.",
    problem:
      "A careless Dockerfile reinstalls all dependencies on every code change, runs as root, and copies secrets or node_modules into the image.",
    how: "Write the steps in order of how rarely they change, copy only what's needed, and set a non-root user and a clear start command.",
    tech: [
      "FROM picks the base image; WORKDIR sets the directory; COPY adds files; RUN executes build commands.",
      "ENV sets runtime environment variables; ARG sets build-time variables (not for secrets: they can end up in the image history).",
      "CMD is the default command and is easy to override; ENTRYPOINT is the fixed executable, and CMD becomes its default arguments.",
      "EXPOSE documents the port; USER switches to a non-root user.",
      ".dockerignore keeps node_modules, .git and .env out of the build context.",
      "Cache order: copy package.json and the lock file, install dependencies, then copy the source, so code changes don't reinstall everything.",
    ],
    cost: "Optimising for the cache makes Dockerfiles longer and less obvious, and every instruction choice has subtle effects on size and security.",
    tryIt:
      "Write a Dockerfile for your API that copies the source before installing dependencies, time a rebuild after a one-line change, then reorder it and compare.",
    buildsOn: "Main week 29: Images",
  },
  "M29:5": {
    why: "Building an app needs compilers and dev dependencies that running it doesn't. Shipping them makes images large and gives attackers more tools.",
    problem:
      "A single-stage Node or Java image can be 1 GB with build tools, source and test files, which is slow to pull and full of vulnerable packages.",
    how: "Use one stage with full tools to build, then copy only the built output into a fresh, minimal base image for the final stage.",
    tech: [
      "FROM node:22 AS build installs and builds; FROM node:22-slim (or distroless) copies only dist and production dependencies with COPY --from=build.",
      "alpine uses musl instead of glibc: very small, but some native modules behave differently.",
      "slim variants are Debian with most extras removed: a safe default.",
      "distroless images contain only the runtime and the app, with no shell or package manager.",
      "Smaller images pull faster, start faster and show fewer vulnerabilities in scans.",
    ],
    cost: "Without a shell, debugging inside a distroless container is harder, and alpine's differences can cause rare, confusing bugs.",
    tryIt:
      "Convert your API's Dockerfile into a multi-stage build on a slim or distroless base, and compare docker images sizes before and after.",
    buildsOn: "Main week 29: Dockerfile",
  },
  "M29:6": {
    why: "'Docker' is several programs. Kubernetes and other tools use only some of them, which is why you'll see the lower layers named separately.",
    problem:
      "Error messages and docs mention dockerd, containerd and runc, and without knowing the stack it's unclear which part failed or why Kubernetes doesn't need Docker.",
    how: "Each layer does one job: the CLI sends commands, the Docker daemon manages builds and networks, containerd manages container lifecycles and images, and runc actually creates the isolated process.",
    tech: [
      "docker CLI: the command you type; it calls the daemon's API.",
      "dockerd (Docker daemon): builds, networks, volumes and the Docker API.",
      "containerd: pulls images, manages snapshots and container lifecycles; used directly by Kubernetes.",
      "runc: the low-level OCI runtime that sets up namespaces and cgroups and starts the process, then exits.",
      "Kubernetes talks to containerd (or CRI-O) through the Container Runtime Interface, so Docker itself isn't needed on nodes.",
      "Podman is an alternative that runs containers without a central daemon.",
    ],
    cost: "More layers mean more moving parts to debug, and slightly different behaviour between Docker on a laptop and containerd in a cluster.",
    tryIt:
      "Run ps -ef on a Linux host with Docker and find dockerd, containerd and a containerd-shim process for a running container.",
  },
  "M29:7": {
    why: "Containers are isolated by default, but real apps need to accept traffic, talk to each other and keep data after a restart.",
    problem:
      "A container's network and filesystem are private and temporary: nothing can reach it, and its data disappears when it's removed.",
    how: "Connect containers through virtual networks, publish ports to the host, and mount volumes for data that must survive.",
    tech: [
      "The default bridge network gives each container a private IP behind NAT on the host (Main week 6: Network layer).",
      "Port publishing (-p 8080:3000) forwards a host port to a container port.",
      "On a user-defined network, containers reach each other by name through Docker's built-in DNS (db:5432).",
      "Volumes are storage managed by Docker that outlives containers; use them for database data.",
      "Bind mounts map a host folder into the container; good for live-editing code in development.",
    ],
    cost: "Container networking adds NAT and hops that can confuse debugging, and bind mounts can be slow and cause file permission issues on macOS and Windows.",
    tryIt:
      "Create a network, run Postgres with a named volume and your API on it, connect by container name, then remove and recreate Postgres and check the data survived.",
    buildsOn: "Main week 6: Network layer",
  },
  "M29:8": {
    why: "A real app needs an API, a database, Redis and maybe a worker. Starting each with a long docker run command is error-prone.",
    problem:
      "New developers spend a day setting up services by hand, and each person's local setup is slightly different.",
    how: "Describe all the services, their images, ports, environment, volumes and dependencies in one compose.yaml file, and start everything with one command.",
    tech: [
      "services: each entry is a container, built from a Dockerfile or pulled as an image.",
      "Compose creates a network where services reach each other by service name.",
      "volumes keep data; environment and env_file set configuration.",
      "depends_on with condition: service_healthy waits for a health check before starting dependants.",
      "docker compose up -d, logs -f, down (add -v to remove volumes).",
    ],
    cost: "Compose is meant for local development and single hosts; it doesn't spread containers across machines or replace containers automatically when a host fails.",
    tryIt:
      "Write a compose.yaml for your API, Postgres and Redis with health checks, and have a teammate (or a fresh clone) start it with one command.",
    buildsOn: "Main week 29: Networking",
  },

  // ---- Week 30: Kubernetes I: the model and core objects ----
  "M30:0": {
    why: "Docker runs containers on one machine. Real systems run hundreds of containers on dozens of machines that fail, fill up and get replaced.",
    problem:
      "By hand, you'd have to decide which machine runs what, restart crashed containers, replace dead machines, scale up for traffic and roll out new versions without downtime.",
    how: "Kubernetes is an orchestrator: you declare what should run, and it places containers on machines, keeps them running, connects them and updates them.",
    tech: [
      "Scheduling: chooses a machine (node) with enough CPU and memory for each container.",
      "Self-healing: restarts failed containers and reschedules them when a node dies.",
      "Scaling: runs more or fewer copies on command or automatically.",
      "Rollouts: replaces old versions gradually and can roll back.",
      "Service discovery and load balancing between containers.",
    ],
    cost: "Kubernetes is complex to learn and run, and for one or two services a simpler platform (a PaaS, ECS or a single VM with Compose) is often better.",
    tryIt:
      "Install kind or minikube, create a local cluster, and run kubectl get nodes and kubectl get pods -A to see what's already running.",
    buildsOn: "Main week 29: Docker Compose",
  },
  "M30:1": {
    why: "The single idea behind Kubernetes is declaring the end state instead of the steps. Everything else follows from it.",
    problem:
      "Scripts of commands ('start 3 containers') break when something changes later: a container crashes, a node dies or someone runs the script twice.",
    how: "You store the desired state as objects in the API ('3 replicas of this image'). Controllers run loops that compare desired with actual state and act to close the gap, forever.",
    tech: [
      "Declarative: write YAML describing the end state and kubectl apply it; applying the same file twice is harmless (idempotent).",
      "Each object has a spec (what you want) and a status (what's actually true).",
      "A controller watches objects and repeats: observe, compare, act. If a pod dies, the ReplicaSet controller creates another.",
      "Many small controllers, each for one kind of object, cooperate through the API.",
      "The same pattern powers GitOps (Main week 32: GitOps) and operators that manage databases.",
    ],
    cost: "Changes happen asynchronously and eventually, so 'applied' doesn't mean 'done', and debugging means finding which controller didn't converge and why.",
    tryIt:
      "Create a Deployment with 3 replicas, delete one pod with kubectl delete pod, and watch a replacement appear with kubectl get pods -w.",
  },
  "M30:2": {
    why: "Knowing the parts of a cluster tells you where to look when something fails and which parts a managed service runs for you.",
    problem:
      "Kubernetes seems like one black box, so a stuck pod or a failed deploy gives no clue whether the scheduler, the node or the network is at fault.",
    how: "The control plane stores and decides; the nodes run the containers. All components talk to each other only through the API server.",
    tech: [
      "API server: the front door; every kubectl command and every component reads and writes objects through it.",
      "etcd: a consistent, replicated key-value store holding all cluster state (it uses the Raft consensus algorithm).",
      "Scheduler: assigns new pods to nodes based on resources and rules.",
      "Controller manager: runs the built-in controllers (Deployments, ReplicaSets, nodes and more).",
      "On each node: the kubelet starts and monitors pods through the container runtime (containerd); kube-proxy programs the Service routing rules.",
    ],
    cost: "Running the control plane yourself, especially etcd, is hard; that's why most teams use managed Kubernetes and pay for it.",
    tryIt:
      "Run kubectl get pods -n kube-system on a kind cluster and match each pod to a component in the list.",
    buildsOn: "Main week 30: Declarative desired state",
  },
  "M30:3": {
    why: "Kubernetes is used through a small set of object types. Knowing what each is for covers most day-to-day work.",
    problem:
      "Pods are mortal and their IPs change, apps need configuration and secrets, and different workloads (web servers, databases, nightly jobs) need different handling.",
    how: "Wrap containers in pods, manage pods with controllers suited to each workload, give them stable addresses with Services, inject config with ConfigMaps and Secrets, and organise everything with namespaces and labels.",
    tech: [
      "Pod: one or more containers that share a network address and volumes, scheduled together; pods are disposable.",
      "Deployment manages ReplicaSets for stateless apps, with rolling updates and rollbacks. StatefulSet gives stable names and storage (databases); DaemonSet runs one pod per node (log agents); Job and CronJob run to completion.",
      "Service: a stable virtual IP and DNS name in front of pods chosen by a label selector. ClusterIP is internal; NodePort opens a port on every node; LoadBalancer asks the cloud for an external load balancer.",
      "EndpointSlices list the current pod IPs behind each Service.",
      "ConfigMap holds configuration; Secret holds sensitive values, but only base64-encoded by default, not encrypted, so restrict access and enable encryption at rest.",
      "Namespaces divide a cluster; labels (app=api) plus selectors connect objects to each other.",
    ],
    cost: "Many object types and lots of YAML to write and keep consistent, and Secrets give a false sense of security if left at their defaults.",
    tryIt:
      "Deploy your API with a Deployment, a ClusterIP Service and a ConfigMap, then decode the Secret you created with base64 -d to see it's not encrypted.",
    buildsOn: "Main week 30: Declarative desired state",
  },
  "M30:4": {
    why: "Kubernetes can only heal what it can see is broken. Probes tell it whether your app is alive, ready for traffic and finished starting.",
    problem:
      "A process can be running but stuck (deadlocked) or not yet ready (still loading), and sending it traffic gives users errors.",
    how: "The kubelet regularly checks each container with probes (HTTP calls, TCP connects or commands) and acts on the results.",
    tech: [
      "Liveness probe: if it fails repeatedly, the container is restarted; use it for stuck processes.",
      "Readiness probe: if it fails, the pod is removed from Service endpoints but not restarted; use it for 'not ready for traffic yet'.",
      "Startup probe: holds off the other probes until a slow-starting app is up.",
      "Use the health endpoints you built (Main week 21: Logging and errors): a cheap /healthz for liveness, and /ready checking key dependencies for readiness.",
      "Don't make liveness depend on the database: a database outage would restart every pod and make things worse.",
    ],
    cost: "Badly tuned probes cause restart loops or route traffic to broken pods, and probes add a little load.",
    tryIt:
      "Add liveness and readiness probes to your Deployment, then make /ready return 503 and watch the pod leave the Service endpoints without restarting.",
    buildsOn: "Main week 21: Logging and errors",
  },
  "M30:5": {
    why: "Many containers share each node. Requests and limits decide where pods go and what happens when they use too much.",
    problem:
      "Without them, the scheduler can't place pods sensibly, one greedy pod can starve its neighbours, and nodes run out of memory unpredictably.",
    how: "A request is what a container is guaranteed and is used for scheduling; a limit is the most it may use. Together they put pods into quality-of-service classes.",
    tech: [
      "requests: cpu: 250m, memory: 256Mi; the scheduler places pods only where requests fit.",
      "Going over the CPU limit gets the container throttled (slowed down).",
      "Going over the memory limit gets it killed: status OOMKilled (Main week 2: Memory).",
      "QoS classes: Guaranteed (requests equal limits), Burstable (requests below limits) and BestEffort (none); BestEffort pods are evicted first when a node runs short.",
      "Set memory requests from measured usage, and be careful with CPU limits, which can cause throttling even on an idle node.",
    ],
    cost: "Requests too high waste money on idle capacity; too low leads to overcommitted nodes, throttling and evictions.",
    tryIt:
      "Deploy a pod with a 64Mi memory limit that allocates 200 MB, and find OOMKilled in kubectl describe pod.",
    buildsOn: "Main week 2: Memory",
  },
  "M30:6": {
    why: "kubectl is how you inspect and change a cluster. A handful of commands covers most debugging.",
    problem:
      "When something is wrong in a cluster, you need to see state, events and logs quickly, often under pressure.",
    how: "Learn the commands that read state, change state through files, and reach inside running pods.",
    tech: [
      "kubectl get pods -o wide (status and node) and kubectl describe pod x (events: scheduling failures, image pull errors, probe failures).",
      "kubectl logs x (add -f to follow, --previous for a crashed container).",
      "kubectl exec -it x -- sh opens a shell in a container.",
      "kubectl apply -f file.yaml creates or updates objects declaratively.",
      "kubectl port-forward svc/api 8080:80 reaches a service from your laptop.",
      "kubectl rollout status, rollout history and rollout undo deployment/api manage deploys.",
    ],
    cost: "Imperative changes from kubectl (edit, scale) drift from what's in git, so in real environments changes should go through files and pipelines.",
    tryIt:
      "Deploy an image tag that doesn't exist, use get, describe and rollout undo to find the ImagePullBackOff and recover.",
  },

  // ---- Week 31: Kubernetes II: Ingress, networking, storage, cloud ----
  "M31:0": {
    why: "Kubernetes makes a simple promise about networking that every app relies on, and plugins do the work of keeping it.",
    problem:
      "Pods on different nodes need to reach each other, and port mapping between hosts (as in plain Docker) doesn't scale to thousands of pods.",
    how: "Every pod gets its own IP address and can reach every other pod directly without NAT. A CNI plugin sets up the network to make that true.",
    tech: [
      "Each pod has its own IP; containers within a pod share it and talk over localhost.",
      "Any pod can reach any other pod's IP across nodes, without NAT, unless a NetworkPolicy blocks it.",
      "CNI (Container Network Interface) plugins create the pod networks, by routing or by tunnelling between nodes.",
      "Calico and Cilium are common; Cilium uses eBPF (programs that run inside the Linux kernel) for speed and visibility.",
      "NetworkPolicies restrict which pods can talk to which, like a firewall inside the cluster.",
    ],
    cost: "Flat networking means everything can talk to everything by default, which is a security risk until policies are written; CNI problems are hard to debug.",
    tryIt:
      "Run two pods, exec into one and curl the other by its pod IP, then add a NetworkPolicy that blocks it and try again.",
    buildsOn: "Main week 6: Network layer",
  },
  "M31:1": {
    why: "A Service's IP doesn't belong to any machine. Knowing how traffic to it reaches a pod explains many networking mysteries.",
    problem:
      "Pods come and go with new IPs, but clients need one stable address that spreads load across whichever pods are healthy right now.",
    how: "On every node, kube-proxy watches Services and EndpointSlices and writes kernel rules that rewrite traffic sent to the Service IP to one of the pod IPs.",
    tech: [
      "The Service ClusterIP is virtual: no interface has it; packets to it are rewritten on the sending node.",
      "iptables mode: kernel NAT rules choose a pod at random; long rule lists slow down with thousands of Services.",
      "IPVS mode: uses the kernel's built-in load balancer with proper algorithms and better scaling.",
      "eBPF mode (Cilium) replaces kube-proxy with kernel programs that are faster and easier to observe.",
      "Only ready pods (readiness probe passing) are included.",
    ],
    cost: "Balancing happens per connection, not per request, so long-lived connections such as gRPC or HTTP/2 can pile onto one pod.",
    tryIt:
      "On a kind node, run iptables-save | grep your service name to see the rules kube-proxy created for it.",
    buildsOn: "Main week 30: Core objects",
  },
  "M31:2": {
    why: "Apps find each other by name, not by IP. Cluster DNS turns Service names into addresses.",
    problem:
      "Hard-coding IPs breaks as soon as a Service is recreated, and each environment would need different configuration.",
    how: "CoreDNS runs in the cluster and answers queries for Service names; every pod is set up to use it.",
    tech: [
      "Full name: my-svc.my-namespace.svc.cluster.local resolves to the Service's ClusterIP.",
      "Within the same namespace, just my-svc works, thanks to search domains in the pod's /etc/resolv.conf.",
      "Headless Services (clusterIP: None) return the pod IPs directly; StatefulSets use them for stable names like db-0.db.",
      "External names fall through to upstream DNS servers (Main week 6: DNS).",
    ],
    cost: "DNS lookups add latency, and the ndots search behaviour can cause several failed lookups for every external name.",
    tryIt:
      "Exec into a pod and run nslookup on a Service's short name and its full name, then cat /etc/resolv.conf.",
    buildsOn: "Main week 6: DNS",
  },
  "M31:3": {
    why: "Services are for traffic inside the cluster. Websites need HTTP routing by host name and path from the outside world.",
    problem:
      "Giving every Service its own cloud load balancer is expensive, and there's no place to route /api and /app to different Services or to terminate TLS.",
    how: "An Ingress object describes HTTP routing rules (hosts, paths, TLS certificates) from outside into Services. It's only a description; a controller must implement it.",
    tech: [
      "rules: host shop.example.com, path /api goes to Service api on port 80, path / goes to Service web.",
      "tls lists host names and the Secret holding the certificate.",
      "pathType is Prefix or Exact.",
      "One external load balancer serves many Ingress rules.",
      "Features beyond the basics (rewrites, timeouts) used controller-specific annotations, which weren't portable.",
    ],
    cost: "The Ingress API is limited and relies on non-standard annotations, which is why the Gateway API replaces it.",
    tryIt:
      "Write an Ingress routing /api and / to two Services on a kind cluster with an ingress controller installed, and test both paths with curl.",
    buildsOn: "Main week 30: Core objects",
  },
  "M31:4": {
    why: "An Ingress object does nothing by itself. A controller program reads it and configures a real proxy.",
    problem:
      "Without a controller installed, Ingress objects are accepted by the API but no traffic flows, which confuses everyone the first time.",
    how: "An ingress controller watches Ingress objects and turns them into configuration for a proxy, such as NGINX, Traefik or Envoy, which receives the external traffic.",
    tech: [
      "The controller runs in the cluster, usually behind one LoadBalancer Service.",
      "It watches Ingress, Service and EndpointSlice objects and reconfigures its proxy when they change (Main week 27: NGINX configuration).",
      "Choices include Traefik, cloud controllers (the AWS Load Balancer Controller, GKE Ingress) and others.",
      "ingress-nginx, long the most common, was retired in March 2026, so new clusters should not adopt it.",
      "IngressClass picks which controller handles each Ingress when several are installed.",
    ],
    cost: "Controller behaviour and annotations differ, so moving between them takes real work, and the controller is critical to keep available.",
    tryIt:
      "Install Traefik on a kind cluster with Helm, apply your Ingress, and read the controller's logs as it picks up the routes.",
    buildsOn: "Main week 27: NGINX configuration",
  },
  "M31:5": {
    why: "Ingress was too limited and too vendor-specific. The Gateway API is its standard successor, and new clusters should use it.",
    problem:
      "Traffic splitting, header matching and cross-namespace routing needed non-portable annotations, and one object mixed cluster operators' and app teams' concerns.",
    how: "The Gateway API splits routing into roles: platform teams define GatewayClasses and Gateways, and app teams attach HTTPRoutes to them, with rich matching and traffic splitting built in.",
    tech: [
      "GatewayClass: which implementation to use (set up by the cluster operator).",
      "Gateway: a listener (ports, host names, TLS) created from a class (owned by the platform team).",
      "HTTPRoute: matches on host, path, headers or query and sends traffic to Services, with weights for canary splits (owned by app teams).",
      "Routes can attach to a Gateway in another namespace, if the Gateway allows it.",
      "Implementations include Envoy Gateway, Cilium, Istio, Traefik and the cloud providers' controllers.",
    ],
    cost: "More objects to learn than Ingress, and some advanced features are still optional, so support varies by implementation.",
    tryIt:
      "Install Envoy Gateway on kind, create a Gateway and an HTTPRoute that sends 90% of traffic to v1 and 10% to v2 of your API, and check the split with 100 curl calls.",
    buildsOn: "Main week 31: Ingress",
  },
  "M31:6": {
    why: "Every public endpoint needs a valid TLS certificate, and certificates expire. Renewing them by hand eventually fails.",
    problem:
      "Manual certificate management causes outages when someone forgets to renew, and copying private keys around is risky.",
    how: "cert-manager runs in the cluster, requests certificates from a certificate authority such as Let's Encrypt using the ACME protocol, stores them as Secrets, and renews them automatically.",
    tech: [
      "Issuer or ClusterIssuer: which CA to use and how to prove you own the domain.",
      "HTTP-01 challenge: serve a token at a URL on the domain. DNS-01 challenge: create a DNS record (needed for wildcard certificates).",
      "Certificate objects (or Ingress and Gateway annotations) say which host names need certificates.",
      "Certificates are stored as Kubernetes Secrets used by the ingress or gateway.",
      "Let's Encrypt certificates last 90 days (and are moving to shorter lifetimes); cert-manager renews well before expiry (Main week 7: TLS).",
    ],
    cost: "Challenges can fail because of DNS or firewall setup, Let's Encrypt has rate limits, and cert-manager is one more critical component.",
    tryIt:
      "Install cert-manager and create a self-signed ClusterIssuer and a Certificate on kind, then inspect the Secret it produces.",
    buildsOn: "Main week 7: TLS",
  },
  "M31:7": {
    why: "Containers lose their files when they restart. Databases and uploads need storage that outlives pods and follows them between nodes.",
    problem:
      "A pod's filesystem is temporary, and a pod rescheduled to another node can't see a disk attached to the old one.",
    how: "Apps ask for storage with a PersistentVolumeClaim; Kubernetes binds it to a PersistentVolume, usually created on demand by a StorageClass from the cloud's disks.",
    tech: [
      "Volumes in a pod spec: emptyDir (temporary, shared between containers), configMap and secret (mounted as files), and persistent volumes.",
      "PersistentVolume (PV): a piece of real storage, such as a cloud disk.",
      "PersistentVolumeClaim (PVC): a request ('10Gi, ReadWriteOnce') that binds to a PV.",
      "StorageClass: creates PVs automatically when a PVC asks, with a type (SSD) and a reclaim policy (delete or retain).",
      "Access modes: ReadWriteOnce (one node at a time) is typical for cloud disks; ReadWriteMany needs a shared file system.",
    ],
    cost: "Stateful workloads are much harder to run in Kubernetes (backups, failover, upgrades), so many teams use managed databases instead.",
    tryIt:
      "Create a PVC, mount it in a pod, write a file, delete the pod, start a new one with the same PVC and check the file is still there.",
    buildsOn: "Main week 3: Files and file systems",
  },
  "M31:8": {
    why: "Traffic changes during the day. Autoscaling adds capacity when it's needed and removes it to save money.",
    problem:
      "Fixed replica counts either waste money at night or fall over at peak, and adding pods doesn't help when the nodes are full.",
    how: "The Horizontal Pod Autoscaler (HPA) changes the number of pods based on metrics; the cluster autoscaler adds or removes nodes when pods can't be scheduled or nodes are idle.",
    tech: [
      "HPA: target, for example, 70% average CPU across pods; it adjusts replicas between a minimum and a maximum.",
      "CPU percentage is measured against the pods' requests, so requests must be set.",
      "Custom metrics (requests per second, queue length) scale better for many apps; KEDA scales on event sources such as queues.",
      "The cluster autoscaler adds nodes when pods are pending for lack of room, and removes underused nodes. Karpenter is a faster alternative on AWS.",
      "Scale-up takes time (new pods start, new nodes boot), so keep some headroom.",
    ],
    cost: "Scaling reacts after load arrives, so sudden spikes still hurt, and badly tuned autoscalers flap up and down.",
    tryIt:
      "Add an HPA to your API at 50% CPU, run a load test with k6, and watch kubectl get hpa -w as replicas rise and fall.",
    buildsOn: "Main week 30: Resource requests vs limits",
  },
  "M31:9": {
    why: "An app needs a dozen YAML files that differ slightly between dev, staging and production. Copying and editing them by hand drifts.",
    problem:
      "Duplicated manifests get out of sync, and installing third-party software such as databases or controllers means hundreds of lines of YAML.",
    how: "Helm packages manifests as templates with values, versioned and installable as charts; Kustomize keeps a plain base and applies small patches (overlays) per environment.",
    tech: [
      "Helm chart: templates plus a values.yaml; helm install and helm upgrade render and apply them as a release with history and rollback.",
      "Most third-party software is distributed as Helm charts.",
      "Kustomize: a base folder of plain YAML plus overlays for each environment that patch replicas, images or config; built into kubectl apply -k.",
      "Helm is better for distributing configurable packages; Kustomize is simpler for your own apps across environments.",
    ],
    cost: "Helm templates mix YAML and Go templating and get hard to read; Kustomize patches can be confusing when many layers stack.",
    tryIt:
      "Create a Kustomize base for your API with dev and prod overlays that differ in replicas and image tag, and compare kubectl kustomize output for each.",
  },
  "M31:10": {
    why: "Clusters run inside a cloud network. The same networking ideas from Main week 6 reappear as cloud resources you configure.",
    problem:
      "Misconfigured cloud networks expose databases to the internet, block outbound traffic, or cost a surprising amount for NAT.",
    how: "A cloud region is split into isolated zones; inside it you create a private network (VPC) divided into public and private subnets, with route tables, gateways and firewall rules controlling traffic.",
    tech: [
      "Region: a geographic area; availability zones (AZs): separate data centres in it. Spread across AZs to survive one failing.",
      "VPC (virtual private cloud): your private network with a CIDR range such as 10.0.0.0/16 (Main week 6: Network layer).",
      "Public subnets route to an internet gateway; private subnets don't, and reach out through a NAT gateway.",
      "Security groups are stateful firewalls on each resource: allow only the ports and sources needed.",
      "Managed Kubernetes (EKS, GKE, AKS) runs the control plane for you; nodes live in your subnets.",
    ],
    cost: "Cloud networking has many parts that cost money (NAT gateways, cross-AZ traffic), and mistakes are often invisible until there's a breach or a bill.",
    tryIt:
      "Sketch a VPC for your API: two AZs, public subnets with the load balancer, private subnets with nodes and the database, and the security group rules between them.",
    buildsOn: "Main week 6: Network layer",
  },
  "M31:11": {
    why: "Many people and programs use one cluster. Each should be able to do only what it needs.",
    problem:
      "If every user and pod can do anything, one leaked token or buggy script can delete production or read every Secret.",
    how: "Role-based access control (RBAC) grants permissions to users and service accounts through roles; pods get identities through service accounts.",
    tech: [
      "Role (one namespace) or ClusterRole (whole cluster): lists allowed verbs (get, list, create, delete) on resources (pods, secrets).",
      "RoleBinding or ClusterRoleBinding: gives a role to a user, group or service account.",
      "Service account: the identity a pod uses to call the Kubernetes API; its token is mounted into the pod.",
      "Give each app its own service account with only the permissions it needs, and disable token mounting when it needs none.",
      "Cloud IAM can be linked to service accounts (IRSA or EKS Pod Identity on AWS, Workload Identity on GKE).",
    ],
    cost: "Fine-grained RBAC takes effort to design and debug, and overly broad ClusterRoles are a common shortcut that undoes it.",
    tryIt:
      "Create a service account that can only list pods in one namespace, and use kubectl auth can-i --as=system:serviceaccount:ns:name to test what it can and can't do.",
    buildsOn: "Main week 17: Authorization models",
  },

  // ---- Week 32: CI/CD, infrastructure as code, observability ----
  "M32:0": {
    why: "Continuous integration catches broken code minutes after it's pushed, instead of days later when someone tries to release.",
    problem:
      "When people test only on their own machines, broken builds and failing tests reach main, and the whole team is blocked.",
    how: "On every push and pull request, a CI service runs the build, lint, type check and tests in a clean environment and reports the result on the PR.",
    tech: [
      "Workflows (GitHub Actions YAML) define jobs triggered by push or pull_request (Main week 14: Continuous integration).",
      "Every run starts from a clean machine, so it catches 'works on my machine' problems.",
      "Cache dependencies (keyed by the lock file hash) to make runs fast.",
      "Run independent jobs in parallel and split slow test suites into shards.",
      "Build artifacts (bundles, container images) are produced once and reused by later stages.",
      "Require CI to pass before merging with branch protection.",
    ],
    cost: "Slow or flaky CI frustrates everyone and tempts people to skip it; CI minutes also cost money.",
    tryIt:
      "Add dependency caching to your GitHub Actions workflow and compare run times before and after.",
    buildsOn: "Main week 14: Continuous integration",
  },
  "M32:1": {
    why: "Continuous delivery makes releasing boring: every merged change can reach production through the same automated, tested path.",
    problem:
      "Manual deploys are slow, error-prone and done by one person who knows the steps, so teams release rarely in big, risky batches.",
    how: "A pipeline builds an artifact once, deploys it to dev, then staging, then production, with automated checks at each step and approvals where needed.",
    tech: [
      "Environments: dev (anything goes), staging (production-like, for final checks), production.",
      "Promotion: the exact same artifact (one image digest) moves through environments; only configuration changes.",
      "Gates: automated smoke tests between stages, and manual approvals for production if required.",
      "Continuous delivery means always deployable with a button; continuous deployment means every green change goes out automatically.",
      "GitHub Actions environments add required reviewers and environment-specific secrets.",
    ],
    cost: "Building trustworthy pipelines and staging environments takes real work, and staging never perfectly matches production.",
    tryIt:
      "Extend your workflow to build an image once, deploy it to a staging environment automatically, and to production after a manual approval.",
    buildsOn: "Main week 32: CI",
  },
  "M32:2": {
    why: "Every deploy is a risk. Deployment strategies limit how many users a bad release can hurt and how fast you can undo it.",
    problem:
      "Replacing everything at once means a bad version hits all users at the same time, and rolling back takes as long as the deploy.",
    how: "Roll out gradually, run old and new side by side, or send a small share of traffic to the new version first, and always keep a fast way back.",
    tech: [
      "Rolling: replace instances a few at a time (the Kubernetes Deployment default); old and new run together briefly.",
      "Blue-green: run the new version (green) alongside the old (blue), then switch all traffic at once; switching back is instant.",
      "Canary: send 1–5% of traffic to the new version, compare error rates and latency, then increase.",
      "Feature flags separate deploying code from releasing features (Main week 42: Trunk-based development).",
      "Rollback means redeploying the previous artifact; database changes must stay compatible with both versions to make that possible.",
    ],
    cost: "Blue-green doubles resources during the switch, canaries need good metrics and traffic routing, and every strategy is complicated by database changes.",
    tryIt:
      "Do a canary release of your API with a Gateway API HTTPRoute weight of 10%, watch the error rate, then promote or roll back.",
    buildsOn: "Main week 30: Core objects",
  },
  "M32:3": {
    why: "Kubernetes reconciles a cluster toward its desired state. GitOps applies the same idea to deployments, with git as the source of truth.",
    problem:
      "When CI pipelines push changes into clusters with kubectl, nobody can be sure the cluster matches git, and manual changes drift unnoticed.",
    how: "An agent in the cluster (Argo CD or Flux) watches a git repository of manifests and keeps the cluster in sync with it. To deploy, you change git.",
    tech: [
      "The desired state of each environment lives in git (Helm values or Kustomize overlays).",
      "Argo CD or Flux pulls from git and applies changes; CI never needs cluster credentials.",
      "Drift detection: manual changes in the cluster are reported or reverted.",
      "Rollback is a git revert; the audit log is the git history.",
      "CI's job becomes building the image and opening a commit that bumps the image tag.",
    ],
    cost: "Another system to run and learn, an extra repository to manage, and secrets need a separate solution since they can't sit in git in plain text.",
    tryIt:
      "Install Argo CD on kind, point it at a repo holding your API's manifests, change the replica count in git and watch it sync.",
    buildsOn: "Main week 30: Declarative desired state",
  },
  "M32:4": {
    why: "Images and secrets flow through every pipeline. Mistakes here deploy the wrong version or leak credentials.",
    problem:
      "Deploying the tag latest makes it unclear what's actually running, and secrets printed in logs or baked into images are exposed to anyone with access.",
    how: "Push images to a registry with immutable, traceable tags, deploy by digest or unique tag, and keep secrets in the CI system's secret store, injected only into the steps that need them.",
    tech: [
      "Tag images with the git commit SHA (and a version for releases), never deploy latest.",
      "Make tags immutable in the registry so a tag can't be overwritten.",
      "Store credentials as encrypted CI secrets, scoped per environment; CI masks them in logs.",
      "Prefer short-lived credentials via OIDC federation (GitHub Actions to AWS, for example) over long-lived keys.",
      "Clean up old images with registry retention policies.",
    ],
    cost: "Tagging and promotion conventions need discipline across the team, and OIDC setup takes some initial effort.",
    tryIt:
      "Change your workflow to tag images with the commit SHA and to authenticate to your registry or cloud with OIDC instead of a stored key.",
    buildsOn: "Main week 29: Images",
  },
  "M32:5": {
    why: "Most of the code you ship was written by someone else. Attackers increasingly target dependencies and build pipelines rather than your code.",
    problem:
      "A compromised npm package, a vulnerable base image or a tampered image in the registry ends up in production without anyone noticing.",
    how: "Pin exact versions, scan dependencies and images for known vulnerabilities, record what's in each artifact, and sign images so only verified ones can be deployed.",
    tech: [
      "Lock files and pinned versions make builds reproducible; review dependency updates like code.",
      "Dependabot or Renovate open PRs for updates; Trivy or Grype scan images and dependencies for known CVEs.",
      "An SBOM (software bill of materials) lists every component in an artifact, so you can tell quickly whether a new vulnerability affects you.",
      "Sigstore cosign signs images (keyless with OIDC) in CI.",
      "An admission policy (Kyverno, or the cloud's equivalent) verifies signatures before the cluster runs an image.",
    ],
    cost: "Scanners produce many findings, including false or irrelevant ones, which need triage, and signing and verification add pipeline complexity.",
    tryIt:
      "Run trivy image on your API's image, fix the highest-severity finding by changing the base image, then sign the image with cosign and verify it.",
    buildsOn: "Main week 17: OWASP Top 10",
  },
  "M32:6": {
    why: "Every app needs credentials: database passwords, API keys, signing keys. Where they live decides how bad a leak is.",
    problem:
      "Secrets in git or images are copied everywhere and can't be revoked cleanly, and secrets that never change stay useful to an attacker forever.",
    how: "Keep secrets in a dedicated store with access control and audit logs, deliver them to apps at runtime, and rotate them regularly.",
    tech: [
      "Secret stores: HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault.",
      "External Secrets Operator syncs secrets from the store into Kubernetes Secrets.",
      "Never commit secrets or bake them into images; scan repos for leaks (GitHub secret scanning, gitleaks).",
      "Rotation: change secrets on a schedule and immediately after any suspected leak; dynamic secrets (Vault) issue short-lived database credentials per app.",
      "Least privilege: each app reads only its own secrets (Main week 16: Configuration and secrets).",
    ],
    cost: "A secret store is critical infrastructure that must be highly available, and rotation can break apps that cache credentials.",
    tryIt:
      "Run gitleaks detect on one of your repositories, then move one secret from a .env file into a secrets manager read at startup.",
    buildsOn: "Main week 16: Configuration and secrets",
  },
  "M32:7": {
    why: "Clicking through a cloud console is unrepeatable, unreviewed and undocumented. Infrastructure as code makes infrastructure behave like software.",
    problem:
      "Manually created resources can't be reproduced for a new environment, nobody knows who changed what, and one wrong click can delete production.",
    how: "Describe infrastructure in code files, keep them in git, review changes in PRs, and let a tool compute and apply the difference between the code and reality.",
    tech: [
      "Provider: a plugin for an API such as AWS, Cloudflare or GitHub.",
      "Resource: one piece of infrastructure (a VPC, a database, a DNS record) declared in HCL.",
      "State: Terraform's record of which real resources it manages; it must be stored safely and shared.",
      "terraform plan shows exactly what will be created, changed or destroyed; terraform apply does it.",
      "Modules package reusable groups of resources.",
      "OpenTofu is an open-source fork with the same language.",
    ],
    cost: "State files can drift or get corrupted and contain sensitive values, and some changes (renames) destroy and recreate resources unless handled carefully.",
    tryIt:
      "Write Terraform for a GitHub repository or a Cloudflare DNS record, run plan and apply, change it by hand in the UI, and see plan detect the drift.",
  },
  "M32:8": {
    why: "Once code runs on many machines, you can't attach a debugger. Logs, metrics and traces are how you see inside a running system.",
    problem:
      "When users report 'it's slow', you need to know whether, where and why, across many services and thousands of requests.",
    how: "Collect three kinds of telemetry: logs for individual events, metrics for numbers over time, and traces for the path of each request through the system.",
    tech: [
      "Logs: structured (JSON) events with a request id, shipped to a central store such as Loki or Elasticsearch (Main week 21: Logging and errors).",
      "Metrics: counters (only go up), gauges (go up and down) and histograms (distributions, used for latency percentiles).",
      "Prometheus pulls (scrapes) metrics from a /metrics endpoint on each app every few seconds.",
      "RED method for services: rate, errors, duration. USE method for resources: utilisation, saturation, errors.",
      "Traces: each request gets a trace id, each step a span, passed between services in headers (context propagation).",
      "OpenTelemetry is the vendor-neutral standard for producing all three.",
    ],
    cost: "Telemetry costs storage and money, and high-cardinality labels (such as a user id on a metric) can overwhelm metrics systems.",
    tryIt:
      "Add OpenTelemetry to your API, export traces and metrics to a local Grafana stack in Docker, and find the slowest span of a request.",
    buildsOn: "Main week 21: Logging and errors",
  },
  "M32:9": {
    why: "Data is only useful if it tells you when users are hurting. SLOs and good alerts turn telemetry into decisions.",
    problem:
      "Alerting on every high CPU spike wakes people for nothing, while real user-facing problems go unnoticed until customers complain.",
    how: "Choose indicators of user experience (SLIs), set targets for them (SLOs), alert when you're burning through your allowed failure (the error budget), and put the key views on dashboards.",
    tech: [
      "SLI (service level indicator): for example, the percentage of requests that succeed in under 300 ms.",
      "SLO (service level objective): the target, such as 99.9% over 30 days.",
      "Error budget: the allowed failure (0.1% is about 43 minutes a month); when it's used up, reliability work takes priority over features.",
      "Alert on symptoms (users seeing errors), not causes (CPU at 80%); burn-rate alerts fire when the budget is being spent too fast.",
      "Grafana dashboards: one overview per service with RED metrics and SLO status, then drill-down views.",
    ],
    cost: "Choosing good SLIs and targets takes thought and negotiation, and dashboards multiply until nobody looks at them.",
    tryIt:
      "Define one availability SLI and one latency SLI with SLOs for your API, build a Grafana panel for each, and write a burn-rate alert rule.",
    buildsOn: "Main week 32: Observability",
  },
  "M32:10": {
    why: "Systems fail. How a team responds decides whether an outage lasts five minutes or five hours.",
    problem:
      "Without preparation, incidents turn into confusion: nobody knows who's in charge, what to check or how to communicate.",
    how: "Have a rotation of responders, runbooks for known alerts, clear roles during incidents, and a blameless postmortem afterwards.",
    tech: [
      "On-call rotations spread the load; tools such as PagerDuty or Opsgenie route alerts and escalate.",
      "Every alert links to a runbook with what it means and the first steps.",
      "In a big incident, separate roles: an incident commander coordinates, others investigate and communicate.",
      "Mitigate first: roll back, flip a feature flag, scale up; find the root cause afterwards.",
      "Blameless postmortems produce tracked action items (Main week 42: On-call).",
    ],
    cost: "On-call is a real burden on people's lives and must be paid for and kept sustainable, and postmortems are only worth it if action items get done.",
    tryIt:
      "Run a 30-minute game day: break something in your staging setup on purpose, have someone respond using only your runbooks, and write up what was missing.",
    buildsOn: "Main week 42: On-call",
  },

  // ---- Week 48: Real cloud: AWS with Terraform ----
  "M48:0": {
    why: "In the cloud, identity is the perimeter. Most serious cloud breaches start with leaked credentials or overly broad permissions.",
    problem:
      "Using the root account day to day or committing access keys to git can let one leak give an attacker control of everything, including the bill.",
    how: "Lock away the root user, use multi-factor authentication, give people and services roles with only the permissions they need, and use short-lived credentials instead of permanent keys.",
    tech: [
      "Root user: secure it with MFA, then never use it for daily work.",
      "IAM users have long-lived credentials; roles are assumed and give temporary credentials. Prefer roles, and use IAM Identity Center for human sign-in.",
      "Policies are JSON documents allowing or denying actions on resources; start from nothing and add only what's needed (least privilege).",
      "Services get roles too: an EC2 instance profile, an ECS task role, a Lambda execution role.",
      "Never put access keys in code or images; CI uses OIDC to assume a role (Main week 32: Container registries).",
    ],
    cost: "Least-privilege policies take time to write and debug, and AWS's permission model is large and full of exceptions.",
    tryIt:
      "Create an AWS account, enable MFA on root, set up an admin through IAM Identity Center, and create a role that can only read one S3 bucket.",
    buildsOn: "Main week 17: Authorization models",
  },
  "M48:1": {
    why: "The networking ideas from Main week 6 and the cloud networking sketch from Main week 31 become real resources here, with real security and cost consequences.",
    problem:
      "Putting a database in a public subnet or opening security groups to 0.0.0.0/0 exposes it to the whole internet; getting routes wrong leaves servers unable to reach anything.",
    how: "Build a VPC with public subnets for load balancers and private subnets for apps and databases, connected by route tables, with an internet gateway for inbound and NAT for outbound traffic.",
    tech: [
      "VPC with a CIDR such as 10.0.0.0/16, split into subnets per availability zone.",
      "Public subnet: its route table sends 0.0.0.0/0 to an internet gateway.",
      "Private subnet: its route table sends 0.0.0.0/0 to a NAT gateway in a public subnet, so instances can reach out but can't be reached.",
      "Security groups allow traffic by port and source; reference other groups (the database allows port 5432 only from the app's group).",
      "VPC endpoints reach S3 and other AWS services privately without NAT charges.",
    ],
    cost: "NAT gateways are charged per hour and per GB, which adds up quickly, and a multi-AZ network has many parts to get right.",
    tryIt:
      "Use the official terraform-aws-modules/vpc module to create a VPC with two public and two private subnets, and read the plan to see every resource it creates.",
    buildsOn: "Main week 31: Cloud networking basics",
  },
  "M48:2": {
    why: "AWS offers several ways to run code, from whole virtual machines to single functions. The right one depends on your workload and team.",
    problem:
      "Picking by hype leads to managing servers you don't need or fighting function limits for a long-running app.",
    how: "Compare how much you manage, how you pay, and what limits apply, then match them to the workload's traffic shape and run time.",
    tech: [
      "EC2: virtual machines; full control, you patch and scale them; pay per hour while running.",
      "ECS with Fargate: run containers without managing servers; a good default for a containerised API.",
      "EKS: managed Kubernetes; worth it for many services or when you need the Kubernetes ecosystem.",
      "Lambda: functions run per event, scale to zero and bill per millisecond; limited to 15 minutes per run, with cold starts.",
      "Steady traffic often suits containers; spiky or occasional work suits Lambda.",
    ],
    cost: "Each choice locks you into different tools, and higher-level services cost more per unit of compute in exchange for less operations work.",
    tryIt:
      "Deploy your API's container to ECS Fargate behind a load balancer with Terraform, and write down the hourly cost of each resource it created.",
    buildsOn: "Main week 29: Containers vs VMs",
  },
  "M48:3": {
    why: "Running your own databases, caches and queues is a big job. Managed services do the backups, patching and failover for you.",
    problem:
      "Self-hosting Postgres or Redis means handling replication, backups, upgrades and disk failures, usually badly at first.",
    how: "Use S3 for files, RDS for Postgres, ElastiCache for Redis-compatible caching and SQS for queues, each configured privately and securely.",
    tech: [
      "S3 stores objects in buckets; keep buckets private, and let clients upload directly with presigned URLs (time-limited signed links) instead of through your API.",
      "RDS runs Postgres with automated backups, point-in-time recovery and an optional standby in another AZ (Multi-AZ) for failover.",
      "ElastiCache runs Valkey or Redis for caching and sessions (Main week 20: Redis).",
      "SQS is a managed queue with at-least-once delivery, visibility timeouts and dead-letter queues (Main week 20: Messaging).",
      "Put RDS and ElastiCache in private subnets, reachable only from the app's security group.",
    ],
    cost: "Managed services cost more than raw servers and limit configuration options, and an S3 bucket made public by mistake is one of the most common data leaks.",
    tryIt:
      "Add an S3 bucket to your Terraform, generate a presigned upload URL from your API, and upload a file to it with curl.",
    buildsOn: "Main week 20: Messaging",
  },
  "M48:4": {
    why: "The DNS, CDN, load balancing and TLS concepts from earlier weeks map directly onto AWS services.",
    problem:
      "Wiring a domain to an app involves several services in a particular order, and mistakes cause certificate errors, slow sites or downtime.",
    how: "Route 53 answers DNS, CloudFront caches at the edge, an Application Load Balancer spreads traffic across your app, and ACM provides free certificates for both.",
    tech: [
      "Route 53: hosted zones and records; alias records point a domain at CloudFront or a load balancer (Main week 6: DNS).",
      "CloudFront: AWS's CDN; cache behaviours by path, origins pointing at the ALB or S3 (Main week 27: CDN).",
      "Application Load Balancer (ALB): an L7 load balancer with listeners, rules and target groups with health checks (Main week 27: Load balancing).",
      "ACM: free, auto-renewing TLS certificates for ALB and CloudFront; certificates for CloudFront must be in us-east-1 (Main week 7: TLS).",
      "AWS WAF can attach to CloudFront or the ALB.",
    ],
    cost: "Every layer has its own charges and settings, and DNS changes take time to propagate, which slows debugging.",
    tryIt:
      "Point a domain or subdomain at your ALB through Route 53 with an ACM certificate, and check the certificate chain with openssl s_client.",
    buildsOn: "Main week 27: How the layers stack in practice",
  },
  "M48:5": {
    why: "Once your app runs on AWS, you need to see its logs and numbers and be alerted when something's wrong, and its secrets need a safe home.",
    problem:
      "Without central logs and alarms, problems are found by users, and secrets in environment variables in Terraform end up in state files and consoles.",
    how: "Send logs and metrics to CloudWatch, set alarms on key symptoms, and keep secrets in Secrets Manager or Parameter Store, read by the app's role at runtime.",
    tech: [
      "CloudWatch Logs collects container and Lambda output; Logs Insights queries it.",
      "CloudWatch metrics come from AWS services automatically (ALB 5xx count, RDS CPU); apps can publish custom ones.",
      "Alarms trigger on thresholds and notify through SNS (email, chat, paging).",
      "Secrets Manager stores secrets with rotation support; SSM Parameter Store is cheaper for simpler config and secrets.",
      "ECS task definitions can inject secrets by reference, so values never appear in Terraform or the task definition.",
    ],
    cost: "CloudWatch charges for log ingestion and storage, which grows fast with chatty logs, and its interface is less pleasant than dedicated tools.",
    tryIt:
      "Create a CloudWatch alarm on your ALB's 5xx count that emails you, then make your API return errors and confirm the email arrives.",
    buildsOn: "Main week 32: Dashboards and alerting",
  },
  "M48:6": {
    why: "In the cloud, every design choice has a price tag, and a forgotten resource or a misconfigured loop can cost thousands.",
    problem:
      "Cloud bills are hard to predict: data transfer, NAT gateways and idle resources cost money quietly, and you often find out only at the end of the month.",
    how: "Set budgets and billing alarms on day one, learn the expensive line items, and treat cost as a requirement in every design.",
    tech: [
      "Free tier: some services are free within limits for new accounts; know exactly which and for how long.",
      "AWS Budgets and billing alarms email you when spending passes a threshold; set one before creating anything.",
      "Data transfer out to the internet and between AZs is charged per GB; inbound is mostly free.",
      "NAT gateways cost per hour plus per GB processed; VPC endpoints and fewer NAT gateways reduce this.",
      "Turn off or destroy what you're not using; tag resources so you know who owns each cost.",
    ],
    cost: "Optimising cost takes time and can trade away reliability (fewer AZs) or speed; ignoring it can sink a project.",
    tryIt:
      "Set an AWS budget of $10 with an email alert, then use Cost Explorer after a week to find your three biggest line items.",
  },
  "M48:7": {
    why: "Terraform for a toy project and for a team are different things. Team use needs shared state, locking, reviews and clean teardown.",
    problem:
      "With state on one laptop, two people applying at once corrupt it, nobody else can make changes, and forgotten test environments keep costing money.",
    how: "Organise code into modules, store state remotely with locking, run plan in CI on every pull request, apply only after review, and destroy environments you don't need.",
    tech: [
      "Modules: reusable building blocks (network, database, service) with inputs and outputs; prefer well-maintained public modules.",
      "Remote state in an S3 bucket with versioning and encryption; native S3 locking (use_lockfile) stops two applies at once.",
      "CI runs terraform fmt, validate and plan on each PR and posts the plan for review; apply runs after merge.",
      "Separate state per environment so a dev change can't touch production.",
      "terraform destroy tears down a whole environment; keep learning environments short-lived.",
      "OpenTofu works the same way if you prefer the open-source fork.",
    ],
    cost: "Pipelines and remote state take setup, refactoring modules can force resource replacement, and state still contains secrets that need protecting.",
    tryIt:
      "Move your Terraform state to S3 with locking, add a GitHub Actions job that posts terraform plan on PRs, and destroy everything at the end of the week.",
    buildsOn: "Main week 32: Infrastructure as Code",
  },

  // ---- Design kata 3: the production setup for your own API ----
  "M49:0": {
    why: "'Always up' isn't a real requirement. Every extra nine of availability costs more, so you need to choose a target on purpose.",
    problem:
      "Without a target, teams either overbuild expensive multi-region setups for a small app or run a single server that takes everything down when it fails.",
    how: "Pick an availability target from what downtime costs the business, then choose the simplest setup that meets it: one zone, several zones, or several regions.",
    tech: [
      "99.9% allows about 43 minutes of downtime a month; 99.99% allows about 4 minutes.",
      "One AZ: simplest and cheapest; a data centre problem takes you down.",
      "Multi-AZ: load balancer, app instances and a database standby across zones; survives one zone failing, the usual production default.",
      "Multi-region: survives a whole region failing, but data replication, failover and cost become much harder (Main week 33 goes into replication).",
      "Your availability is limited by your dependencies: if you call three services at 99.9% each, you can't be much better than 99.7%.",
    ],
    cost: "Each step up costs more money and complexity, and more complex setups can cause their own outages.",
    tryIt:
      "Write down an availability target for your API with a reason, then list which single failures your current setup would survive.",
    buildsOn: "Main week 32: Dashboards and alerting",
  },
  "M49:1": {
    why: "Being able to draw and justify every step a request takes is the core of any production design review.",
    problem:
      "Designs copied from diagrams include boxes nobody can explain and miss boxes that matter, such as the NAT gateway the app depends on.",
    how: "Trace one request from the user's DNS lookup to the database and back, and write next to each box what it does and why you need it.",
    tech: [
      "DNS (Route 53) to CDN (CloudFront) with WAF.",
      "Load balancer (ALB) with TLS from ACM, in public subnets across two AZs.",
      "App containers (ECS Fargate or EKS) in private subnets, autoscaled.",
      "Cache (Redis) and database (RDS Postgres Multi-AZ) in private subnets.",
      "Outbound path through NAT, and supporting pieces: secrets store, logs and metrics, queue and workers if needed.",
      "For each box: what breaks if it's removed, and what it costs.",
    ],
    cost: "Every box is something to secure, monitor and pay for; the exercise often shows a few you can remove.",
    tryIt:
      "Draw your API's full request path and annotate each box with its purpose, its failure mode and its monthly cost.",
    buildsOn: "Main week 27: How the layers stack in practice",
  },
  "M49:2": {
    why: "Users shouldn't notice deploys. Code is usually easy to roll out without downtime; database changes are the hard part.",
    problem:
      "A migration that locks a busy table blocks every query for minutes, and a schema change that the old code can't handle breaks the app mid-deploy.",
    how: "Use a gradual deployment strategy for code, and change the database in backward-compatible steps (expand, migrate, contract) so old and new versions both work at every moment.",
    tech: [
      "Rolling, blue-green or canary deploys for the app (Main week 32: Deployment strategies).",
      "Expand and contract: add the new column, deploy code that writes both, backfill, switch reads, and only later drop the old column.",
      "In Postgres, CREATE INDEX CONCURRENTLY avoids blocking writes, and adding a column with a default is fast in recent versions.",
      "Set lock_timeout on migrations so they fail quickly instead of queueing behind long queries and blocking everything.",
      "Backfill large tables in small batches.",
    ],
    cost: "Backward-compatible migrations take several deploys instead of one, and they need discipline from everyone who touches the schema.",
    tryIt:
      "Plan the steps to rename a column in a table with millions of rows without downtime, and test them on a local Postgres with a load test running.",
    buildsOn: "Main week 19: Transactions",
  },
  "M49:3": {
    why: "Security in production is layers, each catching what another misses. A kata is the place to list them all for one system.",
    problem:
      "Teams secure one layer well, such as authentication, and leave others open: a public database, a broad IAM role or an unscanned image.",
    how: "Go through each layer of your design and write what protects it: network, identity, secrets, the edge and the software supply chain.",
    tech: [
      "Network: private subnets for everything but the load balancer; security groups that allow only the needed paths.",
      "IAM: one role per service with least privilege; no long-lived keys; MFA for people (Main week 48: Accounts and IAM).",
      "Secrets: in a secrets manager, rotated, never in git or images (Main week 32: Secrets management).",
      "Edge: WAF and rate limits in front of the API, TLS everywhere.",
      "Supply chain: dependency and image scanning in CI, pinned versions, signed images (Main week 32: Software supply chain).",
      "Application: the OWASP defences from Main week 17.",
    ],
    cost: "Each layer adds work and some friction for developers; a threat model helps decide where effort matters most.",
    tryIt:
      "Run a STRIDE threat model on your production design and list one control per threat, marking the ones not yet in place.",
    buildsOn: "Main week 17: Threat modeling with STRIDE",
  },
  "M49:4": {
    why: "At 3 a.m. you'll be tired and stressed. The observability you planned in daylight is what lets you fix things quickly then.",
    problem:
      "Teams add dashboards and alerts after the first outage, so the first outage is spent guessing.",
    how: "Before launch, define SLOs, the alerts that page someone, the dashboard you'd open first, and the runbook for each alert.",
    tech: [
      "SLOs for availability and latency on the key user journeys (Main week 32: Dashboards and alerting).",
      "Paging alerts only on SLO burn rate and total outages; everything else goes to a ticket or chat.",
      "One overview dashboard: request rate, error rate, latency percentiles, saturation of the database and cache.",
      "Traces to find which dependency is slow; logs linked by trace id.",
      "A runbook per paging alert, and a list of recent deploys so 'what changed?' has an answer.",
    ],
    cost: "Planning takes time before launch, and observability tools and data have ongoing costs.",
    tryIt:
      "Write the observability plan for your API: two SLOs, three alerts with runbooks, and a sketch of the first dashboard you'd open.",
    buildsOn: "Main week 32: Observability",
  },
  "M49:5": {
    why: "A design isn't finished until you know what it costs each month, and which single change would save the most.",
    problem:
      "Teams launch and discover that NAT, idle databases or log volume cost more than the app's compute.",
    how: "List every resource with its unit price and expected usage, add them up, and find the biggest line item and the cheapest way to reduce it.",
    tech: [
      "Use the AWS Pricing Calculator for each resource: compute, database, load balancer, NAT, data transfer, logs.",
      "Fixed costs (load balancer, NAT gateways, database instances) often dominate small apps.",
      "Variable costs (data transfer, requests, log ingestion) dominate as traffic grows.",
      "Typical levers: right-size instances, fewer NAT gateways or VPC endpoints, caching to reduce database size, shorter log retention, savings plans for steady usage.",
      "Write down what each saving costs in reliability or effort.",
    ],
    cost: "Estimates are rough and real usage will differ, so revisit the estimate after the first real bill.",
    tryIt:
      "Price your production design in the AWS Pricing Calculator, find the largest line item, and propose one change that cuts it with its trade-off.",
    buildsOn: "Main week 48: Cost",
  },
};
