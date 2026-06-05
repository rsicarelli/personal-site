---
title: 'KMP 101: Understanding and Setting Up the Dev Environment in Kotlin Multiplatform'
description: 'Software development is a complex process that demands not only skill and creativity, but also a well-configured development environment.'
summary: 'Software development is a complex process that demands not only skill and creativity, but also a well-configured development environment.'
pubDate: 2023-11-29
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 4
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-101-guia-pratico-para-configurar-e-entender-o-ambiente-no-kotlin-multiplataforma-2jcn'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 14
topic: kmp
difficulty: beginner
contentType: tutorial
---

In the world of Kotlin Multiplatform, this need is even more apparent: properly setting up the development environment for KMP is crucial to make sure developers can get the most out of the language's multiplatform capabilities.

In this article, we'll explore the key components of that environment, from choosing a JDK to using specific IDEs, providing a practical guide for setting up your environment for KMP projects.

---

## Platform requirements

As a tool aimed at native development, KMP requires an environment setup similar to the one used in conventional development methods.

For example, for the Apple family using Kotlin/Native, having a Mac with Xcode installed is essential.

For other platforms, on the other hand, such as web, desktop, or Android, operating systems like Windows or Linux are enough.

Given the breadth of KMP, we've chosen the Mac as the operating system for this and the upcoming articles.

## The JDK as a minimum requirement in KMP

A crucial aspect of multiplatform development with Kotlin, regardless of the operating system, is the need for a [JDK (Java Development Kit)](https://en.wikipedia.org/wiki/Java_Development_Kit). The JDK is vital at several stages of Kotlin development, such as:

- **Compilation to bytecode:** Just like Java, Kotlin is a high-level language compiled to bytecode. This compilation process, carried out by the Java compiler included in the JDK, is crucial for running Kotlin code on a JVM (Java Virtual Machine), especially on JVM-based platforms like backend and Android.

- **Interdependence of the JDK and IDEs:** Given Kotlin's deep integration with development environments like IntelliJ IDEA and Android Studio, the JDK is used to perform essential tasks such as running [Gradle](https://gradle.org/) tasks, a fundamental tool for building Kotlin Multiplatform projects.

### The JDK and its versions

Choosing the right JDK version depends heavily on your project's dependencies, from the infrastructure level, such as the Kotlin and Gradle versions, all the way to open-source libraries.

By default, the [Kotlin/JVM compiler produces bytecode compatible with Java 8](https://kotlinlang.org/docs/faq.html#which-versions-of-jvm-does-kotlin-target). However, to take advantage of the optimizations available in newer versions of Java, you can explicitly set the target Java version, which ranges from 9 to 21.

Opting for newer JDK versions offers significant advantages, including better compatibility with recent language and framework updates, performance optimizations, access to more current features, stronger security through vulnerability fixes, and alignment with the latest practices in the development community.

As a KMP developer, it's common to need multiple JDK versions in your development environment, from the oldest `JDK8/1.8` to newer ones like `JDK17`, `JDK20`, or `JDK21`.

### A variety of JDK distributors

The variety of JDK vendors for Mac is a response to changes in Oracle's policies and the demand for more versatile options adaptable to different needs. Some examples include:

- **[JetBrains Runtime](https://github.com/JetBrains/JetBrainsRuntime):** A version of OpenJDK available for Windows, Mac OS X, and Linux. It offers features like enhanced class redefinition, a framework for Chromium-based browsers (JCEF), and improvements in font rendering and HiDPI support.

- **[AdoptOpenJDK](https://adoptium.net/en-GB/):** Provides OpenJDK binaries with the HotSpot JVM or OpenJ9, developed by IBM. It follows the OpenJDK update schedule, offering regular feature and security updates.

- **[Amazon Corretto](https://aws.amazon.com/corretto/?filtered-posts.sort-by=item.additionalFields.createdDate&filtered-posts.sort-order=desc):** Amazon's certified OpenJDK distribution, free for production use under the GPL + CE license. Available for Linux, macOS, and Windows, with quarterly updates.

- **[Zulu by Azul Systems](https://www.azul.com/downloads/#zulu):** A certified JDK build for multiple platforms, including macOS. Free to download and use, with security updates and bug fixes available through a Zulu Enterprise subscription.

> [🔗 SDKMAN!'s list of JDK distributors](https://sdkman.io/jdks)

## Setting up your Mac for the KMP environment

We'll follow the [official documentation](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-setup.html) to set up the environment, using the following technologies:

- [Homebrew](https://brew.sh/): Used to make installing scripts easier.
- [JetBrains Toolbox](https://www.jetbrains.com/toolbox-app/): An effective tool for managing JetBrains IDEs, built with KMP.
- [kdoctor](https://github.com/Kotlin/kdoctor): A JetBrains tool that runs diagnostics on the KMP environment.
- [Xcode](https://developer.apple.com/xcode/resources/): Essential for accessing Apple-specific tools.
- [SDKMAN!](https://sdkman.io/): Used to manage different JDK versions.

### 1. Installing `kdoctor`

Assuming you already have [Homebrew](https://brew.sh/) installed, use the following command to install `kdoctor` and run it in the terminal. This command will come in handy throughout the process to check whether the setup was successful.

```shell
brew install kdoctor && kdoctor
```

### 2. Installing JetBrains Toolbox

Install [Toolbox](https://www.jetbrains.com/toolbox-app/) with the command below.

```shell
brew install --cask jetbrains-toolbox
```

### 3. Preparing the KMP environment with the JDK

The JDK is an essential requirement for programming in KMP, and configuring the JDK on a Mac can be challenging, especially if you want to have multiple versions installed. [SDKMAN!](https://sdkman.io) simplifies this process, offering a CLI that makes it easy to install and switch between different JDK versions and distributors.

|     | Step                                          | Description                                    |
| --- | --------------------------------------------- | ---------------------------------------------- |
| 1   | Install SDKMAN! following the official docs   | [sdkman.io/install](https://sdkman.io/install) |
| 2   | Install JDK 17.0.9-jbr                        | `sdk install java 17.0.9-jbr`                  |
| 3   | Set the global JDK version                    | `sdk default java 17.0.9-jbr`                  |
| 4   | Check the current JDK version                 | `sdk current java`                             |
| 5   | To install other versions, repeat the process | `sdk list java`                                |
| 6   | Check whether the setup was successful        | `kdoctor`                                      |

### 4. Preparing the Android environment in KMP

To develop for Android in Kotlin Multiplatform, you need to set up the environment properly. This includes installing [Android Studio](https://developer.android.com/studio), which provides essential tools for Android development, such as the [Android SDK](https://en.wikipedia.org/wiki/Android_SDK) and an [Emulator](https://developer.android.com/studio/run/emulator).

|     | Step                                     | Description                                                    |
| --- | ---------------------------------------- | -------------------------------------------------------------- |
| 1   | Install Android Studio through Toolbox   | Search for "Android Studio" in the Toolbox list                |
| 2   | Or install Android Studio via Homebrew   | `brew install --cask android-studio`                           |
| 3   | Finish installing Android Studio         | Open the Android Studio app and follow the step-by-step setup. |
| 4   | Check whether the installation succeeded | `kdoctor`                                                      |

### 5. Preparing the Apple environment in KMP

For Apple environments, we need the Xcode toolset.

|     | Step                               | Description                                                                                                                    |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Check the Kotlin compatibility map | [🔗 Compatibility guide](https://kotlinlang.org/docs/multiplatform-compatibility-guide.html#version-compatibility)             |
| 2   | Install Xcode                      | [🔗 Xcode on the App Store](https://apps.apple.com/app/xcode/id497799835)                                                      |
| 3   | Open Xcode                         | Find and open the Xcode app in your applications.                                                                              |
| 4   | Accept Apple's terms of use        | Follow the steps to complete the installation in Xcode. <br/> You should keep going until you see the create-a-project screen. |
| 5   | Check whether it worked            | `kdoctor`                                                                                                                      |

> ℹ️ KMP doesn't need Xcode open to work. After setup, you can close Xcode if you prefer.

#### 5.1 (Optional) Set up CocoaPods

Optionally, you can set up CocoaPods. We won't need it for this article. But if you do need it, follow the [🔗 official documentation](https://kotlinlang.org/docs/native-cocoapods.html).

### ✅ Verifying the KMP environment

When you run `kdoctor`, it's important that no errors in red show up. Since our focus is the bare minimum needed to get things working, items in yellow aren't necessarily a problem for now.

## Choosing the integrated development environment (IDE)

At this point, we're almost ready to start a new KMP project. We just need to understand a bit more about the tools available for use today (November 2023).

Due to KMP's deep native integration, managing multiple codebases brings practical challenges, such as:

- The ability to search for a reference in Swift or JavaScript files and find the corresponding declaration in Kotlin.
- The ability to run your project on an emulator.
- Code debugging support, regardless of the language.
- Running tests with success and failure reports, plus console logs.
- Analysis tools, such as performance, code quality, and so on.

The following table maps out the current support for each language in the KMP world:

| IDE                                                                       | Kotlin | Swift | JS/TS | Free |
| ------------------------------------------------------------------------- | ------ | ----- | ----- | ---- |
| [Android Studio](https://developer.android.com/studio)                    | ✅     |       |       | ✅   |
| [IntelliJ Ultimate](https://www.jetbrains.com/idea/download/?section=mac) | ✅     |       | ✅    |      |
| [Xcode](https://developer.apple.com/xcode/)                               |        | ✅    |       | ✅   |
| [VSCode](https://code.visualstudio.com/)                                  |        |       | ✅    | ✅   |
| [Fleet (Preview Beta)](https://www.jetbrains.com/fleet/) 🔥               | ✅     | ✅    | ✅    | ✅   |

Let's go into a bit more detail on each of these options.

### Android Studio

Android Studio is widely appreciated by the Android community, offering excellent support for the Android ecosystem. Based on _[IntelliJ Community](https://www.jetbrains.com/products/compare/?product=idea&product=idea-ce)_ and maintained by Google, it's specially tailored for full integration with Android. This option is popular, free, and currently recommended by JetBrains for KMP development.

KMP support in Android Studio requires manually installing the [🔗 Kotlin Multiplatform Mobile](https://kotlinlang.org/docs/multiplatform-plugin-releases.html) plugin.

### IntelliJ Ultimate

IntelliJ Ultimate is a robust environment not just for Kotlin, but also for a range of frameworks (Spring, React/Native, Angular, Vue.js, Django, etc.) and other languages (HTML, Ruby, PHP, Go, SQL, Markdown, etc.), with enough features to fill an entire article.

This version is paid, so it's better suited for experienced developers looking for an IDE as a complete productivity tool to scale projects.

That said, in terms of KMP support, IntelliJ Ultimate doesn't offer big advantages over Android Studio, which probably has most of the KMP features and support available in IntelliJ Ultimate.

### VSCode

If you're in a web/JS environment and plan to adopt KMP, you'll need to use other tools like VSCode, or even paid ones like WebStorm and IntelliJ Ultimate itself.

With today's tooling, you might not even need to work with JS code, since Kotlin/JS has excellent support in IntelliJ and Android Studio, letting you write all your code in Kotlin using [🔗 wrappers](https://github.com/JetBrains/kotlin-wrappers).

### Xcode

Regardless of whether you use IntelliJ or Android Studio, Xcode is required to navigate Swift/Obj-C code. Xcode, Apple's free IDE (although it requires a Mac), is essential in the KMP environment.

How often you use Xcode varies by project. For example:

| Usage Frequency | Context                  | Details                                                                                                                                                             |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moderate        | KMP libraries            | Building multiplatform libraries with common code and platform-specific implementations for JVM, web, and native platforms, used as dependencies in other projects. |
| More frequent   | Swift repos adopting KMP | In existing Swift projects migrating to KMP, Xcode usage is intensive.                                                                                              |
| Frequent        | Performance analysis     | Using Xcode's tools to run performance analysis on the application.                                                                                                 |
| Frequent        | KMP Android and iOS apps | Sharing code across mobile platforms to implement app logic such as networking, data storage, validation, analytics, and calculations.                              |
| Variable        | Desktop apps             | Sharing UIs across desktop platforms like Windows, macOS, and Linux using Compose Multiplatform.                                                                    |

Developers often criticize the Xcode experience, especially compared to IntelliJ or Android Studio, and the challenge of keeping two powerful IDEs running at the same time.

As an alternative to Xcode, JetBrains developed [AppCode](https://www.jetbrains.com/objc/), but it ran into several issues and didn't gain significant traction in the KMP community. In December 2022, JetBrains officially announced AppCode's retirement.

### Fleet

Launched in November 2021, Fleet emerged as a proposal similar to VSCode, being a lightweight and flexible text editor.

Two years later, in November 2023, [🔗 multiplatform support in Fleet was announced](https://blog.jetbrains.com/kotlin/2023/11/kotlin-multiplatform-tooling-in-fleet/), bringing a series of notable features:

- **Easy app integration and execution:** When you open a KMP project, Fleet automatically configures run configurations for Android, iOS, and Desktop, based on the project's build file.

- **Polyglot:** Fleet lets you work with native code in multiplatform projects without switching editors, offering enhanced support for editing Swift code and integration with Xcode projects.

- **Code navigation:** It allows cross-navigation between Swift and Kotlin, making it easier to locate function declarations and usages across languages.

- **Refactoring:** It supports refactorings that affect both Kotlin and Swift modules.

- **Integrated debugging:** With support for tools like breakpoints in both Swift and Kotlin, plus inspecting values and call stacks.

Fleet presents itself as a powerful tool for multiplatform development, unifying different languages and platforms into one integrated environment.

#### Fleet in "Beta Preview"

For now, access to Fleet is free, since the tool is still in an experimental phase. It's also worth noting that many analysis tools for Apple-family apps are still exclusive to Xcode.

> [📹 See Fleet in action: Build Apps for iOS, Android, and Desktop With Compose Multiplatform](https://www.youtube.com/watch?v=IGuVIRZzVTk)

### So, which one should you choose?

If you're just getting started with KMP, I suggest using Fleet, which has excellent support for beginners.

If you plan to adopt KMP in production, you'll need to use the other IDEs like Android Studio, IntelliJ, and Xcode.

| IDE            | Recommended use                                            | Characteristic                                                                           |
| -------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| IntelliJ       | Ideal for complex projects and for experienced developers. | A wide range of features, plugin support for various frameworks and languages, etc.      |
| Android Studio | Recommended for Android development and mobile apps.       | Integration with the Android SDK, UI tools, performance analysis for Android apps, etc.  |
| Xcode          | Essential for iOS and macOS development.                   | Native Apple tools, intuitive interface, performance analysis for the Apple family, etc. |
| Fleet          | A good choice for beginners and lighter projects.          | A simplified interface designed for KMP development.                                     |

## Conclusion

This article offered a comprehensive look at setting up the development environment for Kotlin Multiplatform. We discussed everything from selecting the right JDK to choosing the most suitable IDE, including the emerging Fleet, which stands out as a promising option, especially for beginners.

Carefully selecting the right tools and configurations not only simplifies the development process, but also significantly boosts efficiency and productivity.

In the next article, we'll cover another fundamental aspect of KMP: the Gradle Plugin, a key tool for getting the most out of multiplatform development's potential.

See you next time!

---

> 🤖 This article was written with the help of ChatGPT 4, using the Web plugin.
>
> The sources and content are reviewed to ensure the relevance of the information provided, as well as the sources used in each prompt.
>
> However, if you find any incorrect information or believe a credit is missing, please get in touch!

---

> References:
>
> - [An Overview of JDK Vendors - DZone](https://dzone.com/articles/an-overview-on-jdk-vendors)
> - [Android Developers - Kotlin Multiplatform](https://developer.android.com/kotlin/multiplatform)
> - [Baeldung on Kotlin - Introduction to Multiplatform Programming in Kotlin](https://www.baeldung.com/kotlin/multiplatform-programming)
> - [Bito.ai - Java SDK vs JDK](https://bito.ai/java-sdk-vs-jdk-java-explained/)
> - [Building cross-platform mobile apps with Kotlin Multiplatform - LogRocket Blog](https://blog.logrocket.com/building-cross-platform-mobile-apps-kotlin-multiplatform)
> - [Choosing a configuration for your Kotlin Multiplatform project - KMP Docs](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-project-configuration.html)
> - [Jeff Bruchado - Kotlin Multiplataforma: Crie uma vez, execute em qualquer lugar](https://jeffbruchado.com.br/blog/kotlin-multiplataforma)
> - [Kotlin Documentation: Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html)
> - [Kotlin Multiplatform Development Documentation - Set up an environment](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-setup.html#install-the-necessary-tools)
> - [Recommended IDEs - KotlinLang](https://www.jetbrains.com/help/kotlin-multiplatform-dev/recommended-ides.html)
> - [Sharing More Logic Between iOS and Android - Kotlin Multiplatform Development Documentation](https://www.jetbrains.com/lp/mobilecrossplatform)
