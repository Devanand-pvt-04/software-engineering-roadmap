import type { ExplainMap } from "./types";

// Ground-up explainers for Java + DSA Part E, second half (J30-J35: DP II and III, intervals and math, strings, concurrency, practice). Keys: J<week>:<Must know topic index>.
export const EXPLAIN_JAVA_PART_E2: ExplainMap = {
  // ---- Week 30: Dynamic programming II: 2D, grids, strings, knapsack ----
  "J30:0": {
    why: "Grid problems are the gentlest step from 1D to 2D DP, and they appear in robot paths, games and image processing.",
    problem:
      "Counting or optimising paths through a grid by trying every route is exponential.",
    how: "Let dp[r][c] describe the best (or the count) for reaching cell (r, c). It depends only on the cells you could have come from, usually above and to the left.",
    tech: [
      "Unique paths (moving right or down): dp[r][c] = dp[r - 1][c] + dp[r][c - 1], with the first row and column all 1.",
      "Minimum path sum: dp[r][c] = grid[r][c] + min(dp[r - 1][c], dp[r][c - 1]).",
      "Obstacles: dp = 0 on blocked cells.",
      "Fill row by row, left to right, so dependencies are ready (Java week 29: Order of computation).",
      "O(rows × cols) time and space.",
    ],
    cost: "Allowed moves in all four directions create cycles, which breaks simple grid DP; that needs BFS or Dijkstra's instead.",
    tryIt:
      "Solve unique paths with obstacles and minimum path sum, printing the filled tables for a 4×4 grid.",
    buildsOn: "Java week 29: The method",
  },
  "J30:1": {
    why: "Comparing two sequences powers diff tools, spell checkers, DNA alignment and plagiarism detection.",
    problem:
      "Comparing all pairs of subsequences of two strings is exponential.",
    how: "Let dp[i][j] describe the answer for the first i characters of one string and the first j of the other, and decide based on whether the current characters match.",
    tech: [
      "Longest common subsequence (LCS): if a[i-1] == b[j-1], dp[i][j] = dp[i-1][j-1] + 1; else max(dp[i-1][j], dp[i][j-1]).",
      "Edit distance: if the characters match, dp[i-1][j-1]; else 1 + min(insert dp[i][j-1], delete dp[i-1][j], replace dp[i-1][j-1]).",
      "Longest common substring: dp[i][j] = dp[i-1][j-1] + 1 on a match, else 0; take the maximum anywhere.",
      "Row 0 and column 0 represent empty prefixes; padding the table by one avoids special cases.",
      "O(n × m) time and space.",
    ],
    cost: "Quadratic memory gets large for long sequences (two 10⁵-character strings need 10¹⁰ cells), so real tools use smarter algorithms.",
    tryIt:
      "Fill the edit distance table for 'horse' → 'ros' by hand, then check it with code and reconstruct the edits.",
    buildsOn: "Java week 29: The method",
  },
  "J30:2": {
    why: "The knapsack family covers any problem that chooses items under a capacity limit: budgets, subsets with a target sum, resource allocation.",
    problem:
      "Each item can be taken or not, so there are 2ⁿ combinations to check.",
    how: "Let dp[i][w] describe the best result using the first i items within capacity w. For each item, take the better of skipping it or taking it (if it fits).",
    tech: [
      "0/1 knapsack: dp[i][w] = max(dp[i-1][w], dp[i-1][w - wt[i]] + val[i]).",
      "Subset sum: dp[i][s] is true if some subset of the first i items sums to s.",
      "Partition equal subset sum: subset sum with target total / 2.",
      "Target sum (assign + or − to each number): becomes a subset-sum count.",
      "Unbounded knapsack and coin change II (counting ways): each item can be reused, so dp[i][w] reads dp[i][w - wt[i]] instead of dp[i-1][...].",
      "O(n × W) time, which is pseudo-polynomial: it grows with the capacity's value.",
    ],
    cost: "Large capacities (10⁹) make the table impossible; then you need other approaches such as meet-in-the-middle.",
    tryIt:
      "Solve 0/1 knapsack and partition equal subset sum, then coin change II, and compare where the recurrences differ.",
    buildsOn: "Java week 28: Greedy vs DP",
  },
  "J30:3": {
    why: "Filling a DP table by hand is the most reliable way to understand and debug a 2D DP.",
    problem:
      "Bugs in 2D DP hide in indexes and base cases, and reading code alone rarely reveals them.",
    how: "Draw the table with labelled rows and columns, fill the base cases, then fill each cell using the recurrence, checking which neighbouring cells it reads.",
    tech: [
      "Label rows and columns with the actual input values (characters, items, capacities), including the empty row and column.",
      "Fill base cases first, then the rest in your loop order.",
      "Arrows from each cell to the cells it reads show the dependency direction.",
      "Compare with your program's printed table to find the first wrong cell.",
      "Following the arrows back from the answer reconstructs the solution.",
    ],
    cost: "Hand-filling is slow, so use tiny inputs (3 to 5 elements).",
    tryIt:
      "Fill the LCS table for 'ABCBDAB' and 'BDCABA' by hand, then trace back one longest common subsequence.",
    buildsOn: "Java week 30: Two-sequence DP",
  },
  "J30:4": {
    why: "2D DP tables can be too large for memory, but most recurrences only read the previous row.",
    problem: "A 10⁴ × 10⁵ table needs 10⁹ cells, far too much memory.",
    how: "Keep only two rows (previous and current), or just one row updated in place, with the loop direction chosen so values aren't overwritten before they're read.",
    tech: [
      "Two rows: prev and cur arrays, swapped after each row.",
      "One row for 0/1 knapsack: loop w from high to low, so dp[w - wt] still holds the previous item's value.",
      "One row for unbounded knapsack: loop w from low to high, so dp[w - wt] already includes this item (allowing reuse).",
      "LCS and edit distance need the diagonal value too; save it in a temporary variable before overwriting.",
      "Memory drops from O(n × W) to O(W).",
    ],
    cost: "You can no longer reconstruct the chosen items from the table, and the direction rule is easy to get backwards.",
    tryIt:
      "Convert your 0/1 knapsack to one row, then deliberately loop in the wrong direction and see it behave like unbounded knapsack.",
    buildsOn: "Java week 29: Space optimization",
  },

  // ---- Week 31: Dynamic programming III: intervals, trees, bitmasks, states ----
  "J31:0": {
    why: "Some problems are about ranges of a sequence, where the best way to handle a range depends on how you split it.",
    problem:
      "Trying every order of merging, splitting or removing elements of a sequence is exponential.",
    how: "Let dp[i][j] be the best answer for the range i..j, and try every split point k inside it, combining dp[i][k] and dp[k+1][j] with the cost of the split.",
    tech: [
      "Loop by range length from short to long, so the sub-ranges are ready (Java week 29: Order of computation).",
      "Matrix chain multiplication: dp[i][j] = min over k of dp[i][k] + dp[k+1][j] + the cost of multiplying the two results.",
      "Burst balloons: think of k as the last balloon burst in (i, j), which makes the subproblems independent.",
      "Palindrome partitioning: precompute isPalindrome[i][j], then find the minimum cuts.",
      "Usually O(n³) time and O(n²) space.",
    ],
    cost: "Cubic time limits n to a few hundred, and choosing what k means (first split or last action) is the tricky creative step.",
    tryIt:
      "Solve matrix chain multiplication for 4 matrices by hand and in code, then solve burst balloons.",
    buildsOn: "Java week 30: Drawing the DP table",
  },
  "J31:1": {
    why: "Trees have natural subproblems, the subtrees, so DP on trees follows the recursive patterns you already know.",
    problem:
      "Choices at one node affect its neighbours (you can't rob a house and its direct child), so a single return value isn't enough.",
    how: "Do a post-order traversal where each node returns several values for different situations, such as 'best if this node is chosen' and 'best if it isn't', and combine its children's values.",
    tech: [
      "House robber III: return {rob, skip}; rob = val + left.skip + right.skip; skip = max(left) + max(right).",
      "Diameter: return the height, and update a global best with left height + right height (Java week 21: Patterns).",
      "Maximum path sum: return the best downward path (ignoring negative branches), and update the best path through the node.",
      "Return small records or int arrays for multiple values.",
      "O(n) time, O(height) stack.",
    ],
    cost: "Defining exactly what each return value means is essential; mixing 'path through' and 'path down' is the most common bug.",
    tryIt:
      "Solve house robber III and binary tree maximum path sum, writing what each returned value means as a comment.",
    buildsOn: "Java week 21: Patterns",
  },
  "J31:2": {
    why: "Some problems have a 'mode' that changes what you're allowed to do next, like holding a stock or being in a cooldown.",
    problem:
      "A plain dp[i] can't capture whether you currently hold a stock, so the recurrence can't tell which actions are allowed.",
    how: "Add the mode as a state dimension and write a transition for each mode change, as in a state machine.",
    tech: [
      "States per day: holding, not holding, and cooldown when required.",
      "hold[i] = max(hold[i-1], notHold[i-1] - price[i]); notHold[i] = max(notHold[i-1], hold[i-1] + price[i] - fee).",
      "Cooldown: selling moves you into a cooldown state that must pass before buying again.",
      "At most k transactions: add the number of transactions used as another dimension.",
      "Draw the state diagram first, with arrows for buy, sell and rest.",
    ],
    cost: "The number of states grows with each rule, and it's easy to allow an illegal transition.",
    tryIt:
      "Draw the state diagram for 'stock with cooldown', then write the DP directly from the diagram.",
    buildsOn: "Java week 29: Define the state",
  },
  "J31:3": {
    why: "When a problem's state includes 'which items have been used' and there are only up to about 20 items, a bitmask can represent that set.",
    problem:
      "Tracking which cities have been visited with a list or set as part of the DP state is slow and can't index an array.",
    how: "Represent the set as an integer whose bit i says whether item i is included, and use it as an array index in the DP.",
    tech: [
      "mask in 0..2ⁿ - 1; (mask >> i) & 1 tests membership; mask | (1 << i) adds item i (Java week 14: Bit manipulation).",
      "Travelling salesman: dp[mask][last] = the shortest path visiting exactly the cities in mask and ending at last.",
      "Transition: for each city not in mask, dp[mask | (1 << next)][next] = min(..., dp[mask][last] + dist[last][next]).",
      "O(2ⁿ × n²) time, feasible for n up to about 20.",
      "Also used for assignment problems and covering subsets.",
    ],
    cost: "Exponential in n, so it's only for small sets, and 2ⁿ × n states can use a lot of memory.",
    tryIt:
      "Solve travelling salesman for 10 random cities with bitmask DP, and check it against brute force over all permutations.",
    buildsOn: "Java week 14: Bit manipulation",
  },
  "J31:4": {
    why: "Many hard string problems (palindromes, word segmentation, pattern matching) yield to DP over positions in the strings.",
    problem: "Trying every way to split or match a string is exponential.",
    how: "Define the state over positions (prefixes, or substrings i..j), and use character comparisons to move between states.",
    tech: [
      "Palindromic substrings: isPal[i][j] = s[i] == s[j] && isPal[i+1][j-1]; or expand around each centre.",
      "Word break: dp[i] = true if some dictionary word ends at i and dp[i - word length] is true.",
      "Regular expression matching (. and *): dp[i][j] = whether s[0..i) matches p[0..j); * means zero copies (dp[i][j-2]) or one more copy.",
      "Wildcard matching (? and *): similar, with * matching any sequence.",
      "These are two-sequence DPs with special rules (Java week 30: Two-sequence DP).",
    ],
    cost: "Pattern-matching recurrences have many cases and are notoriously error-prone; test edge cases such as empty strings and patterns.",
    tryIt:
      "Solve word break and regular expression matching, and test the regex solution on 20 tricky cases including empty strings.",
    buildsOn: "Java week 30: Two-sequence DP",
  },
  "J31:5": {
    why: "After three weeks of DP, a written checklist helps you recognise families quickly and keeps the method consistent.",
    problem:
      "Without notes, DP patterns blur together and you start each new problem from scratch.",
    how: "Keep one patterns note: for each family, its signals, its state definition, its recurrence shape and its complexity, with one example problem.",
    tech: [
      "1D: Fibonacci-style, take or skip, LIS.",
      "Grid and two-sequence: paths, LCS, edit distance.",
      "Knapsack: 0/1 versus unbounded, and the loop direction for one-row versions.",
      "Interval, tree, state machine and bitmask DP.",
      "For each: the signals in the problem statement, the state in one sentence, and the recurrence.",
      "Review the note before mock interviews (Java week 35).",
    ],
    cost: "Writing and maintaining the note takes time, but it pays off before every interview.",
    tryIt:
      "Write your DP patterns note with at least 8 families, then classify 5 new problems using only the note.",
    buildsOn: "Java week 29: 1D patterns",
  },

  // ---- Week 32: Intervals, sweep line and math ----
  "J32:0": {
    why: "Calendars, bookings and resource allocation are all about intervals of time. Interval problems are interview staples.",
    problem: "Comparing every pair of intervals for overlaps is O(n²).",
    how: "Sort intervals by start time, then walk through them once, comparing each with the last one kept; or keep a heap of end times to count how many overlap.",
    tech: [
      "Merge intervals: sort by start; if the next starts before the current ends, extend the current end; otherwise start a new interval.",
      "Insert interval: add the ones before it, merge the overlapping ones, then add the rest.",
      "Intersection of two sorted lists: two pointers, advancing the one that ends first (Java week 12: Two pointers).",
      "Meeting rooms: sort by start and keep a min-heap of end times; the heap's largest size is the number of rooms needed (Java week 23: Patterns).",
      "Decide whether touching intervals ([1, 2] and [2, 3]) count as overlapping.",
    ],
    cost: "Sorting costs O(n log n), and the boundary convention (open or closed ends) causes off-by-one bugs.",
    tryIt:
      "Solve merge intervals, insert interval and meeting rooms II, testing touching intervals explicitly.",
    buildsOn: "Java week 19: Sorting objects with Comparator",
  },
  "J32:1": {
    why: "Sweep line turns many overlap and 'at the same time' questions into a single pass over sorted events.",
    problem:
      "Asking 'how many intervals cover each moment' by checking every interval at every moment is far too slow.",
    how: "Turn each interval into two events, +1 at its start and -1 at its end, sort all events by time, and sweep through them keeping a running count.",
    tech: [
      "Events: (start, +1) and (end, -1).",
      "Sort by time; on ties, process ends before starts if touching intervals don't overlap.",
      "The running sum is the number of active intervals; its maximum is the maximum overlap.",
      "O(n log n) for sorting, then O(n).",
      "Same idea as difference arrays, for when times are large or not integers (Java week 14: Difference arrays).",
    ],
    cost: "Tie-breaking rules must match the problem's definition of overlap, or answers are off by one.",
    tryIt:
      "Find the maximum number of people in a building from entry and exit times with a sweep line, and check tie handling.",
    buildsOn: "Java week 14: Difference arrays",
  },
  "J32:2": {
    why: "Number theory shows up in hashing, cryptography, scheduling and many interview problems that ask for answers 'modulo 10⁹ + 7'.",
    problem:
      "Naive approaches overflow 64-bit integers, check primes slowly, or compute huge powers by repeated multiplication.",
    how: "Use a few classic algorithms: Euclid's for the greatest common divisor, the sieve for primes, modular arithmetic for large results, and fast exponentiation by squaring.",
    tech: [
      "GCD (Euclid): gcd(a, b) = gcd(b, a % b), O(log min(a, b)); LCM = a / gcd(a, b) * b (divide first to avoid overflow).",
      "Primes: trial division up to √n for one number; the Sieve of Eratosthenes finds all primes up to n in O(n log log n).",
      "Modular arithmetic: (a + b) % m and (a × b) % m keep numbers small; use long so a × b doesn't overflow before the %.",
      "Negative remainders: Java's % can be negative; use Math.floorMod.",
      "Fast exponentiation: square the base and halve the exponent each step, O(log n): pow(a, n) mod m.",
    ],
    cost: "Overflow bugs are silent in Java, and for very large values you need BigInteger, which is slow.",
    tryIt:
      "Compute 2^(10^18) mod (10^9 + 7) with fast exponentiation, and count primes below 10^7 with a sieve.",
    buildsOn: "Java week 1: Type conversion",
  },
  "J32:3": {
    why: "Counting arrangements and selections comes up in probability, combinatorial problems and checking DP answers.",
    problem:
      "Factorials overflow quickly (21! doesn't fit in a long), and counting by listing everything is impossible for large n.",
    how: "Use formulas for permutations and combinations, compute them with Pascal's triangle or modular arithmetic, and keep numbers in range.",
    tech: [
      "Permutations of n items: n!. Choosing k in order: n! / (n - k)!.",
      "Combinations: C(n, k) = n! / (k! (n - k)!).",
      "Pascal's triangle: C(n, k) = C(n-1, k-1) + C(n-1, k), a tiny DP that avoids big factorials.",
      "nCr mod p for a prime p: precompute factorials and inverse factorials mod p (using Fermat's little theorem: inverse of a = a^(p-2) mod p).",
      "Many 'count the paths' problems reduce to a combination: a grid path of r downs and c rights is C(r + c, r).",
    ],
    cost: "Modular inverses only exist for primes (or numbers coprime with the modulus), so these tricks need care.",
    tryIt:
      "Compute unique grid paths with C(r + c, r) and with grid DP, and check they agree; then compute C(10^6, 5 × 10^5) mod 10^9 + 7.",
    buildsOn: "Java week 32: Number theory",
  },
  "J32:4": {
    why: "Randomness is used in load balancing, sampling, testing and games. Getting it subtly wrong creates bias that's hard to notice.",
    problem:
      "Picking a random item from a stream of unknown length can't be done by storing everything, and naive shuffles produce biased orders.",
    how: "Reservoir sampling picks uniformly from a stream in one pass with constant memory; the Fisher-Yates shuffle produces every permutation with equal probability.",
    tech: [
      "Probability basics: independent events multiply; expected value is the probability-weighted average.",
      "Reservoir sampling (one item): keep the i-th item with probability 1/i; every item ends up chosen with probability 1/n.",
      "For k items, keep the first k, then replace a random slot with probability k/i.",
      "Fisher-Yates: for i from n - 1 down to 1, swap a[i] with a[random index in 0..i].",
      "Swapping with any random index in 0..n-1 is a classic biased shuffle.",
      "Use ThreadLocalRandom or a seeded Random for reproducible tests (Java week 39: Designing for testability).",
    ],
    cost: "Bias is invisible without statistical testing, and java.util.Random isn't suitable for security; use SecureRandom.",
    tryIt:
      "Shuffle [1, 2, 3] a million times with Fisher-Yates and with the biased version, and count how often each of the 6 orders appears.",
    buildsOn: "Java week 32: Combinatorics",
  },
  "J32:5": {
    why: "Basic geometry appears in maps, games, graphics and some interview problems.",
    problem:
      "Floating-point calculations with angles and slopes are imprecise, and division by zero lurks in vertical lines.",
    how: "Use distance formulas and the cross product, which work with integers and avoid division, to answer questions such as which way three points turn.",
    tech: [
      "Distance: √((x2 - x1)² + (y2 - y1)²); compare squared distances to avoid sqrt.",
      "Cross product of AB and AC: (Bx - Ax)(Cy - Ay) - (By - Ay)(Cx - Ax).",
      "Positive means a counterclockwise turn, negative clockwise, zero collinear.",
      "Orientation tests decide whether segments intersect and build convex hulls.",
      "Use long arithmetic for integer coordinates; use an epsilon when comparing doubles.",
    ],
    cost: "Geometry has many edge cases (collinear points, duplicates, overflow), which makes it error-prone in interviews.",
    tryIt:
      "Write an orientation function and use it to check whether two line segments intersect, including touching and collinear cases.",
    buildsOn: "Java week 32: Number theory",
  },

  // ---- Week 33: String algorithms and system-style data structures ----
  "J33:0": {
    why: "Finding a pattern in text is everywhere: search, editors, grep, DNA analysis. The naive method shows why smarter ones exist.",
    problem:
      "Checking the pattern at every position of the text can repeat work: on 'aaaa...ab' it compares almost the whole pattern at every position.",
    how: "Naive matching tries each starting position and compares character by character until a mismatch.",
    tech: [
      "For each i in 0..n-m, compare text[i..i+m) with the pattern.",
      "Worst case O(n·m), for example text 'aaaa...a' and pattern 'aaa...ab'.",
      "On typical text it's fast, since mismatches happen early.",
      "Java's String.indexOf uses a simple, highly optimised approach that's fine for everyday use.",
      "The waste: after a mismatch, it forgets what it already learned about the text.",
    ],
    cost: "Quadratic worst cases make it unsafe for adversarial input or very long patterns.",
    tryIt:
      "Time naive matching on a 10⁶-character string of 'a's with a pattern of 1,000 'a's followed by 'b'.",
    buildsOn: "Java week 12: String manipulation in Java",
  },
  "J33:1": {
    why: "KMP guarantees linear-time matching by never re-examining text characters it has already matched.",
    problem:
      "After a mismatch, naive matching moves one step and starts comparing from scratch, throwing away what it learned.",
    how: "Precompute, for each prefix of the pattern, the length of its longest proper prefix that's also a suffix (the LPS array). After a mismatch, jump within the pattern using it instead of restarting.",
    tech: [
      "lps[i] = length of the longest proper prefix of pattern[0..i] that's also its suffix.",
      "For 'ababc', lps is [0, 0, 1, 2, 0].",
      "On a mismatch after matching j characters, set j = lps[j - 1] and keep the text position.",
      "The text pointer never moves backwards, so matching is O(n) and building lps is O(m): O(n + m) total.",
      "The LPS idea also finds the shortest repeating unit of a string.",
    ],
    cost: "Building the LPS array correctly is subtle, and for typical text the simpler methods are just as fast.",
    tryIt:
      "Compute the LPS array of 'aabaaab' by hand, then implement KMP and count character comparisons against the naive method on the worst case.",
    buildsOn: "Java week 33: Naive string matching",
  },
  "J33:2": {
    why: "Hashing lets you compare substrings as numbers. A rolling hash updates in O(1) as a window slides, which powers matching and deduplication.",
    problem:
      "Hashing every window of length m from scratch costs O(m) each time, which is no better than comparing characters.",
    how: "Treat a string as a number in some base, modulo a large prime. When the window slides, subtract the leaving character's contribution, multiply by the base, and add the new character.",
    tech: [
      "hash = (c₀·B^(m-1) + c₁·B^(m-2) + ... + c_(m-1)) mod M.",
      "Slide: hash = ((hash - c_out · B^(m-1)) · B + c_in) mod M, in O(1) (Java week 32: Number theory).",
      "Rabin-Karp: compare the window's hash with the pattern's; on a match, verify the characters, since collisions are possible.",
      "Expected O(n + m); also finds many patterns at once.",
      "Used for plagiarism detection, file deduplication and content-defined chunking (Main week 51: File storage and sync).",
    ],
    cost: "Hash collisions need verification, and a fixed base and modulus can be attacked with crafted inputs; random bases help.",
    tryIt:
      "Find all repeated 10-letter sequences in a long DNA string with a rolling hash.",
    buildsOn: "Java week 13: Hash functions",
  },
  "J33:3": {
    why: "The Z-algorithm is another linear-time matching method, and its array answers many 'how much does this match the start?' questions.",
    problem:
      "Finding, for every position, how long the substring starting there matches the start of the string takes O(n²) naively.",
    how: "Compute Z[i], the length of the longest substring starting at i that matches a prefix of the string, reusing earlier results through a window of the furthest match found so far.",
    tech: [
      "Z[i] = the longest common prefix of s and s[i..].",
      "Keep [l, r], the rightmost segment known to match a prefix; inside it, Z[i] starts from Z[i - l].",
      "Extend by direct comparison only beyond r, so it's O(n) total.",
      "Pattern matching: compute Z of pattern + '$' + text; a value equal to the pattern length marks a match.",
      "It solves the same problems as KMP's LPS array and some find it easier to reason about.",
    ],
    cost: "Like KMP, it's easy to get subtly wrong, and in practice String.indexOf is usually enough.",
    tryIt:
      "Compute the Z array of 'aabcaabxaaz' by hand, then use 'pattern$text' to find matches in code.",
    buildsOn: "Java week 33: KMP",
  },
  "J33:4": {
    why: "Interviews often ask you to build small data structures that systems really use. They combine several basic structures behind a clean interface.",
    problem:
      "No single built-in structure gives O(1) access by key and O(1) ordering by recency or frequency, or spreads keys across servers that come and go.",
    how: "Combine structures: a hash map for lookup plus a linked list or other structure for order, a sorted map for a hash ring, a per-key token counter for rate limiting.",
    tech: [
      "LRU cache: HashMap<key, node> plus a doubly linked list ordered by recency; get and put move nodes to the front in O(1); LinkedHashMap with removeEldestEntry is the shortcut (Java week 13: HashSet and LinkedHashMap).",
      "LFU cache: maps from key to frequency and from frequency to a linked set of keys, tracking the minimum frequency for O(1) eviction.",
      "Consistent hashing ring: a TreeMap from hash to server, with many virtual nodes per server for balance; ceilingKey finds a key's server (Main week 33: Partitioning).",
      "Token bucket rate limiter: per key, tokens and last-refill time, refilled lazily on each request (Main week 35: Classic building blocks).",
      "Time-based key-value store: a map from key to a TreeMap of timestamp to value; floorEntry answers 'value at time t'.",
    ],
    cost: "These designs need careful synchronisation to be thread-safe, and in-memory versions don't survive restarts or span servers.",
    tryIt:
      "Implement an LRU cache with your own doubly linked list and a consistent hashing ring with virtual nodes, and measure how many keys move when a server is added.",
    buildsOn: "Java week 39: An in-memory rate limiter and an LRU cache",
  },

  // ---- Week 34: Concurrency in Java ----
  "J34:0": {
    why: "Modern machines have many cores, and servers handle many requests at once. Threads let one Java program do several things at the same time.",
    problem:
      "A single-threaded program uses one core and waits idly during slow I/O, while other work could be done.",
    how: "Create threads that run code concurrently, coordinate them with join, and stop them cooperatively with interruption.",
    tech: [
      "new Thread(runnable).start() runs the Runnable on a new thread; calling run() directly doesn't.",
      "Lifecycle: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED.",
      "join() waits for a thread to finish; Thread.sleep(ms) pauses the current one.",
      "Interruption is a polite request: thread.interrupt() sets a flag, and blocking methods throw InterruptedException; the thread decides how to stop.",
      "Threads share the heap but each has its own stack (Main week 2: Threads).",
      "In practice, use executors rather than creating threads by hand (Java week 34: java.util.concurrent).",
    ],
    cost: "Threads cost memory and scheduling time, and shared data between them causes the bugs in the rest of this week.",
    tryIt:
      "Start 4 threads that each print their name 5 times, join them all, then interrupt a sleeping thread and handle the exception.",
    buildsOn: "Main week 2: Threads",
  },
  "J34:1": {
    why: "When threads share data, updates can collide and get lost. This is the most common concurrency bug.",
    problem:
      "count++ is really read, add and write; two threads can read the same value, both add one, and write the same result, losing an increment.",
    how: "Make each read-modify-write happen as one indivisible step by holding a lock: synchronized gives each object a built-in lock that only one thread can hold at a time.",
    tech: [
      "Race condition: the result depends on the timing of threads.",
      "synchronized void inc() { count++; } or synchronized (lock) { ... } lets one thread at a time in.",
      "Intrinsic locks are reentrant: a thread already holding a lock can enter other synchronized code on the same lock.",
      "Every access to shared mutable state must use the same lock, reads included.",
      "Keep critical sections short to limit waiting.",
    ],
    cost: "Locks make threads wait, reducing parallelism, and forgetting one access leaves the race in place.",
    tryIt:
      "Increment a shared counter 1,000,000 times from each of 4 threads without synchronisation, print the total, then fix it with synchronized and AtomicInteger.",
    buildsOn: "Java week 34: Threads in Java",
  },
  "J34:2": {
    why: "Even without lost updates, one thread may simply never see another thread's write. The Java Memory Model defines when writes become visible.",
    problem:
      "CPUs cache values and the compiler reorders instructions, so a loop waiting for a flag set by another thread may spin forever.",
    how: "The Java Memory Model defines happens-before relationships. If a write happens-before a read, the read sees it. Locks, volatile, thread start and join create these relationships.",
    tech: [
      "Visibility: without synchronisation, a thread may keep reading a stale cached value.",
      "Happens-before: unlocking a lock happens-before a later lock of it; Thread.start happens-before the thread's actions; a thread's actions happen-before another thread's join on it returns.",
      "volatile: writes are visible to subsequent reads of that field, and reordering around it is limited.",
      "volatile doesn't make count++ atomic; use locks or atomics for read-modify-write.",
      "Immutable objects with final fields are safe to share once constructed.",
    ],
    cost: "Memory model bugs are rare, timing-dependent and nearly impossible to reproduce, so prefer high-level tools over clever low-level code.",
    tryIt:
      "Write a loop that spins until a non-volatile boolean flag is set by another thread, run it with the JIT warmed up, then make the flag volatile.",
    buildsOn: "Java week 34: Race conditions and synchronized",
  },
  "J34:3": {
    why: "Writing correct low-level thread code is hard. java.util.concurrent gives tested building blocks for the common needs.",
    problem:
      "Creating a thread per task, coordinating results by hand and writing your own locks and counters is slow and buggy.",
    how: "Submit tasks to thread pools, get results through futures, coordinate with latches and semaphores, and use atomic classes for simple shared counters.",
    tech: [
      "ExecutorService: Executors.newFixedThreadPool(n) runs tasks on a fixed set of threads; always shut it down (or use try-with-resources).",
      "Future<T> gets a task's result; CompletableFuture chains async steps (thenApply, thenCombine) and handles errors.",
      "ReentrantLock adds tryLock and timeouts; ReadWriteLock lets many readers or one writer in.",
      "CountDownLatch waits until N events happen; Semaphore limits how many threads use a resource at once.",
      "AtomicInteger and AtomicLong update without locks using compare-and-swap (CAS): set the new value only if the current value is still what you read, otherwise retry.",
    ],
    cost: "Each tool has its own rules, pools must be sized and shut down, and CompletableFuture chains can be hard to debug.",
    tryIt:
      "Download 20 URLs (or simulate it with sleeps) using a fixed thread pool and CompletableFuture.allOf, and limit concurrency to 5 with a Semaphore.",
    buildsOn: "Java week 34: Race conditions and synchronized",
  },
  "J34:4": {
    why: "Shared collections are at the centre of most concurrent programs. Ordinary ones break, and wrapping everything in one lock is slow.",
    problem:
      "HashMap can corrupt itself under concurrent writes, and Collections.synchronizedMap makes every thread wait on one lock.",
    how: "Use collections designed for concurrency, which lock finely or not at all, and use blocking queues to hand work between threads.",
    tech: [
      "ConcurrentHashMap: reads take no lock; writes lock only one bucket (using CAS for empty bins), so threads rarely block each other.",
      "Use its atomic methods (merge, compute, putIfAbsent) instead of get-then-put.",
      "CopyOnWriteArrayList copies the array on every write, ideal for rarely changed lists that are read often, such as listeners.",
      "BlockingQueue (ArrayBlockingQueue, LinkedBlockingQueue): put blocks when full, take blocks when empty.",
      "Producer-consumer: producers put work into a bounded BlockingQueue and consumers take it, with natural backpressure (Main week 20: Messaging).",
    ],
    cost: "Compound operations across several calls still need care, and iterators may not reflect the latest changes.",
    tryIt:
      "Count word frequencies from 4 threads with ConcurrentHashMap.merge, then build a producer-consumer pipeline with a bounded queue of size 10.",
    buildsOn: "Java week 34: java.util.concurrent",
  },
  "J34:5": {
    why: "Locks fix races but bring new failures where threads stop making progress.",
    problem:
      "Two threads each holding one lock and waiting for the other's freeze forever, and the program just hangs.",
    how: "Recognise the three kinds of progress failure, and prevent deadlock by always taking locks in the same global order, or by using timeouts.",
    tech: [
      "Deadlock: threads wait on each other in a cycle, forever.",
      "Four conditions are all needed: mutual exclusion, hold and wait, no preemption, circular wait. Break any one to prevent it.",
      "Lock ordering: always lock accounts by increasing id, so no cycle can form.",
      "tryLock with a timeout lets a thread back off instead of waiting forever.",
      "Livelock: threads keep reacting to each other and never progress; starvation: a thread never gets a turn.",
      "A thread dump (jstack, or IntelliJ's debugger) shows deadlocked threads and the locks they hold.",
    ],
    cost: "Global lock ordering is hard to enforce in large codebases, and timeouts add retry logic.",
    tryIt:
      "Write two threads transferring between two accounts in opposite directions until they deadlock, capture a thread dump, then fix it with lock ordering.",
    buildsOn: "Java week 34: Race conditions and synchronized",
  },
  "J34:6": {
    why: "Java now has three ways to handle many concurrent tasks on a server. Knowing how they differ helps you choose and explain.",
    problem:
      "Platform threads are expensive, so a thread-per-request server is limited, while event loops require async code that's harder to write and debug.",
    how: "Virtual threads keep the simple thread-per-request style but make each thread cheap: the JVM runs millions of them on a few OS threads, unmounting them while they wait.",
    tech: [
      "Platform thread: wraps one OS thread, with a large stack; thousands at most.",
      "Virtual thread: managed by the JVM, small stack on the heap; millions are fine. Thread.ofVirtual().start(...) or Executors.newVirtualThreadPerTaskExecutor().",
      "When a virtual thread blocks on I/O, the JVM unmounts it and its carrier thread runs another.",
      "Node's event loop: one thread, non-blocking I/O and callbacks or async/await (Main week 15: libuv's event loop).",
      "Virtual threads help I/O-bound work, not CPU-bound work, and don't need pooling; limit concurrency with semaphores instead.",
      "Spring Boot can switch to them with one property (Java week 42: Virtual threads).",
    ],
    cost: "Some libraries still pin virtual threads or rely on ThreadLocal heavily, and unlimited concurrency can overload databases and other services.",
    tryIt:
      "Run 10,000 tasks that each sleep 1 second with a fixed pool of 100 platform threads and with virtual threads, and compare total time.",
    buildsOn: "Main week 15: libuv's event loop",
  },

  // ---- Week 35: Mixed practice and mock interviews ----
  "J35:0": {
    why: "Coding interviews assess how you solve problems, not just whether you get the answer. A consistent process shows your thinking and avoids common mistakes.",
    problem:
      "Candidates jump into code, misunderstand the problem, get stuck on an optimal solution, and run out of time with nothing working.",
    how: "Follow the same steps every time: clarify the problem, work through examples, state a brute force, optimise, code, test and state the complexity.",
    tech: [
      "Clarify: input sizes, value ranges, duplicates, empty input, expected output format.",
      "Examples: work a normal case and an edge case by hand.",
      "Brute force: say it out loud with its complexity, even if it's slow.",
      "Optimise: use the constraints and patterns (Java week 10: Input-size intuition) to find a better approach.",
      "Code cleanly with good names, then test by tracing your examples and edge cases, and state time and space complexity.",
    ],
    cost: "Following every step takes time, so practise until it becomes quick and natural.",
    tryIt:
      "Solve 3 medium problems out loud following all seven steps, and time each step.",
    buildsOn: "Java week 10: Input-size intuition",
  },
  "J35:1": {
    why: "Interviewers can only assess what they hear. Silent problem-solving, even when it's correct, scores poorly.",
    problem:
      "Under pressure, people go quiet while thinking, and they ignore or misunderstand hints meant to help them.",
    how: "Narrate your reasoning as you go, including dead ends, and treat hints as information about the direction the interviewer wants.",
    tech: [
      "Say what you're considering and why: 'the array is sorted, so I'm thinking two pointers or binary search'.",
      "Mention trade-offs before choosing.",
      "When stuck, say what you've tried and where it breaks.",
      "When given a hint, repeat it in your own words and connect it to the problem.",
      "Ask clarifying questions rather than assuming.",
    ],
    cost: "Talking while thinking feels unnatural and slows you down at first; it only gets easier with practice.",
    tryIt:
      "Record yourself solving a problem out loud, listen back, and note every silence longer than 30 seconds.",
    buildsOn: "Java week 35: The interview process",
  },
  "J35:2": {
    why: "Most interviews give about 45 minutes per medium problem. Managing that time is part of the test.",
    problem:
      "Spending 25 minutes searching for the optimal solution leaves no time to code or test, so you finish with nothing working.",
    how: "Budget time for each step, and if you're stuck on optimising, code the working solution you have and improve it afterwards.",
    tech: [
      "Rough budget: 5 minutes to clarify and work examples, 10 to find the approach, 20 to code, 5 to 10 to test and discuss.",
      "Watch the clock at each step boundary.",
      "A clean, correct, slower solution usually beats an unfinished optimal one.",
      "Leave time to test with edge cases; it's where many bugs are caught.",
      "In practice sessions, stop at 45 minutes and review, rather than finishing at any cost.",
    ],
    cost: "Strict timeboxing can feel stressful at first, but it's the same pressure you'll face in the real interview.",
    tryIt:
      "Do 5 timed 45-minute problems this week, logging how long each step took, and adjust your budget.",
    buildsOn: "Java week 35: The interview process",
  },
};
