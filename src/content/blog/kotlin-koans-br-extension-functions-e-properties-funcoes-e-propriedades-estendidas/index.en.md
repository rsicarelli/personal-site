---
title: 'Kotlin Koans BR: Extension functions and properties'
description: 'Implement the extension functions Int.r() and Pair.r() so they convert an Int and a Pair into a RationalNumber.'
pubDate: 2024-04-06
tags:
  - 'kotlin'
  - 'braziliandevs'
  - 'mobile'
  - 'kmp'
series: 'kotlin-koans-br'
seriesOrder: 13
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fi1sa1wvhb23tg0s9tvkx.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-extension-functions-e-properties-funcoes-e-propriedades-estendidas-e39'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 7
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Classes/Extension%20functions/Task.kt)

Implement the extension functions `Int.r()` and `Pair.r()` so they convert an `Int` and a `Pair` into a `RationalNumber`.

## Introduction to extension functions in Kotlin

In Kotlin, [extension functions](https://kotlinlang.org/docs/extensions.html#extension-functions) are a powerful tool that lets you add new behavior to a class without having to modify it or inherit from it: you "extend" it.

This tool helps us isolate our code better, reuse it, and give it the right context depending on how it's used.

Let's say you have the following hypothetical class that calculates shipping rates:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String {
        val value : Double = 10.50
        return "${value * 100}%"
    }

    fun calculateFastDelivery(): String {
        val value : Double = 22.90
        return "${value * 100}%"
    }

    fun calculateScheduledDelivery(): String {
        val value : Double = 15.50
        return "${value * 100}%"
    }
}
```

Notice that we're repeating the percentage calculation logic three times: `"${value * 100}%"`

To avoid repeating the code, we can extract just that calculation into a function that takes the `value`:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String {
        val value : Double = 10.50
        return formatAsPercentage(value)
    }

    fun calculateFastDelivery(): String {
        val value : Double = 22.90
        return formatAsPercentage(value)
    }

    fun calculateScheduledDelivery(): String {
        val value : Double = 15.50
        return formatAsPercentage(value)
    }

    private fun formatAsPercentage(value: Double) = "${value * 100}%"
}
```

This option is already great and helps us reuse our code. But with Kotlin's extension functions, there's a more idiomatic and elegant way to solve the same problem.

When you create an extension, the function behaves as if it were a member of that class, but under the hood the compiler treats it as just an ordinary function that takes an instance of that class as its first parameter.

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String {
        val value : Double = 10.50
        return value.formatAsPercentage()
    }

    fun calculateFastDelivery(): String {
        val value : Double = 22.90
        return value.formatAsPercentage()
    }

    fun calculateScheduledDelivery(): String {
        val value : Double = 15.50
        return value.formatAsPercentage()
    }

    private fun Double.formatAsPercentage() = "${this * 100}%"
}
```

Or even:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String = 10.50.formatAsPercentage()

    fun calculateFastDelivery(): String = 22.90.formatAsPercentage()

    fun calculateScheduledDelivery(): String = 15.50.formatAsPercentage()

    private fun Double.formatAsPercentage() = "${this * 100}%"
}
```

The biggest advantage is that we're giving the function context and extending the `Double` class (which is closed), adapting it just for our specific case.

You can also declare higher-order functions and reuse them across the whole repository:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String = 10.50.formatAsPercentage()

    fun calculateFastDelivery(): String = 22.90.formatAsPercentage()

    fun calculateScheduledDelivery(): String = 15.50.formatAsPercentage()
}

// Public to the whole repository
fun Double.formatAsPercentage() = "${this * 100}%"
```

### Extension properties

In the case above, a function can be redundant, since there's no parameter for the `formatAsPercentage()` function.

To solve this, Kotlin also lets us extend a class's properties, making the code even cleaner.

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String = 10.50.asPercentage

    fun calculateFastDelivery(): String = 22.90.asPercentage

    fun calculateScheduledDelivery(): String = 15.50.asPercentage

    private val Double.asPercentage
        get() = "${this * 100}%"
}
```

### How do they work?

Under the hood, an extension is just a static function that takes the object you're "expanding" (the receiver object) as its first argument.

Because of this, there's no performance overhead in using extension functions compared to regular functions.

### Advantages

- **Improves code readability**: Often, calling a method on an object is more intuitive than passing the object as an argument to a function.
- **Avoids namespace pollution**: Instead of creating generic utility functions, you can create your own private extensions only in the context where they're used.
- **Avoids unnecessary subclasses**: Instead of creating a subclass just to add a bit of behavior, you can create extensions.

### Disadvantages

- **They don't override original methods**: If the original class has a method with the same signature as the extension function, the original method gets called.
- **Limited access**: extension functions can't access a class's protected or private members.
- **They can lead to confusion**: Overusing them without proper organization can make the code hard to understand.

#### Testability

- **Isolation and purity**: Ideally, extension functions should behave like pure functions, making tests more predictable.
- **Restricted access**: Because they can't access private members, extension functions are easier to test.
- **Simplicity**: extension functions should have a single responsibility. This makes them easier to test.

### Pair

In the exercise, we come across a specific Kotlin class.

In Kotlin, [Pair](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-pair/) is a class that represents a value made up of two elements - a 'pair'. It's a simple way to store two related values together, but without any particular meaning.

`Pair` is a class defined in the `stdlib`:

```kotlin
data class Pair<out A, out B>(
    val first: A,
    val second: B
)
```

## Conclusion

Kotlin's extension functions and properties will be tools that stay with you throughout your whole journey as a Kotlin DEV.

They help us organize and reuse our code, giving it context and encouraging pure, isolated functions that make the source code easier to understand.
