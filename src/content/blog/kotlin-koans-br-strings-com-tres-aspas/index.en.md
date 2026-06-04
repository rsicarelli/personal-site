---
title: 'Kotlin Koans BR: Triple-quoted strings'
description: 'Swap the trimIndent call for trimMargin, setting # as the prefix value, so the resulting string no longer contains the prefix character.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 4
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F7i8v3zse00a2qe2uta0q.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-strings-com-tres-aspas-3202'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Triple-quoted%20strings/Task.kt)

Swap the `trimIndent` call for the `trimMargin` call, setting `#` as the prefix value, so the resulting string won't contain the prefix character.

There are functions like [`trimIndent`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim-indent.html) and [`trimMargin`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim-margin.html) that format multi-line triple-quoted strings to fit the surrounding code context.

## Use case

In Kotlin, [triple-quoted strings](https://kotlinlang.org/docs/strings.html#multiline-strings) (`multiline strings`) make it easy to represent strings with several lines and special characters, without having to escape them.

This technique improves code clarity and simplifies working with long text or text with intricate structures.

By using a pair of triple quotes `""" """`, you can declare a multi-line piece of text in Kotlin.

```kotlin
val text = """
    This is a string that contains
    several lines
    without needing escape characters.
"""
```

In this context, sequences like `\n` (new line) and `\t` (tab) are read literally as text, without any
special handling.

### Advantages

- **Simplicity**: easy to work with long text or text that needs specific formatting.
- **No character escaping needed**: special characters don't have to be "escaped", which improves the clarity and readability of the code.
- **They act as a kind of string template**, making it easy to embed dynamic values in text and giving you more flexibility when working with strings.

### Disadvantages

- **Unwanted whitespace** can be avoided by using functions like `trimMargin()` and `trimIndent()` to remove those extra spaces.
- **Less support in some IDEs**: although it's rare, some IDEs and text editors may struggle with syntax highlighting or automatic formatting.
- **Performance concerns**: in some situations, such as heavy loops, overusing them can lead to performance problems.

## Analogy

Triple-quoted strings in Kotlin are like murals on walls. A mural isn't interrupted by frames or borders, letting the art stretch across the whole surface without a break.

```kotlin
val heart = """
    ,d88b.d88b,
    88888888888
    `Y8888888Y'
      `Y888Y'
        `Y'
"""
```
