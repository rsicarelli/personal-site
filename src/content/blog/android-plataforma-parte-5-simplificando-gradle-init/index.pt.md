---
title: "Android Plataforma - Parte 5: Simplificando Gradle Init"
description: "No artigo anterior, estabelecemos nossa plataforma com o build-logic e registramos a task greeting no projeto principal."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 5
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fm8snuw8im42ea3ugvnod.png"
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-5-simplificando-gradle-init-1b55"
  devtoId: 1609528
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/5/gradle-init-clean-up"
  reactions: 2
---

No artigo anterior, estabelecemos nossa plataforma com o `build-logic` e registramos a task `greeting` no projeto principal.

Agora, vamos ajustar os arquivos gerados pelo comando `gradle init`.

---

Primeiro, simplificaremos a estrutura das pastas movendo o `src` diretamente para o `build-logic`. Esse passo facilitará os imports em nossos projetos mais para frente.

Para começar, vá até `build-logic` > `build.gradle.kts`. Atualize-o com a coordenada atualizada da classe de implementação e defina um ID mais alinhado ao projeto:

```kotlin
// build-logic/build.gradle.kts

plugins {
    `kotlin-dsl` // `java-gradle-plugin` já está incluído
}

gradlePlugin {
    val greeting by plugins.creating {
        id = "com.rsicarelli.kplatform"
        implementationClass = "com.rsicarelli.KPlatformPlugin"
    }
}
```

Em seguida, otimizaremos nosso `settings.gradle.kts`, delegando a ele a tarefa de declarar os repositórios:

```kotlin
// build-logic/settings.gradle.kts

rootProject.name = "build-logic"

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}
```

Por fim, empregaremos nosso novo ID no `build.gradle.kts` do projeto principal:

```kotlin
// build.gradle.kts principal
plugins {
    ..
    id("com.rsicarelli.kplatform")
}
```

## Concluído!
Após sincronizar tudo, a task `greeting` ainda deve estar registrada em seu projeto.

No próximo artigo, potencializaremos nossa plataforma com uma característica poderosa do Gradle: os Catálogos de Versões (Version Catalogs).
