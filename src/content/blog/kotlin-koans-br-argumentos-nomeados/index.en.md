---
title: 'Kotlin Koans BR: Named arguments'
description: 'Make the joinOptions() function return the list in JSON format (for example, [a, b, c]) by specifying only two arguments.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 2
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-argumentos-nomeados-1ace'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Named%20arguments/Task.kt)

Make the `joinOptions()` function return the list in [JSON](https://en.wikipedia.org/wiki/JSON) format (for example, `[a, b, c]`) by specifying only two arguments.

You can use the [`joinToString`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/join-to-string.html) function available in the [stdlib](https://kotlinlang.org/api/latest/jvm/stdlib/):

```kotlin
fun joinToString(
    separator: String = ", ",
    prefix: String = "",
    postfix: String = "",
    /* ... */
): String
```

## Use case

When you come across [Named arguments](https://kotlinlang.org/docs/kotlin-tour-functions.html#named-arguments) in Kotlin, you can picture them as putting labels or tags on the values you pass to functions, making everything easier to understand and reducing mistakes.

```kotlin
fun sendEmail(
    from: String,
    to: String,
    subject: String,
) = Unit
```

Normally, the function would be used like this:

```kotlin
sendEmail(
    "sender@example.com",
    "recipient@example.com",
    "About the Meeting"
)
```

But when we name the arguments, each value is spelled out clearly:

```kotlin
sendEmail(
    from = "sender@example.com",
    to = "recipient@example.com",
    subject = "About the Meeting"
)
```

### Setting only what you need

Let's say you only need to set the subject and leave the rest as defaults:

```kotlin
sendEmail(subject = "Meeting Cancelled")
```

### Flexibility in ordering

Want to change the order of the values? No problem, everything is still clear:

```kotlin
sendEmail(
    subject = "Reminder",
    to = "team@example.com",
    from = "staff@example.com"
)
```

### Advantages

- **Clarity in function calls**: naming arguments removes any doubt about how the values you provide map to the function's parameters.
- **Flexibility**: there's no need to follow the default parameter order, so you can focus only on the arguments that matter.
- **Error reduction and prevention**: by naming arguments, you reduce the chance of accidentally passing the wrong value to a parameter.
- **Implicit documentation**: the code becomes self-explanatory, reducing the need for extra comments to explain what each value is for.

### Disadvantages

- **Maintaining names**: when a parameter name changes in the function definition, every argument that uses that parameter needs to be updated.
- **Verbose calls**: in functions with many arguments, naming each one can make the function call long and cluttered.

## Analogy

Imagine walking into a library full of books, all with the same cover and no titles on the spine. You know the book you want is in there, but how do you find it among so many identical ones?

This is similar to `named arguments` in Kotlin. Without clearly identifying the arguments, you can easily get lost, even when you know what you want to do. With named arguments, though, everything becomes clearer, as if each book had its own cover and title.
