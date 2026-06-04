---
title: 'Kotlin Koans BR: Hello, world!'
description: 'Change the code so that the start function returns the string "OK".'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 1
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-ola-mundo-2dpf'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Hello,%20world!/Task.kt)

Change the code so that the `start` function returns the string `"OK"`.

In the Kotlin Koans tasks, the `TODO()` function will throw an exception.

To complete a Kotlin Koan, you need to replace that function call with meaningful code that solves the problem.

## How functions work

In Kotlin, functions are blocks of code designed for specific tasks. Functions are fundamental to the language, helping you organize, reuse, and run actions efficiently.

```kotlin
fun functionName(
    argument1: Type,
    argument2: Type,
): ReturnType {
    return returnValue
}
```

- `fun` is the reserved keyword used to declare a function.
- `functionName` names and declares the function in a clear, specific way.
- `(argument1: Type, argument2: Type)` lists the parameters the function will receive, separated by `,`. Every
  parameter must have a name on the left of the `:` symbol, and its type on the right.
- `: ReturnType` after the `:` symbol indicates the type of value the function returns once it finishes running.
- `{}` is the body of the function, where the instructions to be executed live.

### A simple function

Here is a simple function that adds two integers and returns the result.

```kotlin
fun add(a: Int, b: Int): Int {
    val result = a + b
    return result
}

val sumResult = add(3, 5)
println(sumResult) // Result: 8
```

### Single-expression functions

In Kotlin, when a function has only one expression after the `=` symbol, and the return type is clear or can be inferred, the compiler knows that the result of that expression is the function's return value.

This lets you drop the `{}` body and use the `=` expression instead.

In other words, it goes from a **block body** to an **expression body**:

```kotlin
fun double(number: Int): Int = number * 2

val doubledNumber = double(7)
println(doubledNumber) // Result: 14
```

> 💡 In Kotlin, when a function evaluates a simple expression, the conventional practice is to use an expression
> body instead of a block body. Shorter functions are usually easier to understand.

### Functions with no return value

When a function doesn't have a defined return value, it is understood to return `Unit`, which is similar to `void` in other languages.

`Unit` in Kotlin indicates that a function returns nothing.

The following expressions are all equivalent and valid:

```kotlin
//Common usage
fun showMessage() {}
fun showMessage() = Unit

//Uncommon, but equivalent
fun showMessage() {
    Unit
}
fun showMessage(): Unit {}
fun showMessage(): Unit {
    Unit
}
fun showMessage(): Unit = Unit
```

### Handling multiple parameters with _vararg_

`vararg` in Kotlin is used to accept multiple arguments in a function.

```kotlin
fun printItems(vararg items: String) {
    for (item in items) {
        println(item)
    }
}

printItems("Paçoca", "Cajú", "Açaí")
```

### Declaring variables

In Kotlin, there are two common ways to declare variables: with `val` and with `var`.

- `val` is a fixed, read-only value.

```kotlin
val bookTitle = "The Dev Journey"
// bookTitle = "Another Title" //not possible
```

- `var` is a non-fixed value, for both reading and writing.

```kotlin
var draftPage = "My idea"
draftPage = "A different idea" // allowed
```

> 💡 `val` is not a synonym for immutable. Even though you can't reassign the value, its internal content can still change.

```kotlin
val list = mutableListOf("a", "b", "c")
// list = mutableListOf("d", "e", "f") // Compilation error, because `val` is read-only.

list.add("d") // This is allowed, because we are modifying the list's internal content, not reassigning a new value to it.
```

## 🔗 [Types in Kotlin](https://kotlinlang.org/docs/kotlin-tour-basic-types.html)

Types define the nature of a value and determine the operations you can perform on that value.

Some types in Kotlin:

```kotlin
// Int: Represents integer values.
val currentYear: Int = 2023

// Double: Decimal numbers with high precision.
val weight: Double = 1.534776

// Float: Decimal numbers with lower precision.
val height: Float = 1.82F

// Long: Ideal for large integer values.
val worldPopulation: Long = 7800000000L

// Char: Indicates a single character.
val initial: Char = 'K'

// Boolean: Only allows true or false.
val studyingKotlin: Boolean = true

// String: A set of characters forming a piece of text.
val name: String = "Chico"

// List: Groups several elements in order.
val books: List<String> = listOf("Kotlin for Beginners", "Functional Programming")

// MutableList: A list that allows additions and removals.
val animals: MutableList<String> = mutableListOf("Dog", "Cat")

// Set: A collection with unique elements, no duplicates.
val colors: Set<String> = setOf("Red", "Blue", "Green")

// Sequence: A sequence for large collections or complex calculations.
val numbers: Sequence<Int> = sequenceOf(1, 2, 3, 4, 5)

// Map: Relates keys and values.
val dictionary: Map<String, String> = mapOf(
    "Kotlin" to "A programming language",
    "Lua" to "Another programming language"
)

// HashSet: A hash-based set, with no specific ordering.
val fruits: HashSet<String> = hashSetOf("Apple", "Banana", "Orange")

// HashMap: A hash-based map, with no specific ordering.
val capitals: HashMap<String, String> = hashMapOf(
    "Brazil" to "Brasília",
    "China" to "Beijing"
)

// Array: Similar to List, but has a fixed size.
val daysOfWeek: Array<String> = arrayOf("Monday", "Tuesday", "Wednesday")

// Pair: Groups two values of possibly different types.
val nameAge: Pair<String, Int> = Pair(first = "Rodrigo", second = 30)

// Triple: Groups three values of possibly different types.
val coordinates: Triple<Double, Double, Double> = Triple(first = 12.5, second = 45.6, third = 78.9)

// Any: The superclass of all non-null types in Kotlin.
val anything: Any = "This could be any object"

// Nothing: Represents a value that never occurs, used for functions that never return.
val error: Nothing = Nothing

// Byte: An 8-bit integral value, between -128 and 127.
val byteExample: Byte = 127

// UByte: A positive byte, ranging from 0 to 255.
val uByteExample: UByte = 255u

// UShort: A positive, short value, ranging from 0 to 65,535.
val uShortExample: UShort = 65535u

// UInt: A positive integral value, ranging from 0 to 4,294,967,295.
val uIntExample: UInt = 4294967295u

// ULong: A very large positive integral value, ranging from 0 to 18,446,744,073,709,551,615.
val uLongExample: ULong = 18446744073709551615uL
```
