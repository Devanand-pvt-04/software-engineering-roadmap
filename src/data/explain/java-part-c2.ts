import type { ExplainMap } from "./types";

// Ground-up explainers for Java + DSA Part C, second half (J17-J23: recursion to heaps). Keys: J<week>:<Must know topic index>.
export const EXPLAIN_JAVA_PART_C2: ExplainMap = {
  // ---- Week 17: Recursion and backtracking ----
  "J17:0": {
    why: "Many problems are naturally defined in terms of smaller versions of themselves: trees, nested folders, sorting halves. Recursion expresses that directly.",
    problem:
      "Trying to trace every recursive call in your head is overwhelming, so beginners either avoid recursion or write functions that never stop.",
    how: "Define exactly what the function returns for an input (its contract), handle the smallest inputs directly (base case), and for bigger inputs trust that the recursive call on a smaller input already works.",
    tech: [
      "Contract: say what the function promises, such as 'sum(a, i) returns the sum of a[i..end]'.",
      "Base case: the smallest input, answered without recursion (i == a.length returns 0).",
      "Recursive case: solve a smaller input and combine: a[i] + sum(a, i + 1).",
      "Progress: every call must move toward the base case, or it recurses forever.",
      "The leap of faith: assume the smaller call honours the contract; don't trace it all the way down.",
    ],
    cost: "Recursion uses stack space for every pending call and adds call overhead compared with a loop.",
    tryIt:
      "Write recursive functions for the sum of an array, reversing a string and counting the files in a folder tree, writing each contract as a comment first.",
    buildsOn: "Java week 2: Recursion, first look",
  },
  "J17:1": {
    why: "Recursion works because of the call stack. Seeing it explains both how recursion returns answers and why deep recursion crashes.",
    problem:
      "Without picturing the stack, it's unclear where values are kept between calls and why a large input throws StackOverflowError.",
    how: "Each call pushes a frame holding its parameters and local variables. Frames pile up until a base case returns, then unwind in reverse order, each finishing its own work.",
    tech: [
      "factorial(3) pushes frames for 3, 2, 1 and 0; 0 returns 1, then each frame multiplies and returns (Java week 2: The call stack).",
      "Every pending call keeps its frame, so recursion depth n uses O(n) stack space (Java week 10: Space complexity).",
      "Each thread's stack has a fixed size (often about 512 KB to 1 MB, set with -Xss); thousands of frames can exceed it.",
      "Exceeding it throws StackOverflowError (Java week 9: OutOfMemoryError vs StackOverflowError).",
      "Deep linear recursion (such as walking a long list) is safer as a loop or with an explicit stack.",
    ],
    cost: "Stack overflow limits recursion depth in Java, and debugging deep recursion means reading long stack traces.",
    tryIt:
      "Draw the stack for fib(4) on paper, then find the depth at which a recursive count-down throws StackOverflowError on your machine.",
    buildsOn: "Java week 2: The call stack",
  },
  "J17:2": {
    why: "Recursive code can hide exponential cost. A recursion tree makes the total work visible.",
    problem:
      "Naive recursive Fibonacci looks short and harmless, but fib(50) takes minutes because the same values are computed billions of times.",
    how: "Draw each call as a node with its recursive calls as children, count the work at each level, and add up the levels.",
    tech: [
      "Total time = sum over all nodes of the work done in each call (excluding the recursive calls themselves).",
      "Two calls per level with constant work: 1 + 2 + 4 + ... ≈ 2ⁿ nodes, so naive Fibonacci is O(2ⁿ).",
      "Merge sort: 2 calls on half the input, O(n) merge work per level, log n levels, so O(n log n).",
      "Repeated subproblems in the tree are the signal that dynamic programming will help (Java week 29).",
      "The Master Theorem gives answers for common divide-and-conquer shapes (Java week 10: Analyzing recursion).",
    ],
    cost: "Drawing trees for irregular recursions is hard; for those, count calls with an instrumented version instead.",
    tryIt:
      "Count the calls made by naive fib(n) for n = 10, 20 and 30, and compare with 2ⁿ.",
    buildsOn: "Java week 10: Analyzing recursion",
  },
  "J17:3": {
    why: "Recursions have recognisable shapes, and the shape predicts both the cost and whether it can easily become a loop.",
    problem:
      "Treating all recursion the same leads to stack overflows where a loop was easy, and missed optimisations.",
    how: "Classify the recursion by how many recursive calls it makes and where they sit.",
    tech: [
      "Linear: one recursive call per invocation (sum of a list); depth n, often easy to turn into a loop.",
      "Tail recursion: the recursive call is the very last action, so nothing remains to do after it. Many languages reuse the frame; Java doesn't, so it still uses stack.",
      "Binary or tree recursion: two or more calls per invocation (Fibonacci, tree traversals, merge sort); can be exponential if subproblems overlap.",
      "Mutual recursion: functions call each other (isEven calls isOdd), common in parsers.",
      "Any recursion can be converted to a loop with an explicit stack.",
    ],
    cost: "Converting to loops can make code harder to read; keep recursion where depth is small and clarity matters.",
    tryIt:
      "Write factorial in plain and tail-recursive forms, then rewrite a recursive tree traversal using an explicit ArrayDeque stack.",
    buildsOn: "Java week 17: The call stack during recursion",
  },
  "J17:4": {
    why: "Many problems ask you to find every arrangement or choice that satisfies some rules: subsets, permutations, Sudoku, N-Queens. Backtracking explores them systematically.",
    problem:
      "Writing nested loops for every possible choice doesn't work when the number of choices varies, and generating everything before filtering wastes huge amounts of work.",
    how: "Build a solution one choice at a time: make a choice, recurse to explore what follows, then undo the choice and try the next. Stop exploring any branch that can't lead to a valid solution (pruning).",
    tech: [
      "Template: if goal reached, record the solution; for each valid choice: choose, backtrack(next), un-choose.",
      "State: the partial solution so far, usually one list or array that you modify and restore.",
      "Subsets: at each element, choose to include it or not, 2ⁿ results.",
      "Permutations: choose any unused element next, n! results; a boolean[] used tracks what's taken.",
      "Combinations: choose only from elements after the last one chosen, to avoid repeats.",
      "Pruning: reject a branch as soon as a constraint is broken (a Sudoku clash, a sum already too big).",
    ],
    cost: "Backtracking is still exponential in the worst case; pruning helps a lot in practice but doesn't change the worst-case bound.",
    tryIt:
      "Generate all subsets, permutations and size-k combinations of [1, 2, 3, 4] with one template, then solve 8-Queens and count the pruned branches.",
    buildsOn: "Java week 17: Thinking recursively",
  },

  // ---- Week 18: Sorting I ----
  "J18:0": {
    why: "Simple sorts are slow on big inputs, but they teach the core ideas of sorting, and one of them is genuinely used inside fast library sorts.",
    problem:
      "To understand why O(n log n) algorithms matter, and when a simple algorithm is actually the better choice, you need to see how the simple ones work.",
    how: "Each simple sort grows a sorted region one element at a time: by swapping neighbours, by picking the minimum, or by inserting each new element into place.",
    tech: [
      "Bubble sort: swap adjacent out-of-order pairs repeatedly, O(n²); mainly of teaching value.",
      "Selection sort: repeatedly select the minimum of the unsorted part and swap it in, O(n²) always, but few swaps.",
      "Insertion sort: take each element and shift larger ones right until it fits, O(n²) worst case.",
      "Insertion sort is O(n) on nearly sorted data and very fast on small arrays because of low overhead and good cache use.",
      "So library sorts switch to insertion sort for small pieces (Java week 19: What Java actually uses).",
    ],
    cost: "Quadratic time makes these unusable for large inputs: 10⁶ elements means about 10¹² steps.",
    tryIt:
      "Implement all three, count comparisons and swaps on random, sorted and reversed arrays of 1,000 elements, and explain the differences.",
    buildsOn: "Java week 10: Common classes",
  },
  "J18:1": {
    why: "Merge sort is a reliable O(n log n) sort and the clearest example of divide and conquer.",
    problem:
      "O(n²) sorts are far too slow for large inputs, and you need a sort whose performance never degrades on unlucky inputs.",
    how: "Split the array into halves, sort each half recursively, then merge the two sorted halves by repeatedly taking the smaller front element.",
    tech: [
      "Divide: split at the middle. Conquer: sort both halves recursively. Combine: merge.",
      "Merging two sorted arrays of total length n takes O(n) with two pointers.",
      "There are log n levels of splitting, each doing O(n) merge work, so O(n log n) in every case.",
      "It needs O(n) extra space for merging.",
      "Stable: equal elements keep their original order, if the merge takes from the left half on ties.",
      "Merge sort also works on linked lists and on data too big for memory (external sorting).",
    ],
    cost: "The O(n) extra memory and copying make it slower in practice than quicksort for arrays of primitives.",
    tryIt:
      "Implement merge sort, check it's stable by sorting records by one field and confirming ties keep their order, and time it against insertion sort for n = 10⁵.",
    buildsOn: "Java week 17: Recursion trees",
  },
  "J18:2": {
    why: "Quicksort is usually the fastest general-purpose sort in practice and the basis of Java's sort for primitive arrays.",
    problem:
      "Merge sort needs extra memory. You want an in-place sort with low overhead, as long as you can avoid its bad cases.",
    how: "Pick a pivot, rearrange the array so smaller elements are on its left and larger on its right (partitioning), then sort each side recursively.",
    tech: [
      "Lomuto partition: one index scans, another marks the end of the 'smaller' region; simple to write.",
      "Hoare partition: two indexes move toward each other and swap out-of-place pairs; fewer swaps.",
      "Average O(n log n), with a very fast inner loop and good cache behaviour; in place with O(log n) stack on average.",
      "Worst case O(n²) when the pivot is always the smallest or largest, as with a first-element pivot on sorted input.",
      "Choose a random pivot (or median of three) to make the worst case extremely unlikely.",
      "Not stable: partitioning can reorder equal elements.",
    ],
    cost: "Worst-case behaviour exists, many equal elements need three-way partitioning, and it's not stable.",
    tryIt:
      "Implement quicksort with a first-element pivot and with a random pivot, run both on an already sorted array of 10⁵ elements, and compare.",
    buildsOn: "Java week 18: Merge sort",
  },
  "J18:3": {
    why: "Real data is sorted by several keys, such as by department and then by name. Stability decides whether that works.",
    problem:
      "If you sort employees by name and then by department with an unstable sort, the names within each department can come out scrambled.",
    how: "A stable sort keeps equal elements in their original relative order, so sorting by a secondary key and then by the primary key gives correct multi-key ordering.",
    tech: [
      "Stable: merge sort, insertion sort, TimSort, counting sort.",
      "Not stable: quicksort, heap sort, selection sort.",
      "Sort by the secondary key first, then stable-sort by the primary key.",
      "Or sort once with a combined comparator: Comparator.comparing(Emp::dept).thenComparing(Emp::name) (Java week 7: Ordering).",
      "Java's sort for objects (Arrays.sort on Object[] and List.sort) is stable.",
    ],
    cost: "Stable sorts usually need extra memory or more work; for primitives, stability doesn't matter because equal values are identical.",
    tryIt:
      "Sort a list of people by city then name, first with two stable sorts and then with thenComparing, and check both give the same result.",
    buildsOn: "Java week 7: Ordering",
  },
  "J18:4": {
    why: "Knowing an algorithm's memory needs and the theoretical limit on sorting speed helps you choose, and tells you when you can beat the limit.",
    problem:
      "People try to find a comparison sort faster than O(n log n), or pick an algorithm that needs memory they don't have.",
    how: "Classify sorts by extra memory (in place or not), and learn the proof idea that any comparison-based sort needs Ω(n log n) comparisons in the worst case.",
    tech: [
      "In place: O(1) or O(log n) extra memory (quicksort, heap sort, insertion sort).",
      "Out of place: O(n) extra (merge sort, counting sort).",
      "A comparison sort must distinguish all n! possible orderings, and each comparison gives one yes or no answer.",
      "A decision tree with n! leaves needs height of at least log₂(n!) ≈ n log n, so Ω(n log n) comparisons.",
      "Non-comparison sorts escape this bound by using the values themselves (Java week 19: Non-comparison sorts).",
    ],
    cost: "Big-O hides constants: an O(n log n) sort with poor cache behaviour can lose to a simpler one on real inputs.",
    tryIt:
      "Compute log₂(n!) for n = 10, 100 and 1,000 and compare it with the comparisons counted by your merge sort.",
    buildsOn: "Java week 18: Merge sort",
  },

  // ---- Week 19: Sorting II and binary search ----
  "J19:0": {
    why: "When values are integers in a limited range, you can sort faster than any comparison sort.",
    problem:
      "Sorting 10 million ages (0 to 120) with an O(n log n) comparison sort does far more work than needed.",
    how: "Use the values themselves: count how many of each value there are, or distribute by digits or into buckets, without comparing elements to each other.",
    tech: [
      "Counting sort: count occurrences of each value in an array of size k, then write them out; O(n + k), stable if done carefully.",
      "Radix sort: sort by each digit from least to most significant using a stable counting sort; O(d × (n + base)) for d digits.",
      "Bucket sort: spread values uniformly into buckets, sort each small bucket; O(n) on average for evenly distributed data.",
      "They win when the range k or the number of digits d is small compared with n.",
    ],
    cost: "They need extra memory proportional to the range or the number of buckets, and only work on suitable keys (integers, fixed-length strings).",
    tryIt:
      "Sort 10 million random ages with counting sort and with Arrays.sort, and compare the times.",
    buildsOn: "Java week 18: In-place vs out-of-place",
  },
  "J19:1": {
    why: "You'll call Arrays.sort and List.sort far more often than you write a sort. Knowing what they do tells you their guarantees.",
    problem:
      "Without knowing the algorithms, you can't predict performance, stability or worst cases of library sorts.",
    how: "Java uses dual-pivot quicksort for arrays of primitives (where stability doesn't matter) and TimSort, a stable merge-based sort, for objects.",
    tech: [
      "Arrays.sort(int[]) uses dual-pivot quicksort: two pivots split the array into three parts, with insertion sort for tiny pieces.",
      "Arrays.sort(Object[]) and List.sort use TimSort: stable, O(n log n) worst case.",
      "TimSort finds already sorted runs in the data, extends short ones with insertion sort, and merges runs, so nearly sorted data sorts in close to O(n).",
      "Primitives don't need stability because equal ints are indistinguishable.",
      "Arrays.parallelSort splits large arrays across threads.",
    ],
    cost: "TimSort needs up to n/2 extra references of memory, and a comparator that breaks the ordering rules can throw IllegalArgumentException.",
    tryIt:
      "Time Arrays.sort on 10⁶ random Integers, the same data already sorted, and the same data with 10 random swaps, and explain the results.",
    buildsOn: "Java week 18: Merge sort",
  },
  "J19:2": {
    why: "Sorting is often the first step of a faster algorithm, and sorting your own objects needs a clear ordering.",
    problem:
      "Many problems are slow on unsorted data (finding duplicates, closest pairs, merging intervals) but easy once sorted.",
    how: "Define the order with a Comparator, sort first, then use the order: neighbours are close, duplicates are adjacent, and binary search becomes possible.",
    tech: [
      "Comparator.comparing(Person::age).thenComparing(Person::name).reversed() builds orderings declaratively.",
      "Avoid (a, b) -> a - b for ints, which can overflow; use Integer.compare.",
      "After sorting, duplicates sit next to each other, so finding them is O(n).",
      "Intervals sorted by start can be merged in one pass (Java week 32 builds on this).",
      "Sort plus two pointers or binary search often turns O(n²) into O(n log n).",
    ],
    cost: "Sorting costs O(n log n) and loses the original order, so keep indexes if you need them.",
    tryIt:
      "Sort Person objects by age descending then name, and use sorting to find whether any two of 10⁵ meeting times overlap.",
    buildsOn: "Java week 18: Stability and why it matters",
  },
  "J19:3": {
    why: "Binary search finds an item in a sorted array of a billion elements in about 30 steps. It's simple to describe and famously easy to get wrong.",
    problem:
      "A linear search is O(n), and off-by-one mistakes in binary search cause infinite loops or missed elements.",
    how: "Keep a range [lo, hi] that must contain the target if it exists, compare the middle element, and discard the half that can't contain it, until the range is empty.",
    tech: [
      "Each step halves the range, so it's O(log n).",
      "Loop invariant: if the target is in the array, it's within [lo, hi]. Every update must preserve this.",
      "while (lo <= hi) { mid = lo + (hi - lo) / 2; if (a[mid] == t) return mid; if (a[mid] < t) lo = mid + 1; else hi = mid - 1; }",
      "lo + (hi - lo) / 2 avoids int overflow, which (lo + hi) / 2 can cause on huge arrays (a real JDK bug fixed in 2006).",
      "Arrays.binarySearch and Collections.binarySearch return the index, or -(insertion point) - 1 if absent.",
    ],
    cost: "It needs sorted data with random access; on linked lists it gives no benefit.",
    tryIt:
      "Write binary search from memory, then test it against a linear search on 10,000 random sorted arrays, including empty arrays and missing targets.",
    buildsOn: "Java week 10: Common classes",
  },
  "J19:4": {
    why: "Real questions are rarely 'is x present?'. They're 'where does x first appear?', 'where would x go?' or 'search this rotated array'.",
    problem:
      "With duplicates, basic binary search returns any matching index, and many problems need a boundary instead.",
    how: "Change what the search converges to: keep searching after a match to find the first or last occurrence, or search for the first position where a condition becomes true.",
    tech: [
      "Lower bound: the first index with a[i] >= x. Upper bound: the first index with a[i] > x.",
      "First occurrence = lower bound if a[lb] == x; last occurrence = upper bound - 1.",
      "Search insert position is exactly the lower bound.",
      "Half-open template: lo = 0, hi = n; while (lo < hi) { mid; if (cond(mid)) hi = mid; else lo = mid + 1; } returns the first true position.",
      "Rotated sorted array: at each step one half is sorted; check whether the target lies in that half and discard the other.",
    ],
    cost: "Each variant has its own boundary details; mixing templates is the most common source of bugs, so learn one template well.",
    tryIt:
      "Implement lower and upper bound with one half-open template, use them to count occurrences of x in a sorted array, and search a rotated array.",
    buildsOn: "Java week 19: Binary search",
  },

  // ---- Week 20: Binary search on the answer ----
  "J20:0": {
    why: "Binary search isn't only for arrays. It can search for the best answer to an optimisation problem when checking a candidate answer is easy.",
    problem:
      "'What's the minimum ship capacity to deliver all packages in D days?' has no array to search, and trying every capacity is too slow.",
    how: "If a yes or no check is false for small answers and true for all larger ones (monotonic), binary search over possible answers finds the first one that's true.",
    tech: [
      "feasible(x) must be monotonic: false, false, ..., false, true, true, ... true.",
      "Binary search finds the boundary, the smallest x where feasible(x) is true (Java week 19: Variants).",
      "For 'maximum x such that...', the pattern flips to true...true, false...false, and you search for the last true.",
      "The array is imaginary: you only ever evaluate feasible at the midpoints.",
    ],
    cost: "It only works when feasibility really is monotonic; if it isn't, the search returns a wrong answer silently.",
    tryIt:
      "For 'koko eating bananas', print feasible(x) for every x from 1 to the maximum pile on a small input, and check it's monotonic.",
    buildsOn: "Java week 19: Variants",
  },
  "J20:1": {
    why: "The search needs a range that's guaranteed to contain the answer.",
    problem:
      "A range that's too small misses the answer; one that's too large is still fine but must be chosen without overflow.",
    how: "Set lo to the smallest possible answer and hi to the largest, from the problem's own logic.",
    tech: [
      "Ship capacity: lo = the heaviest single package (anything less can't ship it), hi = the total weight (ships everything in one day).",
      "Eating speed: lo = 1, hi = the largest pile.",
      "Minimum time: lo = 0, hi = the time for the slowest valid plan.",
      "Use long when the range can exceed 2³¹.",
      "A wider-than-needed range costs only a few extra steps, since each step halves it.",
    ],
    cost: "Choosing bounds carelessly can cause overflow or a feasible check that breaks on extreme values.",
    tryIt:
      "Write down lo and hi with a one-line justification for three problems: ship within D days, split array largest sum, and minimum days to make bouquets.",
    buildsOn: "Java week 20: The idea",
  },
  "J20:2": {
    why: "The check function is where the real problem-solving happens; the binary search around it is boilerplate.",
    problem:
      "Checking a candidate answer by trying all arrangements is as slow as the original problem.",
    how: "Write a check that, for a fixed candidate, answers yes or no quickly, usually with a greedy single pass.",
    tech: [
      "Ship capacity c: load packages in order, start a new day when the next one doesn't fit, and check the days used ≤ D.",
      "Aggressive cows (place k cows at least d apart): place greedily at the first stall ≥ last + d, and check you placed k.",
      "The greedy works because, for a fixed candidate, packing as much as possible early never hurts.",
      "Each check is usually O(n).",
      "Test the check alone on small inputs before wrapping it in a search.",
    ],
    cost: "Proving the greedy check is correct can be subtle; when in doubt, compare with brute force on small cases.",
    tryIt:
      "Write feasible(capacity) for ship within D days, test it on several capacities by hand, then add the binary search.",
    buildsOn: "Java week 20: Defining the search space",
  },
  "J20:3": {
    why: "Being able to state the complexity shows you understand why the approach is fast enough.",
    problem:
      "Without analysis, it's not clear that searching over a range of 10⁹ answers is fast.",
    how: "Multiply the number of binary search steps, log of the range, by the cost of each check, usually O(n).",
    tech: [
      "Steps = log₂(hi - lo + 1); a range of 10⁹ needs about 30 steps.",
      "Each step calls feasible once, typically O(n).",
      "Total O(n log(range)): for n = 10⁵ and range 10⁹, about 3 × 10⁶ operations.",
      "Compare with checking every candidate: O(n × range), hopeless.",
      "Space is usually O(1) beyond the input.",
    ],
    cost: "If the check itself is expensive (O(n log n) or worse), the total grows accordingly.",
    tryIt:
      "Count the feasible calls your solution makes for a range of 10⁹ and confirm it's about 30.",
    buildsOn: "Java week 10: Rules",
  },
  "J20:4": {
    why: "Spotting that a problem is 'binary search on the answer' is the hardest step. Certain phrases give it away.",
    problem:
      "These problems often look like dynamic programming or greedy problems, so it's easy to go down the wrong path.",
    how: "Look for phrases about minimising a maximum or maximising a minimum, and ask whether a fixed candidate answer is easy to check.",
    tech: [
      "'Minimum capacity', 'minimum speed', 'minimum time such that...'.",
      "'Maximise the minimum distance', 'minimise the largest sum'.",
      "'Smallest divisor such that the sum is at most k', 'at least k groups'.",
      "Ask: if I knew the answer was x, could I check it in O(n)? And does a bigger x always stay feasible?",
      "Large answer ranges (up to 10⁹) with n up to 10⁵ are another hint.",
    ],
    cost: "Not every 'minimum' problem fits; some need a different technique, so confirm monotonicity first.",
    tryIt:
      "Sort 8 mixed problems into 'binary search on the answer' or not, giving the monotonic check for each yes.",
    buildsOn: "Java week 20: The idea",
  },
  "J20:5": {
    why: "Some answers are real numbers, such as a square root or the best average, where integer binary search doesn't apply.",
    problem:
      "With doubles, lo and hi never become exactly equal, so a loop that waits for that runs forever.",
    how: "Repeat the halving a fixed number of times, or until hi - lo is below the precision you need.",
    tech: [
      "for (int i = 0; i < 100; i++) { double mid = (lo + hi) / 2; if (feasible(mid)) hi = mid; else lo = mid; }",
      "100 iterations shrink any reasonable range below double precision.",
      "Or loop while (hi - lo > 1e-9).",
      "Examples: square root to 6 decimal places, maximum average subarray of length at least k.",
      "Doubles have about 15 to 16 significant digits (Java week 1: Primitive types).",
    ],
    cost: "Floating-point rounding means comparisons near the answer can be unstable, so state the precision you guarantee.",
    tryIt:
      "Compute the square root of 2 to 10⁻⁹ with real-number binary search and compare with Math.sqrt.",
    buildsOn: "Java week 20: The idea",
  },

  // ---- Week 21: Binary trees ----
  "J21:0": {
    why: "Trees model anything hierarchical: file systems, HTML documents, org charts, expressions. Precise vocabulary makes tree problems easier to discuss.",
    problem:
      "Without clear terms, it's easy to confuse depth with height or to misread what a 'balanced' or 'complete' tree guarantees.",
    how: "A tree is nodes connected by edges with one root and no cycles. In a binary tree, each node has at most two children, left and right.",
    tech: [
      "Root: the top node. Parent and child: connected nodes one level apart. Leaf: a node with no children.",
      "Depth of a node: edges from the root to it. Height of a tree: edges on the longest root-to-leaf path.",
      "Subtree: a node and all its descendants.",
      "Full: every node has 0 or 2 children. Perfect: all leaves at the same depth. Complete: every level full except possibly the last, filled from the left.",
      "Balanced: the heights of the two subtrees of every node differ by at most a small amount, keeping height O(log n).",
    ],
    cost: "Different books define height and depth slightly differently (edges versus nodes); say which one you use.",
    tryIt:
      "Draw a binary tree with 7 nodes that is complete but not perfect, and label every node's depth and every subtree's height.",
    buildsOn: "Java week 15: Nodes and references",
  },
  "J21:1": {
    why: "How you store a tree affects which operations are easy and how much memory it uses.",
    problem:
      "Most trees need links between objects, but some, like heaps, can be stored much more compactly.",
    how: "Use node objects with left and right references for general trees, and a plain array for complete trees, where positions follow from simple index math.",
    tech: [
      "class TreeNode { int val; TreeNode left, right; }, the way linked lists use next.",
      "Array form for complete trees: root at index 0, children of i at 2i + 1 and 2i + 2, parent at (i - 1) / 2.",
      "The array form wastes no memory on references and is cache-friendly; it's how heaps are stored (Java week 23: Binary heap).",
      "For incomplete trees, the array form leaves gaps, wasting space.",
      "Interview problems usually give the node form; array-like input ([1, 2, null, 3]) is level order with nulls.",
    ],
    cost: "Node objects cost memory per node; arrays only fit complete or nearly complete trees.",
    tryIt:
      "Store a 7-node complete tree in an array and print each node's parent and children using the index formulas.",
    buildsOn: "Java week 21: Terminology",
  },
  "J21:2": {
    why: "Visiting every node in a tree in a particular order is the starting point for almost every tree algorithm.",
    problem:
      "Unlike a list, a tree has no single obvious order, and the right order depends on whether you need parents before children or after.",
    how: "Depth-first traversals visit a node before, between or after its subtrees (pre-, in- and post-order); level order visits nodes level by level with a queue.",
    tech: [
      "Preorder: node, left, right; useful for copying or serialising a tree.",
      "Inorder: left, node, right; gives sorted order in a binary search tree (Java week 22).",
      "Postorder: left, right, node; useful when children must be processed first (deleting, computing sizes).",
      "Iterative versions replace recursion with an explicit stack (ArrayDeque).",
      "Level order (BFS): use a queue, and process queue.size() nodes at a time to handle one level at a time (Java week 16: Queue).",
    ],
    cost: "Recursive traversals use O(height) stack, which is O(n) for a degenerate tree; iterative versions avoid overflow but are harder to write.",
    tryIt:
      "Implement all four traversals, recursive and iterative, and check they print the expected orders for a 7-node tree.",
    buildsOn: "Java week 17: Thinking recursively",
  },
  "J21:3": {
    why: "Most binary tree problems are solved by one of three patterns. Recognising which saves a lot of time.",
    problem:
      "Tree problems can look unique, and writing ad hoc recursion for each one leads to bugs and repeated work.",
    how: "Decide whether information flows up from children to parent (return values), down from parent to children (parameters), or level by level (a queue).",
    tech: [
      "Return values up: height(node) = 1 + max(height(left), height(right)).",
      "Diameter: at each node, the longest path through it is height(left) + height(right); track the best in a field while returning heights.",
      "Balanced check: return the height, or -1 as soon as any subtree is unbalanced, to keep it O(n).",
      "Pass state down: path sum passes the remaining target into each call.",
      "Level by level: right side view, level averages and zigzag order with BFS.",
    ],
    cost: "Returning several values at once needs a small record or an array, which adds some noise in Java.",
    tryIt:
      "Solve max depth, diameter, is-balanced and path sum, labelling each solution as 'up', 'down' or 'level'.",
    buildsOn: "Java week 21: Traversals",
  },
  "J21:4": {
    why: "Trees must be saved to files, sent over networks and rebuilt. Some problems also give you traversals and ask for the tree.",
    problem:
      "One traversal alone doesn't identify a tree uniquely, since different trees can share a preorder.",
    how: "Combine preorder with inorder (the root comes first in preorder and splits the inorder into left and right), or record null markers so one traversal is enough.",
    tech: [
      "Preorder's first element is the root; find it in inorder: everything to its left is the left subtree.",
      "A HashMap from value to inorder index makes each split O(1), so rebuilding is O(n).",
      "Serialise with preorder plus null markers: '1,2,#,#,3,4,#,#,5,#,#'.",
      "Deserialise by reading values in order with a recursive function that consumes markers.",
      "Level order with nulls is the format many online judges use.",
    ],
    cost: "Rebuilding from pre- and in-order requires unique values, and serialised forms with null markers take extra space.",
    tryIt:
      "Write serialize and deserialize for a binary tree using preorder with null markers, and test that the round trip preserves 100 random trees.",
    buildsOn: "Java week 21: Traversals",
  },
  "J21:5": {
    why: "Finding the lowest common ancestor (LCA) of two nodes answers questions like 'which folder contains both files?' or 'the closest shared manager'.",
    problem:
      "Walking up from both nodes needs parent references, which tree nodes usually don't have.",
    how: "Recurse from the root: if the current node is one of the two, return it; otherwise search both subtrees. The node where both sides return something is the LCA.",
    tech: [
      "If node is null or equals p or q, return node.",
      "left = lca(node.left, p, q); right = lca(node.right, p, q).",
      "If both are non-null, node is the LCA; otherwise return whichever is non-null.",
      "O(n) time and O(height) stack.",
      "In a binary search tree it's simpler: go left if both values are smaller, right if both are larger, otherwise stop (Java week 22).",
    ],
    cost: "This version assumes both nodes exist in the tree; if one might be missing, you need an extra check.",
    tryIt:
      "Implement LCA for a binary tree and test it where one node is the ancestor of the other.",
    buildsOn: "Java week 21: Patterns",
  },

  // ---- Week 22: Binary search trees and balanced trees ----
  "J22:0": {
    why: "A binary search tree keeps data sorted while allowing fast inserts and deletes, which a sorted array can't do.",
    problem:
      "A sorted array gives O(log n) search but O(n) inserts and deletes; a hash map is fast but loses order.",
    how: "Keep every node greater than everything in its left subtree and smaller than everything in its right subtree. Search, insert and delete follow one path down.",
    tech: [
      "BST property: left subtree < node < right subtree, for every node.",
      "Search: compare and go left or right; O(height).",
      "Insert: search for the value and attach a new leaf where the search ends.",
      "Delete with no children: remove it. With one child: replace it with the child.",
      "Delete with two children: replace its value with the inorder successor (the smallest in the right subtree), then delete that node.",
    ],
    cost: "Every operation costs O(height), which is only O(log n) if the tree stays balanced.",
    tryIt:
      "Implement a BST with insert, search and all three delete cases, and check the BST property after every operation in a randomised test.",
    buildsOn: "Java week 21: Representation",
  },
  "J22:1": {
    why: "The BST property means an inorder traversal visits values in sorted order, which powers ordered iteration and validation.",
    problem:
      "To list a BST's values in order, or check a tree is a valid BST, you need to use its ordering.",
    how: "Inorder visits the left subtree (all smaller), then the node, then the right subtree (all larger), so values come out sorted.",
    tech: [
      "Inorder traversal of a BST gives ascending order in O(n).",
      "Validate a BST: inorder values must be strictly increasing; or pass down (min, max) bounds.",
      "Checking only each node against its direct children is a classic bug: a deeper node can break the rule.",
      "The k-th smallest element is the k-th node visited in inorder.",
      "Reverse inorder (right, node, left) gives descending order.",
    ],
    cost: "A full traversal is O(n); for repeated order queries, augmented trees do better (Java week 22: Order statistics).",
    tryIt:
      "Write isValidBST using bounds, and build a tree that passes the naive parent-child check but isn't a BST.",
    buildsOn: "Java week 21: Traversals",
  },
  "J22:2": {
    why: "A BST's speed depends entirely on its shape. Plain BSTs can get the worst shape from very ordinary input.",
    problem:
      "Inserting already sorted data creates a tree that's just a linked list, so every operation becomes O(n).",
    how: "Measure the height: with random inserts it's about O(log n), but with sorted inserts every new node goes to the same side.",
    tech: [
      "Inserting 1, 2, 3, ..., n makes each node the right child of the last: height n - 1.",
      "Search and insert then cost O(n), no better than a list.",
      "Real data is often sorted or nearly sorted (timestamps, ids), so this happens in practice.",
      "Balanced trees fix it by restructuring after inserts and deletes.",
    ],
    cost: "Plain BSTs are simple but unreliable; production code uses balanced trees.",
    tryIt:
      "Insert 10,000 sorted values and 10,000 random values into your BST, and print both heights.",
    buildsOn: "Java week 22: BST property",
  },
  "J22:3": {
    why: "Balanced search trees guarantee O(log n) operations whatever order data arrives in.",
    problem:
      "Plain BSTs degrade on ordered input, and rebuilding the whole tree to rebalance it would be O(n) per operation.",
    how: "After each insert or delete, fix local imbalances with rotations (small re-linkings of a few nodes) so the height stays O(log n).",
    tech: [
      "Rotation: a left or right rotation re-links a parent and child and keeps the BST order, in O(1).",
      "AVL trees store a balance factor (height difference, -1, 0 or 1) and rotate when it reaches ±2; strictly balanced, fast lookups.",
      "Red-black trees colour nodes red or black with rules (no two reds in a row, the same number of blacks on every path) that keep height ≤ 2 log n; fewer rotations on updates.",
      "2-3 trees keep nodes with 1 or 2 keys and all leaves at the same depth.",
      "Left-leaning red-black trees (Sedgewick) encode a 2-3 tree as a binary tree, which makes the code much shorter.",
    ],
    cost: "Balanced trees are complicated to implement correctly and use extra memory per node for heights or colours.",
    tryIt:
      "Implement AVL insertion with the four rotation cases, insert 1 to 1,000 in order, and confirm the height stays around 10.",
    buildsOn: "Java week 22: Why unbalanced BSTs degrade",
  },
  "J22:4": {
    why: "Java's TreeMap and TreeSet give you a balanced search tree ready to use, with powerful ordered operations a HashMap can't offer.",
    problem:
      "Questions like 'the largest key at most x', 'all events between 9 and 10' or 'iterate in order' are awkward or slow with a HashMap.",
    how: "TreeMap and TreeSet are red-black trees with O(log n) operations and navigation methods for nearest keys and ranges.",
    tech: [
      "put, get, remove and containsKey are O(log n), versus O(1) average for HashMap.",
      "floorKey(x): the largest key ≤ x. ceilingKey(x): the smallest key ≥ x. lowerKey and higherKey are the strict versions.",
      "headMap(x), tailMap(x) and subMap(a, b) return views of key ranges.",
      "firstKey, lastKey, pollFirstEntry and iteration in sorted order.",
      "Keys must be Comparable or you pass a Comparator; it must be consistent with equals (Java week 7: Ordering).",
    ],
    cost: "Slower than HashMap for plain lookups and more memory per entry; use it only when you need order.",
    tryIt:
      "Store meeting start times in a TreeMap and, for a new meeting, use floorEntry and ceilingEntry to check for overlap in O(log n).",
    buildsOn: "Java week 22: Balanced trees",
  },
  "J22:5": {
    why: "Databases and file systems use B-trees, not binary trees, because of how disks and SSDs are read.",
    problem:
      "A binary tree of a billion keys has a height of about 30. If each level is a separate disk read, every lookup takes 30 slow reads.",
    how: "Make each node a whole disk page holding hundreds of keys and children. The tree becomes very wide and only 3 or 4 levels deep, so a lookup reads just a few pages.",
    tech: [
      "A B-tree node holds many sorted keys and one more child pointer than keys.",
      "With hundreds of children per node, a billion keys fit in about 4 levels.",
      "Nodes split when full and merge when too empty, keeping all leaves at the same depth.",
      "B+ trees keep all values in the leaves and link leaves together, so range scans walk along the leaves.",
      "Database indexes such as Postgres's default index are B+ trees (Main week 19: Indexes).",
    ],
    cost: "Splits and merges are complex, and random writes to many pages are slow, which is why write-heavy stores use LSM trees instead.",
    tryIt:
      "Calculate the height of a B+ tree with 200 keys per node holding 10⁹ keys, and compare it with a balanced binary tree.",
    buildsOn: "Java week 22: Balanced trees",
  },
  "J22:6": {
    why: "'Find the k-th smallest' or 'how many values are below x' comes up in rankings, leaderboards and percentiles.",
    problem:
      "With a plain BST, finding the k-th smallest needs an inorder walk, O(k) or O(n) per query.",
    how: "Store in each node the size of its subtree. Then the k-th smallest can be found in one walk down, choosing left or right by comparing k with the left subtree's size.",
    tech: [
      "size(node) = 1 + size(left) + size(right), updated on every insert, delete and rotation.",
      "If k ≤ size(left), go left; if k == size(left) + 1, it's this node; otherwise go right with k - size(left) - 1.",
      "Rank of x (how many are smaller) uses the same sizes on the way down.",
      "O(log n) per query in a balanced tree.",
      "Simpler alternatives: a sorted array for static data, or a heap of size k for one-off queries (Java week 23).",
    ],
    cost: "Every structural change must keep sizes correct, which adds work and bug opportunities; Java's TreeMap doesn't provide this.",
    tryIt:
      "Add subtree sizes to your BST and implement kthSmallest and rank, testing them against a sorted copy of the data.",
    buildsOn: "Java week 22: Inorder traversal of a BST gives sorted order",
  },

  // ---- Week 23: Heaps and priority queues ----
  "J23:0": {
    why: "Many systems must always handle the most important item next: the earliest timer, the urgent job, the shortest route so far.",
    problem:
      "A sorted list makes inserts O(n), and an unsorted list makes finding the most important item O(n).",
    how: "A priority queue is an abstract data type: you can insert items with a priority and remove the one with the highest (or lowest) priority. A heap is the usual way to implement it.",
    tech: [
      "Operations: insert, peek (look at the top) and poll (remove the top).",
      "It's an abstract data type: it defines behaviour, not implementation.",
      "Implementations: unsorted array (fast insert, slow poll), sorted array (the reverse), binary heap (both O(log n)).",
      "Uses: task scheduling, timers, Dijkstra's shortest paths (Java week 27), event simulation, top-k problems.",
      "It doesn't give sorted iteration; only the top is ordered.",
    ],
    cost: "You can't efficiently search for or update an arbitrary item, only work with the top.",
    tryIt:
      "Simulate a hospital waiting room where patients arrive with a severity, and the most severe is always seen next, using a priority queue.",
    buildsOn: "Java week 16: Queue",
  },
  "J23:1": {
    why: "The binary heap is a simple, fast priority queue that lives in a plain array.",
    problem:
      "You need O(log n) insert and remove-top without the complexity of balanced trees.",
    how: "Store a complete binary tree in an array where every parent is smaller than its children (a min-heap). Insert at the end and sift up; remove the root, move the last element to the top and sift down.",
    tech: [
      "Array layout: parent of i is (i - 1) / 2, children are 2i + 1 and 2i + 2 (Java week 21: Representation).",
      "Heap property (min-heap): every parent ≤ its children, so the minimum is at index 0.",
      "Insert: add at the end, then swap with the parent while smaller (sift up), O(log n).",
      "Extract-min: take index 0, move the last element there, then swap it with its smaller child while larger (sift down), O(log n).",
      "peek is O(1). A max-heap reverses the comparisons.",
    ],
    cost: "Only the top is quick to reach; searching for an arbitrary element is O(n).",
    tryIt:
      "Implement a min-heap on an int[] with insert, peek and extractMin, and check it returns 1,000 random numbers in sorted order.",
    buildsOn: "Java week 21: Representation",
  },
  "J23:2": {
    why: "Building a heap from n items one at a time costs O(n log n), but there's a way to do it in O(n).",
    problem:
      "When you already have all the data, inserting items one by one does unnecessary work.",
    how: "Put all items in the array, then sift down every non-leaf node, starting from the last one and moving backwards to the root.",
    tech: [
      "Start at the last non-leaf, index n/2 - 1, and sift down each node down to index 0.",
      "Half the nodes are leaves and need no work; nodes near the bottom sift down only a short way.",
      "Total work is the sum of node heights, about n/4 × 1 + n/8 × 2 + n/16 × 3 + ..., which adds up to O(n).",
      "Sifting up from each insert does the opposite: most nodes are deep and may travel far, giving O(n log n).",
      "Java's PriorityQueue(Collection) constructor uses bottom-up heapify.",
    ],
    cost: "The O(n) bound only applies to building from a complete batch; later inserts still cost O(log n) each.",
    tryIt:
      "Count the swaps when building a heap of 10⁶ random numbers by repeated insertion and by bottom-up heapify.",
    buildsOn: "Java week 23: Binary heap",
  },
  "J23:3": {
    why: "Heap sort is an in-place O(n log n) sort with no bad cases, and it shows a heap at work.",
    problem:
      "Quicksort has an O(n²) worst case and merge sort needs O(n) extra memory; sometimes you need neither.",
    how: "Build a max-heap in the array, then repeatedly swap the maximum (at the front) with the last unsorted element and sift down the new front over the shrinking heap.",
    tech: [
      "Build a max-heap bottom-up in O(n).",
      "For end from n - 1 down to 1: swap a[0] and a[end], then sift down a[0] within a[0..end-1].",
      "O(n log n) worst case, O(1) extra memory.",
      "Not stable, and its jumps around the array use the CPU cache poorly, so it's usually slower than quicksort.",
      "Introsort (used in C++) switches from quicksort to heap sort when recursion gets too deep, to cap the worst case.",
    ],
    cost: "In practice it's slower than well-implemented quicksort or TimSort, and it isn't stable.",
    tryIt:
      "Implement heap sort in place and compare its time with Arrays.sort on 10⁶ random ints.",
    buildsOn: "Java week 23: Building a heap in O(n)",
  },
  "J23:4": {
    why: "In practice you'll use Java's PriorityQueue rather than writing a heap. Knowing its defaults avoids common mistakes.",
    problem:
      "People expect a max-heap, iterate it expecting sorted order, or write comparators that overflow.",
    how: "PriorityQueue is a binary min-heap by default; pass a Comparator for any other order.",
    tech: [
      "new PriorityQueue<Integer>() is a min-heap: poll returns the smallest.",
      "Max-heap: new PriorityQueue<>(Comparator.reverseOrder()).",
      "Custom order: new PriorityQueue<>(Comparator.comparingInt(Task::priority)).",
      "offer and poll are O(log n), peek is O(1), and remove(Object) and contains are O(n).",
      "Iterating or printing it doesn't give sorted order; only repeated poll does.",
      "Not thread-safe; PriorityBlockingQueue is the concurrent version.",
    ],
    cost: "No efficient way to change an element's priority; the usual workaround is to insert a new entry and skip stale ones when polled.",
    tryIt:
      "Create min and max PriorityQueues of 10 numbers, print each directly and then by polling, and explain the difference.",
    buildsOn: "Java week 23: Binary heap",
  },
  "J23:5": {
    why: "A few heap patterns solve a whole family of interview and real-world problems efficiently.",
    problem:
      "Sorting everything to get the top 10 of a billion items, or re-sorting to find a running median, wastes time and memory.",
    how: "Keep a heap of only what you need: k items for top-k, one head per list for merging, two halves for a median, or tasks ordered by time for scheduling.",
    tech: [
      "Top k largest: keep a min-heap of size k; if a new item beats the smallest, replace it. O(n log k) time, O(k) memory.",
      "K-way merge: put the first element of each sorted list in a min-heap, repeatedly poll and push that list's next element.",
      "Running median: a max-heap for the lower half and a min-heap for the upper half, kept within one element in size.",
      "Scheduling: order tasks by next run time or priority (Java week 39: Booking systems used the same idea for expiry).",
      "Merging k sorted files this way is how external sorting works.",
    ],
    cost: "Heap patterns give exact answers but still touch every item; for approximate answers on huge streams, sketches use less memory.",
    tryIt:
      "Solve 'k closest points to the origin', 'merge k sorted lists' and 'find median from data stream' with heaps.",
    buildsOn: "Java week 23: Java's PriorityQueue",
  },
};
