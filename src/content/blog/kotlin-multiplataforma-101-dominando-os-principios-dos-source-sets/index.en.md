---
title: 'KMP 101: Mastering the Principles of Source Sets'
description: 'In the last article, we learned about the Kotlin compiler frontend, IR, and backend. Now we dig into source sets — the key concept for writing KMP code.'
summary: 'In the last article (🔗 KMP 101: Understanding How Kotlin Compiles for Multiple Platforms), we learned about the frontend, IR, and backend of the Kotlin compiler.'
pubDate: 2023-11-24
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 3
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F6xa5d4gzb1kl52b68rhd.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-multiplataforma-101-dominando-os-principios-dos-source-sets-4pg'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 11
---

This time, let's understand a key concept for writing KMP code: _source sets_.

---

## Introduction to _source sets_ in KMP

_Source sets_ in Kotlin are essential to multiplatform development. Using a hierarchical architecture, _source sets_ let us organize our source code, declare target-specific dependencies, and configure compilation options in isolation for different platforms within a single project.

Think of a _source set_ in KMP as a 'special folder' in a project, where each folder serves a specific purpose (or platform). For example, the "common" folder holds files used across every platform, while platform-specific folders like "android" or "iOS" hold files exclusive to those platforms.

The Kotlin compiler recognizes these special folders and takes care of compiling their contents (source code), following the compilation strategies explored in 🔗 [KMP 101: Understanding How Kotlin Compiles for Multiple Platforms](https://dev.to/rsicarelli/kotlin-multiplataforma-101-entendendo-como-o-kotlin-compila-para-multiplas-plataformas-5hba).

## Understanding the role and basic structure of a _source set_

Every _source set_ in a multiplatform project has **a unique name** and contains a set of source code files and resources (files, icons, etc.). It specifies **a target** the code will compile to.

Assuming the necessary configuration has been applied (which we'll cover in future articles), the folder structure below tells the Kotlin compiler to:

1. Initialize and compile the following targets: `android`, `iOS`, `watchOS`, `tvOS`, `js`, `wasm`, and `desktop`.
2. Compile the source code inside the `common` _source set_ for every platform, making the members of the `Common.kt` file natively available to each defined platform.
3. At the end of compilation, generate platform-specific files (`.class`, `.so`, `.js`, `.wasm`), with every member of `Common.kt` available.

![Basic source set structure](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp101-sourcesets-basic.png?raw=true)

### The hierarchical nature of _source sets_

KMP _source sets_ work like a family tree.

At the root of the tree, we have the common ancestors (the `commonMain` _source set_), whose traits are shared by everyone in the family. As we move out to the branches, we find the intermediate _source sets_, which represent family branches with unique traits shared by a subset of members (for example, `apple` or `native`).

Finally, at the tips of the branches sit the individual family members (the platform-specific _source sets_, like `iosArm64` or `iosSimulatorArm64`), each with its own unique traits.

This lets you organize a hierarchy of intermediate _source sets_ with full control over what each _source set_ shares.

![KMP default hierarchy](https://kotlinlang.org/docs/images/default-hierarchy-example.svg)

## Common vs. platform-specific _source sets_

In KMP, the distinction between common and platform-specific _source sets_ is fundamental to understanding how code is shared and managed across different targets.

### Common _source set_ (`commonMain`)

The common _source set_, usually located in the `commonMain` directory, is the foundation of code sharing in Kotlin Multiplatform. Here you write the Kotlin code that is shared across all of the project's target platforms. This code can include business logic, data models, and functionality that is agnostic to the underlying platform.

It's worth noting that, although this code is shared, it must not contain any functionality or API call that is platform-specific. The Kotlin compiler enforces this, preventing the use of platform-specific functions or classes in common code, since that code is compiled for different targets.

### Platform-specific _source sets_

While common code offers a major advantage in code reuse, not everything can be generalized to every platform. This is where platform-specific _source sets_ come in, such as `androidMain`, `iosMain`, `desktopMain`, and others. These _source sets_ contain platform-specific code and are compiled only for their respective target.

For example, the `androidMain` _source set_ can contain Android API calls, while `iosMain` can use iOS-specific APIs. This lets you take advantage of each platform's unique features and APIs while keeping a significant common codebase in `commonMain`.

### Choosing between common and specific

When developing a Kotlin Multiplatform project, a significant part of your effort goes into deciding what belongs in common code and what needs to be implemented specifically for each platform. The general rule is to maximize common code, falling back to platform-specific _source sets_ only when you need to access functionality or APIs that aren't available generically.

This approach not only simplifies code maintenance but also ensures consistency across all platforms, making the most of Kotlin Multiplatform's potential.

## Intermediate _source set_

Let's say we have a KMP project with the `commonMain`, `androidMain`, and `appleMain` _source sets_. Inside the common _source set_, we have an interface called `InterfaceComum` that acts as a contract every platform must adhere to.

Deriving from `InterfaceComum`, we have `InterfaceApple` and `InterfaceAndroid`: `InterfaceApple` adds functionality specific to the Apple ecosystem, while `InterfaceAndroid` does the same for Android devices.

This design ensures that, even though we share the common logic through `InterfaceComum`, each platform can have its own extensions and functionality, keeping the code separated and specialized as needed.

This concept is called [intermediary _source sets_](https://kotlinlang.org/docs/multiplatform-discover-project.html#intermediate-source-sets):

> An intermediate _source set_ is a _source set_ that compiles to some, but not all, of the project's targets.

![Source sets example](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/mermaid-diagram-2023-11-24-110205.png?raw=true)

## Test _source set_

Tests in Kotlin Multiplatform are also treated as a _source set_. That means each platform can have its own platform-specific tests using, for example, the native SDK or other native open source libraries.

The common _source set_ can (and should!) have its own tests too, but you'll need to use other KMP libraries for multiplatform test authoring, such as [🔗 kotlin.test](https://kotlinlang.org/api/latest/kotlin.test/), [🔗 turbine](https://github.com/cashapp/turbine), or [🔗 assertk](https://github.com/willowtreeapps/assertk).

![Test source sets example](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/test-source-set-kmp.png?raw=true)

## Managing dependencies in _source sets_

In Kotlin Multiplatform projects, managing dependencies efficiently across _source sets_ is crucial to keeping the code modular and efficient.

KMP lets us control each _source set_'s dependencies individually, and even create relationships/dependencies between them.

### Dependencies in the common _source set_

In the common _source set_ (`commonMain`), dependencies include libraries usable across every platform the project supports. These libraries provide functionality that is independent of any specific platform, such as business logic, algorithms, or common utilities. Including a library in the common source set means that functionality is available to all of the project's targets, promoting code reuse and consistency across platforms.

This means that, when you declare a common dependency, all the other _source sets_ get that dependency too — which, in turn, is a KMP dependency offering platform-agnostic functionality.

### Dependencies in platform-specific _source sets_

In contrast to the common _source set_, platform-specific _source sets_ like `androidMain` or `iosMain` focus on dependencies that are relevant only to a particular platform. These dependencies are used to access APIs, libraries, or resources that are exclusive to a platform, allowing developers to leverage native features and optimize the user experience on each platform.

![Dependencies source sets example](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/mermaid-diagram-2023-11-24-125307.png?raw=true)

## Conventions adopted by the community

KMP is extremely flexible, letting us name and manipulate our _source sets_ however we prefer.

Over the years, though, the community has adopted some conventions, and KMP itself has adapted around them, offering some conveniences in project configuration. Let's explore the main ones.

### 1: Names using "camelCase"

The community generally adopts `cammelCase` naming for defining _source sets_.

### 2: The "main" suffix

The `main` directory in projects that use JVM languages such as Java and Kotlin is traditionally used to store the application's main source code. This directory is part of a conventional folder structure, where `main` typically holds the packages and classes that implement the program's core logic.

In KMP projects, this tradition was carried forward, and `main` is used as a suffix to declare our _source sets_: `commonMain`, `androidMain`, `nativeMain`, `desktopMain`, etc.

### 3: Shared code using `commonMain`

Shared code usually lives in a _source set_ called `commonMain`. It's not common, but some projects also adopt the `sharedMain` naming.

### 4: Using the "Source set conventions"

As we learned, KMP itself has adjusted around these community definitions.

Starting with Kotlin `1.9.20`, the KMP Gradle plugin offers **a default hierarchy template**, which contains predefined intermediate _source sets_ for common use cases. This template is automatically configured based on the targets specified in the project.

Inside the KPM Gradle Plugin, there's a class called [🔗 KotlinMultiplatformSourceSetConventions](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/dsl/KotlinMultiplatformSourceSetConventions.kt) that greatly reduces the tedious task of defining and controlling _source sets_:

| Source Set          | Platform    |
| ------------------- | ----------- |
| `androidMain`       | Android     |
| `androidNativeMain` | Android     |
| `androidNativeTest` | Android     |
| `appleMain`         | Apple       |
| `appleTest`         | Apple       |
| `commonMain`        | Common      |
| `commonTest`        | Common      |
| `iosMain`           | iOS         |
| `iosTest`           | iOS         |
| `jsMain`            | JavaScript  |
| `jsTest`            | JavaScript  |
| `jvmMain`           | JVM         |
| `jvmTest`           | JVM         |
| `linuxMain`         | Linux       |
| `linuxTest`         | Linux       |
| `macosMain`         | macOS       |
| `macosTest`         | macOS       |
| `mingwMain`         | Windows     |
| `mingwTest`         | Windows     |
| `nativeMain`        | Native      |
| `nativeTest`        | Native      |
| `tvosMain`          | tvOS        |
| `tvosTest`          | tvOS        |
| `wasmJsMain`        | WebAssembly |
| `wasmJsTest`        | WebAssembly |
| `wasmWasiMain`      | WebAssembly |
| `wasmWasiTest`      | WebAssembly |
| `watchosMain`       | watchOS     |
| `watchosTest`       | watchOS     |

---

## Conclusion

In this article, we explored the vital concept of _source sets_ in KMP, uncovering how they make it easier to organize code, declare platform-specific dependencies, and configure compilation options in isolation. We understood the distinction between common and platform-specific _source sets_, the importance of intermediate _source sets_, and how to manage dependencies efficiently to keep the code modular and efficient.

KMP's flexibility and power let us build robust, efficient applications, maximizing code reuse and keeping consistency across all platforms. Adopting the community conventions and deeply understanding the _source set_ structure are essential for any dev looking to get the most out of Kotlin Multiplatform's potential.

In our next article, we'll dive into the KMP Gradle Plugin, exploring how it helps us configure and manage our multiplatform projects efficiently.

See you next time!

---

> 🤖 This article was written with the help of ChatGPT 4, using the Web plugin.
>
> The sources and content are reviewed to ensure the relevance of the information provided, as well as the sources used in each prompt.
>
> However, if you find any incorrect information or believe a credit is missing, please get in touch!

---

> References
>
> - [Hierarchical project structure | Kotlin Documentation](https://kotlinlang.org/docs/multiplatform-hierarchy.html)
> - [The basics of Kotlin Multiplatform project structure | Kotlin Documentation](https://kotlinlang.org/docs/multiplatform-basic-project-structure.html)
> - [Create your multiplatform project | Kotlin Multiplatform Development Documentation](https://www.jetbrains.com/lp/mobile-multiplatform/)
> - [Adding dependencies on multiplatform libraries | Kotlin Documentation](https://kotlinlang.org/docs/mpp-add-dependencies.html)
> - [Use platform-specific APIs | Kotlin Multiplatform Development Documentation](https://www.jetbrains.com/lp/mobile-multiplatform/platform-specific-apis/)
