---
title: 'Android Plataforma - Parte 13: Incluindo módulos "puro JVM"'
description: 'No último artigo, otimizamos a compilação dos módulos Android desativando diversas funcionalidades do Android Gradle Plugin (AGP).'
summary: 'No último artigo, otimizamos a compilação dos módulos Android desativando diversas funcionalidades do Android Gradle Plugin (AGP).'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 13
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-13-incluindo-modulos-puro-jvm-4f61'
  devtoId: 1611083
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/13/jvm-only-modules'
  reactions: 2
topic: android
difficulty: intermediate
contentType: tutorial
---

Neste artigo, discutiremos a distinção entre módulos puro JVM (`java-library`) e módulos Library Android (`com.android.library`), além de expandir nossa plataforma para suportar essa funcionalidade.

---

## O que são Módulos Puro JVM?

Módulos Puro JVM são aqueles que utilizam exclusivamente a JVM (Java Virtual Machine) para sua execução. Em outras palavras, não têm vínculo nem dependência direta com o Android.

Simplificando, são módulos puramente Java, isentos das especificidades e complexidades dos módulos Android.

Como resultado, as compilações são mais eficientes, já que esses módulos não passam pelas etapas de compilação do Android Gradle Plugin (AGP).

### Quando usar módulos puro JVM?

1. **Lógica de negócios:** Para códigos relacionados à lógica de negócios que não dependem diretamente do Android, como cálculos, validações ou manipulações de listas.

2. **Bibliotecas Genéricas:** Se você está desenvolvendo uma biblioteca que pode ser usada tanto em projetos Android quanto em projetos Kotlin/JVM puros.

3. **Módulos 'core'**: Módulos relacionados a banco de dados, rede, logging, que podem ser construídos puramente em Kotlin/JVM.

## Decorando nossa plataforma para receber módulos puro JVM

A proposta é adicionar um novo ponto de entrada chamado `jvmLibrary()` e decorá-lo com a função `applyJvmLibrary()`.

**1 -** Crie uma função `fun Project.applyJvmLibrary()` no arquivo `kotlin.kt`:

```kotlin
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

internal fun Project.applyJvmLibrary() {
    pluginManager.apply("java-library")
    extensions.configure<JavaPluginExtension> {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    applyKotlinOptions()
}

internal fun Project.applyKotlinOptions() {
    tasks.withType<KotlinCompile>().configureEach {
        kotlinOptions {
            jvmTarget = "17"
        }
    }
}
```

**2 -** Vamos manter o padrão da nossa plataforma e possibilitar que os módulos configurem a compilação individualmente. Isso irá possibilitar algumas novas customizações que iremos aplicar no próximo post:

Pra não deixar os `Options` jogados por aí, vamos criar uma pasta `build-logic/src/../options` e trazer `AndroidOptions.kt` para lá.

Crie uma classe `CompilationsOptions` e declare o conteúdo:

```kotlin
import org.gradle.api.JavaVersion

internal data class CompilationOptions(
    val javaVersion: JavaVersion,
    val jvmTarget: String,
    val allWarningsAsErrors: Boolean,
)

class CompilationOptionsBuilder {

    var javaVersion: JavaVersion = JavaVersion.VERSION_17
    var jvmTarget: String = "17"
    var allWarningsAsErrors: Boolean = false

    internal fun build(): CompilationOptions = CompilationOptions(
        javaVersion = javaVersion,
        jvmTarget = jvmTarget,
        allWarningsAsErrors = allWarningsAsErrors
    )
}
```

**3 -** Vamos adaptar nossa função `applyJvmLibrary()` pra receber um `CompilationOptions`:

```kotlin
import com.rsicarelli.kplatform.options.CompilationOptions
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.api.plugins.JavaPluginExtension
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

internal fun Project.applyJvmLibrary(compilationOptions: CompilationOptions) {
    pluginManager.apply("java-library")
    applyJavaCompatibility(compilationOptions.javaVersion)
    applyKotlinOptions(compilationOptions)
}

internal fun Project.applyKotlinOptions(compilationOptions: CompilationOptions) {
    tasks.withType<KotlinCompile>().configureEach {
        kotlinOptions {
            allWarningsAsErrors = compilationOptions.allWarningsAsErrors
            jvmTarget = compilationOptions.jvmTarget
        }
    }
}

private fun Project.applyJavaCompatibility(javaVersion: JavaVersion) {
    extensions.configure<JavaPluginExtension> {
        sourceCompatibility = javaVersion
        targetCompatibility = javaVersion
    }
}
```

**4 -** Note que alteramos a assinatura da função `applyKotlinOptions` que está sendo compartilhada entre nossas decorações `android.kt`.

```kotlin
internal fun Project.applyAndroidApp(
    androidAppOptions: AndroidAppOptions,
    compilationOptions: CompilationOptions,
) {
    applyAndroidCommon(
        androidOptions = androidAppOptions,
        compilationOptions = compilationOptions
    )
    ..
}

internal fun Project.applyAndroidLibrary(
    androidLibraryOptions: AndroidLibraryOptions,
    compilationOptions: CompilationOptions,
) {
    applyAndroidCommon(
        androidOptions = androidLibraryOptions,
        compilationOptions = compilationOptions
    )
        ..
}

private fun Project.applyAndroidCommon(
    androidOptions: AndroidOptions,
    compilationOptions: CompilationOptions,
) =
    with(commonExtension) {
        ..

        compileOptions {
            sourceCompatibility = androidOptions.javaVersion
            targetCompatibility = androidOptions.javaVersion
        }

        applyKotlinOptions(compilationOptions)
        ..
    }
```

### Expondo as novas APIs

Agora, atualizaremos nosso `KPlatformPlugin.kt` com as novas definições:

```kotlin
fun Project.androidApp(
    compilationOptionsBuilder: CompilationOptionsBuilder.() -> Unit = { },
    appOptionsBuilder: AndroidAppOptionsBuilder.() -> Unit = { },
) = applyAndroidApp(
    androidAppOptions = AndroidAppOptionsBuilder().apply(appOptionsBuilder).build(),
    compilationOptions = CompilationOptionsBuilder().apply(compilationOptionsBuilder).build()
)

fun Project.androidLibrary(
    compilationOptionsBuilder: CompilationOptionsBuilder.() -> Unit = { },
    libraryOptionsBuilder: AndroidLibraryOptionsBuilder.() -> Unit = { },
) = applyAndroidLibrary(
    androidLibraryOptions = AndroidLibraryOptionsBuilder().apply(libraryOptionsBuilder).build(),
    compilationOptions = CompilationOptionsBuilder().apply(compilationOptionsBuilder).build()
)

fun Project.jvmLibrary(builderAction: CompilationOptionsBuilder.() -> Unit = { }) =
    applyJvmLibrary(
        compilationOptions = CompilationOptionsBuilder().apply(builderAction).build()
    )
```

## Criando um módulo JVM e aplicando as decorações da plataforma

**1 -** Dentro de `core`, criaremos um novo módulo chamado `threading`.

![Image description](https://media.rsicarelli.com/blog/android-plataforma/shared/81xtralh2ban3swg5isb.png)

**2 -** Inclua esse novo módulo no `settings.gradle.kts`:

```kotlin
include(":app", ":features:details", ":features:home", ":core:designsystem", ":core:threading")
```

**3 -** Sincronize o projeto. Em seguida, crie um arquivo `build.gradle.kts` e configure as opções desse módulo:

```kotlin
import com.rsicarelli.kplatform.jvmLibrary

plugins {
    kotlin("jvm")
}

jvmLibrary()

dependencies {
    api(libs.kotlinx.coroutines.core)
    testApi(libs.kotlinx.coroutines.test)
}
```

## Sucesso!

A IDE informará se essa biblioteca é pura JVM.

Embora eu esteja usando o IntelliJ, o Android Studio também exibirá um ícone diferente
![Image description](https://media.rsicarelli.com/blog/android-plataforma/shared/e3pvnqbr36fgmjw91v08.png)

No próximo artigo, aprenderemos a customizar nossas compilações para incorporar algumas das funcionalidades experimentais do compilador Kotlin.

![Image description](https://media.rsicarelli.com/blog/android-plataforma/shared/5afv0g9m07tkk60t7bta.png)

![Image description](https://media.rsicarelli.com/blog/android-plataforma/shared/tsfkotnkwv8xvdfu4305.png)
