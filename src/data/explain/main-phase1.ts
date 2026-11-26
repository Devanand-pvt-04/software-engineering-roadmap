import type { ExplainMap } from "./types";

// Ground-up explainers for Main track Phase 1 (weeks 1-7). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_PHASE1: ExplainMap = {
  // ---- Week 1: How a computer works ----
  "M1:0": {
    why: "A computer is built from switches that are either on or off. Everything it stores, from a number to a photo to this sentence, has to be written using only those two states.",
    problem:
      "Without agreed rules for turning on/off patterns into numbers and letters, the same 8 switches could mean 65, the letter A, or part of a colour, and two programs could never exchange data. Naive rules also break in surprising ways: a counter that silently wraps from the largest value to a negative one, or money that is off by a fraction of a cent.",
    how: "Agree on encodings. Group bits into bytes, read a byte as a base-2 number, give negative numbers a clever pattern so the same adder works for them, store fractions in scientific notation, and give every character a number that is then written as bytes.",
    tech: [
      "Binary is base 2 (each position is a power of 2); hex is base 16 and is a compact way to write 4 bits per digit.",
      "A byte is 8 bits; KB is 1000 bytes while KiB is 1024.",
      "Two's complement represents -x as (invert all bits of x) + 1, so addition works the same for signed and unsigned values, and the top bit acts as the sign; going past the maximum wraps around (overflow).",
      "IEEE 754 floats store a sign, an exponent and a fraction, so most decimals such as 0.1 can only be approximated, which is why 0.1 + 0.2 gives 0.30000000000000004.",
      "Unicode assigns each character a code point (U+0041 is A); UTF-8 writes code points in 1 to 4 bytes and is backward-compatible with ASCII, while UTF-16 uses 2 or 4 bytes.",
    ],
    cost: "Every encoding trades range and precision for space. Fixed-size integers overflow, floats lose precision (never use them for money; use integers of the smallest unit or a decimal type), and treating bytes as characters without knowing the encoding garbles text.",
    tryIt:
      'In a browser console, run 0.1 + 0.2, then (255).toString(2) and (255).toString(16). Then run new TextEncoder().encode("é") and count the bytes.',
  },
  "M1:1": {
    why: "Encoded bits are useless unless something can compute with them. Engineers needed a way to build arithmetic and decisions out of simple electrical switches.",
    problem:
      "A machine that can only do one fixed calculation has to be rewired for every new task. We want one general machine that can run any program you give it.",
    how: "Combine switches into logic gates, gates into circuits that add and compare, and those circuits into a CPU that reads instructions from memory one at a time and carries them out. The program becomes data, so changing what the machine does means changing memory, not wires.",
    tech: [
      "Gates compute true/false (boolean) functions: AND, OR, NOT, XOR.",
      "A half adder is an XOR gate (the sum bit) plus an AND gate (the carry bit); chaining full adders adds numbers of many bits.",
      "A CPU has registers (a few very fast storage slots), an ALU (the arithmetic and logic unit, which does the maths) and a control unit.",
      "The control unit runs the fetch-decode-execute cycle: fetch the instruction whose address is in the program counter (a register that remembers where you are in the program), decode which operation and which values (operands) it names, execute it, then move to the next.",
      "A clock ticks to keep every step in sync; 3 GHz means 3 billion ticks per second.",
      "An instruction set (x86-64, ARM64) is the list of instructions a CPU family understands. Machine code is those instructions as bytes; assembly is the same thing spelled in readable words.",
    ],
    cost: "Programs compiled for one instruction set will not run on another without recompiling or emulation (why Apple Silicon needed Rosetta). Higher clock speeds hit heat and power limits, which is why CPUs now add cores instead of getting much faster per core.",
    tryIt:
      "Open an online logic simulator (for example logic.ly or circuitverse.org), wire an XOR and an AND gate to two inputs, and check that you get a half adder's sum and carry.",
    buildsOn: "Main week 1: Information as bits",
  },
  "M1:2": {
    why: "The CPU can process data far faster than ordinary memory can deliver it. If it had to wait for main memory on every step, it would sit idle most of the time.",
    problem:
      "Fast memory is expensive and small; big memory is cheap and slow. Using only fast memory would make computers tiny, and using only big memory would make them crawl.",
    how: "Stack several layers: a tiny amount of very fast memory close to the CPU, then larger and slower layers further away. Keep the data you are using right now in the fast layers, and rely on programs tending to reuse recent data and nearby data.",
    tech: [
      "The hierarchy is registers → L1 cache (~1 ns) → L2 (~4 ns) → L3 (~10-40 ns) → RAM (~100 ns) → SSD (~100 µs) → network round trip in a data centre (~0.5 ms) → across continents (~150 ms).",
      "Caches move data in 64-byte lines, so reading one byte brings its neighbours along; that is why looping through an array in order is fast.",
      "Memory is a long list of bytes, each with a numeric address; a pointer is a variable whose value is one of those addresses.",
    ],
    cost: "Code that jumps around memory (linked structures, random access over huge data) misses the cache and can be 10 to 100 times slower than the same work done sequentially. Knowing the latency numbers is what lets you estimate whether a design can possibly meet its speed target.",
    tryIt:
      "Open the interactive latency numbers page and compare L1 cache with a round trip across the world. Then in C or Java, sum a large 2D array row by row and then column by column, and time both.",
    buildsOn: "Main week 1: Logic and hardware",
  },
  "M1:3": {
    why: "CPUs only understand machine code, but people cannot productively write programs as raw bytes. We needed a way to write in a readable language and still end up with instructions the CPU can run.",
    problem:
      "Without translation tools, every program would have to be written separately for each CPU in its machine code, and a single typo would mean hunting through bytes.",
    how: "Use a program to translate your program. A compiler translates everything ahead of time into machine code; an interpreter reads your code and performs it step by step; a JIT compiler starts by interpreting, then compiles the parts that run often into machine code while the program runs.",
    tech: [
      "For C, the compiler turns source into assembly, and the assembler turns assembly into an object file: machine code with gaps where it calls functions defined elsewhere.",
      "The linker joins object files and libraries into one executable and fills in those gaps with real addresses.",
      "When you run it, the OS loader copies it into memory and jumps to its first instruction (the entry point).",
      "Java compiles to bytecode for the JVM (Java Virtual Machine), which interprets it and compiles the parts that run often (hot code) to machine code.",
      "JavaScript engines such as V8 (in Chrome and Node) parse your source, interpret it as bytecode and JIT-compile hot functions the same way.",
    ],
    cost: "Ahead-of-time compilation gives fast start-up and fast code but needs a build step per platform. Interpreting is portable and quick to start but slower. JITs get close to compiled speed but use extra memory and take time to warm up.",
    tryIt:
      "Write hello.c, then run gcc -S hello.c to get the assembly, gcc -c hello.c to get the object file, and gcc hello.o -o hello to link it. Look at each file.",
    buildsOn: "Main week 1: Logic and hardware",
  },

  // ---- Week 2: Operating systems I ----
  "M2:0": {
    why: "Early computers ran one program at a time, and that program controlled all the hardware directly. Once many programs needed to share one machine, something had to sit in charge.",
    problem:
      "If every program can touch the hardware directly, one buggy or malicious program can overwrite another's memory, wipe the disk, or freeze the whole machine.",
    how: "Put one trusted program, the kernel, in control of the hardware, and run everything else with restricted rights. Other programs must ask the kernel to do privileged things for them.",
    tech: [
      "The CPU itself supports privilege levels. Kernel mode can run any instruction and touch any memory; user mode cannot touch hardware or other programs' memory.",
      "Programs cross into the kernel through system calls, and the CPU switches modes on the way in and out.",
      "The OS is the kernel plus the system libraries and tools around it.",
    ],
    cost: "Every crossing into the kernel costs time (hundreds of nanoseconds or more), which is why high-performance code batches system calls. A bug inside the kernel can still bring down the whole machine.",
    tryIt:
      "Run strace -c ls (Linux) to count how many times a simple command asks the kernel for help.",
    buildsOn: "Main week 1: Logic and hardware",
  },
  "M2:1": {
    why: "People want many programs running at once: a browser, an editor, a music player, a server. The OS needs a unit to track each running program separately.",
    problem:
      "Without a clear boundary, programs would trample each other's state, and the OS could not pause, resume, kill or account for any one of them.",
    how: "Wrap each running program in a process: its own memory, its own open files, and a saved record of where it was. The OS switches the CPU between processes so quickly that they all appear to run at the same time.",
    tech: [
      "A process is a running program plus everything the OS tracks for it: its own memory (its address space, the range of addresses it may use), the files it has open, and where it was in its code.",
      "The kernel keeps this in a process control block (PCB): the process ID (PID), saved register values, the program counter, open file descriptors (numbered handles to open files) and the current state.",
      "A process is running, ready (waiting for a free CPU) or blocked (waiting for input/output, I/O, such as a disk read or a network reply).",
      "On Unix, fork() makes a copy of the calling process, exec() replaces the copy's program with a new one, and the parent wait()s for the child to finish. Your shell starts every command this way.",
      "A context switch saves one process's registers into its PCB and loads another's, so the CPU can move between them.",
    ],
    cost: "Context switches are not free: saving state, and starting again with caches full of the previous process's data, cost microseconds each, so a system with thousands of busy processes spends real time just switching. Each process also carries its own memory overhead.",
    tryIt:
      "Run ps -ef --forest (or pstree) and find your terminal, its shell, and the command you just ran as its child.",
    buildsOn: "Main week 2: What an OS is",
  },
  "M2:2": {
    why: "There are usually more ready processes than CPU cores. Someone has to decide who runs next and for how long.",
    problem:
      "If one process could keep the CPU until it chose to give it up, a single infinite loop would freeze everything, and interactive programs would feel sluggish behind long batch jobs.",
    how: "Give each process a short time slice, then take the CPU back with a timer interrupt and give it to someone else. Use priorities so interactive work gets picked sooner.",
    tech: [
      "Round robin cycles through the ready processes, giving each a fixed slice of time (a few milliseconds).",
      "A timer interrupt (a hardware signal the CPU must stop and handle) lets the kernel take the CPU back when a slice ends, even from a program stuck in a loop.",
      "Priority schedulers prefer important or interactive tasks so typing and clicking stay responsive.",
      "Linux's scheduler tracks how much CPU time each task has had and runs the one furthest behind its fair share (its current version is called EEVDF).",
      "When your app pauses briefly under load, it is often simply waiting its turn for a CPU, or waiting on I/O while marked blocked.",
    ],
    cost: "Short slices feel responsive but waste more time switching; long slices are efficient but feel laggy. Containers with CPU limits can be throttled by the scheduler even when the machine is idle, a common production surprise.",
    tryIt:
      "Run yes > /dev/null & twice, then watch top. Each process gets about half a core. Kill both with kill %1 %2.",
    buildsOn: "Main week 2: Processes",
  },
  "M2:3": {
    why: "Many processes share one physical RAM. Each needs its own memory, protected from the others, without knowing where it physically sits.",
    problem:
      "If processes used physical addresses directly, they could read or overwrite each other's memory, and each program would need to know in advance which part of RAM was free.",
    how: "Give every process the illusion of its own private, huge, continuous memory (virtual memory). Hardware translates each virtual address to a real physical one on every access, and the OS controls that translation.",
    tech: [
      "Each process sees virtual addresses: its own private numbering of memory starting from zero. The hardware translates them to real (physical) RAM addresses on every access.",
      "Memory is split into pages, usually 4 KiB each. A page table per process says which physical page each virtual page maps to.",
      "The MMU (memory management unit, part of the CPU) does the translation, and the TLB (a small cache inside it) remembers recent translations so most lookups are instant.",
      "Touching a page that isn't mapped causes a page fault: the kernel loads or allocates the page, or kills the process if the access was invalid (a segfault).",
      "A process's memory holds its code, static data, the heap (grows upward; objects you allocate) and the stack (grows downward; one frame per function call with its local variables).",
      "A stack overflow is running out of stack, usually from runaway recursion. A memory leak is heap memory you no longer use but never free.",
    ],
    cost: "Translation and page faults add overhead; when RAM runs out the OS swaps pages to disk and everything slows dramatically (thrashing), or the OOM killer ends a process. Heap allocation is slower than stack allocation and needs freeing, by hand or by a garbage collector.",
    tryIt:
      "Run cat /proc/self/maps (Linux) to see the memory layout of the cat process itself: its code, heap, libraries and stack.",
    buildsOn: "Main week 1: Memory",
  },
  "M2:4": {
    why: "Sometimes one program wants to do several things at once, like serving many users or keeping a UI responsive while it works. Separate processes for each would be heavy and could not easily share data.",
    problem:
      "Processes are isolated by design, so sharing data between them needs extra machinery, and creating them is relatively expensive.",
    how: "Allow several threads of execution inside one process. They share the same memory and files, but each has its own stack and registers, so each can be at a different point in the code.",
    tech: [
      "Threads share the heap, code, globals and file descriptors; each has its own stack, program counter and registers.",
      "The OS schedules threads, not processes, onto cores. Concurrency means several tasks are in progress at once and may take turns on one core; parallelism means they literally run at the same instant on different cores.",
    ],
    cost: "Shared memory is exactly what makes threads dangerous: two threads changing the same data can corrupt it (race conditions, covered next week). One crashing thread can bring down the whole process.",
    tryIt:
      "Run ps -eLf | head (Linux) to list threads, or open a browser's task manager and see how many threads one tab uses.",
    buildsOn: "Main week 2: Processes",
  },

  // ---- Week 3: Operating systems II ----
  "M3:0": {
    why: "User programs are not allowed to touch hardware directly, but they still need to read files, send network data and start other programs.",
    problem:
      "There must be a single, safe, well-defined doorway into the kernel, or protection is meaningless.",
    how: "The kernel exposes a fixed list of operations, system calls. A program asks for one by placing arguments in registers and executing a special trap instruction; the kernel checks the request, does the work, and returns a result.",
    tech: [
      "A system call (syscall) is a request from your program to the kernel, such as read, write, open, close, fork, execve or socket. Linux has a few hundred.",
      "Library functions such as printf in C or fs.readFile in Node end up calling them.",
      "strace (Linux) intercepts and prints every syscall a process makes, with arguments and return values. It is one of the best tools for seeing what a program is really doing.",
    ],
    cost: "Each syscall involves a mode switch, so chatty code (many tiny reads or writes) is slow; buffering exists to batch them. Security tools restrict which syscalls a process may make (seccomp in containers).",
    tryIt:
      "Run strace -e trace=openat,read,write cat /etc/hostname and match each line to what cat does.",
    buildsOn: "Main week 2: What an OS is",
  },
  "M3:1": {
    why: "Data must survive after a program exits and after the power goes off. Disks store raw blocks, which is not how people think about documents.",
    problem:
      "Without a file system, every program would have to track which disk blocks hold which data, and two programs could easily overwrite each other's blocks.",
    how: "The OS organizes the disk into named files inside directories, and gives programs a small number, a file descriptor, to refer to each file they have open.",
    tech: [
      "On Unix, many things are exposed as files: regular files, directories, devices, pipes and sockets, all used through open, read, write and close.",
      "A file descriptor is an index into the process's table of open files; 0, 1 and 2 are stdin, stdout and stderr.",
      "An inode stores a file's metadata and the location of its blocks; a directory maps names to inode numbers.",
      "A hard link is another name for the same inode; a symlink is a small file containing a path.",
      "The kernel keeps written data in a page cache and flushes it later; fsync forces it to disk.",
    ],
    cost: 'Buffering makes writes fast but means a crash can lose data that the program thought was written; databases call fsync carefully for this reason. Every process has a limit on open file descriptors, and leaking them leads to "too many open files".',
    tryIt:
      "Run stat on a file to see its inode number, then make a hard link with ln and a symbolic link with ln -s, and stat both.",
    buildsOn: "Main week 3: System calls",
  },
  "M3:2": {
    why: "Servers spend most of their time waiting on the network or the disk. A server needs to handle many clients at once even though each one is slow.",
    problem:
      "With blocking I/O, a call such as read() stops the thread until data arrives. Serving 10,000 clients that way needs 10,000 threads, and their memory and switching costs collapse the machine.",
    how: "Let one thread watch many connections at once and ask the kernel to say which ones are ready, then only do work for those. Nobody sits waiting on a single slow client.",
    tech: [
      'Blocking I/O makes the calling thread wait until data arrives. Non-blocking mode makes read() return immediately with "no data yet" instead.',
      "I/O multiplexing asks the kernel to watch many file descriptors at once and report which are ready.",
      "select and poll scan the whole list on every call, so cost grows with the number of connections. epoll (Linux) and kqueue (macOS, BSD) keep a registered set and return only the ready ones, so cost grows only with activity.",
      "An event loop is a loop around epoll_wait that hands each ready event to a callback function.",
      "Node.js (through its libuv library) and NGINX are built this way, which is how one thread serves thousands of connections.",
    ],
    cost: "Event-driven code is harder to write: any slow CPU work in a callback stalls every other connection. Regular file I/O does not fit epoll well, which is why libuv uses a thread pool for files, and why newer interfaces such as io_uring exist.",
    tryIt:
      "Run strace -f -e trace=epoll_wait,accept4 node -e \"require('http').createServer((q,r)=>r.end('hi')).listen(3000)\" and curl it from another terminal.",
    buildsOn: "Main week 3: Files and file systems",
  },
  "M3:3": {
    why: "Threads share memory and the scheduler can interrupt them at any instruction. Programs that share data across threads need rules.",
    problem:
      "Two threads each doing counter = counter + 1 can both read 5, both write 6, and lose an increment. These bugs are intermittent, depend on timing, and often vanish when you add logging.",
    how: "Mark the code that touches shared data as a critical section and make sure only one thread is inside it at a time. Give threads ways to wait for each other without spinning.",
    tech: [
      "A race condition is when the result depends on the interleaving of threads.",
      "A mutex (lock) lets one thread enter a critical section at a time. A condition variable lets a thread sleep until another signals that something changed (for example, a queue is no longer empty).",
      "A semaphore is a counter that allows up to N holders. Deadlock needs four conditions at once: mutual exclusion, hold-and-wait, no preemption and circular wait; the usual cure is to always take locks in the same global order.",
    ],
    cost: "Locks serialize work and can become the bottleneck; too few locks cause races, too many cause deadlocks and slowdowns. Lock-free techniques (atomic compare-and-swap) avoid some costs but are much harder to get right.",
    tryIt:
      "Run the two-threads-incrementing-a-counter program from this week without a lock five times, and note a different wrong total each time.",
    buildsOn: "Main week 2: Threads",
  },
  "M3:4": {
    why: "Processes are isolated on purpose, but real systems are built from many cooperating processes: a shell pipeline, a web server and its workers, a browser and its tabs.",
    problem:
      "If isolated processes had no way to talk, every tool would have to do everything itself, and you could not stop or reload a running program from outside.",
    how: "The OS provides controlled channels: byte streams between processes, short notifications, network-style connections and, for speed, shared memory regions.",
    tech: [
      "A pipe is a one-way byte stream; the shell's | connects one process's stdout to the next one's stdin.",
      'Signals are small asynchronous notifications: SIGINT (Ctrl-C), SIGTERM (please exit), SIGKILL (exit now, cannot be caught), SIGHUP (often "reload").',
      "Unix domain sockets are two-way streams between local processes; network sockets do the same across machines.",
      "Shared memory maps the same physical pages into two processes and is the fastest option, but needs locking.",
    ],
    cost: "Every channel except shared memory copies data through the kernel. Signals carry almost no data and are easy to mishandle: a server that ignores SIGTERM is killed abruptly by Kubernetes and drops requests.",
    tryIt:
      "Run ls /proc | head piped into wc -l and notice two processes talking through a pipe. Then run kill -l to list every signal.",
    buildsOn: "Main week 3: Files and file systems",
  },

  // ---- Week 4: Linux and the shell ----
  "M4:0": {
    why: "A Linux system has tens of thousands of files. Programs and people need to agree on where configuration, logs, programs and user data live.",
    problem:
      "If every distribution or tool put files anywhere, you could never find a config or log on an unfamiliar server, and scripts would break between machines.",
    how: "Follow a shared convention, the Filesystem Hierarchy Standard, with one tree rooted at / and a fixed purpose for each top-level directory.",
    tech: [
      "/ is the root: every file on the system hangs off it.",
      "/etc holds system configuration; /var holds changing data such as logs (/var/log); /usr holds installed programs and libraries; /home holds users' files; /tmp holds temporary files, often cleared on reboot.",
      "/proc and /sys are not on disk: the kernel generates them live to expose processes and hardware as files.",
      "/dev holds device files, such as disks and terminals, that programs read and write like ordinary files.",
    ],
    cost: "Conventions are not enforced, so some software still scatters files. In containers, much of this tree is minimal or read-only, so code that assumes it can write anywhere will fail.",
    tryIt:
      "Run ls / and then cat /proc/cpuinfo | head and ls /dev | head to see that devices and kernel data appear as files.",
    buildsOn: "Main week 3: Files and file systems",
  },
  "M4:1": {
    why: "Servers usually have no graphical interface, and many developer tasks are faster to do by typing than by clicking.",
    problem:
      "Without command-line file skills you cannot inspect a server, follow a log as it grows, or find a file among millions.",
    how: "Use small commands that each do one job, and combine them.",
    tech: [
      "ls lists a directory, cd changes into one, cp copies, mv moves or renames, and rm deletes. There is no recycle bin.",
      "find searches by name, size, time or type.",
      "cat prints a file, less pages through it, and head and tail show its start and end.",
      "tail -f keeps following a file as new lines are written, the standard way to watch a log.",
    ],
    cost: "The command line is unforgiving: rm -rf on the wrong path is unrecoverable. Read a command fully before pressing Enter, especially as root.",
    tryIt:
      'Run find ~ -name "*.md" -mtime -7 to list Markdown files you changed this week, then open one with less.',
  },
  "M4:2": {
    why: "Linux is multi-user by design, and even on a single-user server, services run as separate users so they cannot harm each other.",
    problem:
      "Without permissions, any program could read your SSH keys or overwrite system files, and one compromised service would own the whole machine.",
    how: "Every file has an owner, a group, and a set of read, write and execute permissions for the owner, the group and everyone else. Only root may bypass the rules, and you borrow root briefly with sudo.",
    tech: [
      "Every file has an owner, a group, and three sets of permissions: for the owner, the group and everyone else.",
      "Each set is r (read), w (write) and x (execute); ls -l shows them as -rwxr-xr--.",
      "Octal notation packs each set into one digit: r=4, w=2, x=1. So 755 is rwxr-xr-x and 644 is rw-r--r--.",
      "chmod changes permissions and chown changes the owner. On a directory, x means you may enter it.",
      "root is the all-powerful administrator account; sudo runs one command as root and logs that you did.",
    ],
    cost: "Making things work with chmod 777 or running everything as root removes the protection entirely. In containers, running as root is a well-known security risk.",
    tryIt:
      "Create a file, run ls -l, then chmod 600 on it and ls -l again. Try to cat it as another user with sudo -u nobody cat file.",
    buildsOn: "Main week 4: The filesystem layout",
  },
  "M4:3": {
    why: "Every command you type is interpreted by some program before anything runs. Knowing that program's rules is the difference between guessing and controlling your terminal.",
    problem:
      'Without understanding the shell, you cannot tell why a command is "not found", why a variable is empty in a script, or why an error message did not end up in your log file.',
    how: "Treat the shell as a programming language for running other programs. It finds programs, sets their environment, wires their inputs and outputs together, and reacts to whether they succeeded.",
    tech: [
      "The shell (bash, zsh) reads your line, expands variables and wildcards such as *.txt, then runs the program.",
      "Environment variables are key-value pairs passed to child processes. PATH lists the directories searched for commands, export makes a variable visible to children, and .bashrc runs when a shell starts.",
      "| pipes one command's output (stdout) into the next command's input (stdin); > overwrites a file, >> appends, and 2>&1 sends error output (stderr) wherever stdout is going.",
      "Every program exits with a code: 0 means success, anything else is failure. && runs the next command only on success, || only on failure.",
    ],
    cost: "Shell syntax has many sharp edges (quoting, word splitting, empty variables). Beyond about 100 lines, a real programming language is usually safer.",
    tryIt:
      "Run echo $PATH, then which ls, then type cd, to see where commands come from and which ones are built into the shell.",
    buildsOn: "Main week 3: Inter-process communication",
  },
  "M4:4": {
    why: "Logs, CSV exports, config files and command output are all text. Engineers constantly need to search, filter and summarize them.",
    problem:
      "Opening a 2 GB log in an editor to count errors is slow or impossible, and doing it by hand is error-prone.",
    how: "Use filter commands that each read text, transform it, and pass it on, then chain them into a pipeline that answers your question in one line.",
    tech: [
      "grep keeps the lines that match a pattern.",
      "sed edits text as it streams past, for example s/old/new/ to replace.",
      "awk splits each line into fields ($1, $2...) and computes over them.",
      "sort orders lines, uniq -c counts repeated lines, wc counts lines or words, and cut picks columns.",
      "xargs turns lines of input into arguments for another command; jq filters and reshapes JSON.",
      "A classic: grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -rn | head ranks the most common errors.",
    ],
    cost: "Regular expressions and awk syntax are cryptic at first. For complex or repeated analysis, a script or a log platform is easier to maintain.",
    tryIt:
      "Run history | awk '{print $2}' | sort | uniq -c | sort -rn | head to find your ten most used commands.",
    buildsOn: "Main week 4: Shell fundamentals",
  },
  "M4:5": {
    why: "On a server you are often asked why it is slow, or why a program will not die. You need to see and control processes from the terminal.",
    problem:
      "Without process tools you cannot find which program is eating the CPU, stop a hung one, or keep a job running after you log out.",
    how: "List processes, watch their resource use live, send them signals, and run commands in the background.",
    tech: [
      "ps aux lists every process with its PID, user, CPU and memory; top and htop show the same live.",
      "kill PID sends a signal (a small notification) called SIGTERM, which asks the program to exit cleanly. kill -9 sends SIGKILL, which ends it immediately, as a last resort.",
      "Adding & runs a command in the background; jobs, fg and bg manage those background jobs.",
      "nohup (or better, tmux or a systemd service) keeps a command alive after you log out.",
    ],
    cost: "kill -9 gives the program no chance to clean up, which can corrupt files or leave half-finished work. Prefer SIGTERM first.",
    tryIt:
      "Run sleep 300 &, then jobs, ps aux | grep sleep, and kill it by its PID.",
    buildsOn: "Main week 2: Processes",
  },
  "M4:6": {
    why: "Most production problems involve the network. You need to test connectivity and inspect traffic from wherever you are, usually a terminal on a server.",
    problem:
      'Without network tools, "the API is down" is a guess: you cannot tell DNS failure from a closed port from a slow server.',
    how: "Use one small tool per layer: is the host reachable, does the name resolve, is anything listening, what does the server actually reply.",
    tech: [
      "ping checks whether a machine answers (using ICMP, a small control protocol).",
      "dig asks DNS for a name and shows exactly which records come back.",
      "ss -tlnp (or netstat) lists listening ports and their processes; lsof -i :3000 shows which process holds port 3000.",
      "curl -v makes an HTTP request and prints the whole conversation.",
      "ssh opens an encrypted shell on another machine; scp copies files over the same connection.",
    ],
    cost: 'Some networks block ping, so "no ping" does not always mean "down". These tools show symptoms; you still need the networking model (week 6) to interpret them.',
    tryIt:
      "Run dig example.com, then curl -v https://example.com, and read where the DNS answer, the TCP connect and the TLS handshake appear.",
    buildsOn: "Main week 4: Shell fundamentals",
  },
  "M4:7": {
    why: "A server has to install software, keep it updated, start services at boot and restart them when they crash.",
    problem:
      "Installing by downloading files by hand loses track of versions and dependencies, and a service started from a terminal dies when you log out or the machine reboots.",
    how: "Let a package manager install and update software with its dependencies, and let a service manager start, supervise and log long-running programs.",
    tech: [
      "apt (on Debian and Ubuntu) installs packages and everything they depend on from online repositories: apt update refreshes the list, apt install adds software.",
      "systemd starts and supervises background services on most Linux distributions. systemctl start, stop, restart, enable (start at boot) and status control them.",
      "journalctl reads the logs systemd collects, for example journalctl -u nginx -f to follow NGINX's log.",
    ],
    cost: "System packages can lag behind upstream versions, and mixing package managers causes conflicts. Containers replace much of this on modern servers, but the host machine still runs on it.",
    tryIt:
      "Run systemctl status ssh (or any service), then journalctl -u ssh -n 20 to read its recent logs.",
    buildsOn: "Main week 4: Processes from the shell",
  },
  "M4:8": {
    why: "Engineers repeat the same command sequences: backups, deployments, log clean-up. Doing them by hand is slow and error-prone.",
    problem:
      "A manual 12-step procedure gets done slightly differently every time, and someone eventually skips a step.",
    how: "Save the commands in a file with variables, conditions and loops, so the procedure runs identically every time.",
    tech: [
      "A script starts with a shebang (#!/usr/bin/env bash) naming its interpreter, and must be executable (chmod +x).",
      'It has variables (NAME=value, used as "$NAME"), if/then/fi, for and while loops, functions, and $1, $2 for arguments. set -euo pipefail makes the script stop on the first error, on unset variables and on failures inside pipelines, instead of carrying on silently.',
    ],
    cost: "Shell scripts are hard to test and easy to break with unexpected input such as filenames with spaces. Always quote variables, and move complex logic to a real language.",
    tryIt:
      "Write a 10-line script with a shebang that loops over the .txt files in a folder and prints each name with its line count, then chmod +x and run it.",
    buildsOn: "Main week 4: Shell fundamentals",
  },

  // ---- Week 5: Git, from the inside ----
  "M5:0": {
    why: "Code changes constantly and many people change it at once. We need a precise history of every version, and a way to tell whether any version has been altered.",
    problem:
      "Copying folders (project_final_v2_REAL) wastes space, loses track of who changed what, and gives no reliable way to combine two people's work.",
    how: "Store every version as a snapshot made of small pieces, and name each piece by a fingerprint of its content. Identical content is stored once, and any change to history changes the fingerprints.",
    tech: [
      "A hash function turns any content into a short fixed-size fingerprint; the same content always gives the same fingerprint. Git names every object by the SHA-1 hash of its content (moving to SHA-256).",
      "Git has four object types. A blob holds one file's contents. A tree is a directory: it lists names and points at blobs and other trees.",
      "A commit points at one tree (the snapshot of the whole project), at its parent commit or commits, and records the author and message. A tag gives a commit a lasting name.",
      "Everything lives in .git: objects/ holds the objects, refs/ holds branch and tag names, HEAD says what is checked out, and index is the staging area.",
    ],
    cost: "Because every snapshot is kept, committing huge binary files bloats the repository forever; Git LFS exists for that. Content addressing also means rewriting old history changes every later hash.",
    tryIt:
      "In a new repo, commit one file, then run git cat-file -p HEAD, then cat-file -p on the tree hash and the blob hash it prints.",
    buildsOn: "Main week 3: Files and file systems",
  },
  "M5:1": {
    why: "Commit hashes are long and meaningless to humans. People need readable names for lines of work, and Git needs to know which commit you are on.",
    problem:
      "Without names, you would have to remember 40-character hashes to switch between features or share work.",
    how: "Make a branch just a named pointer to a commit, which moves forward automatically when you commit. HEAD is a pointer to the branch you are on.",
    tech: [
      "A branch is literally a file such as .git/refs/heads/main containing one commit hash. HEAD usually contains ref: refs/heads/main.",
      "Committing creates a new commit whose parent is the current one, then moves the branch pointer to it.",
      "If HEAD points straight at a commit instead of a branch (detached HEAD), new commits belong to no branch and are easy to lose.",
    ],
    cost: "Branches are cheap to make, so they multiply; long-lived branches drift apart and become painful to merge.",
    tryIt:
      "Run cat .git/HEAD and cat .git/refs/heads/main, then compare with git rev-parse HEAD.",
    buildsOn: "Main week 5: The object model",
  },
  "M5:2": {
    why: "You rarely want to commit every change you have made at once. You want to build each commit deliberately, so history tells a clear story.",
    problem:
      "If Git committed the whole folder every time, unrelated edits and half-finished experiments would land together, making history hard to read and changes hard to undo.",
    how: "Keep three places: the files you are editing, a staging area where you assemble the next commit, and the repository of finished commits.",
    tech: [
      "The working directory is your files on disk, as you edit them.",
      "git add copies chosen changes into the index (the staging area): the next commit, being assembled.",
      "git commit turns the index into a tree and a commit in the repository.",
      "git status compares all three. git diff shows the working directory against the index; git diff --staged shows the index against the last commit.",
    ],
    cost: "The extra step confuses beginners, and it is easy to forget to stage a file. git add -p lets you stage parts of a file for cleaner commits.",
    tryIt:
      "Change a file, git add part of it with git add -p, then compare git diff (unstaged) with git diff --staged.",
    buildsOn: "Main week 5: Refs",
  },
  "M5:3": {
    why: "Teams work in parallel and then need to combine work, share it with others, and sometimes undo it.",
    problem:
      "Commands such as merge, rebase and reset feel dangerous and magical if you do not know what they do to history, so people avoid them or use them wrongly.",
    how: "Treat history as a graph of commits and every command as a precise change to that graph or to the pointers into it.",
    tech: [
      "commit adds a node to the graph; branch adds a pointer; switch moves HEAD to another branch.",
      "merge joins two lines of work. A fast-forward just moves the pointer when one line is simply ahead; a three-way merge makes a new commit with two parents.",
      "rebase replays your commits on top of another branch, creating new commits with new hashes. cherry-pick copies one commit.",
      "reset moves the branch pointer: --soft keeps the changes staged, --mixed keeps them in your files, --hard throws them away.",
      "revert adds a new commit that undoes an old one, which is safe on shared branches. stash shelves uncommitted work for later.",
      "Remotes: fetch downloads commits and updates origin/main; pull is fetch plus merge (or rebase); push uploads your commits and moves the remote branch.",
    ],
    cost: "Rebase and reset rewrite history, so never use them on commits others have already pulled. Merge preserves exact history but can make it noisy.",
    tryIt:
      "Open Learn Git Branching and do the rebase level, watching the graph change, then do the same rebase in a real repo and run git log --graph --oneline.",
    buildsOn: "Main week 5: The three areas",
  },
  "M5:4": {
    why: "People make mistakes with Git: a bad reset, a deleted branch, a rebase gone wrong.",
    problem:
      "After a hard reset or a deleted branch, the commits seem gone, and many people re-clone and lose work.",
    how: "Git keeps a private log of everywhere HEAD and each branch has pointed recently. Old commits stay in the object store, so you can look up where you were and point a branch back there.",
    tech: [
      "git reflog lists recent positions of HEAD with names such as HEAD@{3}.",
      "To recover, find the right entry and run git branch rescue HEAD@{3} or git reset --hard HEAD@{3}.",
      "Unreachable commits are kept until garbage collection, by default for about 30 to 90 days.",
    ],
    cost: "The reflog is local to your machine and is not pushed, so it cannot recover work that was never committed, or work lost on someone else's clone.",
    tryIt:
      "Make a commit, run git reset --hard HEAD~1 to lose it, then find it with git reflog and bring it back with git reset --hard <hash>.",
    buildsOn: "Main week 5: Operations",
  },
  "M5:5": {
    why: "Git itself does not say how a team should use it. Teams need shared habits so many people can change one codebase safely every day.",
    problem:
      "Without a workflow, people push broken code to main, overwrite each other's work, and nobody reviews changes before they ship.",
    how: "Agree on conventions: make changes on short-lived branches, get them reviewed in a pull request, run automated checks, then merge into a main branch that is always releasable.",
    tech: [
      "Feature branches keep each change separate. A pull request (GitHub) or merge request (GitLab) shows the diff for review and runs CI (automatic checks such as tests) before merging.",
      "Trunk-based development keeps branches very short (hours to a day or two) and merges into main often, using feature flags (on/off switches in code) to hide unfinished work.",
      "Conventional Commits (feat:, fix:, chore:) make history readable and allow automated changelogs.",
    ],
    cost: "Process adds friction: long-lived branches cause painful merges, and slow reviews block everyone. Tune the workflow to the team's size.",
    tryIt:
      "Open a public repo's pull requests on GitHub and read one PR's description, review comments and the commits that addressed them.",
    buildsOn: "Main week 5: Operations",
  },

  // ---- Week 6: Networking ----
  "M6:0": {
    why: "Sending data between computers involves many separate problems: physical signals, finding the right machine, reliable delivery and application meaning. One design cannot solve all of them at once.",
    problem:
      "If every application had to handle radio signals, routing and retransmission itself, nothing would interoperate and every change would break everything.",
    how: "Split networking into layers, each solving one problem and relying only on the layer below. Each layer wraps the data from the layer above in its own header, like envelopes inside envelopes.",
    tech: [
      "The TCP/IP model has four layers: link (Ethernet, Wi-Fi), internet (IP), transport (TCP, UDP) and application (HTTP, DNS).",
      'The OSI model splits these into seven for teaching, which is why people say "L4" for transport and "L7" for application.',
      "Encapsulation: an HTTP request goes inside a TCP segment, inside an IP packet, inside an Ethernet frame, and each hop unwraps only what it needs.",
    ],
    cost: "Layers add header overhead, and real protocols do not always respect clean boundaries (TLS and QUIC blur them). Still, the model is the map for debugging.",
    tryIt:
      "Open Wireshark, load a page, and click one HTTP packet to see the Ethernet, IP, TCP and HTTP layers nested inside each other.",
    buildsOn: "Main week 3: Inter-process communication",
  },
  "M6:1": {
    why: "Before data can cross the internet, it has to get from your device to the next box on the same local network.",
    problem:
      "On a shared cable or radio channel, many devices hear every signal. Each needs a way to know which frames are meant for it.",
    how: "Give every network card a hardware address, and let switches learn which address is on which port so they deliver frames only where they need to go.",
    tech: [
      "A MAC address is a 48-bit identifier on each network interface. Ethernet and Wi-Fi carry frames with source and destination MACs.",
      "A switch learns which MAC is on which port and forwards frames accordingly.",
      'ARP (Address Resolution Protocol) answers "which MAC has IP 192.168.1.1?" by broadcasting the question on the local network.',
    ],
    cost: "MAC addresses only matter inside one local network; routers replace the link-layer header at each hop. ARP trusts any reply, which allows spoofing attacks on local networks.",
    tryIt:
      "Run ip neigh (Linux) or arp -a (Mac, Windows) to see the MAC addresses your machine has learned on your network.",
    buildsOn: "Main week 6: Layered models",
  },
  "M6:2": {
    why: "The internet is millions of separate networks. A packet has to find its way from any one of them to any other.",
    problem:
      "Flat hardware addresses do not say where a machine is, so they cannot be routed globally, and the world has run out of unique IPv4 addresses.",
    how: "Give every device a hierarchical IP address that says which network it is on, let routers forward packets hop by hop toward that network, and let NAT share one public address among many private devices.",
    tech: [
      "An IPv4 address is 32 bits, written as four numbers from 0 to 255; an IPv6 address is 128 bits.",
      "CIDR notation such as 10.0.0.0/16 means the first 16 bits name the network and the rest name devices on it (65,536 addresses).",
      "Private ranges (10.x, 172.16-31.x, 192.168.x) are never routed on the public internet.",
      "Each router looks up the destination in its routing table and forwards the packet one hop closer. Your default gateway is where your machine sends anything that isn't local.",
      "Every packet carries a TTL (time to live) counter that drops by one at each hop, so a packet stuck in a loop eventually dies. traceroute uses it to discover the path.",
      "NAT (network address translation) on your home router rewrites private source addresses to its one public address, and remembers each connection so replies reach the right device.",
    ],
    cost: "NAT breaks the idea that every device is directly reachable, which complicates peer-to-peer connections. IPv6 fixes the shortage but adoption is gradual, so you must handle both.",
    tryIt:
      "Run traceroute example.com (tracert on Windows) and count the routers between you and the server.",
    buildsOn: "Main week 6: Link layer",
  },
  "M6:3": {
    why: "IP delivers packets to a machine, but many programs run on that machine, and IP packets can be lost, duplicated or arrive out of order.",
    problem:
      "An application such as a web server needs its own address on the machine, and most applications need every byte to arrive, in order, exactly once.",
    how: "Add ports to address a program on a machine. TCP then builds a reliable, ordered byte stream on top of unreliable packets by numbering bytes, acknowledging them and resending what was lost. UDP offers just ports and speed, with no guarantees.",
    tech: [
      "A connection is identified by source IP, source port, destination IP, destination port and protocol.",
      "TCP opens with a three-way handshake (SYN, SYN-ACK, ACK), numbers every byte with sequence numbers, acknowledges what arrived, and retransmits after timeouts.",
      "Flow control (the receive window) stops a fast sender from overwhelming a slow receiver; congestion control (slow start, then careful growth) stops senders from overwhelming the network.",
      "Closing uses FIN in each direction, and the side that closes first waits in TIME_WAIT.",
      "UDP just sends datagrams, which suits DNS, video calls, games and QUIC, where late data is worse than lost data.",
    ],
    cost: "TCP's reliability costs a round trip to set up and causes head-of-line blocking: one lost packet delays everything behind it. UDP pushes reliability onto the application.",
    tryIt:
      "Run ss -tan (or netstat -an) and find a connection in ESTABLISHED and one in TIME_WAIT. In Wireshark, filter tcp.flags.syn==1 and find a three-way handshake.",
    buildsOn: "Main week 6: Network layer",
  },
  "M6:4": {
    why: "People remember names such as google.com, while networks route by IP addresses, and those addresses change.",
    problem:
      "A single global list of every name and its address would be enormous, change every second, and be a single point of failure.",
    how: "Split the namespace into a hierarchy where each level delegates to the next, and cache answers everywhere so most lookups never travel far.",
    tech: [
      "Your device asks a recursive resolver (your ISP's, or a public one such as 1.1.1.1 or 8.8.8.8) to find the answer for it.",
      "If it doesn't have the answer cached, the resolver asks a root server, which points to the servers for .com (the top-level domain, TLD), which point to the domain's authoritative servers, which give the answer.",
      "Record types: A (IPv4 address), AAAA (IPv6 address), CNAME (an alias to another name), MX (mail server), TXT (free text for verification and policies), NS (which servers are authoritative).",
      "Every answer has a TTL saying how many seconds it may be cached, which is why DNS changes take time to spread.",
    ],
    cost: "Caching means changes take up to the TTL to spread, so lower TTLs before a migration. DNS is a frequent hidden cause of outages, and plain DNS is unencrypted.",
    tryIt:
      "Run dig +trace example.com and follow the answer from the root servers down to the authoritative server.",
    buildsOn: "Main week 6: Transport layer",
  },
  "M6:5": {
    why: "A device joining a network needs an IP address, a gateway and a DNS server before it can do anything.",
    problem:
      "Configuring every phone and laptop by hand would be impossible, and two devices picking the same address would break each other.",
    how: "Let a server on the network hand out addresses on request, as time-limited leases.",
    tech: [
      "DHCP's four steps are Discover (broadcast: is anyone a DHCP server?), Offer, Request and Acknowledge.",
      "The lease includes the IP, subnet mask, default gateway and DNS servers, and it expires unless renewed. Your home router is usually the DHCP server.",
    ],
    cost: "Addresses can change between leases, so servers usually get fixed (reserved) addresses. A rogue DHCP server on a network can redirect traffic.",
    tryIt:
      "Run ipconfig /all (Windows) or ip addr and ip route (Linux) to see the address, gateway and DNS server DHCP gave you.",
    buildsOn: "Main week 6: Network layer",
  },
  "M6:6": {
    why: "Programs need a standard way to ask the OS to open network connections, regardless of language.",
    problem:
      "Without a common interface, every language and program would need its own network stack.",
    how: "Expose network connections as file descriptors through a small set of system calls, so reading and writing to a network peer looks like reading and writing a file.",
    tech: [
      "A server calls socket() to create a socket, bind() to attach it to an IP and port, listen() to accept connections, then accept() in a loop, which returns a new socket for each client. A client calls socket() then connect().",
      "Both then read() and write(). Binding to 127.0.0.1 accepts only local connections; 0.0.0.0 accepts connections on every interface.",
      "Node's net module, Java's ServerSocket and Python's socket module all wrap these calls.",
    ],
    cost: "The raw API handles bytes, not messages, so you must frame messages yourself (that is what HTTP does). Each socket uses a file descriptor and kernel memory.",
    tryIt:
      "Run nc -l 9000 in one terminal and nc localhost 9000 in another, and type in both. That is a TCP socket with no code.",
    buildsOn: "Main week 3: I/O models",
  },

  // ---- Week 7: HTTP and TLS ----
  "M7:0": {
    why: "TCP delivers a stream of bytes but says nothing about what they mean. The web needed a simple shared language for asking for documents and getting them back.",
    problem:
      "Without a standard message format, every browser and server would need custom code for every other one.",
    how: "Define a plain-text request and response format: a first line saying what you want or what happened, some named headers, a blank line, then an optional body.",
    tech: [
      "A request looks like: GET /index.html HTTP/1.1, then headers such as Host: example.com, then a blank line (CRLF CRLF), then an optional body.",
      "A response starts with a status line such as HTTP/1.1 200 OK, then headers, a blank line and the body.",
      "The receiver knows where the body ends from Content-Length or chunked encoding.",
    ],
    cost: "Text is easy to read and debug but slow to parse and verbose to send, which is part of why HTTP/2 moved to a binary format. Parsers that disagree on where a message ends cause request smuggling attacks.",
    tryIt:
      "Run printf 'GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n' | nc example.com 80 and read the raw response.",
    buildsOn: "Main week 6: Sockets API",
  },
  "M7:1": {
    why: "A client needs to say not only which resource it wants, but what it wants to do with it.",
    problem:
      "If everything were a GET, caches, proxies and browsers could not tell a harmless read from a payment, and might repeat or cache something dangerous.",
    how: "Give each request a method with agreed meaning, and agree which methods are safe (no side effects) and which are idempotent (doing it twice equals doing it once).",
    tech: [
      "GET reads, HEAD is GET without the body, POST creates or triggers processing, PUT replaces a resource, PATCH partially updates, DELETE removes, OPTIONS asks what is allowed (used by CORS). GET, HEAD and OPTIONS are safe.",
      "Those plus PUT and DELETE are idempotent, so clients and proxies may retry them after a timeout.",
      "POST is neither, which is why retrying it can create duplicates without idempotency keys.",
    ],
    cost: "These are promises your server must keep. A GET that deletes data will eventually be triggered by a link prefetcher or crawler.",
    tryIt:
      "Run curl -X OPTIONS -i https://httpbin.org/get and curl -X DELETE -i https://httpbin.org/delete, and compare the responses.",
    buildsOn: "Main week 7: HTTP message anatomy",
  },
  "M7:2": {
    why: "Clients, browsers, proxies and monitoring tools must react to results automatically without reading a human-written message.",
    problem:
      "If every error came back as 200 with a message in the body, retries, caching, redirects and alerting could not work.",
    how: "Return a three-digit code whose first digit says the category of the result.",
    tech: [
      "1xx: informational.",
      "2xx success: 200 OK, 201 Created, 204 No Content.",
      "3xx redirection: 301 moved permanently, 302 moved temporarily, 304 Not Modified (use your cached copy).",
      "4xx client error: 400 bad request, 401 not authenticated (who are you?), 403 authenticated but not allowed, 404 not found, 409 conflict, 422 valid syntax but invalid data, 429 too many requests.",
      "5xx server error: 500 a bug, 502 bad gateway (the server behind a proxy failed or sent garbage), 503 unavailable or overloaded, 504 gateway timeout (the server behind a proxy was too slow).",
    ],
    cost: "Codes are coarse, so APIs add a structured error body for detail. Using the wrong family breaks clients: a 500 for bad input triggers pointless retries and false alerts.",
    tryIt:
      "Run curl -i https://httpbin.org/status/404 and curl -I http://github.com to see a 404 and a redirect with its Location header.",
    buildsOn: "Main week 7: HTTP message anatomy",
  },
  "M7:3": {
    why: "A request needs metadata beyond the method and path: which site it is for, what format the body is in, who is asking.",
    problem:
      "Without metadata, a server hosting many sites would not know which one you want, and the receiver would not know how to read the body or where it ends.",
    how: "Attach named key-value headers to every message, with agreed meanings for common ones.",
    tech: [
      "Host names the site, which lets one IP address serve many domains.",
      "Content-Type says what the body is (text/html, application/json); Content-Length gives its size in bytes; Accept says which formats the client wants.",
      "Authorization carries credentials such as a Bearer token; User-Agent names the client software.",
      "Location tells the client where to go after a redirect, or where a newly created resource lives.",
    ],
    cost: "Headers are sent on every request, so large cookies or tokens add real overhead (HTTP/2 compresses them). Headers from clients can be forged, so never trust them blindly.",
    tryIt:
      "Open DevTools, Network tab, click any request and read its request and response headers one by one.",
    buildsOn: "Main week 7: HTTP message anatomy",
  },
  "M7:4": {
    why: "HTTP is stateless: each request stands alone. But sites need to remember that you logged in or what is in your cart.",
    problem:
      "Without some memory between requests, you would have to send your password with every page view.",
    how: "Let the server ask the browser to store a small value and send it back automatically on later requests to that site.",
    tech: [
      "The server sends Set-Cookie: session=abc123, and the browser sends Cookie: session=abc123 back on every matching request.",
      "HttpOnly stops JavaScript from reading the cookie, which limits theft through XSS (cross-site scripting: an attacker's script running on your page).",
      "Secure sends it over HTTPS only.",
      "SameSite (Strict, Lax or None) controls whether it is sent on requests started by other sites, the main defence against CSRF (cross-site request forgery: another site making your browser send requests as you).",
      "Domain and Path say where it is sent; Max-Age or Expires say when it is deleted.",
    ],
    cost: "Cookies ride along on every matching request, which is exactly what enables CSRF if SameSite is not set. They are limited in size, and browsers increasingly restrict third-party cookies.",
    tryIt:
      "In DevTools, Application tab, Cookies, look at a site's cookies and which are HttpOnly, Secure and SameSite.",
    buildsOn: "Main week 7: Headers",
  },
  "M7:5": {
    why: "Many responses do not change often, yet clients request them again and again across slow networks.",
    problem:
      "Re-downloading the same logo or script on every page wastes bandwidth, slows pages and overloads servers.",
    how: "Let the server state how long a response may be reused, and let clients cheaply check whether their copy is still current instead of downloading it again.",
    tech: [
      'Cache-Control: max-age=3600 lets a copy be reused for an hour. no-cache means "you may store it but must revalidate before using it"; no-store means "do not store it at all". public allows shared caches such as CDNs; private allows only the browser. immutable says the file will never change (used with hashed filenames).',
      "For revalidation, the server sends an ETag (a version fingerprint) or Last-Modified, and the client later sends If-None-Match or If-Modified-Since; if nothing changed the server replies 304 with no body.",
      "Vary lists request headers that change the response, so caches store separate copies.",
    ],
    cost: "Caching is where stale data and leaks come from: a long max-age on HTML means users miss updates, and a shared cache storing a private response can show one user's data to another.",
    tryIt:
      "Run curl -I on a static file from a big site twice, and read Cache-Control, ETag and Age. Then reload a page in DevTools and find requests served from disk cache or with a 304.",
    buildsOn: "Main week 7: Headers",
  },
  "M7:6": {
    why: "A web page needs dozens of requests, and each TCP and TLS setup costs round trips. Bodies are often large and highly compressible.",
    problem:
      "Opening a new connection per request multiplies latency, and sending uncompressed text wastes bandwidth.",
    how: "Reuse connections for many requests, stream bodies whose size is not known in advance, and compress bodies on the fly.",
    tech: [
      "Keep-alive (the default in HTTP/1.1) leaves the TCP connection open for more requests.",
      "Chunked transfer encoding sends a body as a series of sized chunks, so a server can start sending before it knows the total length (used for streaming).",
      "Compression: the client sends Accept-Encoding: gzip, br, and the server replies with Content-Encoding: br; text often shrinks by 70 to 90 percent.",
    ],
    cost: "Idle kept-alive connections use server memory, and proxies must agree on timeouts. Compression costs CPU, and compressing secrets next to attacker-controlled data can leak them (the BREACH attack).",
    tryIt:
      "Run curl -v --compressed https://example.com and find Connection, Content-Encoding and Transfer-Encoding in the output.",
    buildsOn: "Main week 6: Transport layer",
  },
  "M7:7": {
    why: "HTTP/1.1 sends one request at a time per connection, so browsers open several connections and still wait in line.",
    problem:
      "Pages with 100 resources stall behind slow responses (head-of-line blocking), and repeating large, near-identical headers wastes bandwidth.",
    how: "HTTP/2 lets many requests share one connection at once by splitting them into interleaved frames. HTTP/3 moves to QUIC over UDP so that one lost packet no longer stalls every stream.",
    tech: [
      "HTTP/2 sends binary frames instead of text. Each request and response is a stream, and frames from many streams interleave on one TCP connection (multiplexing). Headers are compressed (HPACK).",
      "It keeps the same methods, status codes and headers, so your code doesn't change.",
      "But TCP still delivers bytes strictly in order, so one lost packet stalls every stream on that connection (head-of-line blocking).",
      "HTTP/3 runs over QUIC, which builds reliable streams on UDP with TLS 1.3 built in. Loss in one stream doesn't block the others, and connecting takes fewer round trips.",
    ],
    cost: "Binary protocols are harder to inspect by hand, and UDP is sometimes blocked by corporate networks, so clients fall back to HTTP/2.",
    tryIt:
      "In DevTools, Network tab, right-click the column header and turn on Protocol to see which requests use h2 and h3.",
    buildsOn: "Main week 7: Connection management",
  },
  "M7:8": {
    why: "Browsers run code from many sites at once. A page from one site must not be able to read your data from another site.",
    problem:
      "Without restrictions, a malicious page could use your logged-in cookies to fetch your bank statements in the background and read them. But legitimate apps also need to call APIs on other domains.",
    how: "The browser enforces the same-origin policy: scripts may only read responses from their own origin. CORS lets a server explicitly declare which other origins may read its responses.",
    tech: [
      "An origin is scheme + host + port. A simple cross-origin request (GET or POST with basic headers) is sent, but the browser hides the response unless it includes Access-Control-Allow-Origin naming the caller.",
      "Other requests (custom headers, JSON bodies, PUT, DELETE) first get a preflight OPTIONS request; the server must reply with Access-Control-Allow-Methods and -Headers before the real request is sent.",
      "Credentials (cookies) also need Access-Control-Allow-Credentials: true and an exact origin, not *.",
    ],
    cost: "CORS is enforced only by browsers; it does not protect your API from curl or other servers, so it is not authentication. Misconfiguring it (reflecting any origin with credentials allowed) re-opens the hole it closes.",
    tryIt:
      "From the console on example.com, run fetch('https://api.github.com') (allowed) and then fetch('https://www.google.com') (blocked by CORS), and read both results.",
    buildsOn: "Main week 7: Cookies",
  },
  "M7:9": {
    why: "Internet traffic passes through many machines you do not control: Wi-Fi routers, ISPs and network operators.",
    problem:
      "Plain HTTP can be read and changed in transit, so passwords leak and anyone in the path can inject content. You also cannot tell whether you are talking to the real site.",
    how: "Encrypt the connection so only the two ends can read it, protect it so tampering is detected, and prove the server's identity with a certificate signed by an authority your device already trusts.",
    tech: [
      "Symmetric encryption (AES) is fast, but both sides need the same secret key.",
      "Asymmetric encryption (RSA, elliptic curves) uses a key pair: what one key locks only the other unlocks. You can publish the public key and keep the private one.",
      "A hash (SHA-256) fingerprints data; a digital signature is a hash locked with a private key, proving who produced the data and that it wasn't changed.",
      "In the TLS 1.3 handshake, client and server exchange key shares (Diffie-Hellman, a way to agree on a secret over a public channel) in one round trip, derive the same symmetric keys, and the server proves its identity with its certificate and a signature.",
      "A certificate binds a domain to a public key and is signed by a certificate authority (CA). Your device trusts a built-in set of root CAs, and intermediate certificates link them to the site's certificate.",
      "HTTPS hides content and stops tampering, but the domain name (sent in clear as SNI, the server name indication, and in DNS), the IP address, and the timing and size of traffic still leak.",
    ],
    cost: "TLS adds a handshake round trip and some CPU, both small today. Certificates expire and must be renewed (automated by Let's Encrypt and ACME). An expired certificate is a common cause of outages.",
    tryIt:
      "Run openssl s_client -connect example.com:443 -servername example.com and read the certificate chain and the TLS version.",
    buildsOn: "Main week 7: HTTP message anatomy",
  },
};
