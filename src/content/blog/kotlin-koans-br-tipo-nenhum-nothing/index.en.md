---
title: 'Kotlin Koans BR: The "nothing" type (Nothing)'
description: 'Specify the Nothing return type for the failWithWrongAge function.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 7
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F035mutklknjlsv9o3iw2.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-tipo-nenhum-nothing-5gio'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Nothing%20type/Task.kt)

Specify the `Nothing` return type for the `failWithWrongAge` function.

Without specifying the `Nothing` type, the `checkAge` function fails to compile, because the compiler assumes that age could be `null`.

## Use case

`Nothing` represents a value that never exists, and you can't have a value or object of this class because its constructor is private.

`Nothing` is used to mark functions that never return a value.

```kotlin
fun waitForever(): Nothing {
    while (true) {
        // I'm waiting...
    }
}
```

### The special role of `Nothing`

In [type theory](https://en.wikipedia.org/wiki/Type_theory), `Nothing` is considered the "bottom type" — in other words, it's a subtype of every other type in Kotlin. This means a `Nothing` value can be assigned to variables of any type.

```kotlin
fun error(message: String): Nothing = throw IllegalStateException(message)

fun findSession(sessionId: Int): Session =
    sessionsInProgress
        .firstOrNull { it.id == sessionId }
        ?: error("Session not found!")
```

Even though the `error()` function returns `Nothing`, assigning its result to a variable of type `Session` is valid, because `Nothing` acts as a subtype of `Session`.

### Advantages

- **Clear, direct communication**: a function that returns `Nothing` has no intention of returning a value, removing any ambiguity.
- **Flexibility**: it behaves like a "chameleon" in Kotlin's type world, becoming useful in many different scenarios.
- **Resource savings**: thanks to the compiler's smarts, we don't waste memory allocating something that should never exist.
- **Protection against errors:** `Nothing` makes it clear: _I will never return_. This kind of guarantee can prevent unpleasant surprises at runtime.

### Disadvantages

- **Some adjustment needed**: for people just getting started with Kotlin, `Nothing` can come across as a puzzling concept, with a bit of a learning curve.
- **Overuse**: it's possible to fall into the trap of using `Nothing` in a confusing, excessive way, complicating your code instead of simplifying it.

## Analogy

Imagine a colorful book with a cover showing the title, the authors, and the publisher. But when you open it, every page is blank. The book exists, it has weight, it has shape, but it has no content.

That's how `Nothing` works in Kotlin. It has presence, it has a representation, yet it holds no intrinsic value or meaning.

In code, when a function returns `Nothing`, it's as if we were opening a book expecting a story, but finding empty
pages.
