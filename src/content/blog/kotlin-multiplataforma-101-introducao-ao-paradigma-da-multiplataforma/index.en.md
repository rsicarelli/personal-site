---
title: 'KMP 101: An introduction to the multiplatform paradigm'
description: 'We use a wide range of apps every day on phones, watches, TVs, and computers, all part of a broad digital ecosystem.'
summary: 'We use a wide range of apps every day on phones, watches, TVs, and computers, all part of a broad digital ecosystem.'
pubDate: 2023-11-14
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 1
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fgfgzfl54fe26cqlk9jk2.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-multiplataforma-101-introducao-ao-paradigma-da-multiplataforma-eo3'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 18
---

This diversity of platforms demands development strategies that deliver simultaneous updates and a consistent user experience.

In this article, we'll explore [Kotlin Multiplatform (KMP)](https://kotlinlang.org/docs/multiplatform.html) and how it compares to other cross-platform technologies like React Native and Flutter. We'll discuss the strengths and challenges of these approaches, offering useful insights for devs looking for efficient solutions to multiplatform development.

---

## What does building "native" mean?

Native development is building apps made to run on one specific platform—Android, iOS, desktop, web—taking full advantage of all its capabilities.

Native apps integrate seamlessly with the hardware and follow the platform's design guidelines, which results in responsive interfaces and immediate access to the latest system updates.

For each platform, the vendors provide an SDK (Software Development Kit) that makes it easier to build dedicated applications.

That said, native development comes with its own challenges, such as:

- Having to adapt to different environments and languages
- Managing multiple codebases
- Dealing with device fragmentation, like varying screen sizes and system versions
- Requiring constant attention to new operating system updates
- Backward compatibility to keep things working on older versions

The complexity grows with the need to master platform-specific tools and APIs, which makes maintenance more labor-intensive.

[🔗 Interactive version](https://mermaid.live/edit#pako:eNp1U9Fu2jAU_ZUr79UgEiCk0VSJEtKHddK0VtrUpA8mdsCQxJbjFFrKx1R72NOe9gn5sToJDMpUK7Jyr8-5Pj6-3qJYUIY8NFdELuDOj3IwoyhnbSJC5mtz7_JEMWJBGKFJ9ZfyuYBE5JoBJUBkymNS_a5-iQg9HKn1GIcHeNDCBdyKRK9NtTPkJPzO4lIVojhZYDn9QIpdSwmYUiRjuSZFU9n_8p-Aq3AiMslTQoXCcMPzFVNnED-cZpLEQteYczp0Opcv45wqwWm9Af48U5fws_YQA9PxC0zD6cYo19XrI0thxvPqVXHxUBPBPzvKMRyH_3xokFfHJb9JBOG3WhMDnxda8VlZ_TH1T-QFjTQiVxg2RGJohBEp97KuwxuxrH1hMG4uSPPHd962_GduCGtSZAfadfiDzU5gkwYm8zmGpTTTJkv3ey0Lke9ZH1kYp6QofJY0VwYJT1MPPo2CoR0EGGKRCmXiJEkwmDOKFTNRv98_RJ01p3rhgSU3ZyXbbsRtI9Rzu248RhhlTGWEU9Pi2zodIb1gGYuQZ34pUau6vXcGR0otbp_yGHlalQyjUlKimc-J6bLskJQkvxfiNETeFm2QZ18Mu8Oea_fcgeNYjm1koyfkuU53MHBc1-n1rIvRyN1h9Nzwe13Xsob2sO8YuD1yLAsjRrkW6mv7HptnuXsDt5gXKQ)

![Native development](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091436.png?raw=true)

> [🔗 Decision framework for mobile development](https://www.researchgate.net/publication/314165913_Decision_Framework_for_Mobile_Development_Methods)

## Introducing cross-platform frameworks

Cross-platform frameworks like React Native and Flutter ship their own SDK, which can act as an extra layer on top of the native SDK.

There's no denying how much this kind of solution has grown across the app ecosystem. Taking Flutter's data:

- In **2021**, Flutter accounted for 3.2% of the total, with more than **150,000 of the 4.67 million** apps on the Play Store [[1](https://developers.googleblog.com/2021/03/announcing-flutter-2.html), [2](https://www.statista.com/statistics/289418/number-of-available-apps-in-the-google-play-store-quarter/)].

![Flutter Play Store 2021](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091647.png?raw=true)

- In the third quarter of **2022**, Flutter accounted for around 14.1%, with more than **500,000 of the 3.55 million** apps published on the Play Store [[1](https://techcrunch.com/2023/05/10/with-over-1m-published-apps-googles-flutter-expands-its-support-for-web-apps-and-webassembly/?guccounter=1#:~:text=Google%20also%20noted%20that%20there,adopt%20Flutter%20in%20existing%20projects.), [2](https://www.statista.com/statistics/289418/number-of-available-apps-in-the-google-play-store-quarter/#:~:text=Google%20Play%3A%20number%20of%20available%20apps%20as%20of%20Q3%202022)].

![Flutter Play Store 2022](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091703.png?raw=true)

- In November **2023**, Flutter sits at around 35%, with **1 million of the 2.87 million** apps available on the Play Store [[1](https://bloggersideas.com/pt/apps-statistics/#:~:text=,de%20aplicativos%20dispon%C3%ADveis%20para%20download), [2](https://www.nomtek.com/blog/flutter-app-examples)].

![Flutter Play Store 2023](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091710.png?raw=true)

The demand for cross-platform solutions comes from the desire to simplify the complex process of building apps for multiple platforms.

Having to master different languages and SDKs for each platform—like Kotlin for Android and Swift for iOS—on top of constant technological updates, poses a major long-term challenge.

Cross-platform frameworks like Flutter and React Native offer a more efficient path, letting you use a single codebase across several platforms and saving significant time and effort.

## Introducing React Native

[React Native](https://github.com/facebook/react-native) is an open-source framework that connects JavaScript and React with native components for Android and iOS.

This approach is especially convenient for devs with a background in the Web/React world.

- A `Text` component in React Native is converted into a `UITextView` on iOS.
- On Android, that same `Text` component becomes a `TextView`.

Today, React Native has two types of architecture: the current one and the [new one](https://reactnative.dev/docs/next/the-new-architecture/landing-page).

### React Native's current architecture

React Native's current, stable architecture is based on three main threads:

1. **JavaScript thread**: Responsible for running the JavaScript code.
2. **Native main thread**: Or "main thread," it manages the UI and user interactions.
3. **Background thread (Shadow Node)**: Handles creating and manipulating the nodes.

Communication between JavaScript and native code happens over a "bridge," which works like a data-transmission terminal, allowing the required operations to be deserialized and executed.

[🔗 Interactive version](https://mermaid.live/edit#pako:eNqNVO9u2jAQfxXLU9VNMowQAiOdJq3tKrUaVTW6D1uyD0fsgEViZ45DyxAPs2foI_BiuyRQGFBtJ8XK_b_73dkLGmkuqE_HBrIJuT8PFUHKi1EtCOlH87OQVtjCADkFW0DyVuR29XsmklPCNfkiILLkFqyciZDW7iWdG8nHIgjpnVYWNT9CtVU-xwcjwEGj-wn-cHIDMxhGRma2ciA7VOX5LEcBfuRm-FfeY6YXOs2C8tBKYAG1cMdQKP5iRe1tRapMAOR1ZqSKZIbdpyDVm4PysJCB5tdplgSD1RMvEp3Xvjrfs_x6jYYbI8IFCg5j3SVgg_KAWJsU1rEg_88G3G0DIiUjiKZjowt02C_7mx5DMJwA1w_kFjehEpBPaiyVOJ7r5IRcIKSRBYXTL7tcPeUk0ikBUo9aHcyBNBof1guxpy2H-f6YtkLpuGoL9Yv6ErnjyponjSbqyl5rzU5_UQJ5finiCkcSyyTxyavelde-umLYZqIN8nEcM5Jbo6cCOdd1N1zjQXI78YmTPe6F4yKGIrFDO0_Ev1zPdnzrK8KqtaxOt5LsWtQ9sWe42QZatoWKVYCyNTasGvNuSWeU0VTgqkmOr8GiDB9SOxEpXl0ffzmYaXm9l2gHhdXDuYqob00hGC0yDlZcSsAFTKkfQ5KjNAP1Xet0Y4Qs9Rf0kfpOq9lp913H8xykntduMzqnfqfXbHU6_ZbnvOt2va7ndpeM_qoiOM1WTV6_2-p03V6PUcGl1WZQv17VI7b8A-WLexI)

![React Native's stable architecture](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091730.png?raw=true)

> [🔗 Understanding React Native Architecture](https://dev.to/goodpic/understanding-react-native-architecture-22hh)

#### Challenges of the old architecture

1. **Asynchronicity**: the bridge operates asynchronously, which can cause UI update delays even when no wait is necessary.
2. **Single-threaded JavaScript execution**: it confines all computation to a single thread, which can cause blocking and delays on intensive operations.
3. **Serialization overhead**: transferring data between layers requires serialization (usually as JSON) and deserialization, adding computational overhead and hurting performance.

### React Native's new architecture

React Native's new architecture focuses on improving communication between threads, removing the need for serialization/deserialization and using multiple threads to boost performance.

#### ⚠️ Experimental phase

This new architecture is still experimental and subject to change as the project evolves.

It's important to be aware that the current implementation involves several manual steps and doesn't reflect the final development experience envisioned for the revamped architecture.

#### Key components of the new architecture

- **[Fabric](https://reactnative.dev/architecture/fabric-renderer)**: A complete rewrite of the rendering layer, optimizing the interaction between JavaScript and native code. Fabric removes the need for serialization and deserialization, enabling immediate UI updates and smoother animations while reducing the overall computational load.
- **JSI (JavaScript Interface, a JavaScript interface to native code)**: Replaces the traditional bridge, offering a lighter abstraction layer that allows synchronous calls between JavaScript and native code.
- **TurboModules**: Optimized modules that use JSI for more direct and efficient access.
- **React Renderer**: A new renderer that works with JSI to improve UI performance.

[🔗 Interactive version](https://mermaid.live/edit#pako:eNqFVFFv0zAQ_iuWeeiLOy1NupVMQoKWikkrQmw8QIO0a3xprTl2cJxupeqPQTzwQ_rHcBxK044KP0T-7r67--zceU1TzZHGdG6gWJC7UaKIW2U1awwJfW2-VcKirQyQjtJL6BCuyUeE1JL3YMUSE9oEHQSCQQimCfXEhH7dU-r1donKvgPFJZrpBJQoKglcG8KRYO3TZSsCFT9RoecqjGFmRPqsxJ1BHDqKFVpNh0bA9tf2pyYcyPaHWWqDR_wbWOnKTsdQYq2iIz3uHLGGOs9Fi5V63DkWe0Ju6OR-kGAh0yaHZ5InulJWqPnf9Pf5H8v96QLtqyTd7quDg-9pbaunNefdExrsXc0h964Ge9dO4j-dbSl7wi7kBKV1nFRCWY4w83dFMiFlTF5cjvu98ZiRVEttHM6yjJHSGv2ADoVhuEPdR8HtIiZB8XSUjmMGlbS3diXxf6FXrdimiZlvNP8NvaXNeGMEnyPzXe5uomh2N2LG3GxMNL_OC8k-Xbtdbaj_Pfus53Ag6YoymqNrCMHdIK7r9Am1C8zdZMVuy8E81DO2cTyorL5dqZTG1lTIaFVwsDgS4Josp3EGsnTWAtQXrfMdyUEar-kTjYNBdBZcvIzOw36vH0XB-QWjK2cOzoJ-NLh0uNe_CAa9aMPod58hYBS5sNpMmnfCPxeb34ZgUH0)

![React Native new architecture](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091745.png?raw=true)

#### Turbo Modules

Previously, communication in React Native between the native and JavaScript layers happened through the JavaScript bridge, or the "Native Modules."

Turbo Modules represent a significant evolution of `NativeModule` in React Native, tackling challenges like premature initialization and data serialization.

- **Lazy loading:** they enable lazy loading of modules, speeding up app startup.
- **Direct communication:** by avoiding the JavaScript Bridge and communicating directly with native code, they reduce the communication overhead between JavaScript and native code.
- **Codegen for type safety:** Codegen generates a JavaScript interface at build time, ensuring the native code stays in sync with the data coming from the JavaScript layer.
- **Use of JSI:** the JSI (JavaScript Interface) bindings enable efficient, direct interaction between JavaScript and native code without the bridge, providing faster and more optimized communication.

Fabric leverages the capabilities of Turbo Modules and Codegen. Together, these components form the pillars of React Native's new architecture, delivering improved performance and more efficient interoperability between native code and JavaScript.

> [🔗 Exploring React Native's new architecture](https://blog.logrocket.com/exploring-react-natives-new-architecture/)
>
> [🔗 A guide to Turbo Modules in React Native](https://dev.to/amazonappdev/a-guide-to-turbo-modules-in-react-native-5aa3)
>
> [🔗 Official documentation on the new architecture](https://reactnative.dev/docs/next/the-new-architecture/landing-page)

---

## Introducing Flutter

[Flutter](https://github.com/flutter/flutter) is an open-source user-interface development kit (UI toolkit and framework), created by Google in 2015 and based on the Dart programming language, that makes it possible to build natively compiled apps for the Android, iOS, Windows, Mac, Linux, Fuchsia, and Web operating systems.

Architecturally, Flutter has three layers—the framework, the engine, and the platform—and it relies on Dart-specific features like ahead-of-time (AOT) compilation.

As a dev, you mainly interact with the framework, writing the app and the widgets (Flutter's UI components) declaratively using Dart.

The engine then renders that to a canvas using [Skia](https://github.com/google/skia), which is later sent to the native platforms: Android, iOS, or web. The native platform presents the canvas and sends the events that occur back:

[🔗 Interactive version](https://mermaid.live/edit#pako:eNqVVMlu2zAQ_RWCvSpGvMhulSKAI8eA0aQwohZFK_cwkUYyYYokKMrZv6aHnPoV_rGSkp06SoKiPEizvHkYzsI7msgUaUBzDWpJvkwWgthTVpeNYUHJlFfGoCbR5NOCNu5nENAI3XiqocArqVc__0LcOQcby4DHO6HlDyuF2jAh4yephfjG0hxNGW__Le8FitTyijzudDp7PmteiDey7cWnImcCW1QR6jVLcK6lkYnk8U6QJMXGuXlsJxfKQsmSGSZFvJU3j5tfbdicg8mkLsIlCIG8jEMQwEpH7FzgfNCKmYA2s1JaN0ZoKvUfF-zHb7I29YoqnUGy5Q2lyFheaagzJymQyLUi2_xOGJKPl_rY5bkt9C28dr_PYNga57yyZS3j7b-xynbHxkrNIVlB7pp2WihIpLGzI0xd57HiLKnjWmGnaws5k1LNhB0k-Wo5WnVJOJTlBLO6JiRjnAfk3Wjq96ZTj7jGaqtnWeaR0mi5Qqv1-_2ddnDFUrMMSFddt-hSzKDiJjI3HP8VerQX26yKV49g_e3Xln3EiXZT7l0gJMbNUyOdsUvPFvNcprNCce_rzErO4LrsfZc5PEvp6OUO7y_ueG9XycHB8f12se7Jycu9OKkRdlrXUJJoxeCehK8PV1gj6y5Jx9XmePKMn_pEPVqgZWGpfYDunHlBzRILXNDAiinolUv8weKgMjK6EQkNjK7Qo5VK7V5MGNgrFjTIgJfWqkD8kLLYgaxKgzt6TQO_Mxwc-j3_0B--748GI9-jNzTo-cPOaNQd-h8Go6E_6A6GDx69rQm6HsWUGanPm-exfiUf_gA_RqLp)

![Flutter SDK](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091807.png?raw=true)

### Flutter vs React Native

Moving from React Native to Flutter reveals an evolution in cross-platform development. While React Native offers an efficient path with JavaScript, Flutter stands out with the flexibility of Dart, a language optimized for interactive UIs.

Although Flutter's architecture is similar to React Native's, there's a significant difference in terms of performance.

One of the key components that lets Flutter achieve better performance than React Native is its deeper integration with the native side, which means it doesn't use the traditional SDKs.

Instead, Flutter uses the Android NDK and iOS's LLVM to compile the C/C++ code that comes from the engine.

With React Native's new architecture, this performance gap may become less pronounced.

### Flutter's downsides

While Flutter delivers solid performance, beating React Native when it comes to compiling Dart to native code, it faces challenges like increased app size, due to bundling its runtime engine and widgets.

On top of that, extending Flutter with functionality it doesn't support natively requires communication between Dart and the native languages through specific channels and data structures, which can be a less efficient and more complex solution compared to the interoperability between Java and Kotlin or Objective-C and Swift.

![Native vs Flutter vs Compose](https://www.jacobras.nl/wp-content/uploads/2023/09/chart_app_size-5-1024x633.png)

> [🔗 Android & iOS native vs. Flutter vs. Compose Multiplatform](https://www.jacobras.nl/2023/09/android-ios-native-flutter-compose-kmp/)

#### The Dart challenge in Flutter

Like any language, Dart comes with its own natural learning and adoption curve.

While Dart is a modern, dynamic language, it's common for devs from other native platforms to hit a barrier when stepping into this new ecosystem, missing language-specific features from the likes of Kotlin or Swift.

Dart is constantly improving and, while it may not feel as mature as established languages, it offers a range of interesting features that are gaining recognition in the development community.

### Final thoughts on cross-platform

Cross-platform solutions abstract away the native complexities, letting you write a single codebase for many devices.

But it's common to run into limitations when integrating with the native platform, impacting the app's performance and experience.

On top of that, adapting to platform updates can be slow, since the cross-platform framework needs to be updated to support new native features.

---

## Introducing Kotlin Multiplatform (KMP)

KMP stands out in how it integrates with native platforms. This approach lets devs share business logic while keeping native interfaces, offering an ideal balance between efficiency and customization.

Instead of trying to fully abstract away the native platform, KMP empowers native devs with open-source machinery that handles compiling applications for Android, iOS, Web, macOS, Windows, Linux, and more.

[🔗 Interactive version](https://mermaid.live/view#pako:eNqFk81OwkAQx19lM14XtC0gVuMFwkGDlxpNpBwGdisrbbfZblUkPJWP4Iu57bZSxYRNk85Mf__5SGe3sJSMgw_PCrMVuR-HKTEnLxY2EIJ5bKw8yxjzfMwjgoojiUQc--TkfNJ3JxNKljKWyvhRFFGSayXX3Hie5zVe500wvfKJk73_k5LxCItYB3oT82Pyy71-JJNEpiMzxWz09cnEsyS3UsciNf0kGSot4hUyOSedznX95eZhOrPWqTHn_-Vq08EPHBxj71CLV97w1jumecQ8mYVQa0ovhJbmp-VKYt7VqN0XVORqoa5JF1Ed4oGlgxrOD4iyTsWUhqXejHXA2Rkq0pqWzeX8zy_cN0qbHmg7BW3VLbfn8q--Ho3apum-Gm1a_LUitZ6nDCgkXCUomNnjbRkOQa94wkPwjclQrcsd3hkOCy2DTboEX6uCUygyhpqPBZptT5pghumTlG0X_C28g--edXtDp-85nnvR6_XdAYUN-N6w6_SH7oXrng3PB2ZfdxQ-Kr1DgTOhpZraO1Zdtd037awVvw)

![KMP sharing code](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/mermaid-diagram-2023-11-21-164030.png?raw=true)

KMP aims to:

- Keep developing platform-specific features as natural and close to native development as possible.
- Ensure native developers don't run into trouble when working with the shared code.
- Make interoperability between native and shared code easy, so interacting with the shared code feels intuitive and familiar.

### Flexibility and native UI

With KMP, the versions of your app can have a lot in common, but also differ significantly, especially when it comes to UIs.

KMP doesn't impose limits on how you build your app's UI. You can use any style and framework you want, including the most modern ones, like Jetpack Compose for Android and SwiftUI for iOS. This lets you use platform-specific elements, delivering a native UI experience to your users.

[🔗 Full-screen diagram](https://mermaid.live/view#pako:eNp9VNtu2kAQ_ZXV9iWRHBowhEurSCkoapqQoqCoUkNVDd5x2GLvurvrkAv5mfahUl-rvvSVH-vYBgoh1ELYu3N8Zub4zD7wQAvkLX5tIBmxs4uBYnTZdFhsnHZ7VwN-ZL6m0qFLDTChs80B_1Qg19AnKjRA-LdgxAQMMmRHvROmwMkbsGvvZNeREkZL8Xnx2pkOIJL3MPsx-6430PJ9f4m8QIEbgA7asdPJEtSRNtik-YDDJaI9-xajgTUMKjFQ_5an2kVS5Sq0Z7-EvNYs0HEaM4w3dMhp2eu9vcNpmzBKBkUrTEiDjiJDc8hAs37nlJ1nmujpkv9pRuImjkRGIDTlLn0B47ES0H_OgrcYpA6GERZrOyK5xUvriDZgkRx6RTYqKMaJNuMcNgEbs7WSF-lZVnTPaJHes3j2J3IyicBmrWYlUBe_0c4pBSakEf2oL4IQzkGoTUzP83golaTQ9JlW_tdmXgN9tEQrOZSZERisVEA6JkD6WjRFokArm8aUKQPpeV2znyqQMGVvUhmtfcilSfNIZo8V_IZLcite7eS33SexC4y101c7xX13u3eWKS9PKN_lYhC2zkEOe4cugWDMMlm0xWfHIAf2JzJ0RP2sw3NEITHVC4Hbgqrkw0TxwpC4BeYT7DhKnUOzdezylPOqWTctLOQyZ_xvvkiVYl6U1TGyRBvWhRtUHjvvdeeOKzrtkSpwndmwrQMNiRZ2PgsuWH7vJxkCMrHtYMhoOoCFMopa7EX9uFY5PvbINZE2tA7D0GPWGT1GWvm-v1jtTaRwoxYrJ7crdFSyV0x6RvqKe5zOkBikoFP0IcMNuBthTFK26FGAGQ_4QD0SDlKn-3cq4C1nUvR4mghw2JFALokXmwmoj1qvLnnrgd_yVnm_UirXageVcrla9Wt-w_f4HW03Sw2_fFCp1Or71UbNr1YfPX6fM-yXmo1y_aDmV5oNv15vNsseRyGdNt3i0M_P_se_AG7kHA)

![Simplified KMP architecture](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-15-153615.png?raw=true)

### Sharing Kotlin code with the platforms

Given KMP's flexible spirit, there's currently a range of strategies devs can adopt to use KMP.

Some common approaches:

- **Sharing domain models**: Using common classes like entities, DTOs (Data Transfer Objects), server responses, etc., that stay consistent across all platforms.
- **Infrastructure components**: Sharing logic related to networking, data persistence, cache handling, and so on.
- **Experimentation and analytics**: Code that enables in-app experimentation, like defining feature flags, analytics events, etc.
- **Business logic**: Code that defines business rules, validations, and algorithms essential to how the application works.
- **Utilities**: Helper functions and classes that can be used in different parts of the application, like string manipulation, date formatting, constants, etc.
- **Tests**: Writing unit and integration tests that can run on all platforms, ensuring the consistency and reliability of the shared code.
- **Hardware and OS abstractions**: Code that abstracts platform- or hardware-specific functionality, like accessing sensors, file storage, etc., so it can be used uniformly across different platforms.

[🔗 Interactive version](https://mermaid.live/view#pako:eNqNVEtu2zAQvQrBblpUSWwr8kctAjh2gxqN-4ntBGjcBSWNbSIUqZKU80NO00VXXfUIvlhJSXYkxynChcQ3M3zzZiTOPQ5FBNjHc0mSxZQjs1QaZAj1GAWuQeXmimsoAsrg0WFXl0dS0OhyiovdFP-oRtAvI-M1z4oHeLQjwwUQSQJWzm7XNdHhYk2zRk8S2cNZUKEkM6AX5e2DutIiqfLFJMzpkoRBjp7mpDwS18pEFbsnEaeUpzfGn71fIGV8Xj0_XpZE6OUODUW54_NS6YblJd0OtjsYXBAV22og6CoFccBu0QGyxh3tDs6AhNpEfxwPT9Fb1Bs90-tss_WfdeXPlGrQqSR5eQhi9EloRjkapkzThBFNZkLGpELaN9YSEjGh_BFPBs9ntCdNqoygzHj2YTTufh0YV29BYhIRhQyshIxAUsLoHdFUcBO4wavfq18CvQ_kkf2HKtYqwbc-MDpf2G4dEx4KFAGKSCTUQY-EC9gE7xI-sdomVUWfjZSlsOUAg7khQom5OkioXMxj8xTiNpQUjtdhcb_f_Ddl3ldLL-LVH06r1RyninJQ6lTMaXh5BuaMsgVxmK_-hlSore81NOOGqcvstXGW0k4GaG_vaGv0hIwo1YcZIhIImlHGfPSqdeI1Tk4cFAompMGz2cxBSktxBQa5rrtGe9c00gsf1ZObEl0xwpzNnHGKm28sgWO-6hKkMxk4efmO1e6MzzMF77CDYzANpZGZnPeWdIr1AmLz7XyzjYi8muIpfzBxJNVidMtD7GuZgoPTJCIa-pSYRsVrY0L4dyHKEPv3-Ab7Xmu_1XYbNa_ZabU77XrbwbfYP_T2D1uder3h1Wu1w0az0Xxw8F1GUNvvuK2m2_Bq1u26XsvBEFEt5DCf89m4f_gHd2rNtA)

![KMP architecture](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-15-150050.png?raw=true)

Keep in mind that choosing which parts to share depends on the specific needs of your project and team. KMP gives you the flexibility to adapt your code-sharing strategy as the project evolves.

## Final thoughts

In this article, we went from zero into the KMP world and built a technical understanding of the difference between native, cross-platform, and multiplatform development.

In short, each technology—React Native, Flutter, and Kotlin Multiplatform—has its strengths and weaknesses.

When choosing the right tool for your project, consider factors like performance, ease of use, and community support. Kotlin Multiplatform emerges as a promising option, especially for those who value the efficiency of shared code without compromising the native user experience.

With this knowledge, we can move on to the more specific concepts of how Kotlin Multiplatform works, like the compiler, syntax, configuration, and so on.

### Next steps

We'll learn how the Kotlin compiler works, and how its frontend + backend + IR structure makes the multiple compilations possible.

---

> 🤖 This article was written with the help of ChatGPT 4, using the Web plugin.
>
> The sources and content are reviewed to ensure the information provided is relevant, as are the sources used in each prompt.
>
> That said, if you find any incorrect information or believe a credit is missing, please get in touch!

---

> References
>
> - [Simplifying Application Development with Kotlin Multiplatform Mobile Robert Nagy](https://github.com/PacktPublishing/Simplifying-Application-Development-with-Kotlin-Multiplatform-Mobile)
> - [Kotlin In-Depth - Aleksei Sedunov ](https://www.amazon.com/Kotlin-Depth-Multipurpose-Programming-Multiplatform/dp/9391030637)
