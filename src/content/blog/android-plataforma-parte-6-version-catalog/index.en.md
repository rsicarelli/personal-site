---
title: "Android Plataforma - Parte 6: Version Catalog"
description: "No post anterior, otimizamos nossa plataforma, deixando-a preparada para mais funcionalidades."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 6
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F3b7x5zvcghon1kgq5zxn.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-6-version-catalog-59ob"
  devtoId: 1609535
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/6/version-catalog"
  reactions: 2
---

No post anterior, otimizamos nossa plataforma, deixando-a preparada para mais funcionalidades.

Neste post, vamos configurar os *Version Catalogs* do Gradle, proporcionando uma forma sofisticada de gerenciar nossas dependências.

---

## O que são Version Catalogs?
*Version Catalogs* é uma funcionalidade lançada inicialmente como experimental no Gradle `7.x` e posteriormente estabilizada na versão `8.x`. 

Essencialmente, esse recurso gera um "acessor de projeto", frequentemente nomeado como `libs`. Ele pode ser definido através de uma DSL no `settings.gradle.kts` ou por meio de um arquivo `.toml`. Neste tutorial, optaremos pela abordagem do arquivo `.toml`.

## Passos

**1 -** Acesse a pasta `gradle` no diretório raiz do seu projeto e crie um arquivo nomeado `libs.versions.toml`:
```shell
cd gradle
touch libs.versions.toml
```

**2 -** Edite o arquivo `libs.versions.toml` e defina as dependências do projeto:

```toml
[versions]
composeBom = "2023.09.01"
composeKotlinCompilerExtension = "1.5.3"
androidxCoreKtx = "1.12.0"
androidxLifecycleRuntimeKtx = "2.6.2"
androidxComposeActivity = "1.7.2"
androidBuildTools = "8.1.1"
kotlin = "1.9.10"

[libraries]
androidx-compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { module = "androidx.compose.ui:ui" }
androidx-compose-ui-graphics = { module = "androidx.compose.ui:ui-graphics" }
androidx-compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
androidx-compose-material3 = { module = "androidx.compose.material3:material3" }
androidx-compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
androidx-compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "androidxCoreKtx" }
androidx-lifecycle-runtime-ktx = { module = "androidx.lifecycle:lifecycle-runtime-ktx", version.ref = "androidxLifecycleRuntimeKtx" }
androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "androidxComposeActivity" }

[plugins]
android-application = { id = "com.android.application", version.ref = "androidBuildTools" }
android-library = { id = "com.android.library", version.ref = "androidBuildTools" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
rsicarelli-kplatform = { id = "com.rsicarelli.kplatform" }
```

**3 -** Vá até o arquivo `build-logic > settings.gradle.kts` e integre o nosso `libs.versions.toml`:

```kotlin
// build-logic/settings.gradle.kts

..

dependencyResolutionManagement {
    ..
    versionCatalogs {
        create("libs") {
            // Note que subimos 1 nível de folder, para utilizar a pasta "gradle" da raiz 
            from(files("../gradle/libs.versions.toml"))
        }
    }
}
```

### Notas Importantes:
1. É vital que o `libs.versions.toml` esteja localizado na pasta `gradle` do diretório raiz. Isso garante que tanto o projeto quanto nosso `build-logic` possam acessar esse catálogo.
2. A adição do version catalog no `build-logic > settings.gradle.kts` assegura que o catálogo seja incluído tanto no projeto quanto no `build-logic`.

Mantenha essas observações em mente, pois podem evitar futuros problemas relacionados à localização dos arquivos.

## Utilizando o acessor de projeto `libs`
Após sincronizar o projeto, uma nova classe `libs` estará disponível. Agora, é hora de atualizar todos os `build.gradle.kts` para fazer uso desta classe:

```kotlin
// build.gradle.kts da raiz

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}
```
```kotlin
// app/build.gradle.kts

plugins {
    id(libs.plugins.android.application.get().pluginId)
    kotlin("android")
}
..

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(projects.core.designsystem)
    implementation(projects.features.home)
}
```
```kotlin
// core/designsystem/build.gradle.kts

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}
..

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
// feature/details/build.gradle.kts
// feature/home/build.gradle.kts

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}
..
```
## Atualizando a versão do Compose Compiler
Busque por referências do `kotlinCompilerExtensionVersion` e substitua pelo nosso acessor `libs`:

```kotlin
composeOptions {
    kotlinCompilerExtensionVersion = libs.versions.composeKotlinCompilerExtension.get()
}
```

## Concluído!
Com essas alterações, agora possuímos uma maneira robusta e unificada de gerenciar nossas dependências, seja no projeto ou na plataforma.

No próximo artigo, migraremos nossos scripts do módulo `app` diretamente para nossa plataforma.
