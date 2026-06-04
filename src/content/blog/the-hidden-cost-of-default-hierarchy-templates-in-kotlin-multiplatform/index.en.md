---
title: 'The Hidden Cost of Default Hierarchy Template in Kotlin Multiplatform'
description: 'The Default Hierarchy Template in KMP projects is a great way to reduce boilerplate code and start working quickly. However, it came with an unexpected…'
pubDate: 2025-11-02
updatedDate: 2025-11-14
tags:
  - 'kotlin'
  - 'kmp'
  - 'mobile'
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F6nh7bfue7eck9yqnr91b.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/the-hidden-cost-of-default-hierarchy-templates-in-kotlin-multiplatform-256a'
  devtoId: 2985222
  reactions: 6
topic: kmp
difficulty: advanced
contentType: deep-dive
featured: true
featuredOrder: 2
---

## Introduction

The Default Hierarchy Template in KMP projects is a great way to reduce boilerplate code and start working quickly. However, it came with an unexpected cost in our large-scale codebase. A project with 70+ KMP modules targeting Android, iOS, and JVM saw sync times balloon from 15 minutes to over an hour. More critically, an enterprise project with 180+ modules became completely unusable, crashing after 10+ hours of attempting to sync.

This wasn't a misconfiguration or a rogue plugin. The culprit? A single, seemingly innocent line of code introduced with Kotlin 1.9.20:

```kotlin
applyDefaultHierarchyTemplate()
```

Before we dive into the solution, let's understand what's happening under the hood. What are hierarchy templates, and why does the default one create such a performance bottleneck?

## What Are Hierarchy Templates in Kotlin Multiplatform?

At its core, Kotlin Multiplatform is built on a elegant but complex system of **source sets**—logical collections of code that share common dependencies and compilation settings.

When you create a KMP project, you declare **targets** (the platforms you're compiling for) and **source sets** (where your code lives):

```kotlin
kotlin {
    androidTarget()
    jvm()
    iosArm64()
    iosX64()
    iosSimulatorArm64()
}
```

Each target automatically gets its own source set (`androidMain`, `jvmMain`, `iosArm64Main`), where you can write platform-specific code with access to platform APIs. But the real power of KMP lies in `commonMain`—code written here is shared across _all_ your targets.

### The dependsOn Relationship: Connecting the Dots

Source sets form a hierarchy through the `dependsOn` relationship. When `iosArm64Main` depends on `commonMain`, it can access all the code written in the common source set. This relationship creates a directed graph that determines:

1. **Code visibility** - Which declarations are accessible where
2. **Dependency propagation** - Libraries added to `commonMain` flow down to all dependent source sets
3. **API safety** - The compiler ensures you only use APIs available on all platforms a source set compiles to

### Intermediate Source Sets: The Middle Ground

Here's where it gets interesting. What if you want to share code between _some_ platforms, but not all?

Imagine you have iOS-specific logic that works across all iOS variants (arm64 for devices, x64 for Intel simulators, simulatorArm64 for Apple Silicon simulators). You don't want to duplicate this code in three places, but you also can't put it in `commonMain` because it uses iOS-specific APIs.

Enter **intermediate source sets**. An `iosMain` source set sits between `commonMain` and your platform-specific iOS source sets, allowing you to:

- Access iOS-specific APIs (like Foundation framework)
- Share that code across all iOS targets
- Keep it separate from Android and JVM code

This hierarchy might look like:

```
commonMain
├── androidMain
├── jvmMain
└── iosMain (intermediate)
    ├── iosArm64Main
    ├── iosX64Main
    └── iosSimulatorArm64Main
```

### What Hierarchy Templates Do

Manually creating intermediate source sets and wiring up all the `dependsOn` relationships was tedious and error-prone. You'd write something like:

```kotlin
val iosMain by creating {
    dependsOn(commonMain.get())
}
val iosArm64Main by getting {
    dependsOn(iosMain)
}
// ... repeat for each iOS target
```

**Hierarchy templates** automate this boilerplate. They're predefined blueprints that analyze your declared targets and automatically create the appropriate intermediate source sets with the correct dependency relationships.

Starting with Kotlin 1.9.20, the default hierarchy template became active automatically, eliminating the need to manually configure iOS source sets. Sounds great, right?

It is—until it isn't.

## The Default Hierarchy Template in Action

To understand the performance problem, we need to see what the default template actually _does_.

When you call `applyDefaultHierarchyTemplate()` (or let it apply automatically), the Kotlin Gradle Plugin analyzes your targets and creates intermediate source sets based on a comprehensive, predefined structure designed to support _all possible_ Kotlin Multiplatform targets.

Let's consider a common real-world scenario. Your project targets:

```kotlin
kotlin {
    applyDefaultHierarchyTemplate()

    androidTarget()
    jvm()
    iosArm64()
    iosX64()
    iosSimulatorArm64()
}
```

You might expect a simple hierarchy:

```
commonMain
├── androidMain
├── jvmMain
└── iosMain
    ├── iosArm64Main
    ├── iosX64Main
    └── iosSimulatorArm64Main
```

But here's what the default template _actually_ creates:

```
commonMain
├── androidMain
├── jvmMain
├── nativeMain (shared by ALL native targets)
    └── appleMain (shared by ALL Apple targets)
        └── iosMain (shared by iOS targets)
            ├── iosArm64Main
            ├── iosX64Main
            └── iosSimulatorArm64Main
```

Notice the extra layers: nativeMain and appleMain. The template creates these intermediate source sets (and their corresponding src/nativeMain and src/appleMain directories) to enable code sharing in scenarios like:

- `nativeMain`: Share code across _all_ Kotlin/Native targets (iOS, macOS, Linux, Windows Native, watchOS, tvOS, etc.)
- `appleMain`: Share code across _all_ Apple platforms (iOS, macOS, watchOS, tvOS)

The design philosophy is sound. The default template optimizes for the most comprehensive code-sharing scenario. If you later add `macosArm64()` to your targets, it will automatically slot into the existing hierarchy under `appleMain`, and any code you've written there will just work.

This is "convention over configuration" at its finest—the template handles the complexity for you.

But here's the critical question: What if you're never going to target macOS, Linux, or tvOS? What if your "native" targets are only iOS?

In an iOS-only project, you likely have no code in nativeMain or appleMain—these directories sit empty in your project structure. Yet they still generate build tasks and configuration overhead.

## The Hidden Cost: A Task Explosion

Source sets aren't just a conceptual model—they have real, tangible consequences in your build system. Every source set in your hierarchy triggers the creation of multiple Gradle tasks.

When the Kotlin Gradle Plugin processes your source set hierarchy, it generates tasks for each source set. The pattern is predictable and measurable.

The results were striking:

- **Optimized template**: 158 tasks per module
- **Default template**: 166 tasks per module
- **Difference**: **8 extra tasks per module**

Extrapolate to our production codebase with 70 modules, and you're looking at **560 wasteful tasks**. In our enterprise codebase with 180+ modules we have "only" **1440** **wasteful tasks** 🫣.

For every intermediate source set (`nativeMain`, `appleMain`), Gradle creates a family of tasks:

- `compile<SourceSet>KotlinMetadata` - Compiles the source set into platform-agnostic Kotlin IR (Intermediate Representation) stored in a `.klib` file
- `metadata<SourceSet>Classes` - Assembles compilation outputs
- `metadata<SourceSet>ProcessResources` - Processes resources for the source set
- `transform<SourceSet>DependenciesMetadata` - Generates serialized dependency metadata for IDE tooling

### Task Deep Dive: The Metadata Compilation Tasks

**`compileNativeMainKotlinMetadata`** and **`compileAppleMainKotlinMetadata`** are responsible for compiling the (conceptual) `nativeMain` and `appleMain` source sets into Kotlin metadata.

Here's the problem: **These source sets have no code.** The `src/nativeMain/kotlin` and `src/appleMain/kotlin` directories exist but sit empty because we're not sharing any code at those levels. Yet the Kotlin compiler still runs, processing an empty source set, generating an (essentially empty) `.klib` file.

The source sets exist in the dependency graph because the template created them. The `iosArm64Main` compilation needs to know what APIs are available from `appleMain`, which needs to know what's available from `nativeMain`. Even if those source sets are empty, the metadata must be compiled to satisfy the dependency chain.

Think of it like compiling an empty `.kt` file—the compiler still has to initialize, parse (nothing), run analysis passes, and write output. The overhead isn't zero.

### Task Deep Dive: The IDE Transform Tasks

**`transformNativeMainCInteropDependenciesMetadataForIde`** and **`transformAppleMainCInteropDependenciesMetadataForIde`** are even more insidious.

If you have tests under `iosTest` you will get an extra **`transformNativeTestCInteropDependenciesMetadataForIde`** and **`transformAppleTestCInteropDependenciesMetadataForIde`** as well.

These tasks exist specifically for IDE support. When you sync your project in Android Studio or IntelliJ IDEA, these tasks run to process C-interop dependencies (Kotlin/Native bindings to C/Objective-C libraries) and make them understandable to the IDE's code analysis engine.

**The irony?** Our project has no C-interop dependencies in `nativeMain` or `appleMain` because those source sets don't exist in our codebase. We're transforming... nothing.

But the task still runs. It still needs to:

1. Resolve the dependency graph for the source set
2. Check for C-interop `.klib` files
3. Process (empty) results
4. Write metadata for the IDE

These tasks created real bottlenecks in our workflow. The 70-module project went from 15-minute syncs to over an hour and twenty minutes. The 180-module project became completely unusable, with syncs crashing consistently after 10+ hours.

After implementing the fix, we couldn't reproduce the exact conditions to capture detailed metrics—Gradle's caching and environmental factors made this difficult. But the aggregate impact was consistent across our entire team, and the theoretical analysis aligned with reality: eliminating 1,440 wasteful tasks restored functionality to the broken project.

## The Solution: Custom Optimized Hierarchy

Once we understood the problem, the solution became clear: **build exactly the hierarchy we need, no more, no less.**

Kotlin provides the `applyHierarchyTemplate()` DSL for precisely this purpose—defining custom hierarchies that match your project's actual structure.

### The Optimized Hierarchy

Instead of the default template's deep, general-purpose hierarchy, we created a minimal, flat structure:

```kotlin
kotlin {
    applyHierarchyTemplate {
        common {
            withAndroidTarget()
            withJvm()
            group("ios") {
                withIosArm64()
                withIosX64()
                withIosSimulatorArm64()
            }
        }
    }

    androidTarget()
    jvm()
    iosArm64()
    iosX64()
    iosSimulatorArm64()
}
```

This creates the hierarchy:

```
commonMain
├── androidMain
├── jvmMain
└── iosMain
    ├── iosArm64Main
    ├── iosX64Main
    └── iosSimulatorArm64Main
```

Notice what's missing: `nativeMain` and `appleMain`. We've collapsed the hierarchy to only include the intermediate source sets we actually use.

This configuration change transformed our development experience. The 70-module project saw sync times improve from roughly an hour and twenty minutes to about 14 minutes. The 180-module project went from completely broken to functional. The improvement was universal across our team ✨.

By eliminating unused intermediate source sets, we removed the overhead that had been silently compounding across our codebase.

## A Note on Reproducing This Issue

After implementing the fix, I attempted to reproduce the original problem to capture more detailed metrics. Surprisingly, the severe degradation didn't reoccur—likely due to Gradle's aggressive caching and configuration state.

**If you're considering this optimization:** You may not see dramatic improvements immediately after switching, especially if Gradle has already cached artifacts from your current configuration. The benefits become most apparent on clean syncs or when onboarding new team members. The task count reduction is objective—whether it becomes a bottleneck depends on your specific project context and scale.

## When to Use Default vs Custom Hierarchy

The default hierarchy template isn't inherently bad—it's solving for a different use case than ours. Understanding when to use each approach is critical.

If your project genuinely targets macOS, Linux, Windows, iOS, and watchOS, the `nativeMain` source set becomes valuable. You _want_ to share native-specific code across all these platforms, so the Default Hierarchy is gold here.

On the other hand, if you're starting a new project and not sure if you'll add macOS support in six months, the default template provides a stable foundation that scales as you add targets.

However, if "native" means exclusively iOS in your project, `nativeMain` and `appleMain` are dead weight. The task multiplication effect becomes severe at scale, as it adds 8-10 tasks per module.

So, when to use Default Hierarchy Template? Sorry, but "it depends" 🫠.

## Conclusion

The default hierarchy template in Kotlin Multiplatform is a powerful tool that embodies the "convention over configuration" philosophy. For many projects, it's the right choice—it simplifies setup, reduces boilerplate, and scales effortlessly as you add targets.

But as our experience demonstrates, **the default optimizes for maximum flexibility, not maximum performance.** When you know your platform constraints (iOS-only native targets) and operate at scale (70+ modules), that flexibility becomes a liability. You're paying the build-time cost of supporting platforms you'll never target.

The transformation we experienced—from unusable to functional, from frustrating to manageable—came from a simple realization: **we don't need a hierarchy designed for the entire Kotlin Multiplatform universe. We need one designed for our project.** The `applyHierarchyTemplate()` DSL gave us the precision to define exactly that, eliminating hundreds of wasteful tasks and restoring our development velocity.

That's it! ✌️ Hope you can apply to our project today and give your day a performance boost!
