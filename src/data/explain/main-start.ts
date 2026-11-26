import type { ExplainMap } from "./types";

// Ground-up explainers for the Main track's first week, Learn to program (M37). Keys: M<week>:<Must know topic index>.
export const EXPLAIN_MAIN_START: ExplainMap = {
  "M37:0": {
    why: "Everything in this plan rests on one idea: a computer does exactly what it's told, nothing more and nothing less.",
    problem:
      "People give each other vague instructions ('make a sandwich') and fill the gaps with common sense. A computer has no common sense, so vague instructions either fail or do something unexpected.",
    how: "A program is a precise list of instructions, written in a programming language, that the computer follows one step at a time, in order, without guessing what you meant.",
    tech: [
      "Each instruction is small and exact: store this number, add these two numbers, show this text.",
      "The computer runs instructions in order, from top to bottom, unless an instruction tells it to jump somewhere else.",
      "A programming language is a strict format for writing instructions, so a tool can translate them into something the processor runs.",
      "If an instruction is ambiguous or wrong, the computer doesn't ask; it stops with an error or does exactly the wrong thing.",
      "Programming is mostly breaking what you want into steps that small and that clear.",
    ],
    cost: "Being completely precise is slow and tiring at first, and that feeling is normal. It gets easier with practice.",
    tryIt:
      "Write instructions for making a cup of tea for someone who follows every word literally, then have a friend follow them exactly and note where they get stuck.",
  },
  "M37:1": {
    why: "Every programming language, from Scratch to C to Java to Python, is built from the same four building blocks. Learn them once and they carry over everywhere.",
    problem:
      "Without these, a program could only run the same fixed steps once, with no way to remember values, make choices, repeat work or reuse pieces.",
    how: "Variables remember values, conditions choose between paths, loops repeat steps, and functions give a name to a piece of work so you can reuse it.",
    tech: [
      "Values and variables: a variable is a named box holding a value, such as score = 0, and its value can change.",
      "Conditions: if (score > 10) { ... } else { ... } runs one block or the other, based on a boolean expression that is either true or false.",
      "Loops: while (condition) repeats as long as the condition is true; for repeats a counted number of times.",
      "Functions: a named piece of work that takes inputs (parameters) and gives back an output (a return value), such as add(2, 3) returning 5.",
      "Almost every program, however large, is these four blocks combined.",
    ],
    cost: "The syntax for each block differs between languages, so you'll relearn spelling, not ideas, with each new language.",
    tryIt:
      "In Scratch, build a game where a sprite moves while a key is held (loop), says 'You win' when it touches a goal (condition), and keeps a score (variable).",
  },
  "M37:2": {
    why: "The hardest part of programming isn't typing code; it's working out the steps. Planning before coding saves a lot of time.",
    problem:
      "Starting to type straight away on a big problem leads to confusion, half-working code and starting over, because you're solving everything at once.",
    how: "Break the problem into smaller problems until each one is easy (decomposition), and write the steps in plain language (pseudocode) before writing real code.",
    tech: [
      "Decomposition: 'build a quiz game' becomes show a question, read the answer, check it, update the score, repeat.",
      "Keep splitting until each piece is something you know how to do in a few lines.",
      "Pseudocode: steps in plain words with the shape of code, such as 'for each question: show it; if answer is right, add 1 to score'.",
      "Pseudocode isn't a real language, so it can't be wrong in syntax; it only needs to be clear.",
      "Each small piece often becomes one function.",
    ],
    cost: "Planning feels slower than coding at first, and some details only appear once you start writing real code, so the plan will change.",
    tryIt:
      "Write pseudocode for a program that finds the largest number in a list, test it by hand on [3, 9, 2, 7], then turn it into code.",
  },
  "M37:3": {
    why: "The processor only understands machine code, numbers that mean simple instructions. Compiled languages like C show you the translation step plainly.",
    problem:
      "Humans can't practically write machine code, but the processor can't read human-friendly text.",
    how: "You write source code in a text file; a compiler translates the whole file into a machine-code program (an executable), which you then run from a terminal.",
    tech: [
      "Source code: the text you write, such as hello.c.",
      "The compiler (clang or gcc) checks the code and translates it: clang hello.c -o hello.",
      "If the compiler finds a mistake, it stops and prints an error instead of making a program.",
      "The result is an executable file of machine code; run it with ./hello.",
      "The terminal is a text window where you type commands to run programs.",
      "Each time you change the source, you compile again before running.",
    ],
    cost: "Compiling adds a step between writing and running, and C's errors can be cryptic at first.",
    tryIt:
      "Write a C program that prints your name, compile it with clang hello.c -o hello, run it with ./hello, then remove a semicolon and read the error.",
    buildsOn: "Main week 37: What a program is",
  },
  "M37:4": {
    why: "Inside the computer, everything is bits. A value's type tells the computer how many bits to use and what they mean.",
    problem:
      "The same bits could be a number, a letter or part of a decimal, so without types the computer wouldn't know how much memory to set aside or how to interpret it.",
    how: "In C, you state each variable's type when you create it. The type fixes its size and how operations on it behave.",
    tech: [
      "int: a whole number, usually 4 bytes (32 bits), roughly from -2.1 billion to +2.1 billion.",
      "char: 1 byte, holding a small number that stands for a character in a code table ('A' is 65).",
      "float: a decimal number in 4 bytes, approximate rather than exact (0.1 + 0.2 isn't exactly 0.3).",
      "bool (from stdbool.h): true or false.",
      "A string in C is an array of chars ending with a special zero character '\\0' that marks the end.",
      "sizeof(int) tells you a type's size in bytes on your machine.",
    ],
    cost: "Choosing types takes thought, and mistakes such as numbers too large for an int (overflow) silently give wrong results.",
    tryIt:
      "Print sizeof for int, char, float and double, then add 1 to the largest int (INT_MAX from limits.h) and see what you get.",
    buildsOn: "Main week 37: The building blocks every language shares",
  },
  "M37:5": {
    why: "Programs usually work on many values of the same kind: scores, temperatures, letters. Arrays store them together.",
    problem:
      "Creating a separate variable for each of 100 scores is impossible to manage, and you can't loop over separately named variables.",
    how: "An array holds many values of one type side by side in memory. Each value is reached by its position, its index, starting from 0.",
    tech: [
      "int scores[5]; sets aside space for 5 ints in a row.",
      "scores[0] is the first element and scores[4] the last; an index is how many steps from the start.",
      "Because elements sit side by side, the computer finds any element instantly: start address + index × element size.",
      "Loops and arrays go together: for (int i = 0; i < 5; i++) visits every element.",
      "C doesn't check indexes: scores[5] reads whatever memory comes next, a classic bug.",
    ],
    cost: "In C an array's size is fixed when it's created, and going past the end causes silent, confusing bugs.",
    tryIt:
      "Fill an array with 5 numbers, print their total and average with a loop, then print scores[10] and see what garbage appears.",
    buildsOn: "Main week 37: Types in C",
  },
  "M37:6": {
    why: "Every programmer writes bugs every day. What matters is finding and fixing them calmly and methodically.",
    problem:
      "Beginners see a wall of error text and give up, or change things at random until something seems to work.",
    how: "Read errors from the first one down, print values to check what the program is really doing, and use a debugger to step through the program one line at a time.",
    tech: [
      "Fix the first compiler error first: later errors are often caused by the first one.",
      "An error message names the file, line and column (hello.c:5:12) and describes the problem.",
      "printf debugging: print variable values at key points to compare what's happening with what you expected.",
      "A debugger (lldb or gdb, or the one built into VS Code) pauses the program at a breakpoint so you can run one line at a time and look at every variable.",
      "Change one thing at a time, and check after each change.",
    ],
    cost: "Debugging takes patience and can be slow, but every bug you track down teaches you how the computer really works.",
    tryIt:
      "Write a loop that should sum 1 to 10 but starts at the wrong index, find the bug with printf, then find it again by stepping through it in a debugger.",
    buildsOn: "Main week 37: Your first compiled language, C",
  },
};
