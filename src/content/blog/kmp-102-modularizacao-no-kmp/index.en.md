---
title: 'KMP-102 - Modularization in KMP'
description: 'In the last article we dug into the quirks of code exported to Objective-C headers, along with the best practices for what to export…'
summary: 'In the last article we dug into the quirks of code exported to Objective-C headers, along with the best practices for what to export.'
pubDate: 2025-03-07
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-102'
seriesOrder: 5
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fz0zdcy0ty1bpvi3mlcob.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-modularizacao-no-kmp-4oe5'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 23
topic: kmp
difficulty: intermediate
contentType: tutorial
---

In this article, we'll get a better understanding of how modularization behaves in KMP projects, and how to do it in an efficient, well-organized way.

---

- [What is modularization?](#what-is-modularization)
- [Modularization in KMP](#modularization-in-kmp)
- [Paving the way for UI flexibility](#paving-the-way-for-ui-flexibility)
- [Exporting to the XCFramework](#exporting-to-the-xcframework)
  - [Scenario 1: shared KMP "backend", flexible "frontend"](#scenario-1-shared-kmp-backend-flexible-frontend)
  - [Scenario 2: Hybrid, migrating to Compose Multiplatform](#scenario-2-hybrid-migrating-to-compose-multiplatform)
  - [Scenario 3: 100% Compose Multiplatform](#scenario-3-100-compose-multiplatform)
- [Exploring the benefits of modularization in KMP](#exploring-the-benefits-of-modularization-in-kmp)
- [Conclusion](#conclusion)

---

## What is modularization?

I won't dwell too long on this topic, since we already covered it in [Android Platform - Part 1: Modularization](https://dev.to/rsicarelli/android-plataforma-parte-1-modularizacao-2016). If you're not sure what modularization means in Gradle projects, I recommend taking a break to read that article.

In short, modularization is the practice of splitting a project into smaller, independent modules that can be developed, tested, and maintained separately.

This practice is crucial for scaling KMP projects, since modularization directly affects team autonomy and independence, preventing one team from depending on another to get its work done.

## Modularization in KMP

In KMP, modularization is done through shared modules, which are responsible for sharing code across platforms.

Let's put together a module structure that respects separation of concerns and enables efficient code reuse across modules. Our context here assumes an application that will scale, in the sense of gaining more features and more platforms:

<img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp-modularization-pt1.png?raw=true" />

This structure follows some ideas from Domain Driven Design (DDD), in which each module represents an independent, isolated domain of the application. I won't go into much detail about DDD, but I recommend reading [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://www.amazon.com.br/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215/ref=sr_1_1?dib=eyJ2IjoiMSJ9.Lo7-Md3VvIV38Rzn-ytmnX1FyJz_hHxG_c3ocyge7LEEkMf9J0QQUC_vNRqM-bly1FEW6JDWiQjxRiR4Ip4uOSi5BDadwwQLRq-qGmgXmoG36NnUp66mVBVEOL-xFpHChmTWdyWDB5EZGboxu2dOIVTrzRS54KI4S6rDRsLLLoSAkU9bCl81j0cePEicQvqB.QPWgwg7lUfTottKjOov5grb2CciIICVV12MWxs8bueA&dib_tag=se&keywords=Domain-Driven-Design-Tackling-Complexity-Software&qid=1739362218&sr=8-1&ufe=app_do%3Aamzn1.fos.4bddec23-2dcf-4403-8597-e1a02442043d) to learn more about the subject.

With this structure, we can:

- Scale efficiently without duplicating code. To add a new feature, you just create a new module and add the necessary dependencies.
- Have granularity over what gets exported to the other platforms, especially to the XCFramework.
- Have domain independence for specific teams, avoiding code and responsibility conflicts. For example, teams can set up a `CODEOWNER` for a specific module, and be responsible for maintaining and evolving that module.

## Paving the way for UI flexibility

One of KMP's superpowers is letting you share a lot of code or a little. This ability means we can choose which UI to use on each platform. Depending on your UI-building strategy, you'll need a specific module approach to create that flexibility.

Let's think of each feature as something that can be split into a "frontend" and a "backend". Following the MVVM architecture pattern, the "frontend" would be our UI (Compose, SwiftUI) and the "backend" would be our business logic (ViewModel/UiModel + Domain + Data). In other words, parts of the presentation layer can be shared, but we give each platform the freedom to choose its own UI.

With that in mind, one approach you can use is the following:

<img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp-modularization-pt2.png?raw=true" />

Here, we split each feature that has a screen into 3 modules:

- `common`, our "backend" containing the feature's business logic.
- `android-ui`, our Android-only "frontend", containing the feature's UI.
- `common-ui`, our multiplatform "frontend", containing the feature's UI shared across platforms.

With this approach, you can:

- Start migrating screens to SwiftUI gradually, without having to migrate the whole feature at once.
- Have the flexibility to keep features in Jetpack Compose (Android-only) while sharing the "backend" with other platforms.
- Have the flexibility to start screens in Compose Multiplatform (Android, iOS, Desktop, ...) while sharing the "backend" with other platforms.

## Exporting to the XCFramework

Now that we've explored a modularization model that allows flexibility in choosing the UI, we can move forward and export our Kotlin code to the XCFramework.

To use our Kotlin code on iOS, we need a module that represents our XCFramework. This is a "glue" module, that is, a module that aggregates several modules to be exported to the XCFramework.

This module won't be used directly by the Android app or other platforms, but it represents our export to iOS. This module is commonly called `ios-interop`.

To illustrate the power of modularization and the flexibility of KMP, let's explore a few sharing scenarios:

### Scenario 1: shared KMP "backend", flexible "frontend"

In this scenario, we have a `common` module that contains the feature's business logic. The `android-ui` module contains the feature's UI for Android only, and is used by the Android app.

Characteristics of this model:

1. The business logic is shared across platforms
2. The UI is Android-specific, using Jetpack Compose
3. The UI is not shared across platforms
4. On iOS, the business logic is reused, but the UI is iOS-specific with SwiftUI
5. An ideal model for projects looking to migrate to Compose gradually, or that intend to keep platform-specific UI

<img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp-modularization-scenario-1.png?raw=true" />

### Scenario 2: Hybrid, migrating to Compose Multiplatform

In this scenario, we have a `common` module that contains the feature's business logic. The `common-ui` module contains the feature's UI shared across platforms.

Here, the migration to Compose Multiplatform begins, while we keep the `android-ui` feature Android-specific.

Characteristics of this model:

1. Business logic shared across platforms
2. Part of the UI shared across platforms
3. In `android-ui`, Android-specific UI components using Jetpack Compose
4. In `common-ui`, shared UI components using Compose Multiplatform
5. An ideal model to begin migrating to Compose Multiplatform with a gradual UI migration

<img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp-modularization-scenario-2.png?raw=true" />

### Scenario 3: 100% Compose Multiplatform

In this scenario, we have a `common` module that contains the feature's business logic. The `common-ui` module contains the feature's UI shared across platforms.

Here, there's no distinction by platform - the entire UI is shared using Compose Multiplatform.

Characteristics of this model:

1. Business logic shared across platforms
2. UI fully shared through Compose Multiplatform
3. An ideal model for projects with a unified UI across all platforms

<img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp-modularization-scenario-3.png?raw=true" />

## Exploring the benefits of modularization in KMP

As you've seen, modularization in KMP is an essential practice for scaling projects efficiently and in an organized way.

But there's one crucial point I want to highlight: modularization helps us achieve granularity over what we want to export to the XCFramework, more specifically, to the Objective-C headers.

As we saw in the last post, [KMP-102 - Optimizing the Export of Kotlin to Obj-C/Swift](https://dev.to/rsicarelli/kmp-102-otimizando-a-exportacao-do-kotlin-para-o-obj-cswift-358p), being selective about the code we export to the Objective-C headers is directly tied to build-time efficiency (that is, more efficient XCFramework compilations).

For example:

- In **Model 1**, we ensure that only `login:common` is exposed in the Objective-C headers, while keeping any part of `android-ui` from being exposed.
- In **Model 3**, we ensure that none of the journey's "backend" is exposed in the headers, only the multiplatform "frontend".

This strategy is fundamental to the health and evolution of the repository, and it ensures that KMP devs can consume the XCFramework efficiently and without dependency conflicts.

## Conclusion

In this article, we explored modularization in KMP and how to do it efficiently and in an organized way. We learned how this practice can be used to scale projects, and got a preview of how it directly affects team autonomy and independence.

Usually, in basic KMP examples, we have just a single `shared` module. But in real-world scenarios - where projects need to scale and adopt flexible UI strategies - the complexity is much higher.

Modularization is a key piece for the success of KMP projects, and it's crucial that it's implemented in a structured and organized way!

In the next article, we'll explore strategies for building the XCFramework in existing projects, ensuring autonomy and independence for teams.

See you next time!
