---
title: "Claude Code 101: Demystifying Language Models"
description: "In the previous article, we built the entire factory: the evolution from manual production to autonomous machines, the ecosystem of agentic tools, the…"
pubDate: 2026-04-09
tags:
  - "ai"
  - "claude"
series: "claude-code-101"
seriesOrder: 2
coverUrl: "https://media2.dev.to/dynamic/image/width=1200,height=627,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fruy65fg3biv53aa6r856.png"
provenance:
  devtoUrl: "https://dev.to/rsicarelli/claude-code-101-demystifying-language-models-3h8o"
  devtoId: 3476270
  githubRepo: "https://github.com/rsicarelli/claude-code-10x"
  reactions: 1
---

In the [previous article](https://dev.to/rsicarelli/claude-code-101-introduction-to-agentic-programming-3p83), we built the entire factory: the evolution from manual production to autonomous machines, the ecosystem of agentic tools, the three pillars (prompt, context, and harness engineering). You know what the factory does, who works in it, and even how much revenue it pulls in.

But the machines in the factory build things. And to understand how they build, the best analogy I know is LEGO. Standardized pieces that snap together one at a time, following (or ignoring) a manual, on a desk with limited space.

This is the second article in the **Claude Code 101** series, and here we take that mechanic apart. What tokens are, how the context window works, why models generate text the way they do, and why they sometimes get things wrong with unsettling confidence.

---

## What is a token

Computers don't understand text. They understand numbers. Before a language model processes anything you wrote, every word, space, and punctuation mark has to become a sequence of integers. Those integers are **tokens**: the standardized pieces the model works with.

![What is a token](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image0-3997.png?raw=true)

A token isn't necessarily a word. It can be a whole word ("hello" becomes 1 token), a chunk of a word ("tokenization" becomes several tokens), an isolated character, or even a single byte. The rule of thumb for English: **1 token is roughly 4 characters**, or about 3/4 of a word. For Portuguese, it's closer to 1 token per 2.7 to 3 characters.

### How the vocabulary is built

Most LLMs use an algorithm called **BPE** (Byte Pair Encoding) to build their vocabulary. The logic is straightforward: start with the 256 possible byte values, scan billions of training texts, find the most frequent byte pair, merge it into a new token, repeat. The result is a vocabulary ranging from ~100K to ~260K tokens, depending on the model.

The detail that matters: this training corpus is dominated by English. Words like "the," "and," "great" become single tokens, whole pieces. Words in Portuguese get fragmented into smaller chunks, as if the kit came with pieces cut in half. Compare:

![Tokenization: English vs Portuguese](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image1-eb4d.png?raw=true)

The character "o" with an accent becomes a separate token because accented characters are rare in the training data. This isn't an irrelevant technical detail. It directly affects your wallet and the model's effective capacity when you work in Portuguese.

### The linguistic tax on Portuguese

A study by Petrov et al. presented at NeurIPS 2023 measured what they called the "tokenization premium" across languages [[1]](#references). The numbers:

| Tokenizer | How much more Portuguese consumes vs English |
|---|---|
| GPT-2 (`r50k_base`) | **1.94x** (nearly double) |
| GPT-4 (`cl100k_base`) | **1.48x** (~50% more) |
| GPT-4o (`o200k_base`) | **~1.3-1.4x** (improved) * |

The GPT-2 and GPT-4 numbers come directly from Petrov et al. [[1]](#references). The GPT-4o estimate reflects the improvement trend with larger vocabularies, confirmed by subsequent studies.

The good news: each generation of tokenizer narrows this gap. The news that actually matters: even in the best case, Portuguese still consumes at least 30% more pieces than English to build the same thing. This "tax" will come back when we talk about context windows and cost, because it compounds with every interaction.

---

## The context window

If tokens are the pieces, the context window is the desk where you build. Fixed size. Everything has to fit on it: the instructions you sent, the conversation history, reference files, and the response the model is constructing. When the desk fills up, that's it. The model doesn't "remember" anything left off the surface.

### The desks of 2026

The market has converged on **1 million tokens** (1M) as the standard for frontier models [[2]](#references). In the table below, "K" means thousand and "M" means million:

| Model | Desk size | Max response |
|---|---|---|
| **[Claude Opus 4.6](https://docs.anthropic.com/en/docs/about-claude/models)** | 1M tokens | 128K tokens |
| **[Claude Sonnet 4.6](https://docs.anthropic.com/en/docs/about-claude/models)** | 1M tokens | 64K tokens |
| **[Claude Haiku 4.5](https://docs.anthropic.com/en/docs/about-claude/models)** | 200K tokens | 64K tokens |
| **[GPT-5.4](https://platform.openai.com/docs/models)** | 1.05M tokens | 128K tokens |
| **[GPT-4.1](https://platform.openai.com/docs/models)** | 1M tokens | 32K tokens |
| **[Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/models)** | 1M tokens | 65K tokens |
| **[Llama 4 Scout](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)** | 10M tokens | varies |

The desk is shared. Everything you send to the model (your question, files, conversation history) and everything it replies with must fit together on the same surface. A desk of 1 million tokens sounds enormous, but the response already reserves a chunk of it, and the rest is the maximum you can send.

For a sense of scale: 1 million tokens is roughly 750,000 words in English, about 8 to 10 books. For Portuguese, because of the tokenization tax, that drops to around 500,000 words. About 7 books.

### Advertised size vs. actual size

Here's a point that rarely comes up. Having a desk of 1 million tokens doesn't mean the model uses all of that surface well.

Recent research shows that the model's ability to pay attention (attention, a concept we'll dig into right below) drops as context grows, especially for information positioned in the middle of the text [[3]](#references). The phenomenon even has a name: **"lost in the middle."** In practice, the model's effective attention span is significantly smaller than the advertised window. The NoLiMa benchmark (ICML 2025) showed that most LLMs fail more than half the time when they need to locate specific information in contexts beyond 32K tokens [[9]](#references).

![The context window](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image2-f9e8.png?raw=true)

And the linguistic tax shows up again here. If the effective window of a model with 200K tokens is already significantly smaller than advertised, for content that's 100% in Portuguese, plan with a generous safety margin. The usable space can drop to roughly 80K-90K tokens of English-equivalent content. Larger pieces take up more room on the same surface.

---

## How models generate text

You already know what the pieces are (tokens) and the size of the desk (context window). Now comes the assembly process itself.

The mechanic is surprisingly simple. The model looks at everything already on the desk, calculates a probability distribution over the entire vocabulary (between ~100K and ~260K possible pieces) to decide which one fits best in the sequence, places one, and repeats. One at a time, from beginning to end of the response. There's no master plan. This is called **autoregressive generation** [[4]](#references), and it's the core mechanic of the Transformer architecture published in 2017 by Vaswani et al.

Example: the model receives **"The sky is"** and needs to continue.

![Autoregressive generation](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image3-bde9.png?raw=true)
Result: **"The sky is blue today."**

Each piece placed depends on all the ones before it: both the original input and what the model has already built. That's why responses sometimes start well and derail halfway through. The model doesn't know where it will end up when it starts generating.

If you read the [previous article](https://dev.to/rsicarelli/claude-code-101-introduction-to-agentic-programming-3p83), you might recognize this mechanism. Remember autocomplete, phase 1 of the evolution? The code completion that suggested the next line in the editor? The underlying mechanism is the same: next-token prediction. The difference is scale. Models like GPT-2 (2019) had 1.5 billion parameters and a tiny desk. Claude Opus 4.6 operates at a completely different scale, with a context window a thousand times larger. The assembly process is the same. The ability to build complex things is what changed.

---

## The attention mechanism

The assembly process explains that the model places one piece at a time. But we still need to understand how it decides the probabilities. If the input is "I need to check the bank by the river," how does the model know whether "bank" means the riverbank or a financial institution?

The answer is the **attention mechanism** (self-attention), introduced in the paper "Attention Is All You Need" [[4]](#references). It's the heart of the **Transformer** architecture that powers every modern LLM.

### How the model sees context

Imagine that the building manual doesn't just show the next step. For each new piece, it highlights which parts of the construction matter for this decision: the foundation lights up bright (supports everything), the nearby towers glow (they define the pattern), the garden on the other side stays dim (irrelevant right now). The attention mechanism does exactly this: for each token, it "lights up" the preceding ones that carry the most weight and "dims" the ones that don't matter.

![Attention mechanism](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image4-459c.png?raw=true)

Before Transformers, it was like building LEGO with someone dictating instructions: one piece at a time, no repeating, no going back. Missed step 12? Tough luck. The Transformer is like having the entire manual open on the desk, all pages visible at once. This ability to process everything in parallel was the leap that made it feasible to train models at today's scale.

### Disambiguation in practice

Go back to the example: "I need to check the bank by the river." The attention mechanism makes the token "bank" pay close attention to "river," and little attention to "need" and "to." It's like a build where a blue piece could be sky or ocean depending on what's around it. Context resolves the ambiguity.

This mechanism has a price. For every piece on the desk, the model looks at all the others before deciding on the fit [[4]](#references). On a desk with 10 pieces, no problem. On a desk with 10,000, every decision requires looking at 10,000 pieces. Doubling the desk size doesn't double the work; it quadruples it.

On top of that, building costs more than looking. When you send a question, the model reads everything at once, like scanning a full page of the manual at once. But when it constructs the response, it's one piece at a time, each one requiring a glance at the entire desk. That's why the price per output token is 3x to 5x higher than input.

### What this means for you

If attention works by weighing the relevance of each token against the others, clear and well-structured prompts make the model's job easier. Ambiguity in the input produces "confusion" in the attention: the model has to distribute weight across competing interpretations. A precise prompt is like clean code: the intent is obvious and the attention mechanism focuses on what matters. The more organized the desk, the more precise the next piece.

This isn't abstract. It's the technical foundation for why prompt engineering works, something we'll explore in depth in Part 6 of this series.

---

## How the model picks between options

You now understand how the model weighs its options. But when several tokens have similar probabilities, what decides which one gets picked?

The difference is between following the manual to the letter and improvising.

### Temperature

You're building a blue wall and need the next piece. In the box, the pieces are sorted: on top are the blue ones that fit perfectly, in the middle are some green ones that could work as an accent, and way at the bottom there's a red wheel that makes no sense at all.

**Temperature** controls how deep the model reaches into the box. At zero, it always grabs the piece on top: same choice, every time, no surprises. At 0.7, it sometimes fishes out a green one nobody expected, and it adds a nice touch to the build. Above 1.0, it pulls the red wheel and snaps it onto the wall anyway.

| Temperature | Completing "The recipe calls for..." | Behavior |
|---|---|---|
| 0.0 | "flour, sugar, and cocoa." | Always the same answer |
| 0.3 | "whole wheat flour, coconut oil, and cocoa." | Minor variations |
| 0.7 | "exotic spices and a hint of Sicilian lemon." | Creative |
| 1.5 | "melted dreams in dragon caramel." | Incoherent |

![Temperature: how deep into the box](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image5-c50d.png?raw=true)

### Top-p

Temperature isn't the only control. **Top-p** works differently: instead of changing how deep the model reaches into the box, it removes pieces from the box before the model chooses. With top-p at 0.9, the bottom 10% most improbable pieces aren't even available. The effect is similar to temperature, and the recommendation from providers is to adjust one or the other, not both at the same time.

### What this means in practice

When you start using agentic tools to write code (from Part 5 of this series), these values come pre-calibrated. But understanding that they exist helps explain why the model sometimes surprises you with an unexpected response: someone let it dig deeper into the box.

For what we care about in this series, the rule is simple: for code, the model works best in predictable mode. Right piece, right place, no improvisation.

---

## Model families

Not every piece works for every build. LEGO Duplo (big pieces, simple) is perfect for getting started, but you can't build a working motor with it. LEGO Technic (gears, axles, complexity) enables sophisticated builds, but costs more and takes more time. The same logic applies to language models.

### Reasoning models

The Technic kits: they "think before answering," spending internal tokens on step-by-step reasoning (extended thinking) before producing the final response. They're the most capable, slowest, and most expensive. The prices below are in dollars per MTok (1 million tokens): the first value is the input cost (what you send), the second is the output cost (what the model generates).

- **Claude Opus 4.6** (Anthropic) reaches 80.8% on SWE-bench Verified [[5]](#references). $5/$25 per MTok.
- **o3 / o3-pro** (OpenAI) are dedicated reasoning models. o3-pro costs $20/$80 per MTok.
- **Gemini 2.5 Pro** (Google) lets you configure the "thinking budget." $1.25/$10 per MTok.

### Fast models

The Duplo kits: bigger pieces, quick assembly, immediate results. Built for low latency and high volume.

- **Claude Haiku 4.5** (Anthropic): $1/$5 per MTok.
- **GPT-4o-mini** (OpenAI): $0.15/$0.60 per MTok.
- **Gemini 2.5 Flash** (Google): $0.30/$2.50 per MTok.

### Code models

Kits optimized for specific builds. Like the Creator Expert line, where each set is designed for a particular result.

- **GPT-4.1** (OpenAI): 1M context, $2/$8 per MTok. Explicitly optimized for code.
- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** (Anthropic): uses Opus/Sonnet under the hood, but with an entire harness of tools to read, edit, execute, and commit.

### Open-weight models

Kits with all the pieces exposed: you build, take apart, and adapt however you want.

- **Llama 4 Scout** (Meta): 10M context, open-weight [[6]](#references).
- **Llama 4 Maverick** (Meta): 1M context, 17B active parameters out of 400B total.
- **DeepSeek R1**: open-source (MIT), 671B parameters, strong reasoning.

### Choosing the right kit

Using Opus to classify tweet sentiment is like buying a 4,000-piece Technic set to build a cube. The difference between Haiku ($1/$5 per MTok) and Opus ($5/$25 per MTok) is **5x on input and 5x on output**. Plenty of tasks that seem to "need" a large model work perfectly well with a smaller one.

The rule of thumb: always start with the cheapest model that could work. Test with Haiku, Flash, or mini. If quality falls short, move up. Opus and o3-pro are reserved for when you truly need them.

![Model families](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image6-8e4b.png?raw=true)

But regardless of which kit you choose, they all share the same fundamental limitations.

---

## What models can't do

The build might look perfect. Visually flawless, every piece in place. But push the wall and it falls over. The model doesn't "know" whether what it built actually works. It snaps pieces where they seem to fit, following statistical patterns, and the result often holds up. But not always.

### Hallucinations aren't bugs

When a model generates information that looks correct but is factually false, we call it a **hallucination**. It's tempting to treat this as a defect, something that will be "fixed" in a future version. But hallucinations are a direct consequence of the design: the model snaps pieces where they seem to fit statistically, without checking whether the build makes sense in the real world [[4]](#references).

If the statistical pattern of "X wrote the book Y" is strong enough in the training data, the model will assert it even if it's false. It has no internal fact-checker. It doesn't distinguish between generating "Paris is the capital of France" and "Paris is the capital of Italy." Both are plausible token sequences; one is true, the other isn't, and the model doesn't know the difference.

![Limitations: hallucinations and a clean desk](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image7-2540.png?raw=true)

### The concrete limitations

The model's manual was printed on a specific date. Everything that happened after that doesn't exist for it. And worse: at the end of every build, the desk is wiped clean. The next conversation starts from zero, with no pieces from the previous one. If you need the model to remember something, you have to put it back on the desk yourself.

The good news: with context engineering and harness engineering techniques (topics in Parts 7 and 8 of this series), you can automate what goes on the desk for each conversation. But for now, the important thing is knowing that the model on its own doesn't remember anything.

Math remains a weak spot. The model can assemble a calculation that looks right but gets the result wrong. For computations that demand precision, it's safer to ask the model to write code that does the math rather than trusting the direct answer.

And in the context of code, Veracode tests showed that **45% of AI-generated code contains security flaws**, across evaluations of more than 100 LLMs [[7]](#references). The model builds fast, but if nobody checks the construction, poorly fitted pieces end up in the final product.

### What's getting better

But the community isn't standing still. Improvements are coming from multiple fronts at the same time: models that "think step by step" before building, reducing errors on complex tasks. Systems that automatically populate the desk with the right pieces for your project, instead of you placing everything by hand. Agents that remember previous builds and learn from them. And infrastructure that gets faster and cheaper with every generation.

Each of these fronts will show up in the upcoming articles of this series. For now, the takeaway is: the limitations are real, but they're shrinking.

Even with these limitations, models are being used at scale. And scale has a cost.

---

## How much it costs

Every piece costs money. LLMs are billed per token processed, split into two categories: **input tokens** (everything you send) and **output tokens** (what the model generates). Building something new (output) always costs more than reading what already exists (input), typically 3x to 5x the price [[8]](#references). This makes sense: generating each token requires a full forward pass through the model.

![Input vs Output: consulting vs building](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image8-14bf.png?raw=true)

### Price table (April 2026)

Prices in USD per 1 million tokens (MTok):

| Model | Input / MTok | Output / MTok | Cache read / MTok |
|---|---|---|---|
| **Claude Opus 4.6** | $5.00 | $25.00 | $0.50 |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | $0.30 |
| **Claude Haiku 4.5** | $1.00 | $5.00 | $0.10 |
| **GPT-5.4** | $2.50 | $15.00 | $0.25 |
| **GPT-4.1** | $2.00 | $8.00 | $0.50 |
| **Gemini 2.5 Pro** | $1.25 | $10.00 | $0.125 |
| **Gemini 2.5 Flash** | $0.30 | $2.50 | $0.03 |

Notice the "Cache read" column. It'll be important in a moment.

### The linguistic tax comes full circle

Remember the tokenization cost for Portuguese? It translates directly into money. For the same content, Portuguese applications cost between **30% and 50% more** in input tokens than the same application in English, depending on the tokenizer. On a $5,000/month bill, that's an extra $1,150 to $1,650 just because of the language.

Throughout this article, one thread runs through three sections: Portuguese consumes more pieces to build the same thing (section 1), that takes up more room on the desk (section 2), and now it costs more (here). These aren't three problems. It's the same problem, in three layers.

![The linguistic tax in three layers](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/en/part2-image9-1314.png?raw=true)

### How to optimize

The good news: there are concrete ways to bring this cost down.

**Prompt caching** is the most impactful. All major providers offer cache reads at roughly 10% of the input price [[8]](#references). If your system prompt or reference context repeats across calls, caching can cut input costs by up to **90%**. This significantly mitigates the Portuguese linguistic tax.

**Batch API** offers a 50% discount in exchange for asynchronous processing (24-hour window). For tasks that aren't real-time (document analysis, bulk classification), it's easy savings.

**Model selection** is the third lever. Many tasks running on Opus would work just as well on Haiku, at a fraction of the cost. Testing with the cheapest model first isn't premature optimization. It's responsible engineering.

Combining batch + caching on Anthropic, the discount can reach **95%** in ideal scenarios [[8]](#references).

This topic will be central in Part 4, when we talk about context engineering. Managing what goes on the desk is, in practice, managing money.

---

## Final thoughts

Tokens, desk, attention, temperature, limitations, cost. It might seem like a lot, but everything connects. And none of this is technical trivia. It's the foundation of every decision you'll make with these tools: why one prompt works and another doesn't, why the response cut off midway, why the bill came in higher than expected.

But there's a gap. Knowing how the pieces work doesn't explain how typing a paragraph into a terminal results in 50 edited files, passing tests, and a ready commit. Something is taking those pieces, arranging them on the desk, building, checking, tearing down what fails, and trying again. Something is turning a next-token engine into a system that actually builds software.

That something is what tools like Claude Code, Codex CLI, and OpenCode do. They wrap the model, give it tools to act, and orchestrate the cycle of building, checking, and correcting. In the next article, we crack one of them open, piece by piece.

---

> 🤖 This article was written with assistance from Claude (Anthropic).
>
> Content researched, verified, and edited by a human.
>
> Found an error or a missing credit? Send me a message!

---

## References

1. [Petrov, A. et al. — "Language Model Tokenizers Introduce Unfairness Between Languages" (NeurIPS 2023)](https://arxiv.org/abs/2305.15425)
2. [Anthropic — Claude model documentation (2026)](https://docs.anthropic.com/en/docs/about-claude/models)
3. [Liu, N.F. et al. — "Lost in the Middle: How Language Models Use Long Contexts" (TACL 2024, vol. 12)](https://arxiv.org/abs/2307.03172)
4. [Vaswani, A. et al. — "Attention Is All You Need" (NeurIPS 2017)](https://arxiv.org/abs/1706.03762)
5. [SWE-bench](https://www.swebench.com/) — Princeton NLP (ICLR 2024)
6. [Meta — Llama 4 announcement (2025)](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
7. [Veracode — "GenAI and Code Security: What You Need to Know" (2025)](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
8. [Anthropic — API Pricing (2026)](https://www.anthropic.com/pricing)
9. [Kuratov, Y. et al. — "NoLiMa: Long-Context Evaluation Beyond Literal Matching" (ICML 2025)](https://arxiv.org/abs/2502.05167)
