---
title: "Android Plataforma - Parte 1: Modularização"
description: "A eficiência no desenvolvimento de software é essencial nos projetos atuais. Neste artigo, discutiremos a modularização em projetos Kotlin/Android, o…"
summary: "A eficiência no desenvolvimento de software é essencial nos projetos atuais. Neste artigo, discutiremos a modularização em projetos Kotlin/Android, o papel vital do Gradle para otimizar compilações e os desafios de gerir múltiplos módulos."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 1
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fvih5nd062eyxjjo6l50n.png"
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-1-modularizacao-2016"
  devtoId: 1609438
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/1-2/introduction"
  reactions: 6
---

Para lidar com essa complexidade, apresentaremos o conceito de "plataforma" em desenvolvimento, ilustrando como uma plataforma estruturada pode simplificar a gestão de dependências e configurações.

---

## O que é modularização?

Pense em um guarda-roupas: se todas as peças estiverem misturadas, localizar um item específico pode ser demorado.

No entanto, se estiver organizado, com uma divisão clara para camisetas, calças e outros, tudo fica mais acessível.

Isso é similar à modularização em Kotlin. Segmentamos o código em "módulos", onde cada um tem responsabilidades específicas. Esse agrupamento facilita a manutenção, reutilização e colaboração no projeto.

## Modularização vs pastas

Apenas agrupar o código em pastas não é o mesmo que modularizar. Em grandes módulos, alterações pequenas levam à recompilação de todo o módulo. 

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4bbq7yrajidhu3ffjh5b.png)

Já com módulos menores, apenas a seção alterada é recompilada, tornando compilações mais eficientes.

## Gradle em ação

No contexto de Kotlin, o Gradle é indispensável. Ele detecta módulos alterados e recompila apenas essas partes. O resultado? Compilações mais rápidas e um processo de desenvolvimento mais ágil.

Um diagrama representando uma versão super simplificada desse processo:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qpnc33x56e705gtn3p2h.png)

Em projetos pequenos, a modularização pode parecer desnecessária. Mas, à medida que o código cresce, ela otimiza tempo e recursos. Assim, em grandes projetos, a modularização se torna vital.

## Manutenção dos módulos

Modularizar em Kotlin vai além da arquitetura; envolve a interação com ferramentas como o Gradle. E surgem desafios, como manter a consistência dos arquivos `build.gradle.kts`. Além disso, é essencial garantir que as configurações de cada módulo sejam corretamente aplicadas.

## Conceito de "Plataforma"

Em software, "plataforma" refere-se a um conjunto de ferramentas e especificações que facilitam o desenvolvimento. No cenário do Gradle, criar uma "plataforma" ajuda a padronizar módulos, simplificando a gestão de dependências e configurações.

## Criando uma plataforma para seu projeto Android

Ao longo desta série, construiremos uma plataforma passo a passo, adicionando funcionalidades, visando uma solução flexível. Assim, será como montar blocos de lego, aplicando plugins que coordenam seu projeto.
