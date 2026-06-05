---
title: 'KMP 101: Exploring internal and external dependencies in KMP (end of the series)'
description: 'In previous articles, we established a foundation in Kotlin Multiplatform (KMP) and how it compiles to multiple platforms.'
summary: 'In previous articles, we established a foundation in Kotlin Multiplatform (KMP) and how it compiles to multiple platforms.'
pubDate: 2024-01-27
tags:
  - 'kmp'
  - 'kotlin'
  - 'braziliandevs'
series: 'kmp-101'
seriesOrder: 8
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-101-explorando-as-dependencias-internas-e-externas-no-kmp-4j76'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 8
topic: kmp
difficulty: beginner
contentType: tutorial
---

In this article, we'll explore how to use _open-source_ libraries, understand when they fit our projects, and finally how to implement them.

---

## Dependencies and source sets

We discovered that Kotlin uses a structure of _source sets_ to manage its distinct compilations.

Each Kotlin _source set_, whether `commonMain` or specific ones like `androidMain`, `native/ios`, `desktop`, `js`, can declare dependencies that are used exclusively in that context.

Example:

```kotlin
commonMain.dependencies {
    // shared by all source sets
}
androidMain.dependencies {
    // common + Android
}
appleMain.dependencies {
    // common + Apple family
}
iosMain.dependencies {
    // common + apple + iOS
}
```

### A source set is a unique environment

Each Kotlin _source set_ becomes an isolated environment, with access to platform-specific APIs and SDKs.

For example, in the Android _source set_ you have access to the Android SDK; on iOS, to DarwinOS and Apple's SDK such as `platform.UiKit` and components of `platform.Foundation`.

Below we implement a Logger in KMP in a fully native way, with no external dependencies, using only the native SDKs:

```kotlin
// src/commonMain/Logger.kt

interface Logger {
    fun e(message: String, error: Throwable)
}
```

```kotlin
// src/androidMain/Logger.android.kt

import android.util.Log

class AndroidLogger : Logger {
    override fun e(message: String, error: Throwable) {
        Log.e("TAG", message)
        error.printStackTrace()
    }
}
```

```kotlin
// src/appleMain/Exemplo.apple.kt

import kotlinx.cinterop.ptr
import platform.darwin.OS_LOG_DEFAULT
import platform.darwin.OS_LOG_TYPE_ERROR
import platform.darwin.__dso_handle
import platform.darwin._os_log_internal

class DarwinLogger : Logger {
    override fun e(message: String, error: Throwable) {
        _os_log_internal(
            __dso_handle.ptr,
            OS_LOG_DEFAULT,
            OS_LOG_TYPE_ERROR,
            "%s",
            message
        )
        error.printStackTrace()
    }
}
```

## Understanding how dependencies work in KMP

Consider a `build.gradle.kts` with [ktor-client](https://ktor.io/docs/getting-started-ktor-client-multiplatform-mobile.html) applied and dependencies declared. When you sync the project, dependencies are pulled in according to the _targets_ you specified.

```kotlin
kotlin {
    androidTarget()

    jvm("desktop")

    iosX64()
    iosArm64()
    iosSimulatorArm64()
    watchosArm32()
    watchosArm64()
    watchosSimulatorArm64()
    macosArm64()
    tvosArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.ktor.client.core)
        }
    }
}
```

The following image shows only a portion of those dependencies:

![Dependency with all source sets](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-all-targets-imported.png)

By declaring the _targets_ and importing a dependency in `commonMain`, all of those dependencies get imported into the project.

If we removed some _targets_ from our `build.gradle.kts` and synced the project, we'd notice that the dependencies specific to each source set disappeared:

```kotlin
// removed:
watchosArm32()
watchosArm64()
watchosSimulatorArm64()
macosArm64()
tvosArm64()
```

![Dependency with some of the source sets](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-limited-imports.png)

In other words, each declared target expects a dependency to exist for it, whether it's published as an artifact somewhere like Maven, or it's a dependency on an internal module.

### The relationship between external dependencies and a module's targets

To use a dependency in a source set, that dependency must exist for the specific target.

For example, to declare dependencies in `commonMain`, an artifact (internal or external) specific to common main must exist.

The same applies to the other targets. For instance, if you declare `watchosArm32()` as a target, and your internal module or library doesn't declare those targets, you get an error.

### Dissecting the `commonMain` dependency

`commonMain` works in a unique way compared to the other source sets. At compile time, it acts only as `metadata` — that is, it isn't compiled directly into executable code for a specific platform, but rather into an intermediate format that contains metadata.

This metadata is then used by the platform-specific Kotlin backends to generate the corresponding executable code for each platform.

When we explore the contents of this dependency, we notice a special KMP extension: the `.klib`.

![ktor client common dependency](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-ktor-client-common-klib.png)

In KMP, the `.klib` file is a library that contains code shareable across different platforms.

In the context of `commonMain`, the `.klib` works as a collection of source code and resources that can be compiled for multiple platforms using the different backends.

If we expand the `linkdata` folder, we run into another special KMP file format: `.knm`

![ktor client common dependency](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-ktor-client-common-knm.png)

The `.knm` file format is a binary format used internally by Kotlin/Native's `klib` libraries, especially together with the `cinterop` tool.

This format holds metadata and information that the Kotlin compiler uses to compile and link native libraries. The `.knm` files are implementation details that make interoperability and library creation in the Kotlin/Native context easier.

The last file is the `manifest`. This file contains metadata about the library itself. That includes information like the library version, required dependencies, and other metadata the build system and the compiler use to understand how to integrate and use the library in the project. Every `.klib` has a manifest that describes its contents and how it should be handled during compilation and runtime linking.

### Dissecting the iOS dependency

Depending on which Apple platforms you include in your source set, a different dependency gets imported into the project.

Note that, besides the source sets declared in our `build.gradle.kts`, there's also the `posix` dependency.

The "posix" dependency in a Kotlin Multiplatform context for iOS refers to application programming interfaces for operating systems compatible with POSIX (Portable Operating System Interface).

In the iOS case, `posixMain` indicates that this library is using POSIX APIs, common in Unix-based systems like iOS.

![iOS dependency in the project](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-ktor-client-ios-imports.png)

#### Exploring the iOS `.klib` files

When we analyze the contents of an iOS target's `.klib`, we find a structure similar to `commonMain`, but with an `ir` folder and a `targets.ios_X` folder.

The `ir` folder represents different compiled code components and metadata:

- `bodies.knb`: Contains the bodies of the compiled functions.
- `debugInfo.knd`: Debug information that enables error tracing and code inspection during development and debugging.
- `files.knf`: List of the source files compiled into the library.
- `irDeclarations.knd`: Intermediate declarations of the Intermediate Representation (IR) that the compiler uses to compile the Kotlin code.
- `signatures.knt`: Signatures of the functions and types in the library, used for unique identification within the compiled code.
- `strings.knt`: String literals used in the library's code.
- `types.knt`: Information about the types used in the library, such as classes, interfaces, and primitive types.

The `targets.ios_X` folder has no content in this case. But this folder is where LLVM "bitcode" files live, containing the intermediate code used by the LLVM compiler.

![iosarm64 dependency in the project](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-ktor-client-iosarm64-klib.png)

### Dissecting the JS dependency

For the JS _target_, we still have a `.klib` file, but accompanied by a `package.json`.

![JS dependency](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-ktor-client-js-include-klib.png)

### Dissecting the Android dependency

In the case of Android and JVM, the dependency isn't a `.klib`, but rather a conventional `.jar` from the JVM world.

In this case, we see a normal `.jar` format, like any Java/Kotlin program.

Note that this dependency is used by both the `android` and `desktop` source sets:

![Android and JVM dependency](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-ktor-client-jvm-jar.png)

## How do I find out whether an open-source library is compatible with my target?

To check whether an _open-source_ library is compatible with a _target_, it's a good idea to look at where the library is hosted and which artifacts are available. You can also inspect the library's `build.gradle.kts` and check which _targets_ that library compiles for.

In the case of `ktor-client-core`, going to [Maven Central](https://mvnrepository.com/search?q=ktor-client-core) and searching for the group, we find a list of artifacts for each source set.

![Demo across all platforms](https://media.rsicarelli.com/blog/kmp-101/shared/kmp-maven-ktor-ezgif.com-video-to-gif-converter.gif)

## Internal module dependencies

For internal modules, it's essential that the consuming module has _targets_ compatible with the consumed module.

Let's say the `:shared1` module wants to consume the `:shared2` module. Note that the `:shared2` module has the same targets as `:shared1` plus `js()`.

In this case, `:shared1` can consume `:shared2`, since `:shared2` compiles for the target that `:shared1` needs.

Now, the reverse isn't possible: the `:shared2` module expects a `js()` target that the `:shared1` module doesn't offer! In that case, you get a compilation error.

```kotlin
// :shared1 build.gradle.kts
kotlin {
    androidTarget()
    iosARM64()
}

// :shared2 build.gradle.kts
kotlin {
    androidTarget()
    iosARM64()
    js()
}
```

## Conclusions

Understanding how internal and external dependencies work in Kotlin Multiplatform (KMP) is crucial, because it helps us pick libraries that meet our projects' needs.

In this article, we explored the "guts" of these dependencies more deeply, and how declaring the _targets_ in our application influences which dependencies get included in the project.

We also dug into the concepts of `.klib` and `.knm`. While they don't significantly affect our day-to-day development, these pieces are essential to understanding how KMP works its "magic".

## End of the KMP101 series!

It's with great satisfaction that we wrap up this foundation in KMP!

I hope the knowledge you've gained serves as a springboard so you can explore and navigate the world of KMP with confidence.

Stay tuned for the KMP102 series, where we'll dive even deeper into implementations, architecture, testing, interoperability with Swift and other languages, and much more!

A hug, and see you next time!

---

> 🤖 This article was written with the help of ChatGPT 4, using the Web plugin.
>
> The sources and content are reviewed to ensure the relevance of the information provided, as well as the sources used in each prompt.
>
> That said, if you find any incorrect information or believe some credit is missing, please reach out!

---

> References
> [Discussion about KNM on KotlinLang](https://slack-chats.kotlinlang.org/t/5013792/u02k3a6e6kd-i-have-some-questions-about-the-knm-kotlin-nativ)
