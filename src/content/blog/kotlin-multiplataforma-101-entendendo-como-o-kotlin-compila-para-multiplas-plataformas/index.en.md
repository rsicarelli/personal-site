---
title: 'KMP 101: Understanding How Kotlin Compiles to Multiple Platforms'
description: 'In the last post (🔗 KMP 101: An Introduction to the multiplatform paradigm), we explored the multiplatform paradigm and how KMP stands out in the ecosystem.'
summary: 'In the last post (🔗 KMP 101: An Introduction to the multiplatform paradigm), we explored the multiplatform paradigm and how KMP stands out in the ecosystem.'
pubDate: 2023-11-21
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 2
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-multiplataforma-101-entendendo-como-o-kotlin-compila-para-multiplas-plataformas-5hba'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 13
topic: kmp
difficulty: beginner
contentType: tutorial
---

In this article, we'll unpack the basics of the Kotlin compiler and its ability to compile to multiple platforms.

---

## An introduction to the Kotlin compiler

A compiler is a piece of software that converts code from one programming language into another. Compilers are often used to turn programs written in high-level languages into low-level languages.

Kotlin, like some other compilers such as [LLVM](https://llvm.org/) and [GCC](https://gcc.gnu.org/), has an architecture split into a **frontend** and a **backend**, which communicate through an **Intermediate Representation (IR)**.

### Understanding the Kotlin compiler frontend

Responsible for analyzing and preparing the `.kt` source code for compilation, Kotlin ships with two frontend versions: **K1** and **K2**.

#### K1: codename FE10 (Frontend 1.0)

The K1 frontend, also known as FE10, is the original Kotlin compiler frontend and is the default in use today.

Key characteristics:

- **Lexical analysis (Lexer):** breaks the Kotlin source code into tokens, the fundamental building blocks of the language.
- **Syntactic analysis (Parser):** organizes the tokens into a syntactic structure, usually a syntax tree (AST), that represents the logical structure of the code.
- **PSI/AST trees:** uses the `Abstract Syntax Tree` (AST) and the `Program Structure Interface` (PSI) to represent and manipulate the code structure, which is essential for later analyses.
- **Semantic analysis:** checks that language elements such as types and scopes are used correctly, making sure the code follows Kotlin's semantic rules.

![Frontend K1](https://media.rsicarelli.com/blog/kmp-101/shared/k1_frontend.png)

#### K2: codename FIR (Frontend Intermediate Representation)

K2, also known as `FIR`, is the next major update to the Kotlin compiler and is set to replace K1/FE10.

The first beta of K2 arrived with Kotlin `1.9.20`, released in November 2023, and the final version is planned for Kotlin 2.0.0, which we expect in 2024. This new system brings several important improvements, such as more speed, a more organized structure, and a clearer way to understand the code.

![KotlinConf2023 K1 vs K2](https://media.rsicarelli.com/blog/kmp-101/shared/k1-vs-k2-kotlinconf2023.png)

> Data from the [KotlinConf'23 - Keynote](https://www.youtube.com/live/c4f4SCEYA5Q?si=LyH_q_6R8hjd-dRo&t=495)

A few of those improvements:

- **Completely rebuilt:** K2 was built from scratch, with speed and easy future updates in mind.
- **Better code analysis:** it has a more advanced method for inspecting code, helping it identify and use important information in a smarter way.
- **Plugin support:** includes support for a variety of plugins, such as `kapt`, `serialization`, `all-open`, and others.
- **Cross-platform compatibility:** supports `JVM`, `Native`, `Wasm`, and `JS`, optimized for multiplatform projects.

![Frontend K2 FIR](https://media.rsicarelli.com/blog/kmp-101/shared/k2_frontend.png)

### Understanding the Kotlin compiler backend

Once the frontend has processed and prepared the source code, the backend takes on a crucial role.

The backend is responsible for converting the intermediate representation (IR) into machine code, performing optimizations and generating the output specific to the target platform (such as `*.class`, `*.js`, `*.so`, `*.wasm`).

Designed to be multiplatform, Kotlin can be compiled to run on a wide range of devices and operating systems. Each Kotlin compiler backend is specially optimized for a target platform, making it possible for developers to write code that can run in many different environments.

- **Kotlin/JVM:** this is the most traditional backend and generates bytecode compatible with the Java Virtual Machine (`JVM`). It's ideal for applications that will run in JVM-supported environments, including Android, Desktop, and server applications.
- **Kotlin/Native:** using the `LLVM` toolchain, this backend compiles Kotlin code directly into native machine code. It supports a wide range of platforms, such as iOS, macOS, Windows, Linux, and embedded systems, allowing applications to run directly on the hardware.
- **Kotlin/JS:** specialized for web development, this backend converts Kotlin code into JavaScript, making it compatible with web browsers and JavaScript-based server environments such as Node.js.
- **Kotlin/Wasm:** a more recent addition that's still in development, this backend lets you compile Kotlin to WebAssembly (Wasm), making it easier to run high-performance Kotlin applications in web browsers.

![Native development](https://media.rsicarelli.com/blog/kmp-101/shared/kotlin-compiler-backend.jpg)

## Intermediate Representation (IR)

The IR is a way of representing the source code inside the compiler that is independent of both the source programming language and the target machine architecture. It serves as a middle ground between the high-level code and the low-level machine code.

This data structure lets the Kotlin compiler manipulate code in a more abstract way, making it easier to generate code for multiple platforms. This is especially beneficial for Kotlin, which is designed to be multiplatform.

## Conclusions

Understanding how Kotlin compiles to different platforms isn't something you need to do every day or memorize. Still, having an overview of this process has its advantages.

This understanding gives you a sense of Kotlin's versatility and efficiency, offering you the confidence that your code can run across multiple ecosystems. On top of that, a basic appreciation of what happens "under the hood" can be incredibly useful when debugging code and making sense of error messages, saving you hours of frustration.

---

> References
>
> - [Crash Course on the Kotlin Compiler by Amanda Hinchman-Dominguez - KotlinConf'23](https://www.youtube.com/watch?v=wUGfuWHCqrc), [Github repo](https://github.com/ahinchman1/Kotlin-Compiler-Crash-Course)
> - [Crash Course on the Kotlin Compiler | K1 + K2 Frontends, Backends](https://medium.com/google-developer-experts/crash-course-on-the-kotlin-compiler-k1-k2-frontends-backends-fe2238790bd8)
> - [The Road to the K2 Compiler | The Kotlin Blog](https://blog.jetbrains.com/kotlin/2021/11/the-road-to-the-k2-compiler/)
> - [Kotlin Roadmap Autumn 2021 Highlights | The Kotlin Blog](https://blog.jetbrains.com/kotlin/2021/11/kotlin-roadmap-autumn-2021/)
> - [The K2 Compiler Is Going Stable in Kotlin 2.0 | The Kotlin Blog](https://blog.jetbrains.com/kotlin/2021/11/the-k2-compiler-is-going-stable-in-kotlin-2-0/)
> - [FIR Basics | GitHub](https://github.com/JetBrains/kotlin/blob/master/docs/fir/fir-basics.md)
> - [What's new in Kotlin 2.0.0-Beta1 | Kotlin Documentation](https://kotlinlang.org/docs/whatsnew-eap.html)
