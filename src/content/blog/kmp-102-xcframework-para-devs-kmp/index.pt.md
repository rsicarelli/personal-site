---
title: 'KMP-102 - XCFramework para Devs KMP'
description: 'Olá! Dou as boas-vindas a série KMP-102. Vamos aprofundar os conceitos do Kotlin Multiplatform, aprendendo mais sobre como integrar nosso código Kotlin…'
pubDate: 2024-05-29
tags:
  - 'kotlin'
  - 'kmp'
  - 'ios'
  - 'braziliandevs'
series: 'kmp-102'
seriesOrder: 1
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-xcframework-para-devs-kmp-4a4b'
  devtoId: 1868908
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 16
topic: kmp
difficulty: intermediate
contentType: tutorial
---

## KMP102 - XCFramework para Devs Kotlin Multiplataforma

Olá! Dou as boas-vindas a série KMP-102. Vamos aprofundar os conceitos do Kotlin Multiplatform, aprendendo mais sobre como integrar nosso código Kotlin no iOS e em outras plataformas.

Como início desta série, vamos aprender mais sobre um formato de arquivo especial para compartilhar código com a família Apple: o `XCFramework`.

### Introdução ao `.framework` da Apple

Um [framework](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPFrameworks/Concepts/WhatAreFrameworks.html) é um pacote que contém um conjunto de recursos e código-fonte destinados a serem utilizados em projetos para a família Apple. No mundo da JVM, isso é equivalente a um `.jar` ou, no caso do Android, a um `.aar`.

Trata-se de um formato pré-compilado que pode ser utilizado livremente entre projetos no Xcode. Esse formato de arquivo facilita a criação de bibliotecas para dispositivos Apple, permitindo sua distribuição e utilização por meio de gerenciadores de pacotes, como CocoaPods ou o Swift Package Manager.

<p align="center">
  <img src="https://media.rsicarelli.com/blog/kmp-102/shared/framework_2x.png" alt="AppKit.framework" style="max-width:450px">
</p>

### Introdução ao XCFramework

O [XCFramework](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle) é um tipo de pacote ou artefato que facilita a distribuição de bibliotecas para a família Apple. Basicamente, ao invés de distribuirmos vários `.frameworks` para cada plataforma, temos um único `.xcframework` contendo múltiplos `.frameworks`, cada um representando uma plataforma específica suportada pela biblioteca.

O Kotlin Multiplataforma, mais especificamente o Kotlin/Native, utiliza este artefato para pré-compilar código Kotlin para Objective-C, garantindo total interoperabilidade com Swift. Com isso, nosso código Kotlin é facilmente compartilhado entre todos os alvos suportados do projeto, simplificando significativamente o processo de desenvolvimento: ao invés de compilar vários `.frameworks` para cada alvo suportado no KMP, compilamos apenas um `.xcframework` para cada alvo ou arquitetura de processador.

### Gerando um XCFramework no KMP

Por trás dos panos, o KGP (Kotlin Gradle Plugin) utiliza a toolchain do Xcode e nos oferece uma API que possibilita a criação de um `XCFramework` através dos nossos arquivos `build.gradle.kts`:

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

Ao sincronizar o projeto, observamos que a task `assembleKotlinSharedXCFramework` foi registrada no nosso projeto. Observe que a task tem o miolo `KotlinShared`, que corresponde com o parâmetro `xcFrameworkName` da classe `XCFramework`:
![XCFramework registered task](https://media.rsicarelli.com/blog/kmp-102/shared/xcframework-gradle-task.png)

### Analisando o resultado da tarefa assemble...XCFramework

Ao executarmos a task `assembleKotlinSharedXCFramework`, o Kotlin/Native gera os `.xcframeworks` para todos os alvos que definimos no `build.gradle.kts`.

Este artefato é exatamente o arquivo que precisamos vincular ao projeto Xcode para consumir nosso código KMP compilado para Objective-C!

> **Nota**: Tenha cuidado com o nome do projeto! Caracteres especiais, como "-", podem resultar em erro, apesar de o XCFramework ser gerado.

<p align="center">
  <img src="https://media.rsicarelli.com/blog/kmp-102/shared/xcframework-task-result.png" alt="AppKit.framework" style="max-width:450px">
</p>

## NativeBuildTypes: debug e release

Observe que temos dois frameworks gerados: a versão `debug` e a versão `release`. Esses dois tipos possuem características especiais, provenientes da classe [NativeBinaryType](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin-api/src/common/kotlin/org/jetbrains/kotlin/gradle/plugin/mpp/NativeBinaryTypes.kt):

Analisando esse enum, entendemos que a versão `release` possui a flag `optimized = true` e `debuggable = false`, enquanto a versão `debug` possui `optimized = false` e `debuggable = true`.

Como você pode imaginar, devemos ter cuidado ao escolher qual `XCFramework` utilizar no fluxo de desenvolvimento:

- Para o ambiente de desenvolvimento local, a versão `debug` é a escolha ideal, pois permite debugar nosso código KMP.
- Para o ambiente de produção, a versão `release` é a escolha correta, pois o binário é otimizado e evita a inclusão de informações de debug no produto final.

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

## Controlando qual tipo de build gerar

A configuração para gerar os tipos de binário é proveniente da função `iosTarget.binaries.framework()`. Ao analisarmos a classe [AbstractKotlinNativeBinaryContainer](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/dsl/AbstractKotlinNativeBinaryContainer.kt), observamos que a função `framework()` possui um argumento `buildTypes` com um valor padrão.

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

Durante o fluxo de desenvolvimento, pode ser desejável evitar a compilação das duas versões devido ao aumento do tempo de compilação. Para isso, basta adaptar nosso `build.gradle.kts`:

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

## Conclusões

O XCFramework é um tema central no universo do Kotlin Multiplatform (KMP). Compreender o que é, como funciona e como gerá-lo nos proporciona um maior controle e compreensão dos bastidores do KMP.

No próximo artigo, exploraremos melhor a função `framework()`!

## Fontes

- [KotlinLang | Build final native binaries](https://kotlinlang.org/docs/multiplatform-build-native-binaries.html)
- [Embracing the Power of XCFrameworks: A Comprehensive Guide for iOS Developers](https://medium.com/@mihail_salari/embracing-the-power-of-xcframeworks-a-comprehensive-guide-for-ios-developers-77fe192d47fe)
