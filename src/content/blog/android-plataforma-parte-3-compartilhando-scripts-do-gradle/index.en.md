---
title: "Android Plataforma - Parte 3: Compartilhando scripts do Gradle"
description: "No artigo anterior, entendemos quais os desafios que um projeto multi-modular traz: a da manutenção e reutilização dos arquivos do Gradle. Vamos entender…"
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 3
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fv0zw6o1nmtk9vblrb5zq.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-3-compartilhando-scripts-do-gradle-5ak3"
  devtoId: 1609504
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/3-4/composite-build"
  reactions: 6
---

No artigo anterior, entendemos quais os desafios que um projeto multi-modular traz: a da manutenção e reutilização dos arquivos do Gradle. Vamos entender melhor como resolver esse problema analisando dois conceitos: o `buildSrc` e os **Composite Builds**.

---

## Entendendo o buildSrc

O `buildSrc` é uma convenção especial do Gradle para organizar e encapsular código que precisa ser compartilhado entre vários arquivos do Gradle. Em termos simples, `buildSrc` é um projeto Gradle dentro do seu projeto principal.

- Quando o Gradle detecta a presença de um diretório chamado `buildSrc`, ele o trata como um projeto Gradle autônomo.
- Isso significa que o `buildSrc` pode ter seu próprio `build.gradle`, suas próprias dependências e até seus próprios testes.
- A grande característica mágica do `buildSrc` é que, ao iniciar o build do projeto, o Gradle primeiro compila e constrói o `buildSrc`.

Todos os artefatos gerados (classes, recursos, etc.) pelo `buildSrc` são então adicionados ao classpath dos arquivos do Gradle do projeto, possibilitando que você referencie e use essas classes diretamente nesses arquivos Gradle sem nenhuma configuração adicional.


![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fpupqlqr1nhyumiwau5d.png)

Infelizmente, todos esses recursos incríveis vêm com um grande inconveniente: qualquer alteração dentro do `buildSrc` invalida completamente o cache de compilação. Esse comportamento pode ser especialmente problemático para projetos maiores, uma vez que invalidar o cache implica em recompilações frequentes, aumentando consideravelmente o tempo de build.


![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lpkfn0h6fei2mzv38eyl.png)


## Composite Builds

Enquanto o `buildSrc` serve como uma convenção para encapsular código compartilhado, os **Composite Builds** representam uma abordagem que permite combinar diversos projetos Gradle de forma independente, porém integrada.

Imagine vários projetos Gradle como veículos autônomos, cada um com sua finalidade e características. Os **Composite Builds** são como um caminhão-cegonha, transportando cada "veículo" ou projeto de forma coesa, mas sem tirar a individualidade de cada um.

### Funcionamento

Em um projeto multi-módulo convencional, os subprojetos compartilham configurações definidas pelos arquivos `build.gradle.kts` e `settings.gradle.kts` na raiz. Contudo, o Gradle permite incorporar outro projeto, construindo-o de forma autônoma, mas com configuração integrada. Cada projeto inserido tem seus próprios arquivos `build.gradle.kts` e `settings.gradle.kts`.

Essa característica o torna o candidato ideal para lidar com bibliotecas externas, ou componentes do projeto que operam de forma indepente. Nos últimos anos, essa prática vem se tornando cada vez mais comúm em grandes repositórios open source, como o `android/nowinandroid`, `chrisbanes/tivi`, `signalapp/Signal-Android`, `slackhq/slack-gradle-plugin`, etc.

### Composite Build vs. buildSrc

A principal vantagem dos **Composite Builds** é a forma como lidam com a configuração. Ao separarmos nossa lógica da pasta `buildSrc`, evitamos que mudanças internas provoquem a constante invalidação do build cache. Isso se deve ao fato de o Gradle tratar o código do **Composite Build** como uma dependência externa, semelhante a plugins externos, como o Android Gradle Plugin. Essa abordagem otimiza as verificações de entrada e saída das tarefas, garantindo um uso mais eficiente do cache.

A eficiência dos **Composite Builds** é claramente vista na maneira como eles gerenciam o cache. Quando uma task do Gradle utiliza resultados salvos no cache, o status "FROM-CACHE" é exibido, economizando tempo ao evitar reconstruções desnecessárias.

Porém, é importante entender que esse mecanismo do cache é um conceito diferente dos "builds incrementais". Em um build incremental, se uma tarefa não detecta mudanças desde sua última execução, ela exibe o status "UP-TO-DATE", indicando que nada foi refeito.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8kp0uexg5vptttshf0g1.png)

## Criando nossa plataforma utilizando Composite Builds

No decorrer dos artigos, iremos criar nossa plataforma utlizando os **Composite Builds** do Gradle, e incrementalmente adicionar outras funcionalidades até termos uma plataforma "robusta".
