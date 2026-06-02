---
title: 'KMP-102 - XCFramework for KMP Devs'
description: 'Welcome to the KMP-102 series. We dig deeper into Kotlin Multiplatform concepts, learning more about how to integrate our Kotlin code into iOS and beyond.'
pubDate: 2024-05-29
tags:
  - 'kotlin'
  - 'kmp'
  - 'ios'
  - 'braziliandevs'
series: 'kmp-102'
seriesOrder: 1
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F77ybgidb8t2gwn9n696y.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-xcframework-para-devs-kmp-4a4b'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 16
---

## KMP102 - XCFramework for Kotlin Multiplatform Devs

Welcome to the KMP-102 series. We're going to dig deeper into Kotlin Multiplatform concepts, learning more about how to integrate our Kotlin code into iOS and other platforms.

To kick off this series, let's learn more about a special file format for sharing code with the Apple family: the `XCFramework`.

### An Introduction to Apple's `.framework`

A [framework](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPFrameworks/Concepts/WhatAreFrameworks.html) is a bundle that contains a set of resources and source code meant to be used in projects for the Apple family. In the JVM world, this is the equivalent of a `.jar` or, in the case of Android, an `.aar`.

It's a precompiled format that can be used freely across projects in Xcode. This file format makes it easier to build libraries for Apple devices, allowing them to be distributed and consumed through package managers like CocoaPods or the Swift Package Manager.

<p align="center">
  <img src="https://developer.apple.com/library/archive/documentation/General/Conceptual/DevPedia-CocoaCore/Art/framework_2x.png" alt="AppKit.framework" width="450">
</p>

### An Introduction to the XCFramework

The [XCFramework](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle) is a type of bundle or artifact that makes it easier to distribute libraries for the Apple family. Basically, instead of distributing several `.frameworks` for each platform, we have a single `.xcframework` that contains multiple `.frameworks`, each one representing a specific platform supported by the library.

Kotlin Multiplatform, and more specifically Kotlin/Native, uses this artifact to precompile Kotlin code into Objective-C, ensuring full interoperability with Swift. With this, our Kotlin code is easily shared across all of the project's supported targets, significantly simplifying the development process: instead of compiling several `.frameworks` for each target supported in KMP, we compile only one `.xcframework` for each target or processor architecture.

### Generating an XCFramework in KMP

Behind the scenes, the KGP (Kotlin Gradle Plugin) uses the Xcode toolchain and gives us an API that lets us create an `XCFramework` through our `build.gradle.kts` files:

```kotlin
kotlin {
    val xcFramework = XCFramework(xcFrameworkName = "KotlinShared")

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "KotlinShared"
            isStatic = true

            xcFramework.add(this)
        }
    }
}
```

When we sync the project, we notice that the `assembleKotlinSharedXCFramework` task has been registered in our project. Notice that the task has `KotlinShared` in the middle, which matches the `xcFrameworkName` parameter of the `XCFramework` class:
![XCFramework registered task](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/xcframework-gradle-task.png?raw=true)

### Analyzing the result of the assemble...XCFramework task

When we run the `assembleKotlinSharedXCFramework` task, Kotlin/Native generates the `.xcframeworks` for all the targets we defined in `build.gradle.kts`.

This artifact is exactly the file we need to link to the Xcode project in order to consume our KMP code compiled into Objective-C!

> **Note**: Be careful with the project name! Special characters, such as "-", can lead to an error, even though the XCFramework still gets generated.

<p align="center">
  <img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/xcframework-task-result.png?raw=true" alt="AppKit.framework" width="450">
</p>

## NativeBuildTypes: debug and release

Notice that we have two generated frameworks: the `debug` version and the `release` version. These two types have special characteristics that come from the [NativeBinaryType](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin-api/src/common/kotlin/org/jetbrains/kotlin/gradle/plugin/mpp/NativeBinaryTypes.kt) class:

Analyzing this enum, we understand that the `release` version has the `optimized = true` and `debuggable = false` flags, while the `debug` version has `optimized = false` and `debuggable = true`.

As you can imagine, we have to be careful when choosing which `XCFramework` to use in the development workflow:

- For the local development environment, the `debug` version is the ideal choice, since it lets us debug our KMP code.
- For the production environment, the `release` version is the right choice, since the binary is optimized and avoids including debug information in the final product.

```kotlin
// kotlin/libraries/tools/kotlin-gradle-plugin-api/src/common/kotlin/org/jetbrains/kotlin/gradle/plugin/mpp/NativeBinaryTypes.kt

enum class NativeBuildType(
    val optimized: Boolean,
    val debuggable: Boolean
) : Named {
    RELEASE(true, false),
    DEBUG(false, true);
}
```

## Controlling which build type to generate

The configuration for generating the binary types comes from the `iosTarget.binaries.framework()` function. When we analyze the [AbstractKotlinNativeBinaryContainer](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/dsl/AbstractKotlinNativeBinaryContainer.kt) class, we notice that the `framework()` function has a `buildTypes` argument with a default value.

```kotlin
// kotlin/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/dsl/AbstractKotlinNativeBinaryContainer.kt

fun framework(
    namePrefix: String,
    buildTypes: Collection<NativeBuildType> = NativeBuildType.DEFAULT_BUILD_TYPES,
    configure: Framework.() -> Unit = {}
) = createBinaries(namePrefix, namePrefix, NativeOutputKind.FRAMEWORK, buildTypes, ::Framework, configure)

// kotlin/libraries/tools/kotlin-gradle-plugin-api/src/common/kotlin/org/jetbrains/kotlin/gradle/plugin/mpp/NativeBinaryTypes.kt
enum class NativeBuildType(...) : Named {
    ...
    companion object {
        val DEFAULT_BUILD_TYPES = setOf(DEBUG, RELEASE)
    }
}
```

During the development workflow, you may want to avoid compiling both versions due to the increased build time. To do that, we just adapt our `build.gradle.kts`:

```kotlin
kotlin {
    val compileOnlyDebug = true // some gradle.properties flag will help you here!

    val buildType = if (compileOnlyDebug)
        NativeBuildType.DEBUG
    else NativeBuildType.RELEASE

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework(
            buildTypes = listOf(buildType)
        ) {
            baseName = "KotlinShared"
            isStatic = true

            xcFramework.add(this)
        }
    }
}
```

## Conclusions

The XCFramework is a central topic in the Kotlin Multiplatform (KMP) universe. Understanding what it is, how it works, and how to generate it gives us greater control and a better grasp of what goes on behind the scenes in KMP.

In the next article, we'll take a closer look at the `framework()` function!

## Sources

- [KotlinLang | Build final native binaries](https://kotlinlang.org/docs/multiplatform-build-native-binaries.html)
- [Embracing the Power of XCFrameworks: A Comprehensive Guide for iOS Developers](https://medium.com/@mihail_salari/embracing-the-power-of-xcframeworks-a-comprehensive-guide-for-ios-developers-77fe192d47fe)
