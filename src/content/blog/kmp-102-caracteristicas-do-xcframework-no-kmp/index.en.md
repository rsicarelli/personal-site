---
title: 'KMP-102 - Characteristics of the XCFramework in KMP'
description: 'In the previous post, we learned how Kotlin/Native exports a collection of .frameworks in the XCFramework format.'
pubDate: 2024-07-21
updatedDate: 2024-07-25
tags:
  - 'kotlin'
  - 'kmp'
  - 'mobile'
  - 'braziliandevs'
series: 'kmp-102'
seriesOrder: 2
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-caracteristicas-do-xcframework-no-kmp-3162'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 12
topic: kmp
difficulty: intermediate
contentType: tutorial
---

In the previous post, we learned how Kotlin/Native exports a collection of `.frameworks` in the XCFramework format.

Now, let's understand the characteristics of this XCFramework.

## How to use an XCFramework on iOS

The XCFramework package gives you one `.framework` for each Kotlin/Native target. Inside it, you'll find targets like the physical device (`iosArm64`), the simulator (`iosSimulatorArm64`), and simulators for Intel processors (`iosX64`).

Consuming a `.framework` varies depending on the environment and the existing codebase, but in general you just create a _build phase_ in the Xcode project to import the classes exported by Kotlin/Native.

- :link: [Using the Swift Package Manager](https://kotlinlang.org/docs/native-spm.html)
- :link: [CocoaPods overview and setup](https://kotlinlang.org/docs/native-cocoapods.html)
- :link: [Kotlin/Native as an Apple framework – tutorial](https://kotlinlang.org/docs/apple-framework.html)

There are several ways we can import it into the project.

All of these approaches have important characteristics worth exploring.

## Understanding how the XCFramework is generated

In KMP, the `.framework` is of the "Fat" type. That means it includes not only your code, but also every dependency it needs. This differs from other types, which may include less content:

- **Skinny**: Contains only your code, with no external dependencies.
- **Thin**: Includes your code and its direct dependencies.
- **Hollow**: The opposite of Thin, containing only the dependencies, without your code.
- **Fat**: Includes everything: your code, direct dependencies, and everything needed to work on its own.

This "Fat" approach has important implications for modularization and dependency management, as we'll discuss next.

The "Fat" nature of frameworks in KMP creates a technical challenge when we want to modularize our distributions. This happens because all dependencies are bundled together, forcing us to consolidate all of the KMP code into a single export. This model can lead to duplicated dependencies and a larger final package size, complicating project management, especially in collaborative development environments.

## Context about Kotlin applications

Kotlin projects have a multi-modular nature for cache reuse and build performance. Modularizing projects has a positive influence on the development experience in Kotlin projects that use Gradle.

[In this article](https://dev.to/rsicarelli/android-plataforma-parte-1-modularizacao-2016) I dig a bit deeper into modularization in Android projects, which also applies to KMP projects.

Kotlin projects usually have multiple modules, such as:

```
- legado
- core/design-system
- core/logging
- core/analytics
- feature1
- feature2
```

These modules can be used individually in Kotlin projects, but that doesn't mean we can have a corresponding `.framework` for each one.

Well, we actually can, but there's a characteristic to keep in mind.

Consider that `feature1` and `feature2` use the following KMP dependencies:

```kotlin
// feature1
kotlinx-serialization
kotlinx-coroutines

// feature2
kotlinx-serialization
kotlinx-coroutines
```

When you export the XCFramework, the `kotlinx-serialization` and `kotlinx-coroutines` dependencies **would be duplicated in each `.framework`**, causing:

- A larger final package (`.ipa`);
- Increased build time, considering a scale of modules.

This happens because of a characteristic imposed by the `.framework` on iOS: one `.framework` cannot communicate with another.

In an ideal scenario, `kotlinx-serialization` would be an isolated `.framework` and our `.framework` would communicate with that `.framework`.

So this "fat" model becomes a characteristic adopted in KMP projects, as a way to optimize usage and reduce the app's final size.

With that, let's move forward and better understand the challenges this model imposes.

## Using a "fat" KMP on iOS

Let's consider a scenario where we have an existing iOS project and want to integrate KMP code. To illustrate, let's assume we made a change to a module, such as adding a new parameter to a function. This change, however simple it may seem, can break the iOS code, because the iOS project expects the previous version of the function. Here's a step-by-step example:

First, let's assume the following `build.gradle.kts`:

```kotlin
kotlin {
    val xcFramework = XCFramework(xcFrameworkName = "KotlinShared")

    val exportedDependencies = listOf(feature1, feature2, core)

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "KotlinShared"

            exportedDependencies.forEach { dependency ->
                export(dependency.get())
            }

            xcFramework.add(this)
        }
    }
}
```

When you run the `assembleKotlinSharedXCFramework` task, you'll get one big bundle with all the exported modules.

For KMP projects, it's essential to have a central module, often called `ios-interop`. This module acts as an integration point that groups and exports all the dependencies needed for use in Xcode. This method centralizes dependency management and makes maintaining and updating the project easier.

## Challenges in modularizing KMP

As we discussed earlier, the "fat" nature of XCFramework frameworks in KMP means that every exported module includes all of its dependencies. This results in duplication of dependencies shared across modules and an overall increase in the final package size. On top of that, this approach creates significant challenges for modularization, which are especially evident in projects that integrate SwiftUI as the iOS user interface. Let's look at these challenges in more detail.

Let's assume that `feature1` and `feature2` expose the following Kotlin classes to be consumed on iOS:

```kotlin
class Feature1ViewModel(
    val repository: Feature1Repository
) {
    fun fetch() = Unit
}

class Feature2ViewModel(
    val repository: Feature2Repository
) {
    fun fetch() = Unit
}
```

When you export the XCFramework, all of the `feature1` and `feature2` classes will be present in the `.framework`, meaning we can use both `Feature1ViewModel` and `Feature2ViewModel` on iOS:

```swift
import KotlinShared

class Feature1ViewModelWrapper {
    private let viewModel: KotlinSharedFeature1ViewModel

    init(repository: Feature1Repository) {
        self.viewModel = KotlinSharedFeature1ViewModel(repository: repository)
    }

    func fetch() {
        viewModel.fetch()
    }
}

class Feature2ViewModelWrapper {
    private let viewModel: KotlinSharedFeature2ViewModel

    init(repository: Feature2Repository) {
        self.viewModel = KotlinSharedFeature2ViewModel(repository: repository)
    }

    func fetch() {
        viewModel.fetch()
    }
}
```

So far, so good. Our KMP code was integrated into iOS successfully, and let's assume this code is even already in production. Now, let's add a new parameter to `Feature1ViewModel`:

```kotlin
class Feature1ViewModel(
    val repository: Feature1Repository,
    val repository2: Feature1Repository2
) {
    fun fetch() = Unit
    fun fetchRepository2() = Unit
}
```

When you export the XCFramework, **the iOS code will break**, because the `Feature1ViewModelWrapper` class doesn't have the new `repository2` parameter:

```swift
class Feature1ViewModelWrapper {
    private let viewModel: KotlinSharedFeature1ViewModel

    init(repository: Feature1Repository) {
        // will break, `repository2` is not being passed
        self.viewModel = KotlinSharedFeature1ViewModel(repository: repository)
    }
}
```

Now, let's assume this XCFramework has already been generated and exported, but it hasn't been integrated into the iOS repository yet. The team responsible for `feature2` needs a new feature and also needs to make a change to `Feature2ViewModel`:

```kotlin
class Feature2ViewModel(
    val repository: Feature2Repository,
    val repository2: Feature2Repository2,
) {
    fun fetch() = Unit
}
```

When you export the XCFramework, **the iOS code will break**, for the same reason as above, since the `Feature2ViewModelWrapper` class doesn't have the new `repository2` parameter:

```swift
class Feature2ViewModelWrapper {
    private let viewModel: KotlinSharedFeature2ViewModel

    init(repository: Feature2Repository) {
        self.viewModel = KotlinSharedFeature2ViewModel(repository: repository) // will break, `repository2` was not passed as a parameter
    }

    func fetch() {
        viewModel.fetch()
    }
}
```

**Putting the scenario above together, we have the following timeline:**

1. `Feature1ViewModel` and `Feature2ViewModel` are integrated into the iOS project.
2. `Feature1ViewModel` is updated to include a new parameter, causing a break on iOS.
3. After the changes are merged, a new version of the `XCFramework` is generated and published through tools like Swift Package Manager, CocoaPods, version control, etc.
4. This version, containing the changes in `Feature1ViewModel`, results in breaks on iOS.
5. Before this version is integrated into the iOS project (fixing the break), the `feature2` team makes changes to `Feature2ViewModel`.
6. A subsequent version of the `XCFramework` is generated and published, including the new changes in `Feature2ViewModel` that also result in breaks on iOS.

**In this complex scenario:**

- The team responsible for `feature2` needs to wait for the `feature1` team to fix the breaks on iOS before they can integrate the `feature2` fix. This process can create a cycle of waiting and fixing that slows down the delivery of new features.

**To summarize and make it easier to understand:**

1. Version 1.0.0 of the XCFramework, already integrated into iOS, works without issues.
2. Version 1.1.0 introduces a `breaking change` in `feature1`, causing problems.
3. Version 1.2.0 brings a breaking change in `feature2`.
4. Version 1.2.0 can only be integrated into iOS after the `feature1` fixes in version 1.1.0 are integrated and validated.

![Timeline of KMP breaking changes](https://media.rsicarelli.com/blog/kmp-102/shared/timeline-kmp-breaking-changes.png)

## The pains of KMP development

Integrating KMP code into existing iOS projects, especially those built with SwiftUI, presents unique challenges due to the need for direct communication between modules. This challenge is less intense in projects that use Compose Multiplatform (CMP), where communication between modules happens in a more indirect and decoupled way.

The "fat" framework model imposes several complications on KMP development, among them:

- **Dependency Management:** You need to follow a specific timeline to bring KMP code changes into the iOS repository, making sure all dependencies are in sync.
- **Sensitivity to Changes:** Any change to attributes, parameters, or functions can result in breaks in the iOS project, requiring immediate fixes to keep the project stable.
- **Cross-team dependency**: Devs frequently have to wait for other teams to fix breaks on iOS before they can move forward with integrating new KMP features.

## Impact on the day-to-day development cycle

In daily work, these challenges become even more evident. For example, when integrating new features into the main branch (`main`) of the KMP project — usually associated with Android development — and trying to test them on iOS, we frequently run into breaks caused by changes that haven't been integrated into the iOS project yet.

To mitigate this problem, we usually generate an XCFramework locally to test on iOS. However, this approach still suffers from the risk of breaks if the main branch contains changes that aren't in sync with iOS, creating a continuous cycle of identifying and fixing breaks, which significantly delays development.

This creates a huge bottleneck in daily work, because we face the enormous challenge of identifying which team is responsible for the break and, consequently, waiting for the fix before we can integrate the KMP code into iOS.

On small teams or personal projects this isn't a problem, but at scale it's definitely the biggest bottleneck in KMP development today.

## How to work around this problem

- **Better Communication**: Strengthening communication between development teams to plan and synchronize changes can reduce the frequency of unexpected breaks.
- **Test Automation**: Implementing automated tests and continuous integration processes to detect and fix breaks before they impact other developers or the main project.

There's a strategy we can adopt, but it'll have to wait for a future article. First, we need to climb a few more steps on the KMP knowledge ladder through other concepts so we can better understand this alternative strategy.

## Conclusion

It's important to be realistic and face the real problems of a technology. Sometimes, in the heat of the "boom" of a new technology, we overlook some crucial aspects for scaling a solution, and if we don't address these problems, we can (and will!) end up with a huge bottleneck in development. This can create internal friction within your team, like people not adopting the technology due to a poor development experience, and constant code breaks caused by other teams in other contexts.

Understanding the nature of the XCFramework is crucial for having a scalable and healthy project, with an end-to-end development experience free of bottlenecks.

In the next articles, we'll better understand the code that gets exported to iOS, some characteristics and limitations of Kotlin > Objective-C and Objective-C > Swift code, how to write our Kotlin code to be idiomatic in Swift, and some approaches to improve the Kotlin <--> Swift integration.

See you next time, bye!

### References

> https://dzone.com/articles/the-skinny-on-fat-thin-hollow-and-uber
