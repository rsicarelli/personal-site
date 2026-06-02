---
title: "Android Plataforma - Parte 2: Início do Projeto"
description: "Neste post, vamos explorar um projeto inicial, entender os desafios de manter os arquivos build.gradle.kts e descobrir como o conceito de Composite…"
summary: "Neste post, vamos explorar um projeto inicial, entender os desafios de manter os arquivos build.gradle.kts e descobrir como o conceito de Composite Builds do Gradle pode auxiliar nessa jornada."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 2
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F40ckwb99i0qotfyr6zb8.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-2-inicio-do-projeto-34jg"
  devtoId: 1609493
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/1-2/introduction"
  reactions: 4
---

---

Iniciaremos a partir de um projeto simples, gerado a partir de um template padrão do IntelliJ, ao qual foram adicionados alguns módulos:


![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mx1hv2uvq4pa5oqglvj2.png)


- **app**: Atua como o ponto central do aplicativo, contendo a MainActivity.
- **core:designsystem**: Define os principais elementos visuais, como tema, cores, tipografia e ícones do projeto.
- **features:home**: Representa a primeira tela de interação, exibindo o conteúdo do módulo details.
- **features:details**: Apresenta uma mensagem textual na interface.


![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/oasfibiiy8z36dtjytfs.png)



## Problema a ser solucionado

Dê uma olhada nos arquivos Gradle de cada módulo:

- [app/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/app/build.gradle.kts)
- [core/designsystem/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/core/designsystem/build.gradle.kts)
- [features/home/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/features/home/build.gradle.kts)
- [features/details/build.gradle.kts](https://github.com/rsicarelli/kplatform/blob/main/features/details/build.gradle.kts)

É possível perceber uma redundância: embora os módulos apliquem configurações semelhantes utilizando a extensão `android {}`, as suas dependências são diferentes.

Nosso objetivo inicial é estabelecer uma padronização nesses scripts, permitindo sua reutilização e simplificando a manutenção.

## Utilizando Composite Builds do Gradle

Ao enfrentarmos desafios de gestão e manutenção de múltiplos módulos no Gradle, uma solução eficaz é o recurso **Composite Builds**. Esse recurso nos permite combinar múltiplos builds independentes em um só, facilitando a padronização e reutilização de scripts.

Nos próximos tópicos, mergulharemos mais profundamente no funcionamento dos composite builds, como configurá-los e como integrá-los ao seu projeto existente.
