---
title: 'KMP 101: Learning how Gradle is used in Kotlin Multiplatform'
description: 'In the last article, we created a project using the KMP Wizard and, with little effort, ran our app on Android, iOS, and Desktop.'
summary: 'In the last article, we created a project using the KMP Wizard and, with little effort, ran our app on Android, iOS, and Desktop devices.'
pubDate: 2023-12-01
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 6
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-101-aprendendo-sobre-o-uso-do-gradle-no-kotlin-multiplataforma-47f8'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 9
topic: kmp
difficulty: beginner
contentType: tutorial
---

This time, we're going to dig into a core aspect of KMP: the KMP Gradle Plugin.

---

## What is Gradle?

Gradle is a crucial tool in Kotlin projects, and it's a topic you'll need to invest plenty of time learning—especially if you don't have any Android dev experience.

Think of Gradle as the equivalent of NPM/Yarn/Webpack in the JavaScript world, or CocoaPods/Swift Package Manager in the iOS world. We'll use the following table to compare these tools:

| Feature                | Gradle | NPM     | Webpack | CocoaPods |
| ---------------------- | ------ | ------- | ------- | --------- |
| Dependency management  | ✅     | ✅      | ❌      | ✅        |
| Build automation       | ✅     | ❌      | ✅      | ❌        |
| Script execution       | ✅     | ✅      | ✅      | ✅        |
| Build customization    | ✅     | Limited | ✅      | Limited   |
| Repository management  | ✅     | ✅      | ❌      | ✅        |
| Plugins and extensions | ✅     | ✅      | ✅      | ✅        |
| Distributable packages | ✅     | ✅      | ✅      | ✅        |

### Why is Gradle so important in KMP?

One of the pillars of the Kotlin Multiplatform Project (KMP) is its deep integration with Gradle, through the use of the [KMP Plugin](https://plugins.gradle.org/plugin/org.jetbrains.kotlin.multiplatform). KMP relies heavily on Gradle to manage many aspects before, during, and after the development process. Gradle not only makes project setup easier, it also provides specialized tasks that help integrate shared KMP modules with iOS apps, for example.

The KMP Plugin is responsible for, among other things, linking the Xcode and KMP projects, as well as offering more Xcode-specific capabilities such as using `XFCFramework` to generate the distributable.

Beyond the Xcode/Apple integration, the KMP Plugin offers a wide range of integrations with other platforms, such as using **_Webpack_** for JS projects. Everything is orchestrated and executed by Gradle.

### Groovy vs Kotlin

Gradle's original language is Groovy. Today, however, the Kotlin community uses the [Kotlin DSL](https://docs.gradle.org/current/userguide/kotlin_dsl.html), which lets you drive Gradle with Kotlin.

It's worth noting that:

- `.gradle` files are written in Groovy.
- `.gradle.kts` files are in Kotlin, using the Kotlin DSL.

### A note for Gradle beginners

I strongly recommend pausing here and reading up on the basics of Gradle. That knowledge will help you understand the concepts that follow!

- [🔗 Getting started with Gradle: Tasks and basic commands | #AluraMais with Alex Felipe](https://www.youtube.com/watch?v=uX6Ezf73OEY)
- [Getting Started with the Gradle Kotlin DSL with Paul Merlin and Rodrigo B. de Oliveira](https://www.youtube.com/watch?v=KN-_q3ss4l0)

## Dissecting the Gradle files

Assuming you've grasped a few key aspects of Gradle, let's look at the most important files in the project we created in the [previous article](https://dev.to/rsicarelli/kmp-101-criando-e-executando-seu-primeiro-projeto-multiplataforma-no-fleet-4ep7).

```
.
├── .gradle
├── composeApp
│   ├── build
│   └── build.gradle.kts
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── build.gradle.kts
├── gradle.properties
├── gradlew
├── gradlew.bat
├── local.properties
└── settings.gradle.kt
```

### The root `settings.gradle.kts` file

This file is a Gradle component whose responsibility is to define the project's global settings, such as modules and subprojects, as well as the repository and dependency configuration for the overall project.

```kotlin
// Defines the project name
rootProject.name = "KMP101"

// How to enable Gradle features. In this case, "type safe project accessors"
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

// This block starts the configuration of the plugins the project's modules will share
pluginManagement {

    // Every module in the project will be able to use plugins from these repositories
    repositories {
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
        google()
        gradlePluginPortal()
        mavenCentral()
    }
}

// This block starts the configuration of the dependencies the project's modules will share
dependencyResolutionManagement {

    // Every module in the project will be able to use dependencies from these repositories
    repositories {
        google()
        mavenCentral()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}

// The `include(String)` function "plugs" a module into the project
// It causes the module's `build.gradle.kts` file to be executed
include(":composeApp")
```

### The root `build.gradle.kts` file

The main role of the root project's `build.gradle.kts` file is to define the build configuration for the entire project. It's through this file that we declare which plugins the other modules can use, along with other build settings that apply to the whole project.

Note the `apply false` pattern. This annotation is needed to prevent these plugins from being loaded multiple times by each subproject. For example, without this `apply false`, we'd be not just registering, **but also applying** the specific plugin to every module.

```kotlin
plugins {
    // Registers the Compose Multiplatform plugin
    alias(libs.plugins.jetbrainsCompose) apply false
    // Registers the AGP (Android Gradle Plugin) "application" plugin
    alias(libs.plugins.androidApplication) apply false
    // Registers the AGP (Android Gradle Plugin) "library" plugin
    alias(libs.plugins.androidLibrary) apply false
    // Registers the KMP plugin
    alias(libs.plugins.kotlinMultiplatform) apply false
}
```

> Wondering what this `libs` is?
>
> [🔗 Check out my article on Gradle's version catalog](https://dev.to/rsicarelli/android-plataforma-parte-6-version-catalog-59ob)

### The `composeApp` module's `build.gradle.kts` file

This is where the module-specific settings happen. A Gradle module's `build.gradle.kts` file applies local settings to that specific module only.

Let's split this module's `build.gradle.kts` into a few parts and analyze each one.

#### 1. Applying plugins

In the root `build.gradle.kts` file, we registered our plugins. Now, let's apply them to our project.

```kotlin
plugins {
    // Enables the "kotlin" extension in this file
    alias(libs.plugins.kotlinMultiplatform)

    // Enables the "android" extension in this file
    alias(libs.plugins.androidApplication)

    // Enables the "compose" extension in this file
    alias(libs.plugins.jetbrainsCompose)
}
```

#### 2. The `kotlin` extension (aka [_KotlinMultiplatformExtension_](https://github.com/JetBrains/kotlin/blob/c4fe7e44534a5412463acf6bba0da9f5bf8f9cb3/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/dsl/KotlinMultiplatformExtension.kt))

Welcome to the gateway of KMP. This extension lets you declare platforms and compilation-specific settings. Its main responsibilities are:

1. Define the module's targets
2. Set up the module's source sets
3. Determine the common and source-set-specific dependencies

##### 2.1: Defining the `composeApp` module's targets

First, we specify which targets the module will compile to, plus a few specific settings.

```kotlin
kotlin {
    // Tells the plugin to add Android as a target
    androidTarget {
        // Tells which JVM version your Android app will use
        compilations.all {
            kotlinOptions {
                jvmTarget = "1.8"
            }
        }
    }

    // Tells the plugin to add Desktop as a target
    jvm("desktop")

    // Tells the plugin to add iOS as a target
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget -> //of type KotlinNativeTarget
        // A basic framework configuration is required
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }
    ..
}
```

##### 2.2 Defining the source sets

The next step is to define the project's source sets and the dependencies each one needs.

It's important to highlight the following:

1. `androidMain` and `commonMain` are predefined through the `KotlinMultiplatformSourceSetConventions` class. This removes the need to manually register these source sets.
2. `desktopMain` doesn't have a convention yet. That's why we need to create it manually.
3. Note that there's no `iosMain` in this configuration. The reason is that, for now, no extra dependencies are needed for iOS. But, just like `androidMain` and `commonMain`, we have `iosMain` available if needed.

```kotlin
kotlin {
    ..

    sourceSets {
        // Defines the dependencies of the "androidMain" source set.
        // These dependencies are Android-only
        androidMain.dependencies {
            implementation(libs.compose.ui)
            implementation(libs.compose.ui.tooling.preview)
            implementation(libs.androidx.activity.compose)
        }

        // Defines the dependencies of the "commonMain" source set.
        // These dependencies are shared across all targets
        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material)
            implementation(compose.components.resources)
        }


        // Creates the "desktopMain" source set
        val desktopMain by getting

        // Defines the dependencies of the "desktopMain" source set
        // These dependencies are specific to Desktop
        desktopMain.dependencies {
            implementation(compose.desktop.currentOs)
        }
    }
}
```

#### 3. The `android` extension (also known as `BaseAppModuleExtension`)

This configuration is specific to Android, imposed by the `androidApplication` plugin. Here, we define paths for resources and manifests. Rather than detailing everything, let's focus only on the KMP-related part.

Normally, in Android projects, we only have a single `main` folder, and the Android Gradle Plugin (AGP) doesn't need additional information about where Android-specific resources—like the `AndroidManifest.xml`—are located.

In the KMP context, however, there are multiple `main` directories, and AGP currently doesn't clearly identify which one is the Android-specific one.

To solve this, we need to define a few paths manually:

```kotlin
android {
    ..
    // Tells where the AndroidManifest.xml is located
    sourceSets["main"].manifest.srcFile("src/androidMain/AndroidManifest.xml")

    // Tells where the `res` folder is located
    sourceSets["main"].res.srcDirs("src/androidMain/res")

    // Tells where the `resources` folder is located.
    // Note that this folder isn't exclusive to Android, so we can share it with "commonMain"
    sourceSets["main"].resources.srcDirs("src/commonMain/resources")
    ..
}
```

#### 4. The `compose` extension (also known as `ComposeExtension`)

We haven't dug deeply into Compose yet, but since we're following the KMP Wizard's template, it's worth briefly mentioning this extension.

It becomes essential exclusively for configuring the desktop version of our app:

```kotlin
compose.desktop {
    // Defines a new JVM-based application
    application {
        // Points to an internal class in the "desktopMain" source set
        mainClass = "MainKt"

        // Defines the information about the distributable package
        nativeDistributions {
            targetFormats(
                TargetFormat.Dmg, // Mac
                TargetFormat.Msi, // Windows
                TargetFormat.Deb  // Linux
            )
            packageName = "br.com.rsicarelli"
            packageVersion = "1.0.0"
        }
    }
}
```

### Other Gradle files

We've already covered the files specific to our KMP project. Other files, like `gradle.properties` and `libs.versions.toml`, hold important Gradle and project settings.

#### The root `gradle.properties` file

This file contains various Gradle settings that let us make some deeper changes to our project.

In KMP projects, there are a few important _flags_ to declare:

```properties
# Enables Compose Multiplatform support for iOS.
org.jetbrains.compose.experimental.uikit.enabled=true

# Sets the Android source set layout version to the new structure introduced in Kotlin 1.8.0 and the default in 1.9.0.
kotlin.mpp.androidSourceSetLayoutVersion=2

# Enables C-interop "commonization" in Kotlin Multiplatform.
kotlin.mpp.enableCInteropCommonization=true
```

#### The `libs.versions.toml` file in the `gradle` folder

This file represents our catalog of libraries, versions, and plugins.

> [🔗 Check out my article on Gradle's version catalog](https://dev.to/rsicarelli/android-plataforma-parte-6-version-catalog-59ob)

#### Other files

Files and folders like `.gradle`, `gradlew`, `gradlew.bat`, `local.properties`, `.idea`, and `.fleet` are managed by Gradle commands or by the IDE itself, with no KMP-specific configuration that needs analyzing.

## Conclusion

With this guide, we've learned crucial aspects of Gradle in KMP projects.

Being able to efficiently manage dependencies, define paths for resources and manifests, and configure specific extensions is crucial for day-to-day life as a KMP dev. On top of that, understanding the Gradle files—like `gradle.properties` and `libs.versions.toml`—is fundamental to keeping your project up to date and aligned with industry best practices.

The way I see it, Gradle in KMP projects isn't just a technical skill; it's a strategic asset that powers the development of robust, adaptable applications across multiple platforms. As KMP continues to evolve, the knowledge gained here will be a solid foundation for exploring new features and integrating emerging technologies into your projects.

In the next article, we'll finally get our hands on some Kotlin code, learning an essential KMP feature: `expect` and `actual`.

See you next time!

---

> 🤖 This article was written with the help of ChatGPT 4, using the Web plugin.
>
> The sources and content are reviewed to ensure the information provided is relevant, as are the sources used in each prompt.
>
> That said, if you find any incorrect information or believe some credit is missing, please get in touch!

---

> References
>
> - [Gradle vs. Other Build Tools - unrepo.com](https://www.unrepo.com)
> - [Gradle vs. npm - Gradle Hero](https://gradlehero.com)
> - [Webpack Comparison - webpack.js.org](https://webpack.js.org/comparison/)
> - [Multiplatform Gradle Plugin Improved for Connecting KMM Modules | The Kotlin Blog](https://blog.jetbrains.com/kotlin/2021/07/multiplatform-gradle-plugin-improved-for-connecting-kmm-modules/)
> - [Compose Multiplatform for iOS Is in Alpha | The Kotlin Blog](https://blog.jetbrains.com/kotlin/2023/02/compose-multiplatform-for-ios-is-in-alpha/)
> - [Android source set layout | Kotlin Documentation](https://kotlinlang.org/docs/mpp-android-source-set-layout.html)
