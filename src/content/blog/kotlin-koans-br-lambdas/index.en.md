---
title: 'Kotlin Koans BR: Lambdas'
description: 'Pass a lambda to the any function to check whether the collection contains an even number.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 8
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fi79j8kpd34s9m5t1y524.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-lambdas-4pnl'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Lambdas/Task.kt)

Pass a lambda to the [`any`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/any.html) function to check whether the collection contains an even number.

When applied to a collection, the any function takes a predicate as its argument and returns true if at least one element satisfies the condition.

## Use case

[Lambdas](https://kotlinlang.org/docs/lambdas.html#lambda-expressions-and-anonymous-functions) are anonymous functions that offer an elegant and powerful way to represent actions or behaviors in Kotlin.

The power of lambdas lies in their simplicity. They let you express an idea or action concisely. For example, the action of adding two numbers can be written like this:

```kotlin
val sum: (Int, Int) -> Int = { x, y -> x + y }
println(sum(5, 3))  // Output: 8
```

- `(Int, Int) -> Int`: this is the lambda's signature: it takes two `Int` parameters and returns another `Int`.
- `{ x, y -> x + y }` defines the body. The parameters are named before the `->` symbol. Then comes the expression that produces the result of the expected type.

### A lambda is also a type

In Kotlin, lambdas are treated flexibly: they can, for example, be passed as arguments, returned by other functions, or assigned to variables.

```kotlin
val triangleFormula: (Polygon) -> Double = { it.base * it.height / 2 }
val rectangleFormula: (Polygon) -> Double = { it.base * it.height }

class Polygon(val base: Double, val height: Double) {
    fun calculateArea(formula: (Polygon) -> Double): Double {
        return formula(this) //this refers to "this instance"
    }
}

val triangle = Polygon(base = 10.0, height = 5.0)
val rectangle = Polygon(base = 8.0, height = 6.0)

println("Triangle area: ${triangle.calculateArea(triangleFormula)}")
println("Rectangle area: ${rectangle.calculateArea(rectangleFormula)}")
```

### What is `it`?

In Kotlin, when a lambda has only one parameter, that single parameter can be accessed implicitly using the
`it` keyword, without having to declare it explicitly.

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

val odds = numbers.filter { number -> number % 2 == 0 }
val evens = numbers.filter { it % 2 != 0 }
```

### Lambdas as the last parameter

If a lambda is the last parameter of a function, you can close the `)` and place the lambda outside the parentheses using `{}`.

```kotlin
fun applyOperation(a: Int, b: Int, operation: (Int, Int) -> Int): Int = operation(a, b)

applyOperation(
    a = 5,
    b = 3
) { x, y ->
    x + y
}
```

### Advantages

- **Concise code**: Lambdas simplify function syntax.
- **[Higher-order functions](https://kotlinlang.org/docs/lambdas.html#higher-order-functions) and [functional programming](https://en.wikipedia.org/wiki/Functional_programming)**: lambdas let you combine functional concepts with imperative programming.
- **Flexibility**: behavior can be passed as an argument using lambdas.
- **Modern integration**: Great compatibility with 'kotlin-first' APIs, such as [Jetpack Compose](https://developer.android.com/jetpack/compose).

### Disadvantages

- **Performance**: In some cases, lambdas can be less efficient, such as with intensive context capture.
- **Readability**: Overusing them can make code harder to understand.
- **Debugging**: Lambdas can produce complex stack traces.
- **Backward compatibility**: In versions prior to Java 8, backward compatibility is limited.

### Testability

- **Isolation**: it's good practice to test lambdas individually.
- **Verification**: Make sure lambdas produce correct results for the given inputs.
- **Coverage**: Include both common scenarios and edge cases.
- **Simplicity**: Keep lambdas focused and simple. Refactor them if they get too complex.

---

## Analogy

### Lambdas and the Swiss Army knife

- Quick, versatile tools for specific tasks.
- Just like each tool on the knife, lambdas meet one-off needs in your code.

### Lambdas and RPGs

- A "spell" that can be quickly adapted to the situation.
- Facing a specific challenge? Craft a spell on the spot, without having to search your predefined list of spells.
