---
title: 'Kotlin Koans BR: Import alias'
description: 'When importing a class or function, you can give it a different name by adding as NewName after the import directive. This can be useful when…'
pubDate: 2024-04-06
tags:
  - 'kotlin'
  - 'braziliandevs'
  - 'mobile'
  - 'kmp'
series: 'kotlin-koans-br'
seriesOrder: 12
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-alias-para-importacao-import-alias-5ahe'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 3
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Classes/Rename%20on%20import/Task.kt)

When [importing](https://kotlinlang.org/docs/packages.html#imports) a class or function, you can give it a different name by adding as NewName after the import directive. This can be useful when you want to use two classes or functions with similar names from different libraries.

Uncomment the code and make it compile. Rename `Random` from the Kotlin package to `KRandom` and `Random` from the Java package to `JRandom`.

## An introduction to Kotlin's "rename imports"

In everyday development, we constantly use different functions and classes that share the same name.

For example, suppose you need to use `Random` from the `kotlin.random` package and, at the same time, `Random` from the `java.util` package:

```kotlin
fun useDifferentRandomClasses(): String {
   val kotlinRandom = kotlin.random.Random.nextInt(2)
   val javaRandom = java.util.Random().nextInt(2)

   return "Kotlin: $kotlinRandom, Java: $javaRandom."
}
```

Here you have to make a choice: either import `java.util` or `kotlin.random`:

```kotlin
import kotlin.random.Random

fun useDifferentRandomClasses() {
    val kotlinRandom = Random.nextInt(2)
    val javaRandom= java.util.Random().nextInt(2)
}
```

or...

```kotlin
import java.util.Random

fun useDifferentRandomClasses(): String {
    val kotlinRandom = kotlin.random.Random.nextInt(2)
    val javaRandom = Random().nextInt(/* bound = */ 2)
}
```

If we try to import both, we get an error in the IDE:

![Conflict when importing](https://media.rsicarelli.com/blog/kotlin-koans-br/shared/import-conflict-kotlin.png)

## Introducing the "import alias"

There are two ways to solve this problem. The first is to use the "full qualifier", that is, to declare the class you want to use together with its package:

```kotlin
kotlin.random.Random.nextInt(2)
java.util.Random().nextInt(2)
```

This approach is perfectly valid, but it takes some extra mental effort to understand where each `Random` instance comes from.

There's also a concern about readability and organization. Imagine, for example, that you have two classes with the same name in your repository, and both live in long packages:

```kotlin
val errorCore = br.com.rsicarelli.multiplatform.core.errorMessages.shared.apiErrors.Error
val errorFeature = br.com.rsicarelli.multiplatform.feartures.home.errorMessages.shared.apiErrors.Error
```

This is much harder to read, which makes the code more difficult to understand.

This is where Kotlin's _import aliases_ come into play:

```kotlin
import br.com.rsicarelli.multiplatform.core.errorMessages.shared.apiErrors.Error as CoreError
import br.com.rsicarelli.multiplatform.feartures.home.errorMessages.shared.apiErrors.Error as FeatureError

val errorCore = CoreError
val errorFeature = FeatureError
```

This way, your imports stay organized and reusable, and you reduce the mental effort of reading and following your code, making it cleaner and more cohesive!

## Conclusion

The import alias in Kotlin helps us organize our code better, and it also resolves import conflicts between classes and functions that share the same name.

This feature is powerful and lets us give our code better context, making it easier to read and understand.
