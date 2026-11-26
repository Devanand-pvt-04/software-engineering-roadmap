import type { ExplainMap } from "./types";

// Ground-up explainers for Java + DSA Part C, first half (J11-J16: arrays to stacks and queues). Keys: J<week>:<Must know topic index>.
export const EXPLAIN_JAVA_PART_C1: ExplainMap = {
  // ---- Week 11: Arrays and dynamic arrays ----
  "J11:0": {
    why: "The array is the most basic data structure, and nearly every other structure is built on it. Its speed comes straight from how memory works.",
    problem:
      "To find the 1,000th item in a list quickly, the computer can't walk past the first 999; it needs to jump straight to it.",
    how: "Store elements of one type side by side in one block of memory. The address of any element is the start address plus its index times the element size, so access takes one calculation.",
    tech: [
      "Contiguous memory: int[] a = new int[5] reserves 5 × 4 bytes in a row (Main week 37: Arrays).",
      "Address of a[i] = base + i × elementSize, so a[i] is O(1) whatever the size.",
      "Inserting or deleting in the middle shifts every later element by one: O(n).",
      "The size is fixed when the array is created.",
      "Sequential access is very fast because the CPU loads neighbouring elements into its cache together (Main week 1: Memory).",
    ],
    cost: "A fixed size means you must know it in advance or copy to a bigger array, and middle inserts and deletes are slow.",
    tryIt:
      "Time summing a 10-million-element int[] in order and in a random order of indices, and explain the difference.",
    buildsOn: "Java week 3: Arrays",
  },
  "J11:1": {
    why: "Most of the time you don't know how many items you'll have. Dynamic arrays like ArrayList give array speed with a size that grows.",
    problem:
      "A fixed-size array fills up; growing it by one slot on each add would copy the whole array every time, making n adds O(n²).",
    how: "Keep a backing array with spare room (capacity) larger than the number of items in use (size). When it's full, allocate a bigger array, about 1.5 times larger in Java, and copy everything once.",
    tech: [
      "size is how many elements are in use; capacity is the length of the backing array.",
      "Java's ArrayList grows to about 1.5 times the old capacity when full.",
      "Most appends just write into spare room: O(1).",
      "A resize copies n elements, but resizes get rarer as the array grows, so the average (amortized) cost per append is O(1) (Java week 10: Amortized analysis).",
      "Passing an initial capacity (new ArrayList<>(1000)) avoids resizes when you know the size.",
    ],
    cost: "Spare capacity wastes memory, and the occasional resize causes a one-off slow append, which matters for latency-sensitive code.",
    tryIt:
      "Write your own DynamicArray<T> with add, get and remove, print the capacity after each resize while adding 100 items, and compare growth factors 1.5 and 2.",
    buildsOn: "Java week 10: Amortized analysis",
  },
  "J11:2": {
    why: "A handful of array techniques solve a large share of interview problems in linear time and constant extra space.",
    problem:
      "The obvious solutions (nested loops, or copying into new arrays) are O(n²) time or O(n) extra space, which fails on large inputs.",
    how: "Learn a few reusable tricks that modify the array in place or carry a running answer in a single pass.",
    tech: [
      "In-place modification: a write pointer that moves only when you keep an element (moving zeros to the end, removing duplicates).",
      "Reversal with two pointers swapping from both ends toward the middle.",
      "Rotation by k: reverse the whole array, then reverse the first k and the rest, all in place.",
      "Kadane's algorithm (maximum subarray sum): keep the best sum ending here, max(x, bestHere + x), and the best overall, in one pass.",
      "Dutch national flag (three-way partition): three pointers sort an array of 0s, 1s and 2s in one pass.",
    ],
    cost: "In-place tricks overwrite the input, which callers may not expect, and they're easy to get off by one.",
    tryIt:
      "Solve maximum subarray with Kadane's algorithm and rotate an array by k with three reversals, then test both on empty, single-element and all-negative inputs.",
    buildsOn: "Java week 11: Static arrays",
  },

  // ---- Week 12: Strings, two pointers, sliding window ----
  "J12:0": {
    why: "String problems are everywhere in interviews and real code, and Java strings have performance traps that catch beginners.",
    problem:
      "Strings are immutable, so building one with + in a loop creates a new string every time, turning an O(n) job into O(n²).",
    how: "Use char[] or StringBuilder when you need to change text, and simple integer arrays to count characters instead of maps.",
    tech: [
      "s.toCharArray() gives a mutable char[]; new String(chars) turns it back into a string.",
      "StringBuilder appends in amortized O(1) and builds the final string once with toString().",
      "Frequency arrays: int[26] for lowercase letters (count[c - 'a']++) or int[128] for ASCII; faster and simpler than a HashMap.",
      "Comparing two frequency arrays checks anagrams in O(n).",
      "charAt(i) is O(1); substring creates a copy, which costs O(length).",
    ],
    cost: "Frequency arrays only work for small known alphabets; full Unicode text needs a map, and characters outside the basic range take two chars.",
    tryIt:
      "Build a 100,000-character string with + in a loop and with StringBuilder, time both, then check two strings are anagrams with an int[26].",
    buildsOn:
      "Java week 3: StringBuilder and why concatenating in a loop is slow",
  },
  "J12:1": {
    why: "Two pointers turn many O(n²) pair-search problems into O(n) by using structure in the data, such as sortedness.",
    problem:
      "Checking every pair of elements is O(n²), too slow for 10⁵ elements or more.",
    how: "Keep two indexes and move them based on what you see: inward from both ends, or both forward at different speeds, so each element is visited a constant number of times.",
    tech: [
      "Opposite ends: lo = 0, hi = n - 1; in a sorted array, if a[lo] + a[hi] is too small move lo up, if too big move hi down (pair sum).",
      "Palindrome check: compare from both ends moving inward.",
      "Same direction: a slow write pointer and a fast read pointer, for example removing duplicates from a sorted array in place.",
      "Fast and slow pointers on sequences detect cycles and find middles (you'll use them on linked lists in Java week 15).",
      "Each pointer moves at most n steps, so the total is O(n).",
    ],
    cost: "Opposite-ends two pointers usually need sorted input; sorting first adds O(n log n) and loses original positions.",
    tryIt:
      "Solve 'two sum in a sorted array' with two pointers and 'valid palindrome ignoring non-letters', and count the steps for n = 10⁶.",
    buildsOn: "Java week 12: String manipulation in Java",
  },
  "J12:2": {
    why: "Questions about contiguous runs of data, such as the longest substring without repeats, are common, and recomputing each run from scratch is wasteful.",
    problem:
      "Checking every possible subarray is O(n²) or worse, even though neighbouring subarrays share almost all their elements.",
    how: "Keep a window [left, right] and update its state incrementally: expand right to add an element, and shrink left while the window breaks a rule.",
    tech: [
      "Fixed-size window: add a[right], remove a[right - k], update the answer; for example, the maximum sum of k consecutive elements.",
      "Variable-size template: for right in 0..n-1, add a[right]; while the window is invalid, remove a[left] and left++; then update the answer.",
      "Track window state with counts (an int[128] or a HashMap) and a few counters, such as the number of distinct characters.",
      "Each element enters and leaves the window at most once, so it's O(n).",
      "Works when shrinking can only fix the rule (monotonic conditions); with negative numbers in sums it often doesn't.",
    ],
    cost: "Getting the invalid condition and the moment you update the answer exactly right is fiddly, and the template doesn't fit every subarray problem.",
    tryIt:
      "Solve 'longest substring without repeating characters' and 'minimum window containing all characters of t' with the same expand and shrink template.",
    buildsOn: "Java week 12: Two pointers",
  },
  "J12:3": {
    why: "Under interview pressure, the hardest part is choosing the technique. Certain words in a problem point strongly to certain approaches.",
    problem:
      "Without recognising the signals, you start with brute force and run out of time before finding the efficient approach.",
    how: "Read the problem for key phrases and constraints, and map them to candidate techniques before writing code.",
    tech: [
      "'Contiguous subarray' or 'substring' with a condition suggests a sliding window or prefix sums.",
      "'Sorted array' plus 'pair' or 'triplet' suggests two pointers (or binary search).",
      "'Longest' or 'shortest' with a condition on a window suggests a variable sliding window.",
      "'Pair with sum' in an unsorted array suggests a hash map of complements (Java week 13).",
      "Input size hints at the complexity you need (Java week 10: Input-size intuition).",
    ],
    cost: "Signals are hints, not rules; some problems look like one pattern and need another, so check your idea on small examples.",
    tryIt:
      "Read 10 array or string problems without solving them, write the technique you'd try for each and why, then check against the solutions.",
    buildsOn: "Java week 10: Input-size intuition",
  },

  // ---- Week 13: Hashing and hash maps ----
  "J13:0": {
    why: "Hash maps give near-instant lookup by key, and they all depend on a hash function that turns a key into a number.",
    problem:
      "Searching an unsorted list for a key is O(n). To jump straight to where a key is stored, you need to compute its location from the key itself.",
    how: "A hash function turns any key into an integer. It must always give the same result for equal keys and should spread different keys evenly.",
    tech: [
      "Deterministic: the same key always gives the same hash.",
      "Uniform: different keys should spread evenly over the range to avoid collisions.",
      "Java's hashCode() returns an int; String computes s[0]·31ⁿ⁻¹ + s[1]·31ⁿ⁻² + ... + s[n-1].",
      "The contract: if a.equals(b), then a.hashCode() == b.hashCode(); override both together (Java week 5: The Object class).",
      "Unequal objects may share a hash (a collision); that's allowed but makes lookups slower.",
      "Mutating a key after inserting it changes its hash and loses it in the map.",
    ],
    cost: "A poor hashCode (for example, returning a constant) turns every lookup into a linear search, and attackers can craft colliding keys.",
    tryIt:
      "Create a class that overrides equals but not hashCode, put an instance in a HashSet, and check contains() with an equal object; then fix it.",
    buildsOn: "Java week 5: The Object class",
  },
  "J13:1": {
    why: "A hash is a huge integer, but a table has only a few slots. The hash must be turned into a valid slot index cheaply.",
    problem:
      "Using the hash directly as an index would need an array of 4 billion slots, and negative hashes would break indexing.",
    how: "Reduce the hash to the range [0, capacity) by taking it modulo the capacity, or, when the capacity is a power of two, by keeping only the low bits with a bit mask.",
    tech: [
      "Modulo: index = Math.floorMod(hash, capacity), which handles negative hashes correctly (unlike %).",
      "Power-of-two capacity: index = hash & (capacity - 1), which is faster than division.",
      "Masking keeps only the low bits, so a hash whose low bits barely vary clusters into a few buckets.",
      "That's why Java mixes high bits into low bits before masking (Java week 13: Java's HashMap internals).",
      "A prime capacity with modulo spreads poor hashes better but is slower to compute.",
    ],
    cost: "Each method has trade-offs between speed and sensitivity to poor hash functions.",
    tryIt:
      "Compute bucket indexes for 1,000 keys that are multiples of 16 using hash & 15 and hash % 13, and count how many buckets each uses.",
    buildsOn: "Java week 13: Hash functions",
  },
  "J13:2": {
    why: "However good the hash, two keys will sometimes land in the same bucket. Every hash table needs a plan for that.",
    problem:
      "If a second key overwrote the first in the same slot, data would be lost; if lookups stopped at the first key, they'd miss the second.",
    how: "Either keep a small list of entries in each bucket (separate chaining), or store every entry in the array itself and look for another free slot by a fixed rule (open addressing).",
    tech: [
      "Separate chaining: each bucket holds a linked list (or tree) of entries; lookups scan only that bucket.",
      "Open addressing stores entries directly in the array and probes for a free slot on collision.",
      "Linear probing tries the next slot, then the next; cache-friendly but builds clusters.",
      "Quadratic probing tries offsets 1, 4, 9 and so on, which reduces clustering.",
      "Double hashing uses a second hash function to choose the step size.",
      "Deleting under open addressing needs 'tombstone' markers so later searches don't stop early.",
    ],
    cost: "Chaining uses extra memory for nodes and pointers; open addressing degrades sharply as the table fills up.",
    tryIt:
      "Implement a small hash map with separate chaining and another with linear probing, insert 1,000 keys into each, and compare the average probes per lookup.",
    buildsOn: "Java week 13: Mapping hash to bucket index",
  },
  "J13:3": {
    why: "As a hash table fills, collisions become frequent and lookups slow down. Resizing keeps it fast.",
    problem:
      "A table with 16 buckets holding 10,000 entries has long chains, so lookups degrade toward O(n).",
    how: "Track the load factor (entries ÷ buckets). When it passes a threshold, allocate a larger array, typically double, and re-insert every entry at its new index.",
    tech: [
      "Load factor = size ÷ capacity; Java's HashMap resizes when it passes 0.75.",
      "Resizing (rehashing) moves every entry because indexes depend on the capacity: O(n) for that one insert.",
      "Doubling keeps the average insert cost O(1) amortized, as with ArrayList (Java week 11: Dynamic arrays).",
      "With power-of-two sizes, each entry either stays at index i or moves to i + oldCapacity, which Java uses to split buckets quickly.",
      "Setting the initial capacity (new HashMap<>(expected / 0.75 + 1)) avoids repeated resizing.",
    ],
    cost: "A lower load factor wastes memory; a higher one slows lookups. Resizing a huge map causes a noticeable pause.",
    tryIt:
      "Insert a million entries into a HashMap with default settings and with a pre-sized capacity, and compare the times.",
    buildsOn: "Java week 11: Dynamic arrays",
  },
  "J13:4": {
    why: "HashMap is probably the Java class you'll use most. Its internals explain its speed, its worst cases and some odd details.",
    problem:
      "A plain chaining table can be attacked or slowed by many keys landing in one bucket, and poor hash functions waste power-of-two masking.",
    how: "HashMap is an array of buckets with chaining. It spreads each hash's high bits into its low bits before masking, and turns long chains into red-black trees.",
    tech: [
      "table is an array of Node<K,V> buckets; each node holds the hash, key, value and next.",
      "Hash spreading: hash = h ^ (h >>> 16) mixes the high 16 bits into the low bits used by the mask.",
      "index = hash & (table.length - 1), with table length always a power of two.",
      "Since Java 8, a bucket with more than 8 entries (in a table of at least 64) becomes a red-black tree, so the worst case is O(log n) rather than O(n).",
      "null is allowed as one key (stored in bucket 0); iteration order isn't guaranteed and can change after resizing.",
    ],
    cost: "Each entry is a separate object with overhead, using far more memory than the data itself; HashMap isn't thread-safe (use ConcurrentHashMap).",
    tryIt:
      "Open HashMap.java in your IDE, find hash(), putVal() and treeifyBin(), and trace what happens when you put the same key twice.",
    buildsOn: "Java week 13: Collision resolution",
  },
  "J13:5": {
    why: "Java's other hash-based collections reuse HashMap rather than reimplementing it. Knowing that tells you their costs immediately.",
    problem:
      "Choosing between HashSet, LinkedHashSet, HashMap and LinkedHashMap seems arbitrary until you see how they're built.",
    how: "HashSet stores its elements as keys in a HashMap with a shared dummy value. The Linked variants add a doubly linked list through all entries to remember order.",
    tech: [
      "HashSet<E> wraps a HashMap<E, Object>; add(e) is map.put(e, PRESENT).",
      "So HashSet has the same O(1) average costs and needs the same equals and hashCode rules.",
      "LinkedHashMap links entries in insertion order, so iteration follows the order of insertion.",
      "With accessOrder = true, LinkedHashMap moves accessed entries to the end, and overriding removeEldestEntry gives an LRU cache.",
      "TreeMap and TreeSet are different: they're sorted trees, O(log n) (Java week 22).",
    ],
    cost: "Linked variants use more memory per entry for the extra pointers.",
    tryIt:
      "Build a 3-entry LRU cache by extending LinkedHashMap with accessOrder = true and removeEldestEntry, and test which key is evicted.",
    buildsOn: "Java week 13: Java's HashMap internals",
  },
  "J13:6": {
    why: "A small set of hash map patterns solves a large share of interview problems in O(n).",
    problem:
      "Many problems seem to need nested loops: is there a pair that sums to k, which words are anagrams, has this appeared before?",
    how: "Store what you've seen in a map or set as you go, so each later question is an O(1) lookup instead of a scan.",
    tech: [
      "Counting: map.merge(x, 1, Integer::sum) builds frequencies in one pass.",
      "Seen-before: a HashSet answers 'have I seen this?' (duplicates, cycles).",
      "Complement lookup (Two Sum): for each x, check whether target - x is already in the map, then add x.",
      "Grouping by key: map each word to its sorted letters (or a frequency signature) to group anagrams.",
      "Index map: remember where you saw each value, for distance or window problems.",
    ],
    cost: "Hash maps use O(n) extra memory and lose order, and boxing primitive keys into Integer adds overhead.",
    tryIt:
      "Solve Two Sum, Group Anagrams and 'first non-repeating character' each in a single pass with a map or set.",
    buildsOn: "Java week 13: HashSet and LinkedHashMap",
  },

  // ---- Week 14: Prefix sums, matrices, bit manipulation ----
  "J14:0": {
    why: "Many problems ask for sums over ranges again and again. Precomputing running totals answers each one instantly.",
    problem:
      "Summing a range by looping is O(n) per query, so 10⁵ queries on 10⁵ elements takes 10¹⁰ steps.",
    how: "Build an array where each entry is the total of everything before it. The sum of any range is then the difference of two entries.",
    tech: [
      "prefix[0] = 0 and prefix[i + 1] = prefix[i] + a[i]; building it is O(n).",
      "sum(l..r) = prefix[r + 1] - prefix[l], in O(1).",
      "Subarray sum equals k (with negatives): count earlier prefixes equal to current - k in a HashMap as you go (Java week 13: Patterns).",
      "2D prefix sums: P[i][j] holds the sum of the rectangle from (0,0); any rectangle's sum comes from 4 lookups (inclusion-exclusion).",
      "Use long for prefix sums to avoid int overflow.",
    ],
    cost: "Prefix arrays use O(n) extra memory and must be rebuilt if the data changes (Fenwick trees handle updates, Java week 24).",
    tryIt:
      "Answer 10⁵ random range-sum queries on a 10⁵-element array with a loop and with prefix sums, and compare times.",
    buildsOn: "Java week 13: Patterns",
  },
  "J14:1": {
    why: "Prefix sums make range queries fast. Difference arrays do the reverse: they make range updates fast.",
    problem:
      "Adding a value to every element in a range is O(n) per update, so many updates are slow.",
    how: "Record only where each change starts and stops in a difference array, then rebuild the final values with one prefix sum pass.",
    tech: [
      "To add v to a[l..r]: diff[l] += v and diff[r + 1] -= v, in O(1).",
      "After all updates, a[i] = diff[0] + ... + diff[i] (a prefix sum), in O(n) total.",
      "Used for booking counts, timeline overlaps and 'how many intervals cover each point'.",
      "Works in 2D with four corner updates.",
    ],
    cost: "You only get the values after the final pass; reading values between updates needs a different structure (a Fenwick or segment tree).",
    tryIt:
      "Given 10⁵ flight bookings (first, last, seats), compute seats per flight with a difference array.",
    buildsOn: "Java week 14: Prefix sums",
  },
  "J14:2": {
    why: "Grids appear in images, games, maps and spreadsheets. Moving around them correctly is a basic skill that interviews test.",
    problem:
      "Index arithmetic in two dimensions is easy to get wrong, and naive solutions copy the whole matrix or search every cell.",
    how: "Treat a matrix as rows of columns, use clear boundary variables, and learn a few standard traversals and in-place tricks.",
    tech: [
      "int[][] m: m.length is rows, m[0].length is columns; m[r][c] is row r, column c.",
      "Spiral order: shrink top, bottom, left and right boundaries after each side.",
      "Diagonals: cells with the same r - c (or r + c) are on the same diagonal.",
      "Rotate 90° clockwise in place: transpose (swap m[i][j] and m[j][i]), then reverse each row.",
      "Search a matrix sorted by rows and columns from the top-right corner: move left if too big, down if too small, in O(rows + cols).",
      "Direction arrays (int[][] dirs = {{0,1},{1,0},{0,-1},{-1,0}}) make neighbour loops tidy.",
    ],
    cost: "Off-by-one errors at boundaries are common, and Java's int[][] is an array of separate arrays, which is less cache-friendly than one flat array.",
    tryIt:
      "Print a 4×5 matrix in spiral order and rotate a 4×4 matrix in place, testing with 1×1 and 1×N cases.",
    buildsOn: "Java week 3: Arrays",
  },
  "J14:3": {
    why: "Everything in a computer is bits. Working with them directly gives compact data, very fast operations and neat solutions to some problems.",
    problem:
      "Storing many yes/no flags as booleans wastes memory, and some problems (subsets, parity, single numbers) are awkward without bit operations.",
    how: "Use bitwise operators to test, set and clear individual bits in an integer, and use known identities for common tasks.",
    tech: [
      "Integers are stored in binary using two's complement for negatives (Main week 1: Information as bits).",
      "& (and), | (or), ^ (xor), ~ (not), << (shift left), >> (shift right keeping the sign), >>> (shift right filling with zeros).",
      "Check bit i: (x >> i) & 1. Set: x | (1 << i). Clear: x & ~(1 << i). Toggle: x ^ (1 << i).",
      "XOR tricks: x ^ x = 0 and x ^ 0 = x, so XOR-ing all numbers finds the one that appears once.",
      "Integer.bitCount(x) counts set bits; x > 0 && (x & (x - 1)) == 0 checks a power of two.",
      "Subsets via bitmasks: for mask in 0..2ⁿ - 1, bit i of mask says whether item i is included.",
    ],
    cost: "Bit tricks are hard to read and easy to get subtly wrong (shifting by 32 or more, sign bits); add comments.",
    tryIt:
      "Print all subsets of {a, b, c} with a bitmask loop, and find the single non-duplicated number in an array with XOR.",
    buildsOn: "Java week 1: Primitive types",
  },

  // ---- Week 15: Linked lists ----
  "J15:0": {
    why: "Linked lists show how to build a structure from objects connected by references, an idea behind trees, graphs and many real systems.",
    problem:
      "Arrays need one contiguous block and must shift elements to insert in the middle. Sometimes you want to insert and remove anywhere without moving anything.",
    how: "Store each element in a node object holding the value and a reference to the next node (and in a doubly linked list, the previous one). The list keeps a reference to the head.",
    tech: [
      "Node: class Node { int val; Node next; }; the last node's next is null.",
      "Singly linked: next only, so you can only walk forward.",
      "Doubly linked: next and prev, so you can walk both ways and remove a node given only that node.",
      "Circular: the last node points back to the first, useful for round-robin.",
      "Nodes are scattered in memory; references connect them (Java week 4: Reference semantics).",
    ],
    cost: "Each node carries extra memory for references and object headers, and following references is slow compared with array access.",
    tryIt:
      "Build a singly linked list of 5 nodes by hand, print it, and draw the boxes and arrows on paper.",
    buildsOn: "Java week 4: Reference semantics",
  },
  "J15:1": {
    why: "Knowing exactly what each linked list operation costs tells you when to use one and when not to.",
    problem:
      "A list that's fast to insert into can be slow to search, and without a tail reference even appending is O(n).",
    how: "Count the references you follow: operations at a known node are constant time, while anything needing a position or a value means walking from the head.",
    tech: [
      "Insert or delete at the head: O(1), just update head.",
      "Insert at the tail: O(1) with a tail reference, O(n) without.",
      "Delete at the tail of a singly linked list is O(n), since you need the node before it; a doubly linked list makes it O(1).",
      "Search by value or get(i): O(n), as there's no random access.",
      "Insert or delete after a node you already hold: O(1).",
    ],
    cost: "The O(1) inserts only help if you already hold the right node; finding it is usually O(n).",
    tryIt:
      "Implement addFirst, addLast (with a tail), removeFirst and get(i) on your own list, and write each operation's cost next to it.",
    buildsOn: "Java week 15: Nodes and references",
  },
  "J15:2": {
    why: "Textbooks praise linked lists' O(1) inserts, but in practice arrays are usually faster. Knowing why prevents bad choices.",
    problem:
      "Big-O treats every memory access as equal, but real hardware is much faster at reading memory in order than at chasing pointers around.",
    how: "Compare both on real costs: arrays win on iteration and random access thanks to the CPU cache; linked lists win only for frequent inserts and removes at positions you already hold.",
    tech: [
      "CPU caches load memory in 64-byte lines, so neighbouring array elements arrive together (Main week 1: Memory).",
      "Linked nodes are scattered, so each step can be a cache miss costing about 100 ns.",
      "ArrayList's O(n) middle insert is a fast block copy (System.arraycopy) that often beats walking a linked list to the same spot.",
      "Linked lists suit queues, LRU caches (with a hash map) and splicing lists together.",
      "In Java, prefer ArrayList or ArrayDeque by default (Java week 7: Implementations and their costs).",
    ],
    cost: "Benchmarks are needed to be sure, since results depend on size, access patterns and the JVM.",
    tryIt:
      "Sum 10 million integers stored in an ArrayList and in a LinkedList and compare times; then insert 10,000 items in the middle of each.",
    buildsOn: "Java week 7: Implementations and their costs",
  },
  "J15:3": {
    why: "Linked list problems are interview favourites because they test careful reference handling. A few techniques solve most of them.",
    problem:
      "Special cases (empty list, changing the head, odd and even lengths) and losing a reference before using it cause most linked list bugs.",
    how: "Use a dummy node to remove head special cases, fast and slow pointers to find middles and cycles, and save next before changing references when reversing.",
    tech: [
      "Dummy (sentinel) node: Node dummy = new Node(0, head); work from dummy, return dummy.next.",
      "Fast and slow pointers: fast moves two steps, slow one; when fast reaches the end, slow is in the middle.",
      "Floyd's cycle detection: if fast and slow ever meet, there's a cycle; restarting one from the head finds where it begins.",
      "Iterative reversal: prev = null; while (cur != null) { next = cur.next; cur.next = prev; prev = cur; cur = next; }",
      "Merge two sorted lists with a dummy and a tail pointer; split by finding the middle.",
      "Java's LinkedList is doubly linked and implements Deque.",
    ],
    cost: "Recursive versions are elegant but use O(n) stack and can overflow on long lists.",
    tryIt:
      "Reverse a linked list iteratively and recursively, detect a cycle with Floyd's algorithm, and merge two sorted lists, testing each on empty and single-node lists.",
    buildsOn: "Java week 12: Two pointers",
  },

  // ---- Week 16: Stacks, queues, deques, monotonic stack ----
  "J16:0": {
    why: "Many processes naturally handle the most recent item first: undo, nested brackets, function calls. A stack models that exactly.",
    problem:
      "Tracking nested or reversible work with plain lists leads to messy index handling and mistakes.",
    how: "A stack allows access only to the top: push adds to the top, pop removes from the top, peek reads it. The last item in is the first out (LIFO).",
    tech: [
      "push, pop and peek are all O(1).",
      "Array-based: a dynamic array where the end is the top; cache-friendly, the usual choice.",
      "Linked-list-based: the head is the top; no resizing, more memory per item.",
      "Uses: the call stack (Java week 2: The call stack), undo, matching brackets, parsing, and depth-first search.",
      "In Java, use ArrayDeque (push, pop, peek), not the old synchronised Stack class.",
    ],
    cost: "Only the top is accessible; finding anything else means popping everything above it.",
    tryIt:
      "Implement a stack on an array with push, pop and peek, then use it to reverse a string and to implement undo for a list of edits.",
    buildsOn: "Java week 2: The call stack",
  },
  "J16:1": {
    why: "Many processes handle items in arrival order: print jobs, requests, breadth-first search. A queue models that.",
    problem:
      "Removing from the front of an array shifts every element, making each dequeue O(n).",
    how: "A queue adds at the back and removes from the front: first in, first out (FIFO). A circular buffer implements it in an array with O(1) operations.",
    tech: [
      "enqueue (offer) adds at the tail; dequeue (poll) removes from the head.",
      "Circular buffer: head and tail indexes wrap around with (i + 1) % capacity, so nothing shifts.",
      "Track size (or keep one empty slot) to tell a full buffer from an empty one.",
      "Uses: BFS (Java week 25), task scheduling, buffering between producers and consumers (Main week 20: Messaging).",
      "In Java, Queue<T> q = new ArrayDeque<>(); with offer, poll and peek.",
    ],
    cost: "A fixed circular buffer can fill up; growing it means copying and unwrapping the elements.",
    tryIt:
      "Implement a circular buffer queue with capacity 4, enqueue and dequeue 10 items in a mixed order, and print head and tail after each step.",
    buildsOn: "Java week 11: Static arrays",
  },
  "J16:2": {
    why: "A deque (double-ended queue) works as both a stack and a queue, and some algorithms need both ends.",
    problem:
      "Some problems need to add or remove at either end efficiently, such as sliding window maximum or palindrome checks.",
    how: "A deque supports adding and removing at both front and back in O(1). Java's ArrayDeque implements it as a growable circular array.",
    tech: [
      "addFirst, addLast, pollFirst, pollLast, peekFirst and peekLast are all O(1).",
      "As a stack: push, pop and peek work on the front.",
      "As a queue: offer at the back, poll from the front.",
      "ArrayDeque is faster than LinkedList for both uses and doesn't allow null.",
      "Not thread-safe; for concurrent use there's ConcurrentLinkedDeque or LinkedBlockingDeque.",
    ],
    cost: "Mixing stack and queue method names on one deque is confusing; pick one style per use.",
    tryIt:
      "Use one ArrayDeque as a stack and another as a queue, push and offer 1 to 5 into each, and compare the removal orders.",
    buildsOn: "Java week 16: Queue",
  },
  "J16:3": {
    why: "Compilers, calculators and config parsers all need to understand nested structure. Stacks are the natural tool.",
    problem:
      "Checking that brackets match, or evaluating 3 + 4 × (2 − 1) with the right precedence, can't be done by reading left to right with simple variables.",
    how: "Push openings and pop to match closings; for expressions, use stacks to hold operators and values until precedence and parentheses say they can be applied.",
    tech: [
      "Balanced brackets: push each opening; on a closing, the top must be its match; at the end the stack must be empty.",
      "Postfix (Reverse Polish) notation such as 3 4 2 1 − × + evaluates with one stack of values.",
      "Infix to postfix (the shunting-yard algorithm) uses an operator stack and precedence rules.",
      "Dijkstra's two-stack algorithm evaluates fully parenthesised infix directly with a value stack and an operator stack.",
      "The same idea underlies parsing HTML, JSON and code.",
    ],
    cost: "Handling unary minus, precedence and associativity correctly takes care, and real parsers use more general techniques.",
    tryIt:
      "Write a balanced-bracket checker for ()[]{} and an evaluator for expressions with + − × ÷ and parentheses.",
    buildsOn: "Java week 16: Stack",
  },
  "J16:4": {
    why: "'Next greater element' and its variants look like they need nested loops, but a stack kept in sorted order solves them in O(n).",
    problem:
      "For each element, scanning to the right to find the next bigger one is O(n²).",
    how: "Keep a stack whose values are always increasing or always decreasing. When a new element breaks the order, pop elements; the new element is the answer for each one popped.",
    tech: [
      "Next greater element: keep a decreasing stack of indexes; when a[i] is bigger than the top, pop it and record a[i] as its answer, then push i.",
      "Each index is pushed and popped at most once, so it's O(n).",
      "Variants: next smaller, previous greater, previous smaller, depending on direction and comparison.",
      "Largest rectangle in a histogram: for each bar, the previous and next smaller bars bound its widest rectangle.",
      "Daily temperatures and stock span are the same pattern.",
    ],
    cost: "The idea is hard to see at first, and choosing strict or non-strict comparisons for equal values is error-prone.",
    tryIt:
      "Solve 'daily temperatures' and 'largest rectangle in histogram' with a monotonic stack, tracing the stack by hand for a small input.",
    buildsOn: "Java week 16: Stack",
  },
  "J16:5": {
    why: "The maximum of every window of size k is a classic problem where a plain sliding window isn't enough.",
    problem:
      "Recomputing the maximum of each window is O(k) per window, O(nk) in total, and a heap gives O(n log k) with removal headaches.",
    how: "Keep a deque of indexes whose values are decreasing. The front is always the current maximum; drop indexes that leave the window from the front and smaller values from the back.",
    tech: [
      "For each i: pop from the back while a[back] ≤ a[i], then add i at the back.",
      "If the front index is outside the window (≤ i - k), remove it from the front.",
      "Once i ≥ k - 1, a[front] is the window's maximum.",
      "Each index enters and leaves once, so it's O(n) total.",
      "The same structure speeds up some dynamic programming problems (sliding window optimisation).",
    ],
    cost: "It only answers max or min, not other statistics, and the index bookkeeping is easy to get wrong.",
    tryIt:
      "Implement sliding window maximum with a deque, and test it against a brute-force version on 1,000 random arrays.",
    buildsOn: "Java week 16: Monotonic stack",
  },
  "J16:6": {
    why: "Building a queue from two stacks is a classic exercise in amortized analysis and in combining simple structures.",
    problem:
      "A stack gives items back in reverse order. You need first-in, first-out behaviour using only stack operations.",
    how: "Push new items onto an 'in' stack. To dequeue, pop from an 'out' stack; if it's empty, first move everything from 'in' to 'out', which reverses the order.",
    tech: [
      "enqueue: in.push(x), O(1).",
      "dequeue: if out is empty, pop everything from in and push it onto out; then out.pop().",
      "Each element is moved from in to out at most once, so n operations cost O(n) total: O(1) amortized (Java week 10: Amortized analysis).",
      "A single dequeue can still be O(n) when the transfer happens.",
      "Functional languages build immutable queues the same way.",
    ],
    cost: "The occasional O(n) step causes latency spikes, which matters in real-time systems.",
    tryIt:
      "Implement the two-stack queue, count every individual push and pop over 10,000 random operations, and check the total is linear.",
    buildsOn: "Java week 10: Amortized analysis",
  },
};
