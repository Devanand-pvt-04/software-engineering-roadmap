import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's browser phase (original weeks 8-14). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_BROWSER: ExplainMap = {
  // ---- Week 8: How the browser renders a page ----
  "M8:0": {
    why: "A modern browser runs code from thousands of strangers' websites every day. Early browsers ran everything in one process, so one bad page could crash or spy on all the others.",
    problem:
      "In a single-process browser, a crashing tab takes down every tab, a slow script freezes the whole window, and a malicious page running in the same memory as your bank tab can try to read its data.",
    how: "Split the browser into separate processes with separate jobs and separate permissions, and give each website its own sandboxed renderer process, so a page can only damage itself.",
    tech: [
      "The browser process draws the address bar and tabs and coordinates everything else.",
      "Renderer processes turn HTML, CSS and JavaScript into pixels. Each runs in a sandbox: a restricted mode where it can't open files or the network directly and must ask the browser process.",
      "The GPU process talks to the graphics card; the network service makes every HTTP request.",
      "Site isolation puts each site (scheme plus registrable domain, such as https://example.com) in its own renderer, so a page from one site never shares memory with another. This blocks attacks such as Spectre that read nearby memory.",
      "Processes talk through IPC (inter-process communication, Main week 3).",
    ],
    cost: "Many processes use a lot of memory, which is why Chrome is known for it; browsers merge processes when memory is short. Every message between processes adds a little latency.",
    tryIt:
      "Open Chrome's Task Manager (Shift+Esc on Windows and Linux, or Window > Task Manager on Mac) with three sites open and find the browser, GPU, network and one renderer per site.",
    buildsOn: "Main week 2: Processes",
  },
  "M8:1": {
    why: "Typing a URL and pressing Enter starts a chain of steps across several processes. Knowing the steps tells you where a slow or broken page is stuck.",
    problem:
      "Without a clear sequence, the browser wouldn't know when to stop showing the old page, which process should draw the new one, or what to do with a download versus a web page.",
    how: "The browser process handles the address bar and the network request, then hands the response to the right renderer once it knows what the response is (navigation commit).",
    tech: [
      "The browser parses what you typed: is it a URL or a search term? It adds https:// if needed.",
      "The network service resolves DNS (Main week 6), opens a TCP and TLS connection (Main week 7), sends the request and reads the response headers.",
      "If the response is a download or a redirect, it's handled without a renderer. If it's HTML, the browser picks a renderer process for that site.",
      "Commit: the browser tells the renderer to take over, the address bar updates, and the old page is gone. The renderer then streams the HTML as it arrives.",
      "The load event fires when the page and all its subresources (images, scripts, stylesheets) have loaded.",
    ],
    cost: "Every step adds latency: DNS, TCP, TLS and the server's own time all happen before the first byte arrives. Redirects repeat much of it, so each one costs a full round trip or more.",
    tryIt:
      "Open DevTools, Network tab, reload a page, hover over the first document request's waterfall bar, and read the DNS, connection, TLS and waiting (time to first byte) phases.",
    buildsOn: "Main week 7: HTTP/1.1 message anatomy",
  },
  "M8:2": {
    why: "HTML and CSS are just text. Something must turn that text into the coloured pixels you see, quickly enough that pages appear in a fraction of a second.",
    problem:
      "If the browser waited for every file before drawing anything, pages would stay blank for seconds. If it drew before knowing the styles, everything would flash unstyled and then jump around.",
    how: "Run a pipeline: build a tree of the document, build a tree of the styles, combine them into what's visible, work out where everything goes, paint it, and let the GPU combine the layers. Each stage feeds the next, and later changes rerun only the stages they affect.",
    tech: [
      "Parsing: bytes are decoded into characters (using the charset), split into tokens (start tag, text, end tag), turned into nodes, and linked into the DOM (Document Object Model), a tree of every element.",
      "CSS goes through the same steps into the CSSOM, a tree of styles. CSS is render-blocking: the browser won't paint until it has the CSS, to avoid a flash of unstyled content.",
      "The render tree combines DOM and CSSOM and leaves out invisible things (display: none, <head>).",
      "Layout (also called reflow) computes each box's exact position and size.",
      "Paint fills in pixels for text, colours, borders and images, on separate layers.",
      "Compositing: the GPU stacks those layers into the final image. Moving or fading a layer only needs this last step.",
    ],
    cost: "Changing a size or position reruns layout for many elements, which is slow; changing a colour reruns paint; changing transform or opacity often only reruns compositing. Too many layers use GPU memory.",
    tryIt:
      "In DevTools, Performance tab, record a page load and find the Parse HTML, Recalculate Style, Layout, Paint and Composite entries in the flame chart.",
    buildsOn: "Main week 8: Navigation",
  },
  "M8:3": {
    why: "JavaScript can change the page while it's still being parsed, for example with document.write. So the parser can't safely continue past a script until the script has run.",
    problem:
      "A plain <script src> in the <head> stops HTML parsing while the script downloads and runs. On a slow network, the page stays blank for the whole download.",
    how: "Tell the browser the script won't interfere with parsing, so it can download in parallel. async runs it as soon as it arrives; defer runs it after parsing finishes, in order. A separate preload scanner also looks ahead for files to start downloading early.",
    tech: [
      '<script src="a.js">: parsing pauses, the script downloads and runs, then parsing continues.',
      "<script async>: downloads in parallel and runs as soon as it arrives, possibly mid-parse and in any order. Good for independent scripts such as analytics.",
      "<script defer>: downloads in parallel and runs after the document is parsed, in the order written, just before DOMContentLoaded.",
      '<script type="module"> (ES modules) is deferred by default.',
      "The preload scanner is a lightweight second parser that reads ahead in the raw HTML and starts fetching images, stylesheets and scripts while the main parser is blocked.",
      '<link rel="preload"> asks for a critical file early, even one the scanner can\'t see.',
    ],
    cost: "async scripts can run before the DOM they need exists, and in an unpredictable order. defer delays the script until parsing ends, so content that depends on it appears later. Preloading too much competes with what's actually needed.",
    tryIt:
      "Make a page with a <script src> in the head pointing at a slow URL (for example https://httpbin.org/delay/3), load it, then add defer and compare when the text appears.",
    buildsOn: "Main week 8: The critical rendering path",
  },
  "M8:4": {
    why: "A page's JavaScript, style calculation, layout and painting all run on one thread per page: the main thread. Simple and safe, but it can only do one thing at a time.",
    problem:
      "While a long JavaScript task runs, the main thread can't respond to clicks, can't scroll some content and can't draw a new frame. The page looks frozen.",
    how: "Keep each task short: split long work into chunks, yield back to the browser between them, and move heavy computation off the main thread into a Web Worker.",
    tech: [
      "The screen refreshes about 60 times per second, so the browser has about 16 ms per frame for your code, style, layout and paint together.",
      "A long task is any task over 50 ms. During it, input waits in a queue.",
      "INP (Interaction to Next Paint) measures how long a click or key press takes to show a visible response; long tasks are the main cause of a bad INP.",
      "Yield by splitting work with setTimeout or scheduler.yield(), or use requestAnimationFrame for visual updates.",
      "Web Workers (Main week 14) run JavaScript on another thread with no DOM access.",
    ],
    cost: "Chunking work makes code more complex and the total work slightly slower. Workers can't touch the DOM, and copying large data to and from them has a cost.",
    tryIt:
      "In the console, run const t = Date.now(); while (Date.now() - t < 3000) {} and try to scroll or click during those 3 seconds.",
    buildsOn: "Main week 2: Threads",
  },
  "M8:5": {
    why: "You can't fix what you can't see. Browser DevTools show you every request, every element's styles and every millisecond of main-thread work.",
    problem:
      "Without tools, debugging a slow or broken page is guessing: which request failed, which CSS rule won, what ran during that freeze?",
    how: "Use the panel that matches the question: Elements for structure and styles, Network for requests, Performance for time on the main thread, Lighthouse for an automated audit.",
    tech: [
      "Elements shows the live DOM (not the original HTML) and the CSS rules applied to the selected element, crossed out when overridden.",
      "Network lists every request with status, size and timing. The waterfall shows what waited for what; throttling simulates a slow phone network.",
      "Performance records a timeline. The flame chart shows functions stacked by who called whom, with wide bars meaning long time; red triangles mark long tasks.",
      "Lighthouse loads the page in a controlled environment and scores performance, accessibility, best practices and SEO, with specific fixes.",
      "The Console runs JavaScript in the page and shows errors.",
    ],
    cost: "Lab tools measure one load on your machine; real users on slow phones see worse. Use them to find causes, and field data (real-user metrics) to know how bad it really is.",
    tryIt:
      "Run Lighthouse on any news site in DevTools with mobile throttling, then fix-list the top three opportunities it reports in your notes.",
  },

  // ---- Week 9: HTML and accessibility ----
  "M9:0": {
    why: "A browser needs to know how to read the file, how to size the page and what to load before it can show anything. The <head> carries that information.",
    problem:
      "Without a doctype, browsers fall back to quirks mode, an old compatibility mode with different layout rules. Without a charset, text can turn into garbage. Without a viewport tag, phones show a zoomed-out desktop layout.",
    how: "Start every page with the same skeleton: a doctype that selects standards mode, and a head that declares the encoding, the viewport, the title and the stylesheets and scripts to load.",
    tech: [
      "<!doctype html> switches the browser into standards mode.",
      '<meta charset="utf-8"> must come early, within the first 1024 bytes, so the parser decodes text correctly (Main week 1).',
      '<meta name="viewport" content="width=device-width, initial-scale=1"> tells phones to use their real width instead of pretending to be a 980-pixel desktop.',
      '<title> appears in the tab and in search results. <link rel="stylesheet"> loads CSS; <script> loads JavaScript.',
      '<html lang="en"> declares the language, which screen readers and translators use.',
    ],
    cost: "Every stylesheet and synchronous script in the head delays first paint (Main week 8). Keep the head small and the critical resources few.",
    tryIt:
      "Remove the viewport meta tag from a page and open it in DevTools device mode as a phone. Then put it back.",
    buildsOn: "Main week 8: The critical rendering path",
  },
  "M9:1": {
    why: "A page full of <div>s looks fine to sighted users but tells machines nothing. Screen readers, search engines and browser features such as reader mode need to know what each part of the page is.",
    problem:
      "Without meaning in the markup, a screen reader user can't jump to the main content or the navigation, and a search engine can't tell the article from the sidebar.",
    how: "Use elements named for their role: header, nav, main, article, section, aside, footer, and headings h1 to h6 in a logical outline. They look like plain boxes but carry meaning.",
    tech: [
      "<main> wraps the page's unique content (one per page); <nav> wraps major navigation links.",
      "<article> is self-contained content that would make sense alone (a post, a comment); <section> is a themed group, usually with its own heading.",
      "<aside> is related but secondary content; <header> and <footer> introduce or close a page or section.",
      "Headings form an outline: one h1 for the page, then h2 for sections, h3 inside those, without skipping levels.",
      "These elements become landmarks in the accessibility tree, which screen reader users navigate by.",
    ],
    cost: "Semantic elements take a little thought, and misusing them (a <section> for every box) adds noise. They don't style anything by themselves.",
    tryIt:
      "Install a landmarks extension or use your screen reader's landmark list (VoiceOver rotor, NVDA's D key) on a well-built site and on a site built only from divs.",
    buildsOn: "Main week 9: Document structure",
  },
  "M9:2": {
    why: "Text, links and images are the core of the web. Doing them right is the difference between a page that works for everyone on every device and one that doesn't.",
    problem:
      "Images without alt text are invisible to blind users; a single huge image wastes megabytes on a phone; a wrong relative link breaks when the page moves.",
    how: "Use the right element for each thing, describe images in alt text, and let the browser choose the right image size and load it only when needed.",
    tech: [
      "Lists: <ul> (unordered), <ol> (ordered), <li> items. Links: <a href>. An absolute URL includes the scheme and host; a relative one (../img.png, /about) is resolved against the current page.",
      'alt describes the image for people who can\'t see it; decorative images get alt="" so screen readers skip them.',
      "srcset lists the same image at several widths and sizes says how wide it will display, so the browser downloads the smallest one that looks sharp.",
      'loading="lazy" delays offscreen images until the user scrolls near them. <picture> lets you offer modern formats (AVIF, WebP) with a fallback.',
      "<video> and <audio> play media natively, with controls and captions through <track>.",
    ],
    cost: "Responsive images mean producing several versions of each image (build tools or an image CDN do this). Lazy-loading the main image at the top of the page delays it and hurts LCP.",
    tryIt:
      "In DevTools, Network, filter by Img, load a page with srcset in device mode, then switch to a wide window and reload, and compare which file was downloaded.",
    buildsOn: "Main week 9: Semantic elements",
  },
  "M9:3": {
    why: "Some data really is a grid of rows and columns: timetables, prices, results. Tables exist to present that data so its structure is clear.",
    problem:
      "A grid built from divs, or a table without headers, reads to a screen reader as a stream of numbers with no idea which column each belongs to.",
    how: "Use <table> for tabular data only, mark header cells with <th>, say which cells they label with scope, and give the table a caption.",
    tech: [
      "<caption> titles the table. <thead>, <tbody> and <tfoot> group rows.",
      '<th scope="col"> labels a column and <th scope="row"> labels a row, so a screen reader can say "Price, Plan B: ₹499".',
      "Don't use tables for page layout; that's what CSS Grid is for (Main week 11).",
      "On narrow screens, wrap a wide table in a container with overflow-x: auto so it scrolls instead of breaking the page.",
    ],
    cost: "Tables are rigid on small screens, and complex tables with merged cells need extra attributes to stay accessible.",
    tryIt:
      "Turn on a screen reader (VoiceOver on Mac with Cmd+F5, Narrator on Windows) and move through a table with and without <th> headers.",
    buildsOn: "Main week 9: Semantic elements",
  },
  "M9:4": {
    why: "Forms are how users send data to a server: logins, searches, orders. HTML forms worked long before JavaScript and still work without it.",
    problem:
      "Forms built from divs and JavaScript often break with keyboards and screen readers, skip validation, and stop working entirely if the script fails to load.",
    how: "Use a real <form> with labelled inputs and a submit button. The browser then handles focus, validation, keyboard submission and sending the data to the server for you.",
    tech: [
      "action is the URL to send to and method is GET (data in the URL query string, for searches) or POST (data in the body, for changes).",
      "Each input's name becomes the key in the submitted data; without name it isn't sent.",
      '<label for="email"> ties text to an input, so clicking the label focuses it and screen readers announce it. <fieldset> and <legend> group related inputs.',
      "Input types (email, number, date, tel, checkbox, radio) give the right keyboard on phones and built-in checks. required, min, max and pattern add validation before submitting.",
      'Default encoding is application/x-www-form-urlencoded (name=Asha&city=Pune); file uploads need enctype="multipart/form-data", which sends each field as a separate part.',
    ],
    cost: "Built-in validation messages are hard to style, and client-side checks are only for convenience: the server must validate everything again, because anyone can send any request.",
    tryIt:
      'Build a form with method="GET" pointing at https://httpbin.org/get, submit it, and read the data echoed back. Then switch to POST and to multipart and compare.',
    buildsOn: "Main week 7: Methods",
  },
  "M9:5": {
    why: "Before CSS layout tools existed, every element needed a default way to sit on the page. Some elements are blocks of content, others are words inside a line.",
    problem:
      "Without knowing the default, setting width on a <span> or vertical margin on a link mysteriously does nothing.",
    how: "Each element has a default display value. Block elements stack vertically and take the full width; inline elements flow within a line of text like words.",
    tech: [
      "Block (div, p, h1, section, ul): starts on a new line, fills the available width, and accepts width, height and all margins.",
      "Inline (span, a, strong, em): flows with text; width and height are ignored and vertical margins don't push other lines away.",
      "inline-block flows like a word but accepts width, height and margins, like a button.",
      "CSS can change any element's display, so the HTML element should be chosen for meaning and the CSS for layout.",
    ],
    cost: "Whitespace between inline-block elements renders as a small gap, a classic surprise. Modern layouts mostly use Flexbox and Grid instead (Main week 11).",
    tryIt:
      "Give a <span> width: 200px and a background colour, then add display: inline-block and watch it change.",
  },
  "M9:6": {
    why: "About one in six people has a disability, and everyone is sometimes limited: a broken arm, bright sunlight, a slow connection. Laws in many countries require accessible websites.",
    problem:
      "A custom div-based button can't be reached with the Tab key, isn't announced by screen readers, and ignores Enter and Space. Users who can't use a mouse simply can't use the site.",
    how: "Use native HTML elements that already work with keyboards and assistive technology, add ARIA only where HTML has no equivalent, manage focus when content changes, and keep enough colour contrast.",
    tech: [
      "The browser builds an accessibility tree from the DOM: each element's role (button, link, heading), name (its label) and state (checked, expanded). Screen readers read this tree, not the pixels.",
      "<button> is focusable, works with Enter and Space, and is announced as a button. A <div onclick> is none of those.",
      'ARIA attributes (role="tab", aria-expanded="true", aria-label) change what the tree says, but not how the element behaves. The first rule of ARIA: don\'t use it if a native element does the job.',
      "Keyboard: everything clickable must be reachable with Tab in a sensible order and show a visible focus outline. When a dialog opens, move focus into it, and return it when it closes.",
      "Colour contrast: normal text needs a contrast ratio of at least 4.5:1 with its background (WCAG AA).",
    ],
    cost: "Retrofitting accessibility onto a finished site is expensive; building it in from the start is cheap. Wrong ARIA is worse than none, because it tells screen readers something false.",
    tryIt:
      "Unplug your mouse (or don't touch it) and try to complete a purchase or sign-up on a site using only Tab, Shift+Tab, Enter and Space. Then open DevTools' Accessibility pane on a button.",
    buildsOn: "Main week 9: Semantic elements",
  },
  "M9:7": {
    why: "Most people find pages through search engines and shared links. Search engines and social apps read specific tags to decide what to show.",
    problem:
      "Without a good title and description, search results show random text from your page. Without Open Graph tags, a shared link appears as a bare URL with no image. Duplicate URLs split your ranking.",
    how: "Give each page a unique title and description, add Open Graph tags for link previews, declare one canonical URL, and describe key content with structured data.",
    tech: [
      '<title> and <meta name="description"> are what search results usually display.',
      "Open Graph tags (og:title, og:description, og:image) control the preview card when a link is shared on WhatsApp, LinkedIn or Slack.",
      '<link rel="canonical" href="..."> tells search engines which URL is the real one when the same page is reachable at several (with tracking parameters, with and without www).',
      "Structured data (JSON-LD using schema.org types such as Article, Product or Recipe) can earn rich results such as star ratings.",
      "Search engines must be able to see your content: content that only appears after client-side JavaScript runs may be indexed late or not at all.",
    ],
    cost: "SEO tags help a good page get found; they can't make a weak page rank. Stuffing keywords or marking up content that isn't visible can get a site penalised.",
    tryIt:
      "Paste a URL into a link preview tester (for example opengraph.xyz) and see which tags it found, then view the page source and find them.",
    buildsOn: "Main week 9: Document structure",
  },

  // ---- Week 10: CSS I ----
  "M10:0": {
    why: "One element can be targeted by many rules from many places: the browser's defaults, your stylesheet, a library, an inline style. Something has to decide which value wins for every property.",
    problem:
      "Without clear rules, two declarations for the same property would conflict unpredictably, and setting the font on every single element would be needed.",
    how: "The cascade ranks competing declarations by origin and importance, then specificity, then order. Inheritance passes some properties, such as font and colour, from parent to child automatically.",
    tech: [
      "A rule is a selector plus declarations: p.note { color: red; }.",
      "The cascade compares, in order: origin and importance (browser defaults, then your styles, with !important flipping the order), then cascade layers (@layer), then specificity, then which rule comes last.",
      "Inherited properties (color, font, line-height) pass from parent to child; non-inherited ones (margin, border, background) don't.",
      "Keywords: inherit takes the parent's value, initial resets to the CSS default, and unset means inherit if the property normally inherits, otherwise initial.",
    ],
    cost: "!important and very specific selectors win today but make every later change harder, because the next override has to be even stronger.",
    tryIt:
      "Write two rules for the same <p>, one with a class selector and one with an id, and see which colour wins in DevTools, where the losing declaration is crossed out.",
  },
  "M10:1": {
    why: "When two rules from the same origin target the same element, the browser needs an objective way to pick the more specific one.",
    problem:
      "Without a formula, nobody could predict why .button.primary beats .primary-button, or why one id overrides ten classes.",
    how: "Count three kinds of selector parts and compare the counts like a three-digit number, left to right.",
    tech: [
      "Specificity is (a, b, c): a = number of IDs; b = classes, attributes and pseudo-classes such as :hover; c = element names and pseudo-elements such as ::before.",
      "#nav .item a is (1, 1, 1); .a.b.c is (0, 3, 0); so the first wins because a beats any b.",
      'The universal selector * and combinators (>, +, ~, space) add nothing. Inline style="" beats all selectors.',
      ":is() and :not() take the specificity of their most specific argument; :where() always counts as zero, which is useful for overridable defaults.",
    ],
    cost: "Leaning on high specificity to win creates specificity wars. Teams often keep selectors flat (one class each) so order and layers decide instead.",
    tryIt:
      "In DevTools, hover over a selector in the Styles panel: Chrome shows its specificity as three numbers. Predict three before hovering.",
    buildsOn: "Main week 10: How CSS is applied",
  },
  "M10:2": {
    why: "What you write in CSS (2em, 50%, inherit) isn't what the browser finally uses. It has to resolve each value to something concrete before it can lay out the page.",
    problem:
      "When a style doesn't apply, reading your stylesheet doesn't tell you what the browser actually ended up with, or which rule set it.",
    how: "Look at the computed value: the resolved value of every property on an element, with a link back to the rule that produced it.",
    tech: [
      "Specified value: the winner of the cascade, or inherited, or the initial value.",
      "Computed value: relative values resolved as far as possible without layout (2em becomes 32px when the font size is 16px).",
      "Used value: the final value after layout (width: 50% becomes a pixel width).",
      "DevTools' Computed panel lists every property's final value and, when expanded, every rule that tried to set it.",
      "getComputedStyle(element) returns these values from JavaScript.",
    ],
    cost: "Calling getComputedStyle in a loop while also changing styles forces the browser to recalculate layout repeatedly (layout thrashing), which is slow.",
    tryIt:
      "Select an element in DevTools, open Computed, find font-size, and expand it to see each rule that tried to set it.",
    buildsOn: "Main week 10: How CSS is applied",
  },
  "M10:3": {
    why: "Every element on a page is drawn as a rectangle. To place rectangles, the browser needs one consistent model of how big each one is and how much space it takes.",
    problem:
      "Without a defined model, adding a border or padding would have unpredictable effects on size, and two boxes set to 50% width might no longer fit side by side.",
    how: "Each box has four layers from the inside out: content, padding, border, margin. box-sizing decides whether width measures the content only or the content plus padding and border.",
    tech: [
      "Content holds the text or children. Padding is space inside the border, with the background showing through. The border is the visible edge. Margin is transparent space outside, pushing other boxes away.",
      "With the default box-sizing: content-box, width: 200px plus padding: 20px and a 1px border takes 242px.",
      "With box-sizing: border-box, width: 200px includes padding and border, so it takes exactly 200px. Most projects set *, *::before, *::after { box-sizing: border-box }.",
      "DevTools' box model diagram shows all four layers with their sizes for the selected element.",
    ],
    cost: "Mixing content-box and border-box in one project causes off-by-a-few-pixels layout bugs. Pick one, usually border-box, and apply it everywhere.",
    tryIt:
      "Give a div width: 200px, padding: 20px and a border, measure it in DevTools, then add box-sizing: border-box and measure again.",
    buildsOn: "Main week 9: Block vs inline elements",
  },
  "M10:4": {
    why: "CSS was designed for documents. Paragraphs with margin above and below would otherwise get double gaps between them, so the designers made adjacent vertical margins merge.",
    problem:
      "Developers set margin-top: 20px on a child and see the gap appear outside the parent, or set 20px and 30px on neighbours and get 30px, not 50px. It looks like a bug if you don't know the rule.",
    how: "When two vertical margins touch with nothing between them, they collapse into one margin the size of the larger.",
    tech: [
      "Adjacent siblings: the bottom margin of one and the top margin of the next collapse into the larger of the two.",
      "Parent and first or last child: if no border, padding or content separates them, the child's margin escapes through the parent's edge.",
      "Empty blocks: an element's own top and bottom margins can collapse together.",
      "Collapsing happens only for vertical margins in normal block flow. It doesn't happen inside flex or grid containers, or when the parent creates a new block formatting context (display: flow-root).",
    ],
    cost: "It's a frequent source of confusion. Many teams avoid it by using margin in one direction only, or gap in flex and grid layouts.",
    tryIt:
      "Put a <p> with margin-top: 40px as the first child of a div with a background colour and watch the gap appear above the div; then add padding-top: 1px to the div.",
    buildsOn: "Main week 10: The box model",
  },
  "M10:5": {
    why: "Before you add any layout CSS, the browser already arranges elements in a default way. Every other layout technique is a departure from this default, called normal flow.",
    problem:
      "If you don't know normal flow, you can't predict where an element will go, or why a floated or positioned element affects its neighbours the way it does.",
    how: "In normal flow, block boxes stack top to bottom and inline content flows left to right in lines, wrapping like text. The display property chooses which behaviour each box gets.",
    tech: [
      "A block formatting context lays out block boxes vertically, one after another.",
      "An inline formatting context lays out text and inline boxes in line boxes that wrap at the container's edge.",
      "display has two parts: the outer type (block or inline: how the box behaves among its siblings) and the inner type (flow, flex or grid: how it lays out its children). display: flex means block outside, flex inside.",
      "display: none removes the element from layout and the accessibility tree; visibility: hidden hides it but keeps its space.",
      "display: flow-root makes an element start a new block formatting context, which contains floats and stops margin collapsing through it.",
    ],
    cost: "Normal flow suits documents; app layouts need Flexbox and Grid. Removing elements from flow (absolute, float) makes the rest of the layout ignore them, which can cause overlap.",
    tryIt:
      "Set display: none on an element in DevTools and watch the rest move up, then try visibility: hidden instead.",
    buildsOn: "Main week 9: Block vs inline elements",
  },
  "M10:6": {
    why: "Screens range from 4-inch phones to 32-inch monitors, and users change their default font size. Lengths need to adapt instead of being fixed.",
    problem:
      "A layout built only in pixels doesn't grow when a user increases the browser font size, and can overflow on small screens.",
    how: "Use relative units that scale with something meaningful: the font size, the parent's size or the viewport.",
    tech: [
      "px is a fixed CSS pixel (not a physical screen pixel on high-density displays).",
      "em is relative to the current element's font size; rem is relative to the root (html) font size, usually 16px. rem doesn't compound when nested, which makes it the safest choice for spacing and type.",
      "% is relative to the parent (for width, the containing block's width).",
      "vw and vh are 1% of the viewport's width and height. On phones, dvh tracks the visible height as browser bars appear and disappear.",
      "ch is the width of the 0 character, handy for limiting line length (max-width: 65ch).",
    ],
    cost: "em compounds when nested, so a 1.2em inside 1.2em inside 1.2em grows quickly. 100vh on mobile can be taller than the visible screen.",
    tryIt:
      "Set your browser's default font size to 24px in its settings and compare a page sized in px with one sized in rem.",
    buildsOn: "Main week 10: The box model",
  },
  "M10:7": {
    why: "Sometimes an element has to sit somewhere normal flow wouldn't put it: a badge on a corner, a sticky header, a dropdown over content.",
    problem:
      "Normal flow can't overlap elements or pin them to the screen, and moving one element shouldn't push all the others around.",
    how: "The position property takes an element out of normal flow (or offsets it within it) and places it relative to a reference box using top, right, bottom and left.",
    tech: [
      "static: the default, normal flow; offsets are ignored.",
      "relative: stays in flow, but can be nudged with offsets; it also becomes the reference box for absolute children.",
      "absolute: removed from flow and placed relative to its containing block: the nearest ancestor with position other than static, or the page if there's none.",
      "fixed: placed relative to the viewport, so it stays put when you scroll (unless an ancestor has a transform, which becomes its containing block).",
      "sticky: acts like relative until you scroll past a threshold (top: 0), then sticks within its parent.",
    ],
    cost: "Absolutely positioned elements ignore everything around them, so they overlap when content changes size. Overusing them makes layouts fragile.",
    tryIt:
      "Put an absolutely positioned badge inside a card, then remove position: relative from the card and watch the badge fly to the page corner.",
    buildsOn: "Main week 10: Normal flow",
  },
  "M10:8": {
    why: "When elements overlap, the browser has to decide which is drawn on top. z-index sets the order, but only among elements in the same group.",
    problem:
      "A modal with z-index: 9999 still appears behind a header with z-index: 10, because they're in different stacking contexts and the modal's whole context is lower.",
    how: "Elements are painted in groups called stacking contexts. z-index orders elements within a context, and each context is then painted as one unit inside its parent.",
    tech: [
      "The root element forms the first stacking context.",
      "A new context is created by position with z-index other than auto, and also by opacity below 1, transform, filter, will-change, isolation: isolate, and a flex or grid child with z-index.",
      "Inside a context, children are ordered by z-index; the context as a whole is ordered among its siblings by its own z-index.",
      "So a child's z-index can never lift it above something outside its parent context, however large the number.",
    ],
    cost: "Stacking contexts appear as side effects of unrelated properties (opacity, transform), which is why z-index bugs are confusing. Rendering overlays in a top-level container (a portal, or the native <dialog>) avoids most of them.",
    tryIt:
      "Give a parent opacity: 0.99 and its child z-index: 9999, then put a sibling of the parent with z-index: 1 on top of it. The child stays behind.",
    buildsOn: "Main week 10: Positioning",
  },
  "M10:9": {
    why: "Content doesn't always fit its box, and early CSS had no layout tools beyond floats, which were meant for wrapping text around images.",
    problem:
      "Long content spills out of its box and covers other content. Older codebases built entire page layouts out of floats, with odd clearing hacks you'll still meet.",
    how: "overflow decides what happens when content is too big: show it, clip it or scroll it. float pushes an element to one side and lets text wrap around it.",
    tech: [
      "overflow: visible (the default) lets content spill; hidden clips it; scroll always shows scrollbars; auto shows them only when needed. overflow-x and overflow-y control each direction.",
      "text-overflow: ellipsis with white-space: nowrap and overflow: hidden shortens one line of text with ...",
      "float: left takes an element out of normal flow and lets following inline content wrap around it.",
      "A parent doesn't grow to contain floated children unless it contains them, with display: flow-root or the old clearfix hack. clear: both makes an element start below previous floats.",
    ],
    cost: "overflow: hidden clips focus outlines and dropdowns and creates a new formatting context, sometimes unexpectedly. Floats for layout are fragile; use Flexbox or Grid instead.",
    tryIt:
      "Put a long unbroken word in a narrow box, then try overflow: hidden, overflow: auto and overflow-wrap: anywhere.",
    buildsOn: "Main week 10: Normal flow",
  },
  "M10:10": {
    why: "Most of the web is text. Readable type and colour decide whether people can read a page comfortably, and web fonts let brands look consistent across devices.",
    problem:
      "Tight line spacing, low contrast and long lines make text hard to read. A custom font that blocks rendering leaves text invisible until it downloads.",
    how: "Set a readable base font size and line height, choose colours with enough contrast, and load web fonts so text is shown immediately in a fallback font.",
    tech: [
      "Colours can be written as names, hex (#1a73e8), rgb(), hsl() or the newer oklch(), which matches how humans perceive lightness.",
      "line-height without a unit (1.5) is multiplied by each element's own font size, which is safer than a fixed px value.",
      "@font-face loads a font file; WOFF2 is the compressed format to use.",
      "font-display: swap shows fallback text immediately and swaps when the font arrives. block hides text for up to 3 seconds; optional uses the font only if it's already cached.",
      "System font stacks (system-ui, -apple-system, Segoe UI, Roboto) cost no download at all.",
    ],
    cost: "Each font weight and style is a separate download. swap can shift the layout when the real font arrives (CLS); matching fallback metrics (size-adjust) reduces the jump.",
    tryIt:
      "In DevTools, Network, throttle to Slow 3G and load a site with custom fonts. Watch whether text is invisible, or shown in a fallback and then swapped.",
    buildsOn: "Main week 10: Units",
  },

  // ---- Week 11: CSS II ----
  "M11:0": {
    why: "Before Flexbox, centring something vertically or making columns of equal height needed hacks with floats, tables or negative margins.",
    problem:
      "Distributing items along a row, aligning them and letting them grow or shrink to fill space wasn't possible with normal flow alone.",
    how: "Make a container display: flex. Its children become flex items laid out along one axis, and properties on the container and items control how space is shared and how items line up.",
    tech: [
      "The main axis is the direction items flow (flex-direction: row or column); the cross axis is perpendicular to it.",
      "justify-content aligns items along the main axis (start, center, space-between); align-items aligns them on the cross axis.",
      "flex-basis is an item's starting size; flex-grow says how much spare space it takes; flex-shrink says how much it gives up when space is short. flex: 1 is shorthand for grow 1, shrink 1, basis 0.",
      "flex-wrap: wrap lets items move onto new lines. gap sets the space between items.",
      "order changes visual order without changing the DOM, but keyboard and screen reader order still follow the DOM.",
    ],
    cost: "Flexbox handles one dimension at a time; two-dimensional grids with aligned rows and columns are clumsy. min-width: auto on flex items can stop text from shrinking, a common overflow surprise (fix with min-width: 0).",
    tryIt:
      "Play Flexbox Froggy's first 15 levels, then centre a div in the viewport with three lines of CSS.",
    buildsOn: "Main week 10: Normal flow",
  },
  "M11:1": {
    why: "Page layouts are two-dimensional: rows and columns that must line up. Flexbox and floats only control one direction at a time.",
    problem:
      "Building a card grid or a page with a header, sidebar and footer that align in both directions needed nested wrappers and fragile maths.",
    how: "Make a container display: grid, define rows and columns (tracks), and place items into the cells or named areas. The browser sizes the tracks for you.",
    tech: [
      "grid-template-columns: 200px 1fr 1fr defines three columns; fr is a fraction of the leftover space.",
      "repeat(3, 1fr) repeats a track; minmax(200px, 1fr) sets a minimum and a maximum.",
      "repeat(auto-fit, minmax(200px, 1fr)) makes as many columns as fit, a responsive card grid with no media queries. auto-fill keeps empty tracks; auto-fit collapses them so items stretch.",
      'grid-template-areas names regions ("header header" "sidebar main"), and items are placed with grid-area: main.',
      "Items placed outside the defined tracks create an implicit grid, sized by grid-auto-rows. Alignment uses justify-items and align-items, and place-items for both.",
    ],
    cost: "Grid has a lot of vocabulary to learn, and explicit placement can make reordering content harder. For a simple row of items, Flexbox is less code.",
    tryIt:
      "Play Grid Garden, then build a responsive card grid with one line: grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)).",
    buildsOn: "Main week 11: Flexbox",
  },
  "M11:2": {
    why: "Flexbox and Grid overlap a lot, and picking the wrong one leads to fighting the tool instead of using it.",
    problem:
      "Forcing Flexbox to make aligned columns, or Grid to make a row of variable-width buttons, produces fragile CSS.",
    how: "Use Flexbox when the content decides the layout along one line; use Grid when the layout decides where content goes in two dimensions. Mix them freely: a Grid page with Flexbox inside each cell.",
    tech: [
      "Flexbox: navigation bars, button groups, centring one thing, a row of tags that wraps. The item sizes come from their content.",
      "Grid: the overall page layout, card galleries, forms with aligned labels and inputs, anything where rows and columns must line up.",
      "Subgrid (grid-template-columns: subgrid) lets a nested grid align with its parent's tracks, for example aligning titles across cards.",
    ],
    cost: "There's rarely a single right answer. The cost of a wrong choice is more CSS and more overrides, not broken pages.",
    tryIt:
      "Build the same navbar with Flexbox and then with Grid, and count the lines of CSS each needed.",
    buildsOn: "Main week 11: Grid",
  },
  "M11:3": {
    why: "More than half of web traffic comes from phones. One page has to work from a 360-pixel phone to a 2560-pixel monitor.",
    problem:
      "A desktop layout shrunk onto a phone is unreadable, and a separate mobile site doubles the work and drifts out of sync.",
    how: "Design for the smallest screen first, then add layout for larger screens with media queries. Let type and images scale fluidly between breakpoints.",
    tech: [
      "Mobile-first: write the base styles for small screens, then add @media (min-width: 768px) { ... } for larger ones. The small-screen styles stay the simplest.",
      "Media queries can also test user preferences: prefers-color-scheme (dark mode) and prefers-reduced-motion.",
      "clamp(1rem, 2.5vw, 2rem) sets a value that scales with the viewport but stays between a minimum and a maximum, so headings grow smoothly without breakpoints.",
      "Responsive images (Main week 9) serve smaller files to smaller screens.",
      "Test in DevTools device mode, and on at least one real phone.",
    ],
    cost: "Every breakpoint is another layout to test. Fluid techniques (clamp, auto-fit grids, flex-wrap) reduce how many you need.",
    tryIt:
      "Take your week 9 page, open DevTools device mode, and drag the width from 320px to 1400px, noting every point where something breaks.",
    buildsOn: "Main week 11: Grid",
  },
  "M11:4": {
    why: "Components are reused in many places: the same card appears in a narrow sidebar and in a wide main column. Media queries only know the screen width, not the space the component actually has.",
    problem:
      "A card styled with media queries looks right in the main column but breaks in the sidebar on a wide screen, because the screen is wide even though the sidebar is narrow.",
    how: "Mark a parent as a container, and let its children change layout based on the container's size instead of the screen's.",
    tech: [
      "container-type: inline-size on a parent makes it a query container for its width.",
      "@container (min-width: 400px) { .card { display: grid; } } applies when that container is at least 400px wide.",
      "container-name lets you target a specific ancestor when containers are nested.",
      "Container query units (cqi, cqw) size things relative to the container, like vw for the viewport.",
    ],
    cost: "A query container can't size itself from its children in the queried direction (it gets size containment), which can surprise you in some layouts. Older browsers need a fallback.",
    tryIt:
      "Put the same card component in a narrow column and a wide one on the same page, and make it switch layout with one @container rule.",
    buildsOn: "Main week 11: Responsive design",
  },
  "M11:5": {
    why: "Motion helps people follow what changed: a menu sliding open, a button responding to a press. But careless animation makes pages janky and drains batteries.",
    problem:
      "Animating width, top or margin forces layout and paint on every frame (Main week 8), which drops frames on phones and looks stuttery.",
    how: "Animate only properties the GPU compositor can handle alone, mainly transform and opacity. Use transitions for simple A-to-B changes and keyframe animations for anything more complex.",
    tech: [
      "transition: transform 200ms ease-out animates a property whenever its value changes, such as on :hover.",
      "@keyframes spin { to { transform: rotate(360deg); } } with animation: spin 1s linear infinite defines a multi-step animation.",
      "transform (translate, scale, rotate) and opacity can be applied on their own compositor layer without layout or paint, so they stay smooth at 60 fps even if the main thread is busy.",
      "will-change: transform hints the browser to create a layer in advance. Use it sparingly.",
      "Respect @media (prefers-reduced-motion: reduce) by turning off large movements for people who get motion sickness.",
    ],
    cost: "Every layer uses GPU memory, and too many layers slow everything down. Animation that ignores reduced-motion preferences can make some users physically ill.",
    tryIt:
      "Animate a box's left property and then its transform: translateX in DevTools with the Rendering panel's Paint flashing on, and compare the green flashes.",
    buildsOn: "Main week 8: The critical rendering path",
  },
  "M11:6": {
    why: "When every developer picks their own colours, spacing and font sizes, a product slowly fills with 47 slightly different greys and inconsistent gaps.",
    problem:
      "Inconsistent values make a UI look unpolished, and changing the brand colour means hunting through hundreds of files.",
    how: "Define a small set of named values (design tokens) for colours, spacing, type sizes and radii, and use only those everywhere.",
    tech: [
      "Tokens are usually CSS custom properties: --color-primary: #1a73e8; --space-2: 8px; used as var(--space-2).",
      "A spacing scale uses a few fixed steps (4, 8, 12, 16, 24, 32, 48) instead of any number.",
      "A type scale does the same for font sizes, often each step a fixed ratio larger than the last.",
      "Custom properties are inherited and can be redefined in a scope, which makes themes such as dark mode a matter of swapping values under a selector or media query.",
      "A design system adds shared components (button, input, card) built only from tokens.",
    ],
    cost: "Tokens need agreement and upkeep, and a scale that's too strict frustrates designers. Too many tokens recreates the original mess.",
    tryIt:
      "Define four colour tokens and a spacing scale as custom properties on :root, use them in your page, then add a dark theme by redefining only the colour tokens.",
    buildsOn: "Main week 10: How CSS is applied",
  },
  "M11:7": {
    why: "Large teams struggle with global CSS: names collide, unused styles pile up, and nobody dares delete a rule. Tailwind and CSS-in-JS are two popular answers.",
    problem:
      "In a big app, changing a class in one stylesheet can break a page nobody remembered used it, and the CSS file only ever grows.",
    how: "Tailwind generates small single-purpose utility classes and ships only the ones you used. CSS-in-JS writes styles next to components and generates unique class names automatically. Both produce ordinary CSS in the end.",
    tech: [
      "Tailwind: classes such as p-4, flex and text-lg each set one or two declarations. At build time it scans your files for class names and generates only those rules, so the CSS stays small.",
      "CSS Modules: each .module.css file's class names are rewritten to unique ones (Button_primary__x7k2) at build time, so names can't collide.",
      "Runtime CSS-in-JS (styled-components, Emotion) generates styles in the browser as components render, which costs main-thread time. Zero-runtime versions (vanilla-extract, Panda) extract static CSS at build time instead.",
      "Open DevTools on any of them and you'll find plain classes and plain CSS rules.",
    ],
    cost: "Tailwind puts long class lists in your markup and has its own vocabulary. Runtime CSS-in-JS slows rendering and doesn't fit React Server Components well, which is why the ecosystem moved toward build-time tools.",
    tryIt:
      "Open a site built with Tailwind (its docs site, for example), inspect an element, and read the generated CSS behind each utility class.",
    buildsOn: "Main week 10: How CSS is applied",
  },
};
