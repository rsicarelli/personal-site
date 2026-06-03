---
title: 'Claude Code 101: Introduction to Agentic Programming'
description: 'September 2025. I was leading a critical dependency upgrade on a mobile app with millions of users. The kind of change that breaks tests in a cascade.…'
summary: "September 2025. I was leading a critical dependency upgrade on a mobile app with millions of users. The kind of change that breaks tests in a cascade. The deadline was October: if it wasn't ready, the app wouldn't ship to the store."
pubDate: 2026-04-06
updatedDate: 2026-04-09
tags:
  - 'claude'
  - 'ai'
series: 'claude-code-101'
seriesOrder: 1
coverUrl: 'https://media2.dev.to/dynamic/image/width=1200,height=627,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fk7x245w00xy8wd4jdt6t.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/claude-code-101-introduction-to-agentic-programming-3p83'
  devtoId: 3460063
  githubRepo: 'https://github.com/rsicarelli/claude-code-10x'
  reactions: 6
---

The problem: nearly 10,000 tests needed to be adapted for the new version. Code owned by over 20 teams, spread across hundreds of modules.

I thought "what if I give these AI tools everyone keeps talking about a real shot?" After watching a few videos and reading the docs, I spun up four terminals running Claude Code in parallel, each one migrating a slice of the tests. One week later: 2,000+ files changed, 50,000 lines of code, 85% migrated on the first pass. The following week, I cleaned up the rest.

When I merged everything with the owning teams' approval, one thing was clear: I **never** could have done that alone. Not in two weeks, maybe not even in two months. It was cognitively impossible.

That's when I understood something had genuinely changed: my role had shifted, and I needed to understand how this works under the hood.

This is the first article in the **Claude Code 101** series. Throughout it, we'll break down what's behind **agentic programming**: where it came from, how it works, what tools exist, and what you need to learn to use this for real. Together we'll build a mental model (the **factory analogy**) and meet the three pillars that hold everything up: prompt engineering, context engineering, and harness engineering.

---

## Software development as we know it

The flow every dev knows: read requirements, design a solution, write code, run tests, fix bugs, deploy. Nothing happens unless you're actively involved. You're the one reading the docs, the one searching the (late) Stack Overflow, the one keeping the project's context in your head, the one typing every character.

Software only moves forward when you're sitting in front of the screen, working on it. Every line of code is a product assembled by hand, and the pace of production depends on how fast your fingers move and how much your memory can hold.

### We are the bottleneck

Cognitive science has some uncomfortable data for us. Our working memory holds roughly 7 items at a time [[1]](#references). After an interruption (that tap on the shoulder, that Slack message) it takes an average of 23 minutes to regain focus [[2]](#references). And if you actually measure it, you'll find that you spend only about 30% of your time effectively writing code. The rest is reading, navigating, debugging, and meetings.

The bottleneck isn't just the compiler. It's not CI. It's not the server. The bottleneck is us.

For decades, we accepted this as the natural cost of building software. The factory produces at the speed of whoever operates it. Period. Until artificial intelligence started changing that equation.

---

## The era of AI assistance

### Intelligent autocomplete (2021-2022)

In June 2021, GitHub launched the technical preview of **Copilot**, which suggested lines of code in real time inside the editor [[3]](#references). Along with [TabNine](https://www.tabnine.com/) and similar tools, the code completion paradigm was born: single- or multi-line suggestions based on the current file's context.

Did it change things? Sure. Less typing, boilerplate filled in automatically, suggestions that often nailed what you were about to write. But the role of the developer didn't change one bit. You still decide what to write, where to write it, when to run tests, how to fix errors. The AI suggests; you execute.

Think of the factory: the production line got a conveyor belt to move parts faster. Useful? Absolutely. But you're still assembling everything by hand.

### The chat paradigm (2022-2023)

November 2022: [ChatGPT](https://openai.com/index/chatgpt/) launches and changes how devs seek help [[4]](#references). The pattern quickly became familiar: copy a code snippet, paste it into the chat, describe the problem, get a suggestion, copy it back to the editor. [LangChain](https://www.langchain.com/), launched a month earlier, was already experimenting with connecting LLMs to external tools. A precursor of what was to come.

Chat was more versatile than autocomplete: it explained concepts, suggested refactors, generated tests. But the limitations were fundamental. No access to project files, no awareness of the folder structure, no ability to run commands. You became a messenger between the AI and your code.

It's like having a really good consultant sitting next to you. Someone who reads any manual in seconds and has an answer for almost anything. Except this consultant can't touch the machines. The manual work is still on you.

![Autocomplete vs Chat](https://media.rsicarelli.com/blog/101/part1/en/part1-01-autocomplete-vs-chat-48b1.png)

### Why assistance wasn't enough

At the end of the day, both paradigms hit the same wall: **the AI is not agentic** (meaning it can't act on its own). It doesn't read your project. It doesn't run commands. It doesn't execute tests. It doesn't iterate on errors.

The conveyor belt and the consultant help, but nobody operates the machines for you. When you leave, production stops.

In 2024, the natural question came: **what if AI could do more than suggest?**

---

## From Assistant to Agent

Looking back, the evolution of AI tools for code follows four distinct phases. Each phase is like an upgrade to the factory: first comes the conveyor belt, then the consultant, then better machines, until you reach ones that operate on their own.

![The Evolution of AI-Assisted Coding](https://media.rsicarelli.com/blog/101/part1/en/part1-02-evolution-timeline-b31d.png)

We've already covered phases 1 and 2. The real leap starts at phase 3.

### Phase 3: Multi-file editing (2024)

In 2024, **[Cursor](https://www.cursor.com/)** (an editor built as a VS Code fork) popularized a new category: multi-file editing via natural language. You describe what you want; the AI proposes coordinated changes across multiple files at once.

The growth speaks for itself: from **$1 million in annual revenue in January 2024** to **over $1 billion by November 2025** [[5]](#references). Devs wanted more than line-by-line suggestions.

But the fundamental model didn't change: the human orchestrates, the AI executes. You say what to change, the AI changes it, you verify. The machines got more sophisticated, yes, but you're still operating every control panel, step by step.

### Phase 4: Agentic coding (2024-present)

This is where the paradigm flips. Instead of you orchestrating the AI, **you set the goal and the AI orchestrates itself**.

This shift didn't happen out of nowhere. A sequence of advances made it possible:

- **Function calling** (OpenAI, June 2023). For the first time, models could invoke external tools. This is the technical prerequisite for any agentic behavior [[6]](#references).
- **Andrew Ng coins "agentic"** (late 2023). He chose an adjective on purpose, not a noun: _"Unlike the noun 'agent,' the adjective 'agentic' lets us think of systems as being more or less agent-like, in varying degrees."_ [[7]](#references)
- **Model Context Protocol** (Anthropic, November 2024). The open standard for connecting agents to external tools, rapidly adopted across the industry [[8]](#references).
- **"Building Effective Agents"** (Anthropic, December 2024). The paper that became the most cited reference in the field, distinguishing **workflows** (predefined paths) from **agents** (dynamic, self-directed processes) [[9]](#references).

What makes something "agentic"? Five things:

1. **Autonomy**: decides what to do without step-by-step guidance
2. **Tool use**: reads and writes files, executes commands, runs tests
3. **Planning**: breaks goals into subtasks
4. **Loop reasoning**: iterates, doesn't just respond once
5. **Self-correction**: makes mistakes, notices, adjusts, and tries again

![The agentic loop](https://media.rsicarelli.com/blog/101/part1/en/part1-03-agentic-loop-d9dd.png)

This is where the factory analogy changes completely. You're no longer on the production line tightening bolts and moving parts. Now you **design** the factory. You program the machines, set up quality controls, oversee production. The agents execute, report problems, and self-correct. Your productivity is no longer limited by the speed of your hands; it depends on the quality of your instructions.

As Anthropic put it: development shifts "from _'write code, run tests, read errors, fix, repeat'_ to _'set goal, review changes, approve implementation.'_"

### The full timeline

Five years, accelerating dramatically in 2024-2025:

- **2021**: GitHub Copilot (preview) — code completion with AI is born
- **2022**: LangChain (October), ChatGPT (November) — chat is born
- **2023**: Function calling (June), [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) goes viral, Andrew Ng coins "agentic"
- **2024**: [Devin AI](https://devin.ai/) jumps the [SWE-bench](https://www.swebench.com/) from 1.96% to 13.86%. MCP is launched. "Building Effective Agents" is published
- **2025**: [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Copilot Agent Mode, [Codex CLI](https://github.com/openai/codex). Agents solve **over 80%** of SWE-bench, up from 13.86% just 18 months earlier [[10]](#references)

### "Vibe coding" vs. the real deal

An important distinction here. Typing vague prompts without checking the output (what the community calls "vibe coding") is not agentic programming. It's just... laziness with a nice interface. It's the difference between turning on a machine without reading the manual and configuring everything properly before pressing the button.

Professional agentic programming, as Tweag's engineering blog defines it, involves _"qualified professionals who write prompts intentionally, validate rigorously, and guide the output within clear architectural boundaries"_ [[11]](#references).

That's the approach this series teaches. And to use it properly, it helps to know the ecosystem of available tools.

---

## The agentic tooling ecosystem

There's no shortage of tools in this space. In 2025, AI coding tools generated **$7.37 billion in revenue**, accounting for 55% of all enterprise AI investment [[12]](#references). Google already attributes 50% of its code to agents [[13]](#references). And 84% of devs say they use or plan to use AI tools [[14]](#references).

The tools fall into three categories: **CLI** (terminal: Claude Code, Codex CLI, Cursor CLI, Aider, OpenCode), **IDE** (editor with built-in AI: Cursor, [Windsurf](https://windsurf.com/)), and **hybrid** (plugin + cloud: GitHub Copilot).

Here are the main ones:

**[Claude Code](https://github.com/anthropics/claude-code)** operates in the terminal: reads the entire codebase, edits files, runs commands, creates commits, opens PRs. The extensions and plugins are open source on GitHub (108K+ stars). It reached $2.5 billion in annual revenue in nine months, the fastest growth in enterprise software history [[15]](#references). It runs exclusively on Anthropic models (Opus, Sonnet, Haiku).

**[Cursor](https://www.cursor.com/)** started as a VS Code fork rebuilt around AI, and now also has a [CLI](https://www.cursor.com/cli) for those who prefer the terminal. It supports Claude, GPT, and Gemini simultaneously. It went from $1M to $1B+ in annual revenue in under two years, with over 1 million daily active users [[5]](#references).

**[GitHub Copilot](https://github.com/features/copilot)** is the most widely adopted: 20 million users, 90% of Fortune 100 companies. Its Coding Agent generates around 1.2 million PRs per month [[16]](#references).

**[OpenCode](https://github.com/nichochar/opencode)** (MIT) became the most-starred code agent on GitHub, with ~129K stars. It runs in the terminal, supports 75+ LLM providers, and has native LSP integration. Completely free (you only pay for the model's API) [[18]](#references).

On the open source side, two more stand out. **[Aider](https://github.com/paul-gauthier/aider)** (Apache 2.0) works with any LLM and is free. Fun fact: Aider writes 70–88% of its own code in each release [[17]](#references). **[Codex CLI](https://github.com/openai/codex)** from OpenAI (Apache 2.0) has 2M+ weekly users [[19]](#references).

| Tool               | Interface          | Models        | Open Source      | Price                     | Approx. Users |
| ------------------ | ------------------ | ------------- | ---------------- | ------------------------- | ------------- |
| **Claude Code**    | CLI + extensions   | Anthropic     | Source-available | $20/mo                    | 108K+ stars   |
| **Cursor**         | IDE + CLI          | Multi-model   | No               | $20/mo                    | 1M+ DAU       |
| **GitHub Copilot** | IDE plugin + cloud | Multi-model   | Partial          | $10/mo                    | 20M+          |
| **OpenCode**       | CLI/TUI            | 75+ providers | Yes (MIT)        | Free (bring your API key) | 129K stars    |
| **Codex CLI**      | CLI                | OpenAI        | Yes (Apache 2.0) | $20/mo                    | 2M+ weekly    |
| **Aider**          | CLI                | Any LLM       | Yes (Apache 2.0) | Free (bring your API key) | 42.5K stars   |

What stands out: these are machines from different manufacturers, but they ultimately do the same thing. Multi-file editing, terminal execution, extensibility via MCP, and an iterative loop. What truly differentiates each one is how the agentic behavior is implemented and orchestrated under the hood: the tool system, the way context is managed, the planning and self-correction loop. Beyond that, what matters is the delivery model (CLI vs IDE vs cloud), the ecosystem, and the price. And the open source alternatives prove that the agentic paradigm doesn't require expensive tools. Just a capable LLM.

But tools are only half the story. The other half is how **you** work with them.

---

## Agentic programming: the paradigm shift

In traditional development, you are simultaneously the brain and the hands of the operation. You think through the solution, type the code, run the tests, read the errors, fix, repeat. Your productivity has a physical ceiling: typing speed, memory capacity, how many hours you can stay focused.

In agentic programming, the role changes. You define the goal, provide context, configure the environment. The agent executes. You're at the beginning (definition) and at the end (review). The middle cycle is autonomous.

![Before vs After](https://media.rsicarelli.com/blog/101/part1/en/part1-04-before-after-90c1.png)

I know what you might be thinking: "so the AI does the work and I just... do what?"

The better question might be: do what _differently_. When the compiler came along, nobody needed to write Assembly by hand anymore. Programmers didn't lose their purpose. They moved up a level of abstraction. They started thinking about business logic instead of memory registers. They became _more_ productive, _more_ strategic, _more_ valuable.

The same thing is happening now: you're not being replaced, you're leveling up. Whoever designs the factory isn't less important than whoever operates it — quite the opposite — but the skills are different.

So what are those skills?

### The three pillars

If the new role is orchestrating agents, three skills become essential. I call them **the three pillars of agentic engineering**, and each one will get a dedicated article in this series.

The first is **prompt engineering**. It's how you communicate intent to the agent. Not just "write a good prompt," but structured communication: clear goals, explicit constraints, examples of what you want and what you don't. Back to the factory: these are the instructions you hand to the machine operator. The more precise they are, the better the output.

The second is **context engineering**. It's the discipline of curating what the agent knows. Which files are relevant? What documentation should be accessible? How do you structure project rules in the `CLAUDE.md` file? Context is the most precious resource in an agentic system, and it's limited and expensive. Think of the documentation you hand to someone new on the team: without quality information, even the best machine produces junk.

The third is **harness engineering**: the configuration of everything that surrounds and orchestrates the agent. Automation hooks, MCP servers to connect external services, permissions, custom tools. In the factory, it's the infrastructure: the conveyor belts, the sensors, the safety systems. The factory that produces the most isn't the one with the best workforce; it's the one with the best structure around it.

![The three pillars](https://media.rsicarelli.com/blog/101/part1/en/part1-05-three-pillars-8cd4.png)

### The numbers: good and bad

It's worth looking at the data honestly, because the landscape has real contradictions.

On one hand, the growth is undeniable: $7.37 billion in revenue in 2025, 84% of devs adopting, SWE-bench jumping from 1.96% to over 80% in 18 months. GitHub Copilot generates 1.2 million PRs per month. In LLM API calls for coding, Claude leads with a 54% share [[20]](#references).

On the other hand, independent data is more sobering. The METR study (a rigorous randomized trial with 16 experienced devs) found that AI tools made the team **19% slower**, even though participants perceived themselves as 20% faster [[21]](#references). AI-generated code carries **2.74x more vulnerabilities** according to Veracode [[22]](#references). And Gartner predicts that **40% of agentic AI projects will be canceled** before reaching production by 2027 [[23]](#references).

The most honest take I've read on this came from the DORA 2025 report: _"AI amplifies the strengths of high-performing organizations and the dysfunctions of those that are struggling."_ [[24]](#references)

The automated factory produces more, but without quality control, it produces defects faster too. The outcome depends on who configures and oversees it. That's exactly what the three pillars address.

---

## Final thoughts

You now know what agentic programming is, where it came from, and what tools exist. You know that the role has shifted: from the one who writes every line to the one who designs, guides, and oversees. And you know that three pillars (prompt engineering, context engineering, and harness engineering) separate those who use AI haphazardly from those who use it with consistency.

But knowing the _what_ isn't enough. To actually use this, you need to understand the _how_. And the how starts with a question few people stop to ask: how does this technology work under the hood?

What are tokens? What is a context window? Why do models hallucinate with such conviction? Understanding this completely changes how you interact with any agentic tool.

That's exactly what we'll break down in the next article: **Demystifying Language Models**.

---

> 🤖 This article was written with assistance from Claude (Anthropic).
>
> Content researched, verified, and edited by a human.
>
> Found an error or a missing credit? Send me a message!

---

## References

1. [Miller, G.A. — "The Magical Number Seven, Plus or Minus Two" (1956)](https://psycnet.apa.org/record/1957-02914-001)
2. [Mark, G. et al. — "The Cost of Interrupted Work: More Speed and Stress" (2008)](https://dl.acm.org/doi/10.1145/1357054.1357072) — ACM CHI 2008
3. [GitHub Copilot](https://github.com/features/copilot) — documentation
4. [ChatGPT](https://openai.com/blog/chatgpt) — OpenAI launch announcement (November 2022)
5. [Cursor / Anysphere — CNBC (November 2025)](https://www.cnbc.com/2025/11/13/cursor-ai-startup-funding-round-valuation.html) — $1B+ ARR, $29.3B valuation
6. [OpenAI Function Calling](https://openai.com/index/function-calling-and-other-api-updates/) — API update (June 2023)
7. [Andrew Ng — "Agentic Design Patterns" (2024)](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/) — The Batch newsletter; [Sequoia AI Ascent talk](https://www.youtube.com/watch?v=sal78ACtGTc)
8. [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) — Anthropic (November 2024)
9. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic (December 2024)
10. [SWE-bench](https://www.swebench.com/) — Princeton NLP (ICLR 2024)
11. [Tweag — "Introduction to Agentic Coding" (2025)](https://www.tweag.io/blog/2025-10-23-agentic-coding-intro/); [Agentic Coding Handbook](https://tweag.github.io/agentic-coding-handbook/)
12. [Mordor Intelligence — AI Code Tools Market Report (2025)](https://www.mordorintelligence.com/industry-reports/artificial-intelligence-code-tools-market) — US$ 7.37B market size
13. [Alphabet Q4 2025 Earnings Call (February 2026)](https://www.fool.com/earnings/call-transcripts/2026/02/04/alphabet-googl-q4-2025-earnings-call-transcript/) — CFO Anat Ashkenazi: "about 50% of our code is written by coding agents"
14. [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/)
15. [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Anthropic documentation
16. [GitHub Blog — "Copilot: Faster, smarter, and built for how you work now" (October 2025)](https://github.blog/ai-and-ml/github-copilot/copilot-faster-smarter-and-built-for-how-you-work-now/) — 20M+ users, 1.2M PRs/month
17. [Aider](https://github.com/paul-gauthier/aider) — GitHub repository
18. [OpenCode](https://github.com/nichochar/opencode) — GitHub repository
19. [OpenAI Codex CLI](https://github.com/openai/codex) — GitHub repository
20. [Menlo Ventures — "2025: The State of Generative AI in the Enterprise" (December 2025)](https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/) — Claude: 54% coding market share
21. [METR — "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (2025)](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/); [arXiv](https://arxiv.org/abs/2507.09089)
22. [Veracode — "GenAI and Code Security: What You Need to Know" (2025)](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
23. [Gartner — "Over 40% of Agentic AI Projects Will Be Canceled by End of 2027" (June 2025)](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
24. [DORA State of DevOps Report 2025](https://dora.dev/) — Google
