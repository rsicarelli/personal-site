---
title: 'Kotlin Koans BR: String Templates'
description: 'The pattern below matches a date in the format 13.06.1992 (two digits, a dot, two digits, a dot, four digits):'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 5
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Funnkrkmrmqw59fx6yz5f.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-modelos-de-string-4kl0'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
---

### 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/String%20templates/Task.kt)

The pattern below matches a date in the format `13.06.1992` (two digits, a dot, two digits, a dot, four digits):

```kotlin
fun getPattern() = """\d{2}\.\d{2}\.\d{4}"""
```

Using the `month` variable, rewrite this pattern so that it matches the date in the format `13 JUN 1992` (two digits, a blank space, a month abbreviation, a blank space, four digits).

## Use case

In Kotlin, [string templates](https://kotlinlang.org/docs/strings.html#string-templates) are a way to combine strings with variables or expressions.

A string template works like a placeholder where you can insert a dollar sign `$` followed by the name of the variable or expression.

The real value is dropped into that spot in the template when the string is used.

```kotlin
val name = "Mel"
println("Good morning, $name.") // Output: Good morning, Mel.
```

You can also include expressions and call other methods using curly braces `${}`.

```kotlin
fun getName() = "Dani"
val age = 35
println("Hi, ${getName()}. You'll turn ${age + 5} in five years.") // Hi, Dani. You'll turn 40 in five years.
```

### Advantages

- **Convenience**: they help you build messages without needing extra functions or variables.
- **Better readability**: string templates are easy to understand, since it's clear where the values from the expressions go.

### Disadvantages

- **Complexity**: when you overuse templates, the string can become hard to read.
- **Security risks**: inserting sensitive information directly into templates can open the door to security problems.
- **Performance issues**: in specific situations, overusing templates can be less efficient than concatenating strings, especially with very long text.

## Analogy

Picture a mosaic, a piece of art made of fragments that come together to form a complete image. In this mosaic, some spaces are left empty to be filled in later, according to the artist's choice.

String templates in Kotlin work in a similar way: the strings form the complete mosaic, while the placeholders (or templates) represent the empty spaces meant to be filled with variables or expressions.

```kotlin
val specialPlace = "Beach"
println("My special place is $specialPlace.")

fun favoritePlace() = "Mountains"
println("Carla's favorite place is ${favoritePlace()}.")
```
