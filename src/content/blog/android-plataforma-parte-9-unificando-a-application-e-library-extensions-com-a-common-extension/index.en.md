---
title: 'Android Plataforma - Parte 9: Unificando a Application e Library extensions com a Common Extension'
description: 'No último post, conseguimos extrair a lógica de configuração de nossos módulos library/biblioteca.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 9
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fizahj8mbp4vfocjlzu36.png'
translated: false
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-9-unificando-a-application-e-library-extensions-com-a-common-extension-19gc'
  devtoId: 1610109
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/9/android-commons-extension'
  reactions: 3
---

No último post, conseguimos extrair a lógica de configuração de nossos módulos library/biblioteca.

Mas, notamos que houve muita duplicação de código, além de não ter uma "fonte da verdade" para partes cruciais, por exemplo configurações de sdk.

Nesse post, iremos entender como unificar essas duas partes em comum, falar sobre a `ApplicationExtension`, `LibraryExtension` e `CommonExtension` e ter uma função que aplique as configurações comuns para qualquer tipo de módulo Android.

---

## Extensions do Android Gradle Plugin (AGP)

No universo do desenvolvimento Android, o Google nos presenteia com uma DSL consistente e poderosa dentro dos nossos arquivos `build.gradle.kts`.

No entanto, quando começamos a utilizar essas extensões em nossa plataforma, percebemos que há várias features "pequenas" que, embora sutis, têm o poder de redefinir como configuramos nossos módulos.

### ApplicationExtension

A porta de entrada para desenvolvimendo Android, é a extensão `android { }` no `build.gradle.kts`.

Esta extensão é, na verdade, uma representação da `ApplicationExtension` quando o plugin `com.android.application` está aplicado.

A `ApplicationExtension` é uma extensão específica do Android Gradle Plugin para a configuração de diversos aspectos de um projeto Android.

Adicionalmente, ela herda características de outras extensões, como `CommonExtension`, `ApkExtension` e `TestedExtension`, ampliando suas capacidades.

```kotlin
interface ApplicationExtension :
    CommonExtension<
            ApplicationBuildFeatures,
            ApplicationBuildType,
            ApplicationDefaultConfig,
            ApplicationProductFlavor,
            ApplicationAndroidResources>,
    ApkExtension,
    TestedExtension { }
```

### LibraryExtension

Na criação de bibliotecas Android, a extensão `android` assume uma forma distinta.

Ela é uma representação da `LibraryExtension` quando o plugin `com.android.library` está aplicado.

A `LibraryExtension` é específica para o plugin de biblioteca Android e fornece meios para configurar e personalizar uma biblioteca Android, diferenciando-se dos projetos de aplicativos.

Além disso, ela tmbém herda características da `CommonExtension` e `TestedExtension`, disponibilizando várias configurações e opções comuns a todos os tipos de projetos Android.

```kotlin
interface LibraryExtension :
    CommonExtension<
        LibraryBuildFeatures,
        LibraryBuildType,
        LibraryDefaultConfig,
        LibraryProductFlavor,
        LibraryAndroidResources>,
    TestedExtension { }
```

### CommonExtension

Esta extensão serve como base para configurações compartilhadas entre diferentes tipos de projetos Android, como aplicativos, bibliotecas e testes instrumentados.

`CommonExtension` não é apenas uma extensão. É uma interface genérica que define um conjunto de propriedades e métodos comuns a todos os projetos Android. Isso significa que ela estabelece um contrato de propriedades e métodos que devem estar disponíveis para qualquer extensão que dela herde.

```kotlin
interface CommonExtension<
        BuildFeaturesT : BuildFeatures,
        BuildTypeT : BuildType,
        DefaultConfigT : DefaultConfig,
        ProductFlavorT : ProductFlavor,
        AndroidResourcesT : AndroidResources> {}
```

#### Por que é tão poderosa?

Em vez de definir configurações específicas para cada tipo de projeto (aplicativo, biblioteca, etc.) separadamente, pode-se confiar que certas configurações serão consistentes e compartilhadas entre os módulos.

Isso não só reduz a complexidade mas também diminui a probabilidade de erros de configuração. Por exemplo, ao definir uma configuração de compilação comum para todos os módulos Android, fazendo isso através da `CommonExtension` garante-se que essa configuração seja aplicada de forma uniforme a todos.

Quando extensões específicas, como `ApplicationExtension` ou `LibraryExtension`, são criadas, elas implementam a `CommonExtension`, herdando todas as suas características.

Assim, qualquer propriedade ou método definido em `CommonExtension` estará automaticamente disponível para qualquer outra extensão que dela herde. Isso assegura uma estrutura de base comum e consistente em todos os projetos Android.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f4zpffe6luk77ineskff.png)

## Extraíndo decorações comuns utilizando a `CommonExtensions`

**1 -** Dentro do arquivo `build-logic/decorations/android.kt`, crie o seguinte atributo:

```kotlin
import com.android.build.api.dsl.ApplicationExtension
import com.android.build.api.dsl.CommonExtension
import com.android.build.api.dsl.LibraryExtension
import org.gradle.api.Project
import org.gradle.kotlin.dsl.findByType

private val Project.commonExtension: CommonExtension<*, *, *, *, *>
    get() = extensions.findByType<ApplicationExtension>()
        ?: extensions.findByType<LibraryExtension>()
        ?: error("Android plugin not applied")
```

Essa função irá se encarregar de se utilizar de uma das extensões `ApplicationExtension` ou `LibraryExtension` e utilizar da herança para retornar o tipo `CommonExtension<*, *, *, *, *>`

**2 -** Vamos criar uma função `private fun applyAndroidCommon()` e utilizar essa nosso novo atributo:

```kotlin
private fun Project.applyAndroidCommon() =
    with(commonExtension) {
      // this é CommonExtension<*, *, *, *, *>
    }
```

**3 -** Vamos trazer tudo que é compartilhado para dentro dessa função. Resultado final fica assim:

```kotlin
private fun Project.applyAndroidCommon() =
    with(commonExtension) {
        namespace = "com.rsicarelli.kplatform"
        compileSdk = 34

        defaultConfig {
            minSdk = 24

            vectorDrawables {
                useSupportLibrary = true
            }
        }

        compileOptions {
            sourceCompatibility = JavaVersion.VERSION_17
            targetCompatibility = JavaVersion.VERSION_17
        }

        applyKotlinOptions()

        buildFeatures {
            compose = true
        }

        composeOptions {
            kotlinCompilerExtensionVersion = libs.version("composeKotlinCompilerExtension")
        }

        packaging {
            resources {
                excludes += "/META-INF/{AL2.0,LGPL2.1}"
            }
        }
    }
```

**4 -** Vamos atualizar nossa `applyAndroidApp()`, mantendo as configurações específicas do `ApplicationExtension`, como `applicationId`, etc:

```kotlin
internal fun Project.applyAndroidApp() {
    applyAndroidCommon()

    extensions.configure<ApplicationExtension> {
        defaultConfig {
            applicationId = "com.rsicarelli.kplatform"
            targetSdk = 34
            versionCode = 1
            versionName = "1.0"
        }

        buildTypes {
            release {
                isMinifyEnabled = false
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            }
        }
    }
}
```

**5 -** Vamos fazer o mesmo com a `applyAndroidLibrary()`:

```kotlin
internal fun Project.applyAndroidLibrary() {
    applyAndroidCommon()

    extensions.configure<LibraryExtension> {
        buildTypes {
            release {
                isMinifyEnabled = false
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            }
        }
    }
}
```

> Note que a função `buildTypes` está disponível na `CommonExtensions`, mas a função `release` não está. Por hora, vamos duplicar essa parte, que será abordada no próximo artigo

## Sucesso!

Conseguimos dar um grande passo compartilhando os comportamentos utilizando `CommonExtension`.
