// Starting points for common kinds of study and interview notes, and snippets for the editor's insert menu.

export interface Template {
  id: string;
  name: string;
  hint: string;
  title: string;
  tags: string[];
  interview?: boolean;
  body: string;
}

export const TEMPLATES: Template[] = [
  { id: "blank", name: "Blank note", hint: "Start from nothing", title: "", tags: [], body: "" },
  {
    id: "concept",
    name: "Concept",
    hint: "Why it exists, how it works, trade-offs",
    title: "",
    tags: ["concept"],
    body: `## In one sentence


## Why it exists
What problem did people have before this?

## How it works


## Example
\`\`\`
\`\`\`

## Trade-offs
| Good at | Costs / limits |
| --- | --- |
|  |  |

## Common mistakes
-

> [!INTERVIEW] How I'd explain it in an interview
>

## Check yourself
Q:
A:
`,
  },
  {
    id: "problem",
    name: "DSA problem",
    hint: "Pattern, approach, complexity, code, pitfalls",
    title: "",
    tags: ["dsa"],
    interview: true,
    body: `**Link:**
**Difficulty:**  · **Pattern:** #
**Status:** solved alone / needed a hint / looked at the answer

## Problem in my words


## Signal → pattern
What in the problem pointed to the approach?

## Approach
1.

## Complexity
Time: $O()$ · Space: $O()$

## Code
\`\`\`java
\`\`\`

## Edge cases and pitfalls
- [ ] Empty input
- [ ] One element
- [ ] Duplicates / negatives

## Revisit
Q: What's the key idea for this problem?
A:
`,
  },
  {
    id: "design",
    name: "System design",
    hint: "Requirements, estimates, API, data, diagram, bottlenecks",
    title: "Design: ",
    tags: ["system-design"],
    interview: true,
    body: `## Requirements
**Functional**
-

**Non-functional** (scale, latency, availability, consistency)
-

## Estimates
| | Value |
| --- | --- |
| Daily active users | |
| Reads / writes per second | |
| Storage per year | |

## API
\`\`\`http
GET /api/...
\`\`\`

## Data model
\`\`\`mermaid
erDiagram
  USER ||--o{ ITEM : owns
\`\`\`

## High-level design
\`\`\`mermaid
flowchart LR
  Client --> LB[Load balancer] --> API[App servers]
  API --> Cache[(Cache)]
  API --> DB[(Database)]
\`\`\`

## Deep dives
###

## Bottlenecks and trade-offs
-

> [!TIP] What I'd say first in the interview
>
`,
  },
  {
    id: "star",
    name: "Behavioural story (STAR)",
    hint: "Situation, task, action, result",
    title: "Story: ",
    tags: ["behavioural"],
    interview: true,
    body: `**Fits questions like:** a conflict, a failure, a tight deadline, leading without authority

## Situation


## Task


## Action
-

## Result
Numbers if possible.

## What I learned

`,
  },
  {
    id: "lecture",
    name: "Lecture / chapter (Cornell)",
    hint: "Cues, notes, summary",
    title: "",
    tags: ["reading"],
    body: `**Source:**

| Cues and questions | Notes |
| --- | --- |
|  |  |
|  |  |

## Summary
In 3–4 sentences, in my own words:

`,
  },
  {
    id: "compare",
    name: "Comparison",
    hint: "X vs Y, when to pick which",
    title: " vs ",
    tags: ["comparison"],
    interview: true,
    body: `| | Option A | Option B |
| --- | --- | --- |
| What it is | | |
| Best for | | |
| Weak at | | |
| Cost | | |

## Pick A when


## Pick B when


Q: When would you choose A over B?
A:
`,
  },
  {
    id: "debug",
    name: "Bug / debugging log",
    hint: "Symptom, cause, fix, lesson",
    title: "Bug: ",
    tags: ["debugging"],
    body: `## Symptom


## What I tried
1.

## Root cause


## Fix
\`\`\`diff
\`\`\`

## Lesson
`,
  },
];

export interface Snippet {
  id: string;
  label: string;
  hint: string;
  /** Text to insert; "|" marks where the cursor goes. */
  text: string;
  /** Inserted on its own line. */
  block?: boolean;
}

export const SNIPPETS: Snippet[] = [
  { id: "h2", label: "Heading", hint: "## Section", text: "## |", block: true },
  { id: "todo", label: "Checklist", hint: "- [ ] task", text: "- [ ] |", block: true },
  { id: "code", label: "Code block", hint: "```java", text: "```java\n|\n```", block: true },
  { id: "table", label: "Table", hint: "3 columns", text: "| Column | Column | Column |\n| --- | --- | --- |\n| | | |\n| | | |", block: true },
  { id: "card", label: "Flashcard", hint: "Q: / A:", text: "Q: |\nA: ", block: true },
  { id: "term", label: "Term card", hint: "term :: meaning", text: "| :: ", block: true },
  { id: "callout", label: "Callout", hint: "Note, tip, warning…", text: "> [!NOTE]\n> |", block: true },
  { id: "interview", label: "Interview callout", hint: "How to say it", text: "> [!INTERVIEW] How I'd explain it\n> |", block: true },
  { id: "math", label: "Math", hint: "$$ … $$", text: "$$\n|\n$$", block: true },
  { id: "flow", label: "Flowchart", hint: "Mermaid", text: "```mermaid\nflowchart LR\n  A[Start] --> B{Decision}\n  B -->|yes| C[Do this]\n  B -->|no| D[Do that]\n```\n|", block: true },
  { id: "seq", label: "Sequence diagram", hint: "Mermaid", text: "```mermaid\nsequenceDiagram\n  participant C as Client\n  participant S as Server\n  C->>S: Request\n  S-->>C: Response\n```\n|", block: true },
  { id: "class", label: "Class diagram", hint: "Mermaid", text: "```mermaid\nclassDiagram\n  class Animal {\n    +String name\n    +speak()\n  }\n  Animal <|-- Dog\n```\n|", block: true },
  { id: "er", label: "ER diagram", hint: "Mermaid", text: "```mermaid\nerDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE_ITEM : contains\n```\n|", block: true },
  { id: "state", label: "State diagram", hint: "Mermaid", text: "```mermaid\nstateDiagram-v2\n  [*] --> Idle\n  Idle --> Running : start\n  Running --> Idle : stop\n```\n|", block: true },
  { id: "hr", label: "Divider", hint: "---", text: "\n---\n|", block: true },
];
