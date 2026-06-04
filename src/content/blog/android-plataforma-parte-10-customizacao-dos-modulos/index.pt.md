---
title: 'Android Plataforma - Parte 10: Customização dos módulos'
description: 'No último artigo, exploramos o CommonsExtension para eliminar duplicidades em nossas configurações.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 10
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fej0i91sw2qolg9uuruxi.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-10-customizacao-dos-modulos-2a7'
  devtoId: 1610709
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/10-11/customizing-android-options'
  reactions: 3
topic: android
difficulty: intermediate
contentType: tutorial
---

No último artigo, exploramos o `CommonsExtension` para eliminar duplicidades em nossas configurações.

Agora, vamos discutir situações em que são necessárias modificações no comportamento e como enriquecer nossa plataforma com uma DSL customizada para a construção de um `AndroidOptions`.

Ainda enfrentamos duplicidade ao definir nossos `buildTypes`, além de não estarmos configurando o Proguard corretamente para as nossas biblotecas.

Mas, antes de resolver essa questão, vale a pena entender como cada módulo pode ter configurações específicas.

---

## Módulos diferentes, configurações diferentes.

Em uma aplicação real, é comum que diferentes módulos demandem certa flexibilidade em relação à plataforma.

Por exemplo, talvez um módulo necessite de um build type adicional, modificar as regras do "resource packing" para excluir determinados arquivos, ou até usar um `namespace` diferente.

Então, como podemos incorporar essa flexibilidade à nossa plataforma?

## Introduzindo o conceito de `Options`

Cada ajuste em nossa plataforma pode ser adaptado a partir de um modelo ou opções, permitindo maior controle sobre determinado módulo.

A proposta é criar um modelo que especifique quais opções serão aplicadas para cada módulo.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/24m73d4j4cj8rcjgg27g.png)

```kotlin
sealed class AndroidOptions(
    open val namespace: String,
    open val compileSdk: Int,
    open val minSdk: Int,
    open val useVectorDrawables: Boolean,
    open val javaVersion: JavaVersion,
    open val composeOptions: ComposeOptions,
    open val packagingOptions: PackagingOptions,
    open val proguardOptions: ProguardOptions,
    open val buildTypes: List<AndroidBuildType>,
) {

    data class AndroidAppOptions(
        val applicationId: String,
        val targetSdk: Int,
        val versionCode: Int,
        val versionName: String,
        override val proguardOptions: ProguardOptions,
        override val namespace: String,
        override val compileSdk: Int,
        override val minSdk: Int,
        override val useVectorDrawables: Boolean,
        override val javaVersion: JavaVersion,
        override val composeOptions: ComposeOptions,
        override val packagingOptions: PackagingOptions,
        override val buildTypes: List<AndroidBuildType>,
    ) : AndroidOptions(
        namespace = namespace,
        compileSdk = compileSdk,
        minSdk = minSdk,
        useVectorDrawables = useVectorDrawables,
        javaVersion = javaVersion,
        composeOptions = composeOptions,
        packagingOptions = packagingOptions,
        proguardOptions = proguardOptions,
        buildTypes = buildTypes
    )

    data class AndroidLibraryOptions(
        override val proguardOptions: ProguardOptions,
        override val namespace: String,
        override val compileSdk: Int,
        override val minSdk: Int,
        override val useVectorDrawables: Boolean,
        override val javaVersion: JavaVersion,
        override val composeOptions: ComposeOptions,
        override val packagingOptions: PackagingOptions,
        override val buildTypes: List<AndroidBuildType>,
    ) : AndroidOptions(
        namespace = namespace,
        compileSdk = compileSdk,
        minSdk = minSdk,
        useVectorDrawables = useVectorDrawables,
        javaVersion = javaVersion,
        composeOptions = composeOptions,
        packagingOptions = packagingOptions,
        proguardOptions = proguardOptions,
        buildTypes = buildTypes
    )
}

data class ProguardOptions(
    val fileName: String,
    val applyWithOptimizedVersion: Boolean = true,
)

data class ComposeOptions(
    val enabled: Boolean = true,
)

data class PackagingOptions(
    val excludes: String = "/META-INF/{AL2.0,LGPL2.1}",
)

interface AndroidBuildType {

    val name: String
    val isMinifyEnabled: Boolean
    val shrinkResources: Boolean
    val versionNameSuffix: String?
    val isDebuggable: Boolean
    val multidex: Boolean
}

object ReleaseBuildType : AndroidBuildType {

    override val name: String = "release"
    override val isMinifyEnabled: Boolean = true
    override val shrinkResources: Boolean = true
    override val versionNameSuffix: String? = null
    override val isDebuggable: Boolean = false
    override val multidex: Boolean = false
}

object DebugBuildType : AndroidBuildType {

    override val name: String = "debug"
    override val isMinifyEnabled: Boolean = false
    override val shrinkResources: Boolean = false
    override val versionNameSuffix: String = "debug"
    override val isDebuggable: Boolean = true
    override val multidex: Boolean = false
}
```

A partir desse modelo, conseguimos:

- Estabelecer opções comuns entre diferentes tipos de módulos Android usando a `sealed class` `AndroidOptions`.
- Especificar opções para o app com o `AndroidAppOptions`.
- Delimitar opções para uma biblioteca usando o `AndroidLibraryOptions`.
- Ter maior adaptabilidade para definir as opções do Proguard.
- Tornar nossa plataforma agnóstica, facilitando a integração com outros projetos que tenham `applicationId` distintos, entre outros.

## Refatorando com `AndroidOptions`

**1 -** Crie um arquivo nomeado `AndroidOptions.kt` na raiz do módulo `build-logic` e mova o conteúdo anterior para este arquivo.

Traga todo o conteúdo acima para esse arquivo.

**2 -** Atualize a função `applyAndroidCommon()` trazendo o `AndroidOptions` como argumento.

Atualize a função para utilizarmos os valores definidos pelo modelo:

```kotlin
private fun Project.applyAndroidCommon(androidOptions: AndroidOptions) =
    with(commonExtension) {
        namespace = androidOptions.namespace
        compileSdk = androidOptions.compileSdk

        defaultConfig {
            minSdk = androidOptions.minSdk

            vectorDrawables {
                useSupportLibrary = androidOptions.useVectorDrawables
            }
        }

        compileOptions {
            sourceCompatibility = androidOptions.javaVersion
            targetCompatibility = androidOptions.javaVersion
        }

        applyKotlinOptions()

        androidOptions.composeOptions.takeIf(ComposeOptions::enabled)
            ?.let {
                buildFeatures {
                    compose = true
                }

                composeOptions {
                    kotlinCompilerExtensionVersion = libs.version("composeKotlinCompilerExtension")
                }
            }

        packaging {
            resources {
                excludes += androidOptions.packagingOptions.excludes
            }
        }
    }

```

**3 -** Atualize nossas funções `applyAndroidApp()` e
`applyAndroidLibrary()` para receber e aplicar as opções do modelo, assim como invocar nossa `applyAndroidCommon()`

```kotlin
internal fun Project.applyAndroidApp(androidAppOptions: AndroidAppOptions) {
    applyAndroidCommon(androidAppOptions)

    extensions.configure<ApplicationExtension> {
        defaultConfig {
            applicationId = androidAppOptions.applicationId
            targetSdk = androidAppOptions.targetSdk
            versionCode = androidAppOptions.versionCode
            versionName = androidAppOptions.versionName
        }
    }
}
```

```kotlin
internal fun Project.applyAndroidLibrary(androidLibraryOptions: AndroidLibraryOptions) {
    applyAndroidCommon(androidLibraryOptions)

    extensions.configure<LibraryExtension> {
    }
}
```

**4 -** Vamos criar uma DSL para definir as configurações do Proguard.

A ideia dessa função é delegar a função `consume` para quem invoca, e deixar aplicar configurações específicas para cada tipo de módulo

```kotlin
private fun <T> Project.setProguardFiles(
    config: T,
    proguardOptions: ProguardOptions,
    consume: T.(Array<Any>) -> Unit,
) {
    if (proguardOptions.applyWithOptimizedVersion) {
        config.consume(
            arrayOf(
                getDefaultProguardFile("proguard-android-optimize.txt", layout.buildDirectory),
                proguardOptions.fileName
            )
        )
    } else {
        config.consume(arrayOf(proguardOptions.fileName))
    }
}
```

**5 -** Atualize as funções `applyAndroidApp()` e `applyAndroidLibrary()`, definindo o proguard dentro do bloco `defaultConfig { }`. Aqui, você terá acesso às funções `proguardFiles` e `consumerProguardFiles`:

```kotlin
internal fun Project.applyAndroidApp(androidAppOptions: AndroidAppOptions) {
    applyAndroidCommon(androidAppOptions)

    extensions.configure<ApplicationExtension> {
        defaultConfig {
            ..

            setProguardFiles(
                config = this,
                proguardOptions = androidAppOptions.proguardOptions,
                consume = { proguardFiles(*it) }
            )
        }
    }
}
```

```kotlin
internal fun Project.applyAndroidLibrary(androidLibraryOptions: AndroidLibraryOptions) {
    applyAndroidCommon(androidLibraryOptions)

    extensions.configure<LibraryExtension> {
        defaultConfig {
            setProguardFiles(
                config = this,
                proguardOptions = androidLibraryOptions.proguardOptions,
                consume = { consumerProguardFiles(*it) }
            )
        }
    }
}
```

**6 -** Em seguida, configure os `buildTypes` a partir da `List<ApplicationBuildType>`:

Para a `ApplicationExtension`:

```kotlin
private fun ApplicationExtension.setAppBuildTypes(options: AndroidAppOptions) {
    fun ApplicationBuildType.applyFrom(androidBuildType: AndroidBuildType) {
        isDebuggable = androidBuildType.isDebuggable
        isMinifyEnabled = androidBuildType.isMinifyEnabled
        isShrinkResources = androidBuildType.shrinkResources
        multiDexEnabled = androidBuildType.multidex
        versionNameSuffix = androidBuildType.versionNameSuffix
    }

    buildTypes {
        options.buildTypes.forEach { androidBuildType ->
            when (androidBuildType) {
                DebugBuildType -> debug { applyFrom(androidBuildType) }
                ReleaseBuildType -> release { applyFrom(androidBuildType) }
                else -> create(androidBuildType.name) { applyFrom(androidBuildType) }
            }
        }
    }
}
```

Para a `LibraryExtension`:

```kotlin
private fun LibraryExtension.setLibraryBuildTypes(options: AndroidLibraryOptions) {
    fun LibraryBuildType.applyFrom(androidBuildType: AndroidBuildType) {
        isMinifyEnabled = androidBuildType.isMinifyEnabled
        multiDexEnabled = androidBuildType.multidex
    }

    buildTypes {
        options.buildTypes.forEach { androidBuildType ->
            when (androidBuildType) {
                DebugBuildType -> debug { applyFrom(androidBuildType) }
                ReleaseBuildType -> release { applyFrom(androidBuildType) }
                else -> create(androidBuildType.name) { applyFrom(androidBuildType) }
            }
        }
    }
}
```

**7 -** Por fim, integre todos os componentes:

```kotlin
internal fun Project.applyAndroidApp(androidAppOptions: AndroidAppOptions) {
    applyAndroidCommon(androidAppOptions)

    extensions.configure<ApplicationExtension> {
        defaultConfig {
            applicationId = androidAppOptions.applicationId
            targetSdk = androidAppOptions.targetSdk
            versionCode = androidAppOptions.versionCode
            versionName = androidAppOptions.versionName

            setProguardFiles(
                config = this,
                proguardOptions = androidAppOptions.proguardOptions,
                consume = { proguardFiles(*it) }
            )
        }

        setAppBuildTypes(androidAppOptions)
    }
}
```

```kotlin
internal fun Project.applyAndroidLibrary(androidLibraryOptions: AndroidLibraryOptions) {
    applyAndroidCommon(androidLibraryOptions)

    extensions.configure<LibraryExtension> {
        defaultConfig {
            setProguardFiles(
                config = this,
                proguardOptions = androidLibraryOptions.proguardOptions,
                consume = { consumerProguardFiles(*it) }
            )
        }

        setLibraryBuildTypes(androidLibraryOptions)
    }
}
```

## Sucesso!

Com essa adaptação, tornamos nossos ajustes mais flexíveis, podendo, por exemplo, habilitar o `Compose` em um módulo específico.

No entanto, ainda há desafios pela frente.

Precisamos encontrar uma maneira de permitir que os módulos definam esses parâmetros.

Uma opção seria aceitar um modelo predefinido, mas no próximo artigo, construiremos juntos uma DSL, buscando uma abordagem mais fluida e idiomática no Kotlin, sem a necessidade de criar objetos em módulos individuais.
