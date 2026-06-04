---
title: 'Android Plataforma - Part 2: Starting the Project'
description: 'In this post we explore a starter project, understand the challenges of maintaining build.gradle.kts files, and discover how Gradle Composite Builds…'
summary: 'In this post we explore a starter project, understand the challenges of maintaining build.gradle.kts files, and discover how Gradle Composite Builds can help along the way.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 2
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F40ckwb99i0qotfyr6zb8.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-2-inicio-do-projeto-34jg'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/1-2/introduction'
  reactions: 4
topic: android
difficulty: intermediate
contentType: tutorial
---

---

We'll start from a simple project, generated from a default IntelliJ template, with a few modules added to it:

![Module structure of the starter project](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mx1hv2uvq4pa5oqglvj2.png)

- **app**: Acts as the central entry point of the application, containing the MainActivity.
- **core:designsystem**: Defines the main visual elements, such as the project's theme, colors, typography, and icons.
- **features:home**: Represents the first interaction screen, displaying the content from the details module.
- **features:details**: Shows a text message on the UI.

![Screen rendered by the starter project](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/oasfibiiy8z36dtjytfs.png)

## The problem to solve

Take a look at the Gradle files of each module:

- [app/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/app/build.gradle.kts)
- [core/designsystem/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/core/designsystem/build.gradle.kts)
- [features/home/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/features/home/build.gradle.kts)
- [features/details/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/features/details/build.gradle.kts)

You can spot a redundancy here: even though the modules apply similar configuration through the `android {}` extension, their dependencies are different.

Our initial goal is to standardize these scripts so they can be reused and are easier to maintain.

## Using Gradle Composite Builds

When you run into the challenge of managing and maintaining multiple Gradle modules, one effective solution is the **Composite Builds** feature. It lets us combine multiple independent builds into one, making it easier to standardize and reuse scripts.

In the next sections, we'll dig deeper into how composite builds work, how to set them up, and how to integrate them into your existing project.
