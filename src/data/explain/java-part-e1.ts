import type { ExplainMap } from "./types";

// Ground-up explainers for Java + DSA Part E, first half (J24-J29: advanced trees, graphs, greedy, DP I). Keys: J<week>:<Must know topic index>.
export const EXPLAIN_JAVA_PART_E1: ExplainMap = {
  // ---- Week 24: Tries, segment trees and Fenwick trees ----
  "J24:0": {
    why: "Many text features work on prefixes: autocomplete, 'words starting with', routing tables. A trie is built for exactly that.",
    problem:
      "Finding all words with a given prefix in a hash set means checking every word, and a sorted list needs binary search plus a scan.",
    how: "Store words character by character in a tree: each node has one child per possible next character and a flag marking the end of a word. Words sharing a prefix share a path.",
    tech: [
      "Node: TrieNode[] children = new TrieNode[26] (or a Map<Character, TrieNode>) and boolean isEnd.",
      "insert(word): walk from the root, creating missing children, and set isEnd on the last node; O(length).",
      "search(word): walk the path; true only if every character exists and the last node has isEnd set.",
      "startsWith(prefix): true if the path exists, whatever isEnd says.",
      "Cost depends on the word length, not on how many words are stored.",
    ],
    cost: "Tries can use a lot of memory, with many nodes and mostly empty child arrays.",
    tryIt:
      "Implement a trie with insert, search and startsWith, load 10,000 English words, and list every word starting with 'pre'.",
    buildsOn: "Java week 21: Representation",
  },
  "J24:1": {
    why: "Tries are behind several features people use every day, which makes them more than an interview topic.",
    problem:
      "Prefix queries, suggestions and longest-prefix matches are slow or awkward with hash maps and sorted lists.",
    how: "Use the trie's shared-prefix paths: walk to a prefix's node, then explore below it, or remember the last word end seen while walking.",
    tech: [
      "Autocomplete: walk to the prefix node, then collect words below it, often with top suggestions cached at each node (Main week 51: Typeahead and search).",
      "Spell check: walk the trie while allowing a few edits to find close words.",
      "IP routing: routers find the longest matching network prefix for a destination address using a binary trie of address bits (Main week 6: Network layer).",
      "Word games (Boggle, word search): prune the search as soon as a path isn't a prefix of any word.",
      "Compressed tries (radix trees) merge single-child chains to save memory.",
    ],
    cost: "For simple exact lookups, a hash set is faster and uses less memory; use tries only when prefixes matter.",
    tryIt:
      "Solve 'word search II' (find all dictionary words in a letter grid) using a trie to prune the backtracking.",
    buildsOn: "Java week 24: Trie",
  },
  "J24:2": {
    why: "How each trie node stores its children decides whether the trie is fast and compact or slow and bloated.",
    problem:
      "A 26-slot array per node is fast but wastes memory on empty slots; a map saves memory but each step is slower.",
    how: "Choose the child representation by alphabet size and how dense the trie is.",
    tech: [
      "Array children (new TrieNode[26]): O(1) child lookup, simple, but 26 references per node even if only one is used.",
      "For large alphabets (Unicode, bytes), arrays are impractical.",
      "HashMap children: memory proportional to the actual children, but slower and with object overhead.",
      "Sorted arrays or lists of children are compact and fine for small fan-out.",
      "Radix trees store whole substrings on edges to collapse long single-child chains.",
    ],
    cost: "Every choice trades memory for speed, and measuring on real data is the only reliable way to choose.",
    tryIt:
      "Build the same 50,000-word trie with array children and with HashMap children, and compare memory use (with a profiler or Runtime) and lookup time.",
    buildsOn: "Java week 24: Trie",
  },
  "J24:3": {
    why: "Some problems need both range queries and updates on the same array, such as the minimum price between two days while prices change.",
    problem:
      "Prefix sums answer range sums in O(1) but need O(n) to rebuild after each update; scanning gives O(1) updates but O(n) queries.",
    how: "A segment tree stores a summary (sum, min or max) for every segment of the array in a binary tree. Queries combine O(log n) segments, and an update fixes the O(log n) segments containing that index.",
    tech: [
      "Each node covers a range [l, r]: the root covers the whole array, children cover the two halves, leaves single elements.",
      "Stored in an array of size about 4n, with children at 2i and 2i + 1.",
      "Build in O(n) bottom-up.",
      "Range query: combine nodes fully inside the range, recurse into partly overlapping ones; O(log n).",
      "Point update: change the leaf and recompute its ancestors; O(log n).",
      "Lazy propagation extends it to range updates.",
    ],
    cost: "It takes more code and memory than prefix sums, and it's easy to make off-by-one mistakes in the range logic.",
    tryIt:
      "Implement a segment tree for range minimum with point updates, and test it against brute force on 1,000 random operations.",
    buildsOn: "Java week 14: Prefix sums",
  },
  "J24:4": {
    why: "For the common case of prefix sums with updates, a Fenwick tree does the job in a few lines of code.",
    problem:
      "A segment tree is more than you need when you only want sums with point updates.",
    how: "A Fenwick tree (binary indexed tree) stores partial sums in an array where each index covers a range determined by its lowest set bit. Queries and updates jump through indexes using that bit.",
    tech: [
      "Index i (1-based) stores the sum of the last (i & -i) elements up to i.",
      "i & -i isolates the lowest set bit, using two's complement (Java week 14: Bit manipulation).",
      "prefixSum(i): add tree[i], then i -= i & -i, until i is 0; O(log n).",
      "update(i, delta): add delta to tree[i], then i += i & -i, while i ≤ n; O(log n).",
      "Range sum (l, r) = prefixSum(r) - prefixSum(l - 1).",
    ],
    cost: "Less flexible than a segment tree (min and max with updates don't fit well), and the 1-based indexing trips people up.",
    tryIt:
      "Implement a Fenwick tree and use it to count inversions in an array in O(n log n).",
    buildsOn: "Java week 14: Bit manipulation",
  },
  "J24:5": {
    why: "Picking the simplest structure that handles your operations keeps code short and fast.",
    problem:
      "Reaching for a segment tree when prefix sums would do adds code and bugs; using prefix sums with frequent updates is too slow.",
    how: "Choose by which operations you need: static data uses prefix sums, point updates with sums use a Fenwick tree, and anything more general uses a segment tree.",
    tech: [
      "No updates, range sums: prefix sums, O(1) per query (Java week 14: Prefix sums).",
      "Range updates, then reads at the end: a difference array (Java week 14: Difference arrays).",
      "Point updates and prefix or range sums: a Fenwick tree.",
      "Point or range updates with min, max, GCD or custom combinations: a segment tree (with lazy propagation for range updates).",
      "Only the min or max of a sliding window: a monotonic deque (Java week 16: Monotonic deque).",
    ],
    cost: "Simpler structures can't be extended easily if requirements change later, so mention the trade-off.",
    tryIt:
      "For 5 problems involving ranges, write down which structure fits each and why, before solving them.",
    buildsOn: "Java week 14: Prefix sums",
  },

  // ---- Week 25: Graphs I: representation, BFS, DFS ----
  "J25:0": {
    why: "Graphs model anything with connections: roads, friendships, web links, dependencies, networks. Many problems become simple once seen as graphs.",
    problem:
      "Without the vocabulary, it's hard to recognise that a problem is a graph problem or to choose the right algorithm for it.",
    how: "A graph is a set of vertices (nodes) connected by edges. Edges can have direction and weight, and these properties decide which algorithms apply.",
    tech: [
      "Vertices (V) and edges (E); an edge connects two vertices.",
      "Undirected edges go both ways (friendship); directed edges go one way (follows, depends on).",
      "Weighted edges carry a cost (distance, time); unweighted edges all count as 1.",
      "Degree: the number of edges at a vertex (in-degree and out-degree for directed graphs).",
      "Path: a sequence of connected vertices. Cycle: a path that returns to its start.",
      "Connected component: a group of vertices all reachable from each other. DAG: a directed acyclic graph, with no directed cycles.",
    ],
    cost: "Graph terminology varies slightly between sources; define terms when you use them in an interview.",
    tryIt:
      "Draw your own module dependencies or a small friend network as a graph, and label its components, any cycles and the degree of each vertex.",
    buildsOn: "Java week 21: Terminology",
  },
  "J25:1": {
    why: "Before running any graph algorithm, you need to store the graph, and the choice affects speed and memory.",
    problem:
      "A graph with a million vertices and few edges would need a trillion cells as a matrix, but checking whether an edge exists in a list is slower.",
    how: "Choose between an adjacency list (each vertex lists its neighbours), an adjacency matrix (a V × V grid of edge flags) and an edge list (a plain list of pairs).",
    tech: [
      "Adjacency list: List<List<Integer>> adj; O(V + E) space; iterating neighbours is fast. The default for sparse graphs.",
      "Adjacency matrix: boolean[V][V] or int weights; O(V²) space; O(1) edge checks. Good for dense or small graphs.",
      "Edge list: List<int[]> edges; simple; used by Kruskal's algorithm and Bellman-Ford.",
      "Weighted lists store pairs: List<List<int[]>> with {neighbour, weight}.",
      "Most real graphs are sparse (E much smaller than V²).",
    ],
    cost: "Matrices waste memory on sparse graphs; lists make 'is there an edge from u to v?' O(degree).",
    tryIt:
      "Build the same 6-vertex graph as a list, a matrix and an edge list, and write hasEdge and neighbours for each.",
    buildsOn: "Java week 25: Vocabulary",
  },
  "J25:2": {
    why: "Many problems are graphs in disguise, with vertices and edges you never store explicitly.",
    problem:
      "Building an explicit graph for a 1,000 × 1,000 grid or every possible puzzle state wastes memory and time.",
    how: "Treat each position or state as a vertex and generate its neighbours on the fly when the algorithm asks for them.",
    tech: [
      "Grids: each cell is a vertex, and its neighbours are the 4 (or 8) adjacent cells within bounds and not blocked (Java week 14: Matrix traversal).",
      "Word ladder: each word is a vertex; neighbours differ by one letter and are in the dictionary.",
      "State spaces: a puzzle configuration or lock combination is a vertex; each legal move is an edge.",
      "Write a neighbours(state) function instead of an adjacency list.",
      "Encode states compactly (an int or a string) so a visited set can track them.",
    ],
    cost: "State spaces can be astronomically large, so you need good pruning or a better algorithm, not just BFS.",
    tryIt:
      "Solve 'open the lock' (4 wheels of digits, with deadends) with BFS over states generated on the fly.",
    buildsOn: "Java week 25: Representations",
  },
  "J25:3": {
    why: "Breadth-first search explores a graph in rings of increasing distance, which finds shortest paths when every edge costs the same.",
    problem:
      "Finding the fewest steps between two points by trying all paths is exponential.",
    how: "Start from the source, visit all its neighbours, then all their unvisited neighbours, and so on, using a queue so vertices are processed in order of distance.",
    tech: [
      "Queue<Integer> q; boolean[] visited; add the source, mark it, then loop: poll a vertex and add its unvisited neighbours, marking them.",
      "O(V + E) time and O(V) memory.",
      "Process q.size() vertices per round to know the current level (distance).",
      "The first time BFS reaches a vertex is along a shortest path in an unweighted graph; store parents to rebuild the path.",
      "Multi-source BFS: start with several sources in the queue at once (for example 'distance to the nearest exit' from every cell).",
    ],
    cost: "BFS stores a whole frontier, which can be large, and it doesn't handle weighted edges (Java week 27: Dijkstra's algorithm).",
    tryIt:
      "Find the shortest path through a grid maze with BFS, print the path using parent pointers, then solve 'rotting oranges' with multi-source BFS.",
    buildsOn: "Java week 16: Queue",
  },
  "J25:4": {
    why: "Depth-first search follows one path as far as it can before backing up. It's the basis of many graph algorithms.",
    problem:
      "To find connected regions, detect cycles or order dependencies, you need to explore everything reachable, systematically and without revisiting.",
    how: "From a vertex, mark it visited and recursively visit each unvisited neighbour; or do the same with an explicit stack.",
    tech: [
      "Recursive: dfs(u) { visited[u] = true; for (v : adj[u]) if (!visited[v]) dfs(v); }; O(V + E).",
      "Iterative: an explicit stack avoids StackOverflowError on deep graphs (Java week 17: The call stack during recursion).",
      "Pre-order (when entering a vertex) and post-order (after all its neighbours) are both useful; post-order is key to topological sort (Java week 26).",
      "Connected components: start a DFS from every unvisited vertex and count the starts.",
      "Flood fill: DFS over grid cells of the same colour (the paint bucket tool).",
    ],
    cost: "Deep recursion can overflow the stack on large graphs, and DFS doesn't find shortest paths.",
    tryIt:
      "Count islands in a grid with recursive DFS, then rewrite it with an explicit stack and run it on a 2,000 × 2,000 all-land grid.",
    buildsOn: "Java week 17: Thinking recursively",
  },
  "J25:5": {
    why: "A tiny ordering mistake in marking vertices as visited makes BFS slow or wrong, and it's one of the most common graph bugs.",
    problem:
      "If BFS marks a vertex visited only when it's taken off the queue, the same vertex can be added many times by different neighbours, blowing up time and memory.",
    how: "In BFS, mark a vertex visited when you add it to the queue, not when you remove it, so each vertex enters the queue exactly once.",
    tech: [
      "Correct: if (!visited[v]) { visited[v] = true; q.add(v); }.",
      "Wrong: marking after poll lets a vertex sit in the queue several times; on grids this can be exponentially worse.",
      "Mark the source before the loop starts.",
      "In DFS, mark on entry, before recursing into neighbours.",
      "For Dijkstra's algorithm it's the opposite: a vertex is final only when it's polled, and stale entries are skipped (Java week 27).",
    ],
    cost: "Choosing a marking rule needs care in each algorithm; copying one into another is a common error.",
    tryIt:
      "Run BFS on a 300 × 300 open grid, marking on enqueue and then on dequeue, and count the total queue insertions in each case.",
    buildsOn: "Java week 25: BFS",
  },

  // ---- Week 26: Graphs II: topological sort, cycles, union-find ----
  "J26:0": {
    why: "Many real systems are directed graphs without cycles: build steps, course prerequisites, task pipelines, spreadsheet formulas.",
    problem:
      "If dependencies contain a cycle, nothing can start; if they don't, you still need an order that respects every dependency.",
    how: "Model 'A must come before B' as a directed edge A → B. A graph with no directed cycle (a DAG) always has at least one valid order.",
    tech: [
      "Directed edges have a from and a to; reachability is one-way.",
      "In-degree: edges coming in (prerequisites); out-degree: edges going out (things that depend on it).",
      "A DAG always has at least one vertex with in-degree 0, a place to start.",
      "Examples: Maven and Gradle dependency graphs, CI job graphs, course prerequisites, the commit graph in git (Main week 5: The object model).",
    ],
    cost: "Real dependency graphs can be large and change often; you'll need to re-check for cycles whenever edges are added.",
    tryIt:
      "Draw the dependency graph of 6 university courses and find two different valid orders to take them.",
    buildsOn: "Java week 25: Vocabulary",
  },
  "J26:1": {
    why: "Cycles cause deadlocks, infinite loops and impossible schedules. Detecting them is a core graph skill.",
    problem:
      "In undirected graphs, every edge looks like a cycle back to its parent; in directed graphs, reaching an already visited vertex doesn't always mean a cycle.",
    how: "Undirected: a cycle exists if DFS reaches a visited vertex that isn't the one it came from (or union-find finds both ends already connected). Directed: track which vertices are on the current DFS path; reaching one of those means a cycle.",
    tech: [
      "Undirected DFS: pass the parent; a visited neighbour other than the parent closes a cycle.",
      "Undirected union-find: for each edge, if both ends already have the same root, the edge creates a cycle (Java week 26: Union-Find).",
      "Directed DFS with three colours: white (unvisited), grey (on the current path), black (finished).",
      "An edge to a grey vertex is a back edge, which means a cycle; an edge to a black vertex is fine.",
      "Kahn's algorithm also detects directed cycles: if it can't output every vertex, a cycle exists.",
    ],
    cost: "Using the undirected method on a directed graph (or the reverse) gives wrong answers, a frequent mistake.",
    tryIt:
      "Solve 'course schedule' (can all courses be finished?) with three-colour DFS, and 'redundant connection' with union-find.",
    buildsOn: "Java week 25: DFS",
  },
  "J26:2": {
    why: "Build systems, task schedulers and package managers need to order work so every dependency comes first.",
    problem:
      "Simply sorting tasks by name or number ignores dependencies, and trying all orders is factorial time.",
    how: "Either do a DFS and output vertices in reverse post-order, or repeatedly take vertices with no remaining prerequisites (Kahn's algorithm).",
    tech: [
      "DFS method: run DFS from every vertex; when a vertex finishes (post-order), push it on a stack; the stack from top to bottom is a valid order.",
      "Kahn's algorithm: compute in-degrees, queue every vertex with in-degree 0, pop one, output it, and decrease its neighbours' in-degrees, queueing any that reach 0.",
      "Both are O(V + E).",
      "If Kahn's outputs fewer than V vertices, the graph has a cycle.",
      "Using a priority queue in Kahn's gives the lexicographically smallest order.",
    ],
    cost: "There are usually many valid orders, so tests must check validity rather than one exact answer.",
    tryIt:
      "Implement both methods for 'course schedule II', and write a checker that confirms an order respects every edge.",
    buildsOn: "Java week 26: Directed graphs and DAGs",
  },
  "J26:3": {
    why: "Some problems ask 'are these two connected?' while connections keep being added. Running BFS for every question is too slow.",
    problem:
      "With many union and connected queries, recomputing components each time is O(V + E) per query.",
    how: "Union-Find keeps each component as a tree with a root representative. find(x) returns x's root; union(a, b) links one root under the other. Two optimisations make both nearly O(1).",
    tech: [
      "int[] parent where parent[x] == x for roots; find follows parents up to the root.",
      "Union: link the root of one set under the root of the other.",
      "Union by rank or size: attach the smaller tree under the larger, keeping trees shallow.",
      "Path compression: during find, point every visited node directly at the root.",
      "With both, operations take O(α(n)) amortized, where α (the inverse Ackermann function) is at most 4 for any realistic n.",
    ],
    cost: "Union-Find can't easily split sets apart or list a set's members without extra work.",
    tryIt:
      "Implement Union-Find with both optimisations and process 10⁶ random unions and finds, comparing the time without the optimisations.",
    buildsOn: "Java week 25: DFS",
  },
  "J26:4": {
    why: "Union-Find turns up in more problems than its narrow definition suggests.",
    problem:
      "Problems about grouping, merging accounts or connecting networks look different from each other, so it's easy to miss that one tool solves them all.",
    how: "Whenever a problem keeps merging groups and asks whether things are in the same group, think Union-Find.",
    tech: [
      "Dynamic connectivity: network links added over time, with 'can A reach B?' queries.",
      "Counting components: start with V components and decrease by one for each successful union.",
      "Detecting redundant edges: the first edge whose ends are already connected forms a cycle.",
      "Kruskal's minimum spanning tree uses it to skip edges that would form a cycle (Java week 27).",
      "Merging accounts that share an email, or grouping equal elements under equivalence rules.",
    ],
    cost: "When you also need paths or distances between items, BFS or DFS is more appropriate.",
    tryIt: "Solve 'number of provinces' and 'accounts merge' with Union-Find.",
    buildsOn: "Java week 26: Union-Find",
  },

  // ---- Week 27: Graphs III: shortest paths and spanning trees ----
  "J27:0": {
    why: "Maps, network routing and games need the cheapest path when edges have different costs. Dijkstra's algorithm is the standard answer.",
    problem:
      "BFS finds fewest edges, not lowest total cost: a path with many cheap roads can beat one with a single expensive road.",
    how: "Always expand the unfinished vertex with the smallest known distance next, using a priority queue, and relax its edges: if going through it gives a neighbour a shorter distance, update it.",
    tech: [
      "dist[] starts at infinity, dist[source] = 0; push (0, source) on a min-heap (Java week 23: Java's PriorityQueue).",
      "Poll the smallest (d, u); skip it if d > dist[u] (a stale entry).",
      "For each edge u → v with weight w: if dist[u] + w < dist[v], update dist[v] and push (dist[v], v).",
      "O((V + E) log V) with a binary heap.",
      "Negative edges break it: a vertex is treated as final when polled, but a negative edge found later could still lower its distance.",
    ],
    cost: "It only works with non-negative weights, and it computes distances from one source at a time.",
    tryIt:
      "Implement Dijkstra's algorithm with path reconstruction on a weighted graph of 8 cities, then add one negative edge that makes it return a wrong answer.",
    buildsOn: "Java week 23: Java's PriorityQueue",
  },
  "J27:1": {
    why: "Some graphs have negative weights, such as rebates, gains or currency exchange rates, and Dijkstra's algorithm fails on them.",
    problem:
      "With negative edges, you can't finalise a vertex early, and a cycle with a negative total means the 'shortest' path can keep getting shorter forever.",
    how: "Bellman-Ford relaxes every edge V - 1 times. One more pass that still improves a distance proves a negative cycle exists.",
    tech: [
      "A shortest simple path has at most V - 1 edges, so V - 1 rounds of relaxing all edges are enough.",
      "Each round: for every edge (u, v, w), if dist[u] + w < dist[v], update dist[v].",
      "O(V·E) time, much slower than Dijkstra's.",
      "If round V still improves something, a reachable negative cycle exists.",
      "Limiting rounds to k gives 'cheapest path with at most k edges' (the cheapest flights with k stops problem).",
    ],
    cost: "Too slow for large graphs; use it only when negative edges or edge limits require it.",
    tryIt:
      "Detect an arbitrage opportunity in a table of currency exchange rates by running Bellman-Ford on -log(rate) weights.",
    buildsOn: "Java week 27: Dijkstra's algorithm",
  },
  "J27:2": {
    why: "Sometimes you need the shortest distance between every pair of vertices, such as a distance table for all the cities on a small map.",
    problem:
      "Running a single-source algorithm from every vertex is fiddly and, for dense graphs, no faster.",
    how: "Floyd-Warshall gradually allows each vertex in turn as a possible stop in the middle of a path, updating every pair's distance if going through it is shorter.",
    tech: [
      "dist[i][j] starts as the edge weight (or infinity), with dist[i][i] = 0.",
      "for k, for i, for j: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]); k must be the outer loop.",
      "O(V³) time, O(V²) memory, which works up to a few hundred vertices.",
      "Handles negative edges; a negative dist[i][i] at the end reveals a negative cycle.",
      "Very short to write, which makes it useful in interviews with small V.",
    ],
    cost: "Cubic time rules it out for large graphs, and it computes every pair even if you only need a few.",
    tryIt:
      "Compute all-pairs distances for a 5-city graph with Floyd-Warshall, then swap the loop order to put k inside and see the results go wrong.",
    buildsOn: "Java week 27: Dijkstra's algorithm",
  },
  "J27:3": {
    why: "In a DAG, shortest (and longest) paths are easier than in general graphs, which is useful for scheduling and critical-path problems.",
    problem:
      "Dijkstra's algorithm needs a heap and non-negative weights, and longest paths in general graphs are very hard.",
    how: "Process vertices in topological order and relax each vertex's outgoing edges once. Every edge into a vertex has been handled before it's processed.",
    tech: [
      "Topologically sort the DAG (Java week 26: Topological sort).",
      "Initialise dist, then for each u in that order, relax every edge u → v.",
      "O(V + E) total, with negative weights allowed.",
      "Longest path: negate weights or use max instead of min; this finds the critical path in project scheduling.",
      "The same idea is DP over a DAG (Java week 29).",
    ],
    cost: "It only works on DAGs; any cycle breaks the topological order.",
    tryIt:
      "Find the minimum total time to finish a set of tasks with durations and dependencies (the critical path) using topological order.",
    buildsOn: "Java week 26: Topological sort",
  },
  "J27:4": {
    why: "Connecting every point in a network as cheaply as possible (cables, roads, pipes) is the minimum spanning tree problem.",
    problem:
      "There are exponentially many ways to connect V vertices, and greedily joining nearest neighbours can leave the network disconnected.",
    how: "Kruskal's algorithm adds the cheapest remaining edge that doesn't form a cycle. Prim's algorithm grows one tree, always adding the cheapest edge leaving it.",
    tech: [
      "A spanning tree connects all V vertices with exactly V - 1 edges and no cycles.",
      "Kruskal's: sort edges by weight, and add each one whose ends are in different Union-Find sets (Java week 26: Union-Find); O(E log E).",
      "Prim's: start from any vertex, keep a min-heap of edges leaving the tree, and add the cheapest edge to a new vertex; O(E log V).",
      "Both are greedy algorithms proven correct by the cut property: the cheapest edge across any split of the vertices belongs to some MST.",
      "Kruskal's suits sparse edge lists; Prim's suits adjacency lists and dense graphs.",
    ],
    cost: "An MST minimises total cost, not the distance between any two particular points; it's not a shortest-path tree.",
    tryIt:
      "Find the minimum cost to connect all points in a plane ('min cost to connect all points') with both Kruskal's and Prim's, and check the totals match.",
    buildsOn: "Java week 26: Union-Find",
  },
  "J27:5": {
    why: "Choosing the right shortest-path algorithm is mostly about the graph's properties. A wrong choice is slow or simply wrong.",
    problem:
      "Applying Dijkstra's algorithm everywhere fails on negative edges, and Floyd-Warshall on a large graph never finishes.",
    how: "Ask four questions: are edges weighted, can they be negative, is the graph a DAG, and do you need one source or all pairs?",
    tech: [
      "Unweighted: BFS, O(V + E) (Java week 25: BFS).",
      "Weights of only 0 and 1: 0-1 BFS with a deque, O(V + E).",
      "Non-negative weights, one source: Dijkstra's, O((V + E) log V).",
      "Negative weights or a limit on edges: Bellman-Ford, O(V·E).",
      "DAG: topological order, O(V + E), negative weights allowed.",
      "All pairs on a small graph: Floyd-Warshall, O(V³).",
    ],
    cost: "Real problems may need variants such as A* search with heuristics, or precomputation for very large road networks, beyond these basics.",
    tryIt:
      "For 6 shortest-path problems, pick an algorithm for each before reading the solution, and note which property decided it.",
    buildsOn: "Java week 27: Dijkstra's algorithm",
  },

  // ---- Week 28: Greedy algorithms ----
  "J28:0": {
    why: "Greedy algorithms make the best-looking choice at each step and never reconsider. When that works, it gives simple, fast solutions.",
    problem:
      "Many optimisation problems seem to need trying every combination, which is exponential.",
    how: "A greedy algorithm works when two properties hold: a locally best choice is always part of some optimal solution (the greedy-choice property), and what remains after it is a smaller instance of the same problem (optimal substructure).",
    tech: [
      "Greedy-choice property: some optimal solution includes the greedy choice.",
      "Optimal substructure: an optimal solution contains optimal solutions to its subproblems.",
      "Greedy algorithms are usually O(n log n), dominated by sorting.",
      "Dynamic programming also needs optimal substructure, but it considers all choices instead of one (Java week 29).",
      "Dijkstra's, Prim's and Kruskal's algorithms are all greedy (Java week 27).",
    ],
    cost: "Greedy algorithms are often wrong, and wrong ones look just as convincing as right ones, so they need proof or careful testing.",
    tryIt:
      "For coin change with coins {1, 5, 10, 25}, check that greedy works for 1 to 100; then try coins {1, 3, 4} and amount 6.",
    buildsOn: "Java week 27: Minimum spanning tree",
  },
  "J28:1": {
    why: "Since greedy algorithms can be subtly wrong, you need ways to convince yourself, and an interviewer, that one is correct.",
    problem:
      "'It worked on my examples' isn't proof; greedy algorithms often fail on one specific arrangement you didn't try.",
    how: "Use an exchange argument (any optimal solution can be changed step by step into the greedy one without getting worse) or show that greedy stays ahead (after each step, greedy is at least as good as any other solution).",
    tech: [
      "Exchange argument: take an optimal solution that differs from greedy at the first choice, swap in the greedy choice, and show the result is still valid and no worse.",
      "Greedy stays ahead: define a measure of progress and show by induction that greedy's progress is never behind.",
      "Activity selection: picking the earliest-finishing activity leaves the most room, which greedy stays ahead proves.",
      "Counterexamples: try small cases with a brute-force checker to find failures quickly.",
      "A randomised comparison with a brute-force solution on thousands of small inputs is strong practical evidence.",
    ],
    cost: "Proofs take time and practice, and in interviews a clear informal argument is usually enough.",
    tryIt:
      "Write a brute-force checker for interval scheduling and compare it with greedy by earliest finish, then by earliest start, on 10,000 random small inputs.",
    buildsOn: "Java week 28: The greedy-choice property",
  },
  "J28:2": {
    why: "A handful of classic greedy problems teach recognisable patterns that recur in interviews and real scheduling.",
    problem:
      "Without seeing the classics, it's hard to know which greedy rule (earliest end, best ratio, furthest reach) fits a new problem.",
    how: "Learn each classic with its greedy rule and the reason it works, and note where greedy breaks.",
    tech: [
      "Activity selection and interval scheduling: sort by end time, take each activity that starts after the last one taken.",
      "Fractional knapsack: take items by value per weight, splitting the last one.",
      "Huffman coding: repeatedly merge the two least frequent symbols with a min-heap, building an optimal prefix code (used in compression formats).",
      "Jump game: track the furthest reachable index in one pass.",
      "Gas station: if the total gas covers the total cost, start after the point where the running sum is lowest.",
      "Coin change: greedy works for standard currencies like {1, 5, 10, 25} but fails for arbitrary coin sets.",
    ],
    cost: "Each classic has a narrow condition for correctness; small changes to the problem can break the greedy rule.",
    tryIt:
      "Solve non-overlapping intervals, jump game and gas station, writing the greedy rule and a one-line reason for each.",
    buildsOn: "Java week 28: Proving a greedy algorithm correct",
  },
  "J28:3": {
    why: "Most greedy algorithms start by sorting, because the greedy rule needs the items in the right order.",
    problem:
      "Choosing the wrong sort key gives a plausible but wrong greedy algorithm.",
    how: "Identify which property makes an item the best next choice (earliest end, best ratio, largest size) and sort by that; then a single pass makes the choices.",
    tech: [
      "Interval scheduling: sort by end time, not start time or length.",
      "Fractional knapsack: sort by value ÷ weight, descending.",
      "Assign cookies to children: sort both, and match the smallest sufficient cookie with each child.",
      "Sorting costs O(n log n), usually the dominant cost (Java week 19: Sorting objects with Comparator).",
      "Try several candidate keys against a brute-force checker on small inputs to find the right one.",
    ],
    cost: "Sorting loses the original order, so keep indexes when the output needs them.",
    tryIt:
      "For 'minimum number of arrows to burst balloons', compare sorting by start and by end on tricky inputs, and explain which works.",
    buildsOn: "Java week 19: Sorting objects with Comparator",
  },
  "J28:4": {
    why: "Knowing when greedy fails, and dynamic programming is needed, saves you from confidently wrong answers.",
    problem:
      "Problems such as 0/1 knapsack look like they should have a greedy rule, but every simple rule fails on some input.",
    how: "If a locally best choice can block a better combination later, greedy fails; then consider all choices with dynamic programming.",
    tech: [
      "0/1 knapsack: taking the best value-per-weight item can waste capacity; e.g. capacity 50, items (10 kg, 60), (20 kg, 100), (30 kg, 120): ratio-greedy gives 160, the best is 220.",
      "Arbitrary coins {1, 3, 4} for 6: greedy uses 4 + 1 + 1 (3 coins), the best is 3 + 3 (2 coins).",
      "Fractional knapsack allows splitting items, so greedy works there.",
      "Test a greedy idea against a brute force on small inputs; one counterexample is enough to reject it.",
      "DP handles these by considering every choice at each step (Java week 30: Knapsack family).",
    ],
    cost: "DP is slower and uses more memory than greedy, so use greedy whenever you can show it's correct.",
    tryIt:
      "Find counterexamples for three greedy rules on 0/1 knapsack (by value, by weight, by ratio), then solve it with brute force.",
    buildsOn: "Java week 28: The greedy-choice property",
  },

  // ---- Week 29: Dynamic programming I: the method and 1D problems ----
  "J29:0": {
    why: "Dynamic programming (DP) turns many exponential brute-force solutions into polynomial ones. It's the most feared and most rewarding interview topic.",
    problem:
      "Brute-force recursion solves the same subproblems again and again, as naive Fibonacci does, so the work explodes exponentially.",
    how: "When a problem breaks into subproblems that repeat (overlapping subproblems) and the best answer is built from best answers to subproblems (optimal substructure), solve each subproblem once and reuse the result.",
    tech: [
      "Overlapping subproblems: the recursion tree contains the same calls many times (Java week 17: Recursion trees).",
      "Optimal substructure: the optimal answer combines optimal answers to smaller problems.",
      "Storing each subproblem's answer makes the total work (number of distinct subproblems) × (work per subproblem).",
      "Naive fib(n) is O(2ⁿ); with stored results it's O(n).",
      "Signals: 'count the ways', 'minimum or maximum', 'is it possible', with choices at each step.",
    ],
    cost: "DP solutions use memory for the table and can be hard to design and explain, especially defining the state.",
    tryIt:
      "Count the calls of naive fib(30), then add a HashMap cache and count again.",
    buildsOn: "Java week 17: Recursion trees",
  },
  "J29:1": {
    why: "DP feels like magic until you follow the same steps every time. A method turns it into a routine.",
    problem:
      "Trying to guess a DP formula directly rarely works, and when it does, you can't explain it.",
    how: "Work through five questions in order: what's the state, what's the recurrence, what are the base cases, in what order are states computed, and where's the answer.",
    tech: [
      "1. State: what does dp[i] mean, in words?",
      "2. Recurrence: how does dp[i] follow from smaller states?",
      "3. Base cases: the smallest states, answered directly.",
      "4. Order: compute states so their dependencies are already done.",
      "5. Answer: which entry (or combination of entries) is the final answer?",
      "Start from a brute-force recursion: its parameters often become the state.",
    ],
    cost: "Writing out the steps takes time, but skipping them is how most DP bugs happen.",
    tryIt:
      "For 'climbing stairs' (1 or 2 steps at a time), write the answers to all five questions in words before writing any code.",
    buildsOn: "Java week 29: When DP applies",
  },
  "J29:2": {
    why: "The state definition is the heart of every DP solution. A good one makes the rest almost automatic.",
    problem:
      "A vague state ('dp[i] is the answer for i') hides what's being computed, so the recurrence comes out wrong.",
    how: "Write one precise sentence defining what each entry means, including what's included and what's fixed.",
    tech: [
      "Precise: 'dp[i] = the maximum money robbable from houses 0..i'.",
      "Sometimes the definition must pin something down: 'dp[i] = length of the longest increasing subsequence ending exactly at index i'.",
      "The state must capture everything the future depends on, and nothing more.",
      "If a recurrence seems to need more information, add a dimension to the state (dp[i][holding] in stock problems).",
      "The number of states times the work per state gives the complexity.",
    ],
    cost: "Choosing the state is the hardest creative step, and the wrong choice can make the recurrence impossible.",
    tryIt:
      "Write two different state definitions for 'longest increasing subsequence' and decide which one leads to a simple recurrence.",
    buildsOn: "Java week 29: The method",
  },
  "J29:3": {
    why: "The recurrence turns the state definition into a computation.",
    problem:
      "Without considering every possible last choice, the recurrence misses cases and gives answers that are too small or too large.",
    how: "Ask what the last decision could have been for state i, express each option with smaller states, and combine them with min, max or a sum.",
    tech: [
      "House robber: either skip house i (dp[i - 1]) or rob it (dp[i - 2] + money[i]); dp[i] = max of the two.",
      "Climbing stairs: the last step was 1 or 2, so dp[i] = dp[i - 1] + dp[i - 2] (counting ways means adding).",
      "Minimum coins: dp[a] = 1 + min over coins c of dp[a - c].",
      "Every option must be covered, and options must not overlap when counting.",
      "Check the recurrence by hand on a tiny example before coding.",
    ],
    cost: "Recurrences that look right can double-count or miss cases; small hand checks catch most of them.",
    tryIt:
      "Write the recurrence for 'decode ways' (digits to letters, 1-26), and check it by hand on '226'.",
    buildsOn: "Java week 29: Define the state",
  },
  "J29:4": {
    why: "Base cases anchor the recurrence. Wrong ones make every later value wrong.",
    problem:
      "Off-by-one base cases, such as the number of ways to climb 0 stairs, silently shift all results.",
    how: "Set the smallest states directly from their meaning, and check they agree with the recurrence where both apply.",
    tech: [
      "Climbing stairs: dp[0] = 1 (one way: do nothing), dp[1] = 1.",
      "Minimum coins: dp[0] = 0, and unreachable amounts start as infinity (or amount + 1).",
      "House robber: dp[0] = money[0], dp[1] = max(money[0], money[1]).",
      "Empty inputs: decide what the answer should be and handle it explicitly.",
      "Padding (an extra row or column for 'empty') often removes special cases.",
    ],
    cost: "Base cases are easy to overlook in testing; always test the smallest inputs.",
    tryIt:
      "For coin change, run your solution on amount 0, an impossible amount and a single coin, and check each base case is right.",
    buildsOn: "Java week 29: Write the recurrence",
  },
  "J29:5": {
    why: "Bottom-up DP fills a table in a loop. If the loop computes a state before the states it needs, the answer is wrong.",
    problem:
      "With more complex states, the right loop order isn't always 'from 0 to n'.",
    how: "Look at which states each recurrence reads, and order the loops so those are always computed first.",
    tech: [
      "If dp[i] reads dp[i - 1] and dp[i - 2], loop i upward.",
      "If dp[i] reads dp[i + 1], loop downward.",
      "2D states: dp[i][j] reading dp[i - 1][*] needs the i loop outside (Java week 30).",
      "Interval DP: dp[i][j] reads shorter intervals, so loop by interval length (Java week 31).",
      "Top-down memoisation finds the order automatically, which is one of its advantages.",
    ],
    cost: "Getting the order wrong usually produces subtly wrong numbers, not crashes, so it's hard to spot.",
    tryIt:
      "Write a DP where dp[i] depends on dp[i + 1] and dp[i + 2] ('minimum cost to reach the top from step i') and fill it in the correct direction.",
    buildsOn: "Java week 29: Base cases",
  },
  "J29:6": {
    why: "The answer isn't always the last entry of the table. Knowing where it is depends on the state definition.",
    problem:
      "Returning dp[n - 1] when the answer is the maximum over all dp[i] gives wrong results.",
    how: "Use the state definition: if a state is 'the best for the whole input', the answer is one entry; if a state is 'ending exactly at i', the answer is the best over all i.",
    tech: [
      "Climbing stairs: dp[n].",
      "House robber: dp[n - 1].",
      "Longest increasing subsequence with 'ending at i' states: max over all dp[i].",
      "Minimum coins: dp[amount], or -1 if it's still infinity.",
      "Some problems need the choices themselves, not just the value; store parent pointers to reconstruct them.",
    ],
    cost: "Reconstructing the actual solution needs extra memory and code.",
    tryIt:
      "Solve longest increasing subsequence, return the length, then also print one actual subsequence using parent pointers.",
    buildsOn: "Java week 29: Order of computation",
  },
  "J29:7": {
    why: "DP can be written as recursion with a cache or as a loop filling a table. Each has its strengths.",
    problem:
      "Starting with a table is hard when the state is unclear, but recursion can be slow and overflow the stack.",
    how: "Top-down: write the recursive brute force and cache each result (memoisation). Bottom-up: compute states in order in a loop (tabulation).",
    tech: [
      "Memoisation: add a map or array cache to the recursive function, and return cached results before computing.",
      "Top-down computes only the states actually needed and follows the natural recursion.",
      "Bottom-up avoids recursion overhead and stack overflow, and makes space optimisation easier.",
      "Both have the same time complexity in most problems.",
      "A good workflow: brute force, then memoise, then convert to bottom-up if needed.",
    ],
    cost: "Top-down risks StackOverflowError for deep states; bottom-up requires working out the order.",
    tryIt:
      "Solve coin change three ways (brute-force recursion, memoised, bottom-up) and compare their speed for amount 10,000.",
    buildsOn: "Java week 29: When DP applies",
  },
  "J29:8": {
    why: "DP tables can be huge. Often you only need the last few rows or values to continue.",
    problem:
      "A table with 10⁷ entries can exceed memory, even though each step only reads the previous one or two values.",
    how: "Keep only the states the recurrence still needs, such as two variables instead of an array, rolling them forward as you go.",
    tech: [
      "Fibonacci and house robber read only i - 1 and i - 2, so two variables replace the array: O(1) space.",
      "2D DPs that read only the previous row keep two rows, or one (Java week 30: Space optimization).",
      "Update in the right order so you don't overwrite a value before it's read.",
      "You lose the ability to reconstruct the full solution from the table.",
    ],
    cost: "Space-optimised code is harder to read and debug; write the full-table version first.",
    tryIt:
      "Rewrite your house robber solution to use two variables, and confirm it gives the same answers on random inputs.",
    buildsOn: "Java week 29: Top-down vs bottom-up",
  },
  "J29:9": {
    why: "Most 1D DP problems are variations of a few patterns. Learning them gives you a head start on new ones.",
    problem:
      "Each new DP problem feels unique without a set of patterns to compare it to.",
    how: "Learn the core 1D patterns, their state definitions and recurrences, and match new problems to them.",
    tech: [
      "Fibonacci-style: dp[i] depends on a fixed number of previous states (climbing stairs).",
      "Take or skip: dp[i] = max(skip: dp[i - 1], take: dp[i - 2] + value[i]) (house robber).",
      "Decode ways: count ways by looking at the last 1 or 2 characters.",
      "Unbounded coin change: dp[a] over all coins, each usable many times.",
      "Longest increasing subsequence: O(n²) with dp[i] ending at i; O(n log n) with a 'tails' array and binary search (Java week 19: Variants).",
    ],
    cost: "Patterns help, but forcing a problem into the wrong one is a common trap; always check the state definition fits.",
    tryIt:
      "Solve one problem from each pattern, and write its state and recurrence in your patterns note.",
    buildsOn: "Java week 29: The method",
  },
};
