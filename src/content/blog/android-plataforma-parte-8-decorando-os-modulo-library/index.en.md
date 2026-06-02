---
title: "Android Plataforma - Parte 8: Decorando os módulos 'library'"
description: "No último post, apresentamos a primeira decoração na Plataforma e fizemos toda a configuração do nosso módulo app usando Kotlin DSL."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 8
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F9jgi6gklng4hp7izrvot.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-8-decorando-os-modulo-library-4mm0"
  devtoId: 1610075
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/8/decorating-android-library"
  reactions: 3
---

No último post, apresentamos a primeira decoração na Plataforma e fizemos toda a configuração do nosso módulo app usando Kotlin DSL.

Agora, vamos estender essa configuração para os módulos designsystem, home e details.

Adotaremos exatamente a mesma estratégia para essa decoração:

1. Expor e implementar a função `internal fun applyAndroidLibrary()` no arquivo `decorations/android.kt`.
2. Tornar nossa API acessível para os demais módulos no arquivo `KPlatformPlugin.kt` através da função `fun androidLibrary()`.
3. Substituir as configurações do módulo por essa nova função.

---

## Passo a passo
**1 -** Crie uma nova função `internal fun applyAndroidLibrary()` em `build-logic/decorations`. Em seguida, recupere as extensões registradas no `Project` para configurar o `LibraryExtension`:

```kotlin
import com.android.build.api.dsl.LibraryExtension
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidLibrary() {
    extensions.configure<LibraryExtension> {
        
    }
}
```

**2 -** Transfira o conteúdo do bloco `android {}` de qualquer módulo (`designsystem`, `home`, `details`) para a configuração do `LibraryExtension`.

Neste passo, vamos também reutilizar o `applyKotlinOptions()` da solução anterior e a configuração do compilador Compose:

```kotlin
import com.android.build.api.dsl.LibraryExtension
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidLibrary() {
    extensions.configure<LibraryExtension> {
        namespace = "com.rsicarelli.kplatform"
        compileSdk = 34

        defaultConfig {
            minSdk = 24
            targetSdk = 34

            vectorDrawables {
                useSupportLibrary = true
            }
        }

        buildTypes {
            release {
                isMinifyEnabled = false
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
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
}
```
**3 -** É hora de tornar esta decoração acessível aos nossos projetos. No `KPlatformPlugin.kt`, declare a função `fun androidLibrary()`:

```kotlin
import com.rsicarelli.kplatform.decorations.applyAndroidApp
import com.rsicarelli.kplatform.decorations.applyAndroidLibrary
import org.gradle.api.Plugin
import org.gradle.api.Project

class KplatformPlugin : Plugin<Project> {

    override fun apply(project: Project) = Unit
}

fun Project.androidApp() = applyAndroidApp()

fun Project.androidLibrary() = applyAndroidLibrary()
```

**4 -** Sincronize o projeto. Depois, acesse cada `build.gradle.kts` dos módulos e aplique a decoração `androidLibrary()`:

```kotlin
// core/designsystem/build.gradle.kts

import com.rsicarelli.kplatform.androidLibrary

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    api(libs.androidx.compose.ui)
    api(libs.androidx.compose.ui.graphics)
    api(libs.androidx.compose.ui.tooling.preview)
    api(libs.androidx.compose.material3)
    debugApi(libs.androidx.compose.ui.tooling)
    debugApi(libs.androidx.compose.ui.test.manifest)
}
```
```kotlin
// features/home/build.gradle.kts

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(projects.core.designsystem)
    implementation(projects.features.details)
}
```
```kotlin
// features/details/build.gradle.kts

import com.rsicarelli.kplatform.androidLibrary

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(projects.core.designsystem)
}
```

## Sucesso!
E aí, o que achou dessa mudança? Olha a quantidade de código e repetição que conseguimos reduzir!

Com isso, a escalabilidade dos nossos módulos em desenvolvimentos futuros se torna muito mais viável.

No entanto, ainda existem oportunidades significativas para otimização e robustez na nossa plataforma.

No próximo post, vamos analisar o código redundante nas funções `applyAndroidApp()` e `applyAndroidLibrary()`. Além disso, exploraremos mais sobre `ApplicationExtension` e `LibraryExtension`.
