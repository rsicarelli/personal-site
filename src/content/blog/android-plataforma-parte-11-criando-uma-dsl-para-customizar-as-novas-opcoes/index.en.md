---
title: 'Android Plataforma - Parte 11: Criando uma DSL para customizar as novas opções'
description: 'No artigo anterior, parametrizamos os argumentos de applyAndroidApp() e appyAndroidLibary() com modelos.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 11
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Favuc64tchhyvt93ar1za.png'
translated: false
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-11-criando-uma-dsl-para-customizar-as-novas-opcoes-1m1e'
  devtoId: 1611012
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/10-11/customizing-android-options'
  reactions: 2
---

No artigo anterior, parametrizamos os argumentos de `applyAndroidApp()` e `appyAndroidLibary()` com modelos.

Agora, as funções `androidApp()` e `androidLibrary()` devem ser modificadas para aplicar as devidas decorações nos módulos.

---

## Definindo os valores através de uma DSL

Dentro das nossas funções `androidApp()` e `androidLibrary()` poderiamos simplesmente aceitar um modelo:

```kotlin
fun Project.androidApp(androidAppOptions: AndroidAppOptions) = applyAndroidApp(androidAppOptions)

fun Project.androidLibrary(androidLibraryOptions: AndroidLibraryOptions) = applyAndroidLibrary(androidLibraryOptions)
```

Essa é uma abordagem totalmente válida! Porém, na hora de consumir, precisamos ter um "boilerplate" de definir uma nova classe:

```kotlin
    androidApp(
        androidAppOptions = AndroidAppOptions(
            applicationId = "com.rsicarelli.plataforma",
            ..
        )
    )
```

Isso é bem verboso, além de fugir um pouco do estilo "convencional" de DSL que encontramos nos arquivos `build.gradle.kts`.

Para solucionar esse problema, vamos introduzir uma DSL que cuide dessa customização de uma forma elegante e idiomática no Kotlin.

Note que, aqui iremos definir os valores padrões da nossa plataforma.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7v2mwju1ebm1o7ebodow.png)

```kotlin

abstract class AndroidOptionsBuilder {

    var namespace: String = "com.rsicarelli.kplatform"
    var compileSdk: Int = 34
    var minSdk: Int = 24
    var useVectorDrawables: Boolean = true
    var javaVersion: JavaVersion = JavaVersion.VERSION_17
    var composeOptions: ComposeOptions = ComposeOptions()
    var packagingOptions: PackagingOptions = PackagingOptions()
    var buildTypes: List<AndroidBuildType> = listOf(ReleaseBuildType, DebugBuildType)

    abstract fun build(): AndroidOptions
}

class AndroidAppOptionsBuilder : AndroidOptionsBuilder() {

    var applicationId: String = "com.rsicarelli.kplatform"
    var targetSdk: Int = 34
    var versionCode: Int = 1
    var versionName: String = "1.0"
    private var proguardOptionsBuilder = ProguardOptionsBuilder("proguard-rules.pro")

    fun proguardOptions(init: ProguardOptionsBuilder.() -> Unit) {
        proguardOptionsBuilder.apply(init)
    }

    override fun build(): AndroidAppOptions = AndroidAppOptions(
        applicationId = applicationId,
        targetSdk = targetSdk,
        versionCode = versionCode,
        versionName = versionName,
        proguardOptions = proguardOptionsBuilder.build(),
        namespace = namespace,
        compileSdk = compileSdk,
        minSdk = minSdk,
        useVectorDrawables = useVectorDrawables,
        javaVersion = javaVersion,
        composeOptions = composeOptions,
        packagingOptions = packagingOptions,
        buildTypes = buildTypes
    )
}

class AndroidLibraryOptionsBuilder : AndroidOptionsBuilder() {

    private var proguardOptionsBuilder = ProguardOptionsBuilder("consumer-proguard-rules.pro")

    fun proguardOptions(init: ProguardOptionsBuilder.() -> Unit) {
        proguardOptionsBuilder.apply(init)
    }

    override fun build(): AndroidLibraryOptions = AndroidLibraryOptions(
        proguardOptions = proguardOptionsBuilder.build(),
        namespace = namespace,
        compileSdk = compileSdk,
        minSdk = minSdk,
        useVectorDrawables = useVectorDrawables,
        javaVersion = javaVersion,
        composeOptions = composeOptions,
        packagingOptions = packagingOptions,
        buildTypes = buildTypes
    )
}

class ProguardOptionsBuilder(defaultFileName: String) {

    var fileName: String = defaultFileName
    var applyWithOptimizedVersion: Boolean = true

    fun build(): ProguardOptions = ProguardOptions(
        fileName = fileName,
        applyWithOptimizedVersion = applyWithOptimizedVersion
    )
}
```

### Expondo nossos `builder` nas funções `androidApp()` e `androidLibrary()`

Note que passamos uma lambda vazia como parametro, possibilitando o módulo simplesmente invocar com as opções pre-definidas.

```kotlin
fun Project.androidApp(builderAction: AndroidAppOptionsBuilder.() -> Unit = { }) =
    applyAndroidApp(AndroidAppOptionsBuilder().apply(builderAction).build())

fun Project.androidLibrary(builderAction: AndroidLibraryOptionsBuilder.() -> Unit = { }) =
    applyAndroidLibrary(AndroidLibraryOptionsBuilder().apply(builderAction).build())
```

### Uso

Uso é super flúido, olha só como podemos customizar `versionCode` e `versionName` no `app/build.gradle.kts`:

```kotlin
androidApp {
    // this é o AndroidAppOptionsBuilder
    versionCode = 1
    versionName = "1.0.0"

    proguardOptions {
        // this é ProguardOptionsBuilder
        applyWithOptimizedVersion = true
    }
}
```

## Sucesso!

Agora, nossa configuração está elegante com uma DSL expressiva e intuitiva, permitindo diversas customizações adaptáveis para diferentes cenários.

Essa abordagem nos permite estabelecer comportamentos padrão para os módulos, mas também oferece uma DSL robusta para que o time consiga adicionar novas configurações conforme necessário.

No próximo artigo, vamos adicionar uma decoração importantíssima para otimizar o tempo de compilação dos nossos módulos.
