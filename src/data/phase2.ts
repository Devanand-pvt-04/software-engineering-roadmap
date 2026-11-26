import "server-only";
// Phase 2: about 110 extra problems on top of the core 161, weighted toward DP, graphs and Hards.
// Each set pairs with the Java week that teaches its topic. None of these repeat a core problem
// and none need LeetCode Premium. Hints follow the same ladder as the core list: pattern, then hints.

import type { HintLadder } from "./hints";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Phase2Problem {
  slug: string;
  name: string;
  difficulty: Difficulty;
  hint: HintLadder;
}

export interface Phase2Set {
  id: string;
  title: string;
  /** The Java week that teaches the topic; do this set any time after it. */
  week: number;
  why: string;
  problems: Phase2Problem[];
}

const p = (slug: string, name: string, difficulty: Difficulty, pattern: string, ...hints: string[]): Phase2Problem => ({
  slug,
  name,
  difficulty,
  hint: { pattern, hints },
});
const M = "Medium" as const;
const H = "Hard" as const;

export const PHASE2: Phase2Set[] = [
  {
    id: "arrays",
    title: "Arrays, windows and hashing, harder",
    week: 14,
    why: "The core list taught each pattern once. These need two patterns at once, or a twist that breaks the obvious one.",
    problems: [
      p("trapping-rain-water", "Trapping Rain Water", H, "Two pointers with running maxima", "Water above index i is min(max left, max right) - height[i].", "Move the pointer on the side with the smaller max: that side's water is already decided."),
      p("first-missing-positive", "First Missing Positive", H, "Index as a hash (cyclic placement)", "The answer is between 1 and n + 1. Can the array itself act as the set?", "Swap each value v in 1..n to index v - 1 until it's in place; then the first index i with nums[i] != i + 1 gives i + 1."),
      p("minimum-window-substring", "Minimum Window Substring", H, "Variable sliding window + 'how many still missing' counter", "Expand right until the window covers t, then shrink left as far as it stays valid.", "Keep need[c] counts and one integer 'missing'; it drops when a needed char enters and rises when one leaves."),
      p("longest-repeating-character-replacement", "Longest Repeating Character Replacement", M, "Sliding window with max frequency", "A window is fixable if length - (count of its most common letter) ≤ k.", "You never need to decrease maxFreq when shrinking: only a bigger maxFreq can give a longer answer."),
      p("4sum", "4Sum", M, "Sort + two fixed + two pointers", "It's 3Sum with one more outer loop.", "Skip duplicates at every level and use long for the sum to avoid overflow."),
      p("next-permutation", "Next Permutation", M, "Find the pivot from the right", "Scan from the right for the first i with nums[i] < nums[i + 1].", "Swap nums[i] with the smallest larger value to its right, then reverse the suffix after i."),
      p("find-all-anagrams-in-a-string", "Find All Anagrams in a String", M, "Fixed window + frequency counts", "Same as Permutation in String, but record every match.", "Slide a window of |p| with an int[26] and track how many of the 26 counts currently match."),
      p("fruit-into-baskets", "Fruit Into Baskets", M, "Longest window with at most 2 distinct", "Rephrase: longest subarray with at most two distinct values.", "Map of value → count; while the map has more than 2 keys, shrink from the left."),
      p("subarray-sums-divisible-by-k", "Subarray Sums Divisible by K", M, "Prefix sums + counts of remainders", "Two prefix sums with the same remainder mod k bound a divisible subarray.", "Normalise negative remainders with ((x % k) + k) % k; start with count[0] = 1."),
      p("count-number-of-nice-subarrays", "Count Number of Nice Subarrays", M, "atMost(k) - atMost(k - 1)", "Exactly k is hard to window directly. What about at most k?", "Count subarrays with at most k odds using a window, then subtract at most k - 1."),
    ],
  },
  {
    id: "lists-stacks",
    title: "Linked lists and stacks, harder",
    week: 16,
    why: "Pointer surgery and the monotonic stack are where most people still slip after the core list.",
    problems: [
      p("copy-list-with-random-pointer", "Copy List with Random Pointer", M, "Old → new map (or interleaving)", "First create every copy, then wire next and random.", "A HashMap<Node, Node> from original to copy makes the second pass easy; interleaving does it in O(1) space."),
      p("reverse-nodes-in-k-group", "Reverse Nodes in k-Group", H, "Reverse in chunks with a dummy head", "Check that k nodes remain before reversing a group.", "Keep prevGroupTail; reverse k nodes, then connect prevGroupTail → new head and old head → next group."),
      p("maximal-rectangle", "Maximal Rectangle", H, "Histogram per row + largest rectangle", "Treat each row as the floor of a histogram of consecutive 1s above it.", "Update heights row by row and run the Largest Rectangle in Histogram stack on each."),
      p("asteroid-collision", "Asteroid Collision", M, "Stack simulation", "Only a left-moving asteroid meeting a right-moving one on the stack collides.", "While the top is positive and the new one negative, compare sizes; pop, destroy, or both."),
      p("basic-calculator", "Basic Calculator", H, "Stack of (result, sign) for parentheses", "Without parentheses it's a running sum with a sign.", "On '(' push the current result and sign and reset; on ')' pop and combine."),
      p("sum-of-subarray-minimums", "Sum of Subarray Minimums", M, "Monotonic stack contribution counting", "Each element is the minimum of some subarrays. How many?", "left[i] × right[i] subarrays, using previous-less and next-less-or-equal from monotonic stacks (to avoid double counting)."),
      p("online-stock-span", "Online Stock Span", M, "Monotonic stack with merged spans", "Yesterday's span already covers days you would re-scan.", "Keep a stack of (price, span); pop while price ≤ today's and add their spans."),
    ],
  },
  {
    id: "backtracking",
    title: "Backtracking, harder",
    week: 17,
    why: "Duplicates, pruning and constraint checking are what separate a working backtracker from a fast one.",
    problems: [
      p("combination-sum-ii", "Combination Sum II", M, "Backtracking with sorted duplicate skipping", "Each number is used once, but values repeat.", "Sort; in each loop skip i > start where nums[i] == nums[i - 1]; stop when the value exceeds the remainder."),
      p("permutations-ii", "Permutations II", M, "Used[] + skip equal unused siblings", "Same as Permutations, but equal values would produce equal results.", "Sort; skip nums[i] if it equals nums[i - 1] and nums[i - 1] isn't used in the current path."),
      p("word-search", "Word Search", M, "Grid DFS with in-place marking", "Start a DFS from every cell matching word[0].", "Mark the cell (e.g. '#') before recursing and restore it after; return early on success."),
      p("palindrome-partitioning", "Palindrome Partitioning", M, "Backtracking over cut positions", "Choose the first piece, which must be a palindrome, then recurse on the rest.", "Precompute isPal[i][j] with DP so each check is O(1)."),
      p("sudoku-solver", "Sudoku Solver", H, "Backtracking with constraint sets", "Fill empty cells one at a time with a digit that fits.", "Keep boolean rows[9][10], cols[9][10], boxes[9][10]; box index is (r / 3) * 3 + c / 3."),
    ],
  },
  {
    id: "binary-search",
    title: "Binary search, harder",
    week: 20,
    why: "Binary search on unusual monotonic properties, and on an answer you count rather than compute.",
    problems: [
      p("search-in-rotated-sorted-array-ii", "Search in Rotated Sorted Array II", M, "Rotated binary search with duplicates", "Duplicates can hide which half is sorted.", "When nums[lo] == nums[mid] == nums[hi], shrink both ends by one; otherwise proceed as in the version without duplicates."),
      p("find-peak-element", "Find Peak Element", M, "Binary search on slope", "If nums[mid] < nums[mid + 1], a peak must exist to the right.", "Move toward the rising side; lo == hi at the end is a peak."),
      p("minimum-number-of-days-to-make-m-bouquets", "Minimum Number of Days to Make m Bouquets", M, "Binary search on the answer", "If you can make m bouquets by day d, you can by any later day.", "Search days in [min, max]; check(d) counts runs of k adjacent bloomed flowers."),
      p("find-k-th-smallest-pair-distance", "Find K-th Smallest Pair Distance", H, "Binary search on value + two-pointer count", "Guess a distance d. How many pairs are ≤ d?", "After sorting, a sliding left pointer counts pairs ≤ d in O(n); find the smallest d with count ≥ k."),
    ],
  },
  {
    id: "trees",
    title: "Trees, harder",
    week: 22,
    why: "Tree problems in interviews are rarely plain traversals; these mix in state, coordinates or a second pass.",
    problems: [
      p("binary-tree-zigzag-level-order-traversal", "Binary Tree Zigzag Level Order Traversal", M, "BFS by level, alternate direction", "Do normal level-order BFS.", "Add each level's values to the front or back of a deque depending on the level's parity."),
      p("count-good-nodes-in-binary-tree", "Count Good Nodes in Binary Tree", M, "DFS carrying the path maximum", "A node is good if nothing above it is bigger.", "Pass max-so-far down; count the node if node.val ≥ max."),
      p("path-sum-iii", "Path Sum III", M, "Prefix sums on a root-to-node path", "It's Subarray Sum Equals K, but on every root-to-leaf path.", "Keep a map of prefix-sum counts along the current path; add on the way down, remove on the way back."),
      p("all-nodes-distance-k-in-binary-tree", "All Nodes Distance K in Binary Tree", M, "Add parent links, then BFS", "A tree is a graph if you can also go up.", "Record each node's parent with a DFS, then BFS k steps from target with a visited set."),
      p("maximum-width-of-binary-tree", "Maximum Width of Binary Tree", M, "BFS with heap-style indices", "Give each node a position: left child 2i, right child 2i + 1.", "Width of a level = last index - first index + 1; re-base indices per level to avoid overflow."),
      p("flatten-binary-tree-to-linked-list", "Flatten Binary Tree to Linked List", M, "Reverse preorder (right, left, root)", "The final order is preorder.", "Visit right, then left, then set node.right = prev, node.left = null, prev = node."),
      p("recover-binary-search-tree", "Recover Binary Search Tree", M, "Inorder traversal, find the two inversions", "An inorder walk of a BST is sorted; two swapped nodes break that.", "Track prev; the first bad pair gives first = prev, the last bad pair gives second = current; swap values."),
      p("vertical-order-traversal-of-a-binary-tree", "Vertical Order Traversal of a Binary Tree", H, "Coordinates + sort", "Give each node (col, row).", "Collect (col, row, val), sort by col, then row, then val, and group by col."),
      p("serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", H, "Preorder with null markers", "A preorder walk that writes nulls captures the shape exactly.", "Write 'N' for null; to rebuild, read tokens from a queue recursively in the same order."),
    ],
  },
  {
    id: "heaps",
    title: "Heaps and data structures, harder",
    week: 24,
    why: "Heaps combined with greedy choices, and the range structures from week 24 on real problems.",
    problems: [
      p("reorganize-string", "Reorganize String", M, "Max-heap, never place the same char twice", "Always place the most frequent remaining letter, unless it was just placed.", "Pop two letters at a time from a max-heap of counts; impossible if any count > (n + 1) / 2."),
      p("ipo", "IPO", H, "Two heaps: by capital, then by profit", "At each step you may pick any project you can afford. Which one?", "Sort projects by capital; push affordable ones into a max-heap of profit; take the top k times."),
      p("smallest-range-covering-elements-from-k-lists", "Smallest Range Covering Elements from K Lists", H, "Min-heap of k pointers + running max", "A range must include one element from each list.", "Heap holds one element per list; range = current max - heap min; advance the list that gave the min."),
      p("longest-word-in-dictionary", "Longest Word in Dictionary", M, "Trie where every prefix is a word", "A word counts only if each prefix is also in the list.", "Insert all words into a trie, then DFS only through nodes that end a word."),
      p("count-of-range-sum", "Count of Range Sum", H, "Prefix sums + merge sort (or Fenwick tree)", "You need pairs i < j with lower ≤ prefix[j] - prefix[i] ≤ upper.", "During merge sort of prefix sums, for each left element move two pointers over the right half to count the valid range."),
    ],
  },
  {
    id: "graphs-traversal",
    title: "Graph traversal, more practice",
    week: 25,
    why: "BFS and DFS show up in most interview loops. These are the shapes that come up again and again.",
    problems: [
      p("keys-and-rooms", "Keys and Rooms", M, "Plain DFS/BFS reachability", "Rooms are nodes, keys are edges.", "Visit from room 0 and check that everything was visited."),
      p("surrounded-regions", "Surrounded Regions", M, "Mark from the border inward", "Which 'O's can't be captured?", "DFS from every border 'O' to mark safe cells; flip the rest to 'X', then restore safe ones."),
      p("number-of-enclaves", "Number of Enclaves", M, "Flood fill from the border", "Same idea as Surrounded Regions.", "Sink every land cell reachable from the border, then count what's left."),
      p("01-matrix", "01 Matrix", M, "Multi-source BFS", "BFS from every 1 separately is too slow.", "Put all 0s in the queue at distance 0 and BFS outward once."),
      p("shortest-path-in-binary-matrix", "Shortest Path in Binary Matrix", M, "BFS on a grid with 8 directions", "Unweighted shortest path means BFS.", "Check start and end are 0; BFS with distance in the queue or by levels."),
      p("snakes-and-ladders", "Snakes and Ladders", M, "BFS over squares + index conversion", "Each square is a node with up to six edges.", "Write a helper that maps square number → (row, col) for the boustrophedon board."),
      p("open-the-lock", "Open the Lock", M, "BFS over states", "Each 4-digit combination is a node with 8 neighbours.", "Put deadends in the visited set from the start."),
      p("word-ladder", "Word Ladder", H, "BFS with wildcard buckets", "Words are nodes; edges join words that differ by one letter.", "Pre-bucket words by patterns like h*t, or try all 26 letters per position against a set."),
      p("word-ladder-ii", "Word Ladder II", H, "BFS to build a parent DAG, then DFS for paths", "Find shortest distances first; only then enumerate paths.", "BFS level by level recording parents (only from the previous level), then backtrack from end to start."),
    ],
  },
  {
    id: "graphs-structure",
    title: "Graph structure: topo sort, union-find, components",
    week: 26,
    why: "Dependency ordering and connectivity are the backbone of most graph Hards.",
    problems: [
      p("find-eventual-safe-states", "Find Eventual Safe States", M, "Reverse graph + Kahn's algorithm (or 3-colour DFS)", "A node is safe if every path from it ends at a terminal node.", "Reverse the edges and topologically sort from the terminals; everything you reach is safe."),
      p("number-of-operations-to-make-network-connected", "Number of Operations to Make Network Connected", M, "Union-find, count components", "You need components - 1 cables.", "If edges < n - 1 it's impossible; otherwise count components with union-find."),
      p("satisfiability-of-equality-equations", "Satisfiability of Equality Equations", M, "Union-find in two passes", "Process all '==' first.", "Union equal variables, then check that no '!=' pair shares a root."),
      p("most-stones-removed-with-same-row-or-column", "Most Stones Removed with Same Row or Column", M, "Union-find on rows and columns", "Stones sharing a row or column are in the same component.", "Answer = stones - components; union row r with column (c + 10001)."),
      p("making-a-large-island", "Making A Large Island", H, "Label components, then try each 0", "Label each island with an id and size.", "For each 0, sum the sizes of distinct neighbouring island ids + 1."),
      p("longest-increasing-path-in-a-matrix", "Longest Increasing Path in a Matrix", H, "DFS + memo on a DAG", "Increasing edges can't form cycles, so it's a DAG.", "memo[r][c] = 1 + max over larger neighbours; or topologically sort by out-degree."),
      p("parallel-courses-iii", "Parallel Courses III", H, "Topological order + longest path", "A course can start when its slowest prerequisite finishes.", "Kahn's algorithm; finish[v] = max(finish[v], finish[u] + time[v])."),
      p("critical-connections-in-a-network", "Critical Connections in a Network", H, "Tarjan's bridges (discovery time + low-link)", "An edge is a bridge if its subtree can't reach above it.", "DFS with disc[] and low[]; edge (u, v) is critical when low[v] > disc[u]."),
    ],
  },
  {
    id: "graphs-paths",
    title: "Shortest paths, more practice",
    week: 27,
    why: "Dijkstra variants and modelling tricks (state, 0-1 BFS) are the most common graph Hards.",
    problems: [
      p("path-with-maximum-probability", "Path with Maximum Probability", M, "Dijkstra with max-heap on product", "Multiplying probabilities ≤ 1 never increases them, so greedy still works.", "Use a max-heap keyed on probability; relax when prob[u] × w > prob[v]."),
      p("number-of-ways-to-arrive-at-destination", "Number of Ways to Arrive at Destination", M, "Dijkstra + counting ways", "Track how many shortest paths reach each node.", "On a strictly shorter distance, copy ways; on an equal one, add ways (mod 1e9 + 7). Use long distances."),
      p("minimum-cost-to-make-at-least-one-valid-path-in-a-grid", "Minimum Cost to Make at Least One Valid Path in a Grid", H, "0-1 BFS", "Following an arrow costs 0; any other move costs 1.", "Use a deque: push 0-cost moves to the front, 1-cost moves to the back."),
      p("bus-routes", "Bus Routes", H, "BFS over routes, not stops", "Changing buses is what costs; riding is free.", "Map stop → routes; BFS where each level boards all routes through the current stops; mark routes visited."),
      p("shortest-path-visiting-all-nodes", "Shortest Path Visiting All Nodes", H, "BFS over (node, visited-mask)", "The state is where you are and which nodes you've seen.", "Start BFS from every node at once with mask 1 << i; stop when mask is all ones."),
      p("reconstruct-itinerary", "Reconstruct Itinerary", H, "Hierholzer's algorithm (Eulerian path)", "You must use every ticket exactly once.", "Adjacency lists as min-heaps; DFS, and add the airport to the front of the answer when it has no tickets left."),
      p("find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree", "Find Critical and Pseudo-Critical Edges in MST", H, "Kruskal with an edge forced or excluded", "Compute the MST weight first.", "Excluding an edge raises the weight → critical; forcing it in keeps the weight → pseudo-critical."),
    ],
  },
  {
    id: "greedy",
    title: "Greedy, harder",
    week: 28,
    why: "Greedy is easy to guess and hard to justify. Each of these has a tempting wrong greedy.",
    problems: [
      p("valid-parenthesis-string", "Valid Parenthesis String", M, "Track a range of open counts", "'*' can be '(', ')' or nothing. Track the minimum and maximum opens possible.", "lo and hi move per char; if hi < 0 fail; clamp lo at 0; valid if lo == 0 at the end."),
      p("queue-reconstruction-by-height", "Queue Reconstruction by Height", M, "Sort tall first, insert by k", "Shorter people don't affect taller people's k.", "Sort by height desc, k asc; insert each person at index k of a list."),
      p("candy", "Candy", H, "Two passes, left and right", "Each child must beat a higher-rated neighbour on both sides.", "Left pass enforces left neighbours, right pass takes max with right neighbours."),
      p("minimum-number-of-taps-to-open-to-water-a-garden", "Minimum Number of Taps to Open to Water a Garden", H, "Interval covering (like Jump Game II)", "Turn each tap into an interval [i - r, i + r].", "For each left point keep the furthest reach, then jump greedily like Jump Game II."),
      p("minimum-number-of-refueling-stops", "Minimum Number of Refueling Stops", H, "Max-heap of passed stations", "Don't decide at the station; decide when you run out.", "Push the fuel of every station you pass; when you can't reach the next point, pop the biggest."),
    ],
  },
  {
    id: "dp-1d",
    title: "Dynamic programming: 1D and sequences",
    week: 29,
    why: "Most people need 40-50 DP problems before the method clicks. This set and the next two get you there.",
    problems: [
      p("perfect-squares", "Perfect Squares", M, "Unbounded knapsack over squares", "dp[n] = fewest squares summing to n.", "dp[n] = 1 + min over j² ≤ n of dp[n - j²]."),
      p("maximum-product-subarray", "Maximum Product Subarray", M, "Kadane with max and min", "A negative number turns the smallest product into the biggest.", "Track both maxEndingHere and minEndingHere; swap them when x is negative."),
      p("delete-and-earn", "Delete and Earn", M, "Reduce to House Robber", "Taking value v deletes v - 1 and v + 1.", "Sum points per value, then run House Robber over the values in order."),
      p("number-of-longest-increasing-subsequence", "Number of Longest Increasing Subsequence", M, "LIS DP with counts", "Alongside length[i], keep count[i] of LIS ending at i.", "For j < i with nums[j] < nums[i]: longer → copy count, equal length → add count."),
      p("largest-divisible-subset", "Largest Divisible Subset", M, "LIS-style DP after sorting + parent pointers", "After sorting, divisibility chains like increasing sequences.", "dp[i] = longest chain ending at i; keep prev[i] to rebuild the subset."),
      p("longest-string-chain", "Longest String Chain", M, "DP over words sorted by length", "A word's chain extends the chain of any word with one letter removed.", "Sort by length; dp[word] = 1 + max dp[word with char i deleted]."),
      p("russian-doll-envelopes", "Russian Doll Envelopes", H, "Sort + LIS with binary search", "Sort widths ascending. How do you stop equal widths from nesting?", "Sort by width asc, height desc, then LIS on heights with patience sorting (O(n log n))."),
      p("word-break-ii", "Word Break II", H, "Memoised DFS returning sentences", "Word Break tells you if it's possible; now return every way.", "memo[start] = list of sentences for s[start:]; build from each dictionary word that matches."),
    ],
  },
  {
    id: "dp-2d",
    title: "Dynamic programming: grids, strings and knapsack",
    week: 30,
    why: "2D states are where DP interviews live: grid paths, two-string comparisons and subset sums.",
    problems: [
      p("unique-paths-ii", "Unique Paths II", M, "Grid DP with obstacles", "Same as Unique Paths, but obstacle cells have 0 ways.", "Use a 1D row: dp[c] = 0 on obstacles, else dp[c] + dp[c - 1]."),
      p("triangle", "Triangle", M, "Bottom-up DP", "Top-down has many choices; bottom-up has one answer.", "Start from the last row; dp[j] = row[j] + min(dp[j], dp[j + 1])."),
      p("minimum-falling-path-sum", "Minimum Falling Path Sum", M, "Row-by-row DP from three parents", "Each cell can be reached from three cells above.", "dp[r][c] = matrix[r][c] + min(dp[r - 1][c - 1], dp[r - 1][c], dp[r - 1][c + 1])."),
      p("maximal-square", "Maximal Square", M, "dp = 1 + min of three neighbours", "dp[r][c] = side of the largest square with bottom-right at (r, c).", "If the cell is 1: 1 + min(top, left, top-left)."),
      p("count-square-submatrices-with-all-ones", "Count Square Submatrices with All Ones", M, "Same DP as Maximal Square, summed", "A cell with dp value k ends k squares.", "Sum every dp value."),
      p("dungeon-game", "Dungeon Game", H, "DP from the end backwards", "Going forward, you don't know what health you'll need later.", "need[r][c] = max(1, min(need right, need down) - dungeon[r][c]), filled from the princess backwards."),
      p("cherry-pickup-ii", "Cherry Pickup II", H, "3D DP over (row, col1, col2)", "Move both robots down a row together.", "dp[r][c1][c2] = cherries at both cells (once if equal) + best of the 9 previous pairs."),
      p("interleaving-string", "Interleaving String", M, "2D DP on prefixes", "dp[i][j] = can s1[:i] and s2[:j] form s3[:i + j]?", "Take the next char from s1 or from s2 if it matches s3[i + j - 1]."),
      p("distinct-subsequences", "Distinct Subsequences", H, "Two-string DP, count ways", "dp[i][j] = ways s[:i] forms t[:j].", "Always dp[i - 1][j]; plus dp[i - 1][j - 1] if s[i - 1] == t[j - 1]."),
      p("wildcard-matching", "Wildcard Matching", H, "Two-string DP with '*'", "'*' matches empty (skip it) or one more char (stay on it).", "dp[i][j] for '*': dp[i][j - 1] || dp[i - 1][j]; for '?' or equal chars: dp[i - 1][j - 1]."),
      p("shortest-common-supersequence", "Shortest Common Supersequence", H, "LCS table + walk back", "The supersequence is both strings with their LCS shared once.", "Build the LCS table, then walk back from the end, emitting shared chars once and others from whichever side you leave."),
      p("ones-and-zeroes", "Ones and Zeroes", M, "0/1 knapsack in two dimensions", "Each string costs some 0s and some 1s.", "dp[z][o] = most strings using z zeros and o ones; loop budgets downwards per string."),
      p("last-stone-weight-ii", "Last Stone Weight II", M, "Reduce to subset sum", "Smashing splits the stones into two groups; the answer is their difference.", "Find the largest subset sum ≤ total / 2 with a boolean knapsack."),
    ],
  },
  {
    id: "dp-advanced",
    title: "Dynamic programming: intervals, states, bitmasks and digits",
    week: 31,
    why: "The advanced DP families. Interviews at top companies pick from exactly these.",
    problems: [
      p("best-time-to-buy-and-sell-stock-with-transaction-fee", "Best Time to Buy and Sell Stock with Transaction Fee", M, "State machine: holding / not holding", "Two states per day.", "cash = max(cash, hold + price - fee); hold = max(hold, cash - price)."),
      p("best-time-to-buy-and-sell-stock-iii", "Best Time to Buy and Sell Stock III", H, "State machine with 4 states", "At most two transactions: buy1, sell1, buy2, sell2.", "Update in order: buy1 = max(buy1, -p), sell1 = max(sell1, buy1 + p), buy2 = max(buy2, sell1 - p), sell2 = max(sell2, buy2 + p)."),
      p("best-time-to-buy-and-sell-stock-iv", "Best Time to Buy and Sell Stock IV", H, "State machine generalised to k", "Generalise III to arrays buy[k], sell[k].", "If k ≥ n / 2 it's unlimited transactions; otherwise update buy[j], sell[j] for j = 1..k each day."),
      p("partition-array-for-maximum-sum", "Partition Array for Maximum Sum", M, "DP over the last block", "dp[i] = best for the first i elements.", "Try the last block of length 1..k: dp[i] = max(dp[i - len] + max(block) × len)."),
      p("palindrome-partitioning-ii", "Palindrome Partitioning II", H, "isPal table + cut DP", "cuts[i] = fewest cuts for s[:i + 1].", "If s[j..i] is a palindrome, cuts[i] = min(cuts[j - 1] + 1); 0 when j = 0."),
      p("longest-valid-parentheses", "Longest Valid Parentheses", H, "Stack of indices (or DP)", "Keep the index before the current valid run as a base.", "Push -1 first; on '(' push i; on ')' pop, then if empty push i, else length = i - top."),
      p("minimum-cost-to-cut-a-stick", "Minimum Cost to Cut a Stick", H, "Interval DP over cut positions", "Add 0 and n to the cuts and sort.", "dp[i][j] = cuts[j] - cuts[i] + min over k in (i, j) of dp[i][k] + dp[k][j]."),
      p("predict-the-winner", "Predict the Winner", M, "Game DP: score difference", "Think of score difference for the player to move.", "dp[i][j] = max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]); player 1 wins if dp[0][n - 1] ≥ 0."),
      p("minimum-difficulty-of-a-job-schedule", "Minimum Difficulty of a Job Schedule", H, "DP over (job index, days left)", "Each day takes a contiguous block; its cost is the block's max.", "dp[i][d] = min over end j of max(jobs[i..j]) + dp[j + 1][d - 1]."),
      p("binary-tree-cameras", "Binary Tree Cameras", H, "Tree DP / greedy with 3 states", "Each node returns: needs cover, has camera, or covered.", "Post-order: if any child needs cover, place a camera here; if a child has a camera, you're covered."),
      p("partition-to-k-equal-sum-subsets", "Partition to K Equal Sum Subsets", M, "Bitmask DP (or backtracking with pruning)", "Each subset must sum to total / k.", "dp[mask] = running sum mod target for a reachable mask; add an unused number only if it fits."),
      p("find-the-shortest-superstring", "Find the Shortest Superstring", H, "Bitmask DP (travelling salesman)", "Precompute overlap[i][j]: how much word j saves after word i.", "dp[mask][last] = max total overlap; rebuild the order with parent pointers."),
      p("number-of-ways-to-wear-different-hats-to-each-other", "Number of Ways to Wear Different Hats to Each Other", H, "Bitmask over people, iterate hats", "There are 40 hats but only 10 people. Which should be the mask?", "dp[mask] over people; for each hat, update masks in reverse by assigning it to anyone who likes it."),
      p("count-vowels-permutation", "Count Vowels Permutation", H, "State-machine DP", "Each vowel can only follow certain vowels.", "Keep 5 counts and update them all from the previous step per the rules, mod 1e9 + 7."),
      p("student-attendance-record-ii", "Student Attendance Record II", H, "DP over (absences, trailing lates)", "States: absences 0-1, consecutive lates 0-2.", "Six states updated per day: P resets lates, A moves to absences 1, L adds a late."),
      p("number-of-digit-one", "Number of Digit One", H, "Digit counting per position", "Count 1s at each digit position separately.", "For position p with high, cur, low parts: high × p, plus p if cur > 1, plus low + 1 if cur == 1."),
    ],
  },
  {
    id: "intervals-strings",
    title: "Intervals, strings and design",
    week: 33,
    why: "Sweep lines, string matching and design questions round out the set.",
    problems: [
      p("car-fleet", "Car Fleet", M, "Sort by position, compare arrival times", "Cars can't pass, so a faster car behind a slower one joins its fleet.", "Sort by position descending; a new fleet starts when its arrival time exceeds the current fleet's."),
      p("my-calendar-ii", "My Calendar II", M, "Track bookings and overlaps", "Keep two lists: bookings, and regions already double-booked.", "Reject if the new event overlaps any double-booked region; otherwise add its overlaps with bookings."),
      p("data-stream-as-disjoint-intervals", "Data Stream as Disjoint Intervals", H, "TreeMap of interval starts", "Inserting one number can merge with the interval on its left, its right, or both.", "floorKey and ceilingKey find neighbours; merge when they touch val - 1 or val + 1."),
      p("the-skyline-problem", "The Skyline Problem", H, "Sweep line + max-heap of heights", "Process building edges in x order.", "Starts add heights, ends remove them (lazy deletion or TreeMap counts); record when the max height changes."),
      p("count-good-numbers", "Count Good Numbers", M, "Fast modular exponentiation", "Even positions have 5 choices, odd ones 4.", "Answer = 5^ceil(n/2) × 4^floor(n/2) mod 1e9 + 7 with binary exponentiation (n is up to 10^15)."),
      p("repeated-dna-sequences", "Repeated DNA Sequences", M, "Rolling hash / sliding window set", "Every 10-letter window is a candidate.", "Add each window to a seen set; add to the answer set if it was already seen (or encode 2 bits per letter)."),
      p("shortest-palindrome", "Shortest Palindrome", H, "KMP prefix function", "Find the longest palindromic prefix of s.", "Compute the LPS array of s + '#' + reverse(s); its last value is that prefix's length."),
      p("longest-happy-prefix", "Longest Happy Prefix", H, "KMP prefix function", "This is exactly what the LPS array measures.", "Build lps for s; the answer is s.substring(0, lps[n - 1])."),
      p("design-twitter", "Design Twitter", M, "Hash maps + k-way merge with a heap", "Each user has a tweet list and a follow set.", "For the feed, push each followee's latest tweet into a max-heap by timestamp and pop 10, pushing each one's previous tweet."),
      p("all-oone-data-structure", "All O`one Data Structure", H, "Doubly linked list of count buckets", "Everything must be O(1), including min and max.", "Buckets in count order, each holding keys; keys map to their bucket; move keys to neighbouring buckets on inc and dec."),
    ],
  },
];

/** Every Phase 2 slug, for checks. */
export const PHASE2_SLUGS = PHASE2.flatMap((s) => s.problems.map((x) => x.slug));

/** LeetCode's weekly contest is Sunday 02:30 UTC; the biweekly is Saturday 14:30 UTC, every other week. */
export const CONTEST_INFO = {
  weeklyUtc: { day: 0, hour: 2, minute: 30 },
  url: "https://leetcode.com/contest/",
  startAfterWeek: 23,
  rules: [
    "Start once you reach Part E (week 24). Before that, contests mostly test topics you haven't met yet.",
    "Do it live and timed (90 minutes). Virtual contests on LeetCode count if you miss the live one.",
    "Most people solve 1-2 at first. 2 regularly is a good interview sign; 3 is strong.",
    "Afterwards, upsolve: read the editorial for the first problem you couldn't solve, then solve it yourself the next day.",
    "Log each contest here. The trend matters, not any single week.",
  ],
};
