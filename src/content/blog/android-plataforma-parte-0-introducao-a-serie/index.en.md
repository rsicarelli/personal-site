---
title: 'Android Plataforma - Part 0: Introducing the Series'
description: 'Android development is a constant stream of new devices, SDK updates, and a flood of libraries and tools shipping every day. Here is how we tame it.'
summary: 'Android development is a constant stream of new things: new devices, SDK updates, and an endless variety of libraries and tools that ship every single day.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 17
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-0-introducao-a-serie-1ffe'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform'
  reactions: 10
topic: android
difficulty: intermediate
contentType: tutorial
---

On top of that, add the constant changes, deprecations, and the business pressure to ship features that meet customer needs. This volatile landscape makes it a real challenge to keep our code organized, efficient, and scalable.

In this series of articles, I'll walk you through the process of building an Android Platform.

## What is a platform?

As you scale an Android project, you run into challenges like modularization and dependency management. The need for performance, optimization, UI/UX consistency, and backward compatibility also becomes more and more pressing.

A "platform" is a cohesive, well-defined set of practices, tools, and libraries that speed up development.

It stands out as a robust, scalable solution for tackling the challenges inherent to Android development, helping with things like modularization, optimization, continuous integration, testing, and security.

## Building a Platform on Android

Throughout these articles, we'll build a platform from scratch and integrate it with an existing project.

🔗 [github.com/rsicarelli/kotlin-gradle-android-platform](https://github.com/rsicarelli/kotlin-gradle-android-platform)

1. [**Modularization**](/en/blog/android-plataforma-parte-1-modularizacao)
   - We'll explore the reasons and ideas behind modularization on Android.
2. [**Starting the Project**](/en/blog/android-plataforma-parte-2-inicio-do-projeto)
   - We'll introduce the base project that we'll evolve and integrate with our platform.
3. [**Sharing Gradle scripts**](/en/blog/android-plataforma-parte-3-compartilhando-scripts-do-gradle)
   - We'll cover `buildSrc` and discuss how to share scripts across Gradle projects.
4. [**Composite Build**](/en/blog/android-plataforma-parte-4-composite-build-lgk)
   - We'll introduce this valuable Gradle feature and create a composite build to represent our platform.
5. [**Simplifying Gradle Init**](/en/blog/android-plataforma-parte-5-simplificando-gradle-init)
   - We'll take a closer look at the features our platform actually needs.
6. [**Version Catalog**](/en/blog/android-plataforma-parte-6-version-catalog)
   - We'll introduce and implement Gradle's version catalog.
7. [**Decorating the 'app' module**](/en/blog/android-plataforma-parte-7-decorando-o-modulo-app)
   - We'll introduce the concept of "decorations" and delegate the `app` module's Gradle scripts to our platform.
8. [**Decorating the 'library' modules**](/en/blog/android-plataforma-parte-8-decorando-os-modulo-library)
   - We'll move on to our libraries and delegate their logic to our platform too.
9. [**Unifying the Application and Library extensions with the Common Extension**](/en/blog/android-plataforma-parte-9-unificando-a-application-e-library-extensions-com-a-common-extension)
   - We'll discuss `ApplicationExtension`, `LibraryExtension`, and `CommonsExtension` from the Android Gradle Plugin (AGP).
10. [**Customizing the modules**](/en/blog/android-plataforma-parte-10-customizacao-dos-modulos)

- We'll parameterize our platform so the modules using it can be customized.

11. [**Creating a DSL to customize the new options**](/en/blog/android-plataforma-parte-11-criando-uma-dsl-para-customizar-as-novas-opcoes)

- We'll build an idiomatic Kotlin way to apply our platform customizations.

12. [**Optimizing build time for Android libraries**](/en/blog/android-plataforma-parte-12-otimizando-tempo-de-compilacao-para-bibliotecas-android)

- We'll discuss the Android Gradle Plugin's `BuildFeatures` and optimize the build of Android libraries.

13. [**Adding "pure JVM" modules**](/en/blog/android-plataforma-parte-13-incluindo-modulos-puro-jvm)

- We'll explore the reasons to keep modules leaner and avoid the extra steps of the Android Gradle Plugin.

14. [**Adopting experimental Kotlin compiler features**](/en/blog/android-plataforma-parte-14-aderindo-a-funcionalidades-experimentais-do-compilador-do-kotlin)

- We'll discuss the `@RequiresOptIn` annotation and how to adapt our platform to adopt experimental features.

15. [**Caring for the code with Detekt, Klint, and Spotless**](/en/blog/android-plataforma-parte-15-cuidando-do-codigo-com-detekt-klint-e-spotless)

- We'll focus on code quality, using our platform to set our project up with code analysis and formatting tools.

16. [**Final thoughts**](/en/blog/android-plataforma-parte-16-consideracoes-finais)

- We'll reflect on whether a platform is really needed, on good practices, and on the next steps for future series!

![A diagram of the Android Platform structure](https://media.rsicarelli.com/blog/android-plataforma/shared/sjeq93uk3vdzdp6sv0ja.png)

## A spoiler of what we'll learn

We'll build a few decorations to apply in our `build.gradle.kts` files:

- Declaring an `app` module through the `androidApp()` function
- Declaring `library` modules through the `androidLibrary()` function
- Declaring pure JVM modules through the `jvmLibrary()` function
- Integrating `detekt` and `spotless` as code quality tools.

```kotlin
import com.rsicarelli.kplatform.detekt
import com.rsicarelli.kplatform.spotless

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.arturbosch.detekt) apply false
    alias(libs.plugins.diffplug.spotless) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}

detekt()
spotless()
```

```kotlin
import com.rsicarelli.kplatform.androidApp

plugins {
    id(libs.plugins.android.application.get().pluginId)
    kotlin("android")
}

androidApp {
    versionCode = 1
    versionName = "1.0.0"
}

dependencies {
    implementation(libs.androidx.activity.compose)
    implementation(projects.core.designsystem)
    implementation(projects.features.home)
}
```

```kotlin
import com.rsicarelli.kplatform.androidLibrary

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
}
```

```kotlin
import com.rsicarelli.kplatform.jvmLibrary

plugins {
    kotlin("jvm")
}

jvmLibrary()

dependencies {
    implementation(libs.kotlinx.coroutines.core)
}
```

## Happy learning!

I hope you enjoy this content and learn a lot from it!

If you have any questions or run into trouble, don't hesitate to reach out or leave a comment.

Start here: [**Part 1: Modularization**](/en/blog/android-plataforma-parte-1-modularizacao)
