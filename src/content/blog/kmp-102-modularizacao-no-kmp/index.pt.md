---
title: 'KMP-102 - Modularização no KMP'
description: 'No último artigo, entramos em detalhes e aprendemos sobre as peculiaridades do código exportado nos headers do Objective-C, assim como as boas práticas…'
summary: 'No último artigo, entramos em detalhes e aprendemos sobre as peculiaridades do código exportado nos headers do Objective-C, assim como as boas práticas quanto ao que exportar.'
pubDate: 2025-03-07
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-102'
seriesOrder: 5
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-modularizacao-no-kmp-4oe5'
  devtoId: 2317222
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 23
topic: kmp
difficulty: intermediate
contentType: tutorial
---

Neste artigo, vamos entender melhor o comportamento da modularização em projetos KMP, e como isso pode ser feito de forma eficiente e organizada.

---

- [O que é modularização?](#o-que-é-modularização)
- [Modularização no KMP](#modularização-no-kmp)
- [Pavimentando flexibilidade da UI](#pavimentando-flexibilidade-da-ui)
- [Exportando para o XCFramework](#exportando-para-o-xcframework)
  - [Cenário 1: "backend" KMP compartilhado, "frontend" flexível](#cenário-1-backend-kmp-compartilhado-frontend-flexível)
  - [Cenário 2: Híbrido, migrando para Compose Multiplatform](#cenário-2-híbrido-migrando-para-compose-multiplatform)
  - [Cenário 3: 100% Compose Multiplatform](#cenário-3-100-compose-multiplatform)
- [Explorando os benefícios da modularização no KMP](#explorando-os-benefícios-da-modularização-no-kmp)
- [Conclusão](#conclusão)

---

## O que é modularização?

Não irei me alongar muito neste tópico, pois já abordamos esse assunto no [Android Plataforma - Parte 1: Modularização](https://dev.to/rsicarelli/android-plataforma-parte-1-modularizacao-2016). Se você não tem certeza do que é modularização em projetos Gradle, recomendo uma pausa para a leitura do artigo.

Em resumo, modularização é a prática de dividir um projeto em módulos menores e independentes, que podem ser desenvolvidos, testados e mantidos separadamente.

Essa prática é crucial para escalar projetos KMP, já que a modularização impacta diretamente na autonomia e independência dos times, evitando que um time dependa do outro para realizar suas tarefas.

## Modularização no KMP

No KMP, a modularização é feita por meio de módulos compartilhados, que são responsáveis por compartilhar código entre as plataformas.

Vamos elaborar uma estrutura de módulos que respeite a separação de responsabilidades e possibilite a reutilização de código de forma eficiente entre módulos. Nosso contexto aqui considera uma aplicação que irá escalar, no sentido de ter mais features e mais plataformas:

![](https://media.rsicarelli.com/blog/kmp-102/shared/kmp-modularization-pt1.png)

Essa estrutura segue algumas ideias do Domain Driven Design (DDD), em que cada módulo representa um domínio independente e isolado da aplicação. Não irei entrar em muitos detalhes sobre o DDD, mas recomendo a leitura do livro [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://www.amazon.com.br/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215/ref=sr_1_1?dib=eyJ2IjoiMSJ9.Lo7-Md3VvIV38Rzn-ytmnX1FyJz_hHxG_c3ocyge7LEEkMf9J0QQUC_vNRqM-bly1FEW6JDWiQjxRiR4Ip4uOSi5BDadwwQLRq-qGmgXmoG36NnUp66mVBVEOL-xFpHChmTWdyWDB5EZGboxu2dOIVTrzRS54KI4S6rDRsLLLoSAkU9bCl81j0cePEicQvqB.QPWgwg7lUfTottKjOov5grb2CciIICVV12MWxs8bueA&dib_tag=se&keywords=Domain-Driven-Design-Tackling-Complexity-Software&qid=1739362218&sr=8-1&ufe=app_do%3Aamzn1.fos.4bddec23-2dcf-4403-8597-e1a02442043d) para entender melhor sobre o assunto.

Com essa estrutura, conseguimos:

- Permitir escalar de forma eficiente sem duplicação de código. Ao criar uma nova feature, basta criar um novo módulo e adicionar as dependências necessárias.
- Ter granularidade no que será exportado para as outras plataformas, especialmente para o XCFramework.
- Ter independência de domínio para times específicos, evitando conflitos de código e responsabilidades. Por exemplo, times podem criar um `CODEOWNER` para um módulo específico, e serem responsáveis por manter e evoluir esse módulo.

## Pavimentando flexibilidade da UI

Um dos superpoderes do KMP é permitir compartilhar muito ou pouco código. Essa habilidade implica que podemos escolher qual UI iremos utilizar em cada plataforma. Dependendo da sua estratégia de construção de UI, você precisará de uma abordagem específica de módulos para criar essa flexibilidade.

Vamos pensar que cada feature pode ser separada em um "frontend" e "backend". Seguindo o padrão de arquitetura MVVM, o "frontend" seria a nossa UI (Compose, SwiftUI) e o "backend" seria a nossa lógica de negócio (ViewModel/UiModel + Domain + Data). Ou seja, partes da camada de apresentação podem ser compartilhadas, mas damos a liberdade para cada plataforma de escolher a sua UI.

Com isso em mente, uma abordagem que pode ser utilizada é a seguinte:

![](https://media.rsicarelli.com/blog/kmp-102/shared/kmp-modularization-pt2.png)

Aqui, nós separamos cada feature que possui uma tela em 3 módulos:

- `common`, nosso "backend" que contém a lógica de negócio da feature.
- `android-ui`, nosso "frontend" apenas em Android, que contém a UI da feature.
- `common-ui`, nosso "frontend" multiplataforma, que contém a UI da feature compartilhada entre as plataformas.

Com essa abordagem, é possível:

- Iniciar migrações de telas em SwiftUI de forma gradual, sem a necessidade de migrar toda a feature de uma vez.
- Ter flexibilidade para migrar features Jetpack Compose (apenas Android) enquanto se compartilha o "backend" com outras plataformas.
- Ter flexibilidade para iniciar telas em Compose Multiplatform (Android, iOS, Desktop, ...) enquanto se compartilha o "backend" com outras plataformas.

## Exportando para o XCFramework

Agora que exploramos um modelo de modularização que permite flexibilidade na escolha da UI, podemos avançar e exportar nosso código Kotlin para o XCFramework.

Para utilizar nosso código Kotlin no iOS, precisamos de um módulo que represente nosso XCFramework. Esse é um módulo "cola", ou seja, um módulo que agrega vários módulos que serão exportados para o XCFramework.

Esse módulo não será utilizado diretamente pelo app Android ou outras plataformas, mas representará nossa exportação para o iOS. Esse módulo é comumente chamado de `ios-interop`.

Para exemplificar o poder da modularização e a flexibilidade do KMP, vamos explorar alguns cenários de compartilhamento:

### Cenário 1: "backend" KMP compartilhado, "frontend" flexível

Neste cenário, temos um módulo `common` que contém a lógica de negócio da feature. O módulo `android-ui` contém a UI da feature apenas para Android e é utilizado pelo app Android.

Características desse modelo:

1. A lógica de negócio é compartilhada entre as plataformas
2. A UI é específica para Android usando Jetpack Compose
3. A UI não é compartilhada entre as plataformas
4. No iOS, a lógica de negócio é utilizada, mas a UI é específica para iOS com SwiftUI
5. Modelo ideal para projetos que buscam migrar para Compose gradualmente ou que pretendem manter a UI específica por plataforma

![](https://media.rsicarelli.com/blog/kmp-102/shared/kmp-modularization-scenario-1.png)

### Cenário 2: Híbrido, migrando para Compose Multiplatform

Neste cenário, temos um módulo `common` que contém a lógica de negócio da feature. O módulo `common-ui` contém a UI da feature compartilhada entre as plataformas.

Aqui, inicia-se a migração para Compose Multiplatform, enquanto mantemos a feature `android-ui` específica para Android.

Características desse modelo:

1. Lógica de negócio compartilhada entre as plataformas
2. Parte da UI compartilhada entre as plataformas
3. No `android-ui`, componentes de UI específicos para Android usando Jetpack Compose
4. No `common-ui`, componentes de UI compartilhados usando Compose Multiplatform
5. Modelo ideal para iniciar migração para Compose Multiplatform com migração gradual da UI

![](https://media.rsicarelli.com/blog/kmp-102/shared/kmp-modularization-scenario-2.png)

### Cenário 3: 100% Compose Multiplatform

Neste cenário, temos um módulo `common` que contém a lógica de negócio da feature. O módulo `common-ui` contém a UI da feature compartilhada entre as plataformas.

Aqui, não há distinção por plataforma - toda a UI é compartilhada usando Compose Multiplatform.

Características desse modelo:

1. Lógica de negócio compartilhada entre as plataformas
2. UI totalmente compartilhada por meio do Compose Multiplatform
3. Modelo ideal para projetos com UI unificada entre todas as plataformas

![](https://media.rsicarelli.com/blog/kmp-102/shared/kmp-modularization-scenario-3.png)

## Explorando os benefícios da modularização no KMP

Como vocês puderam ver, a modularização no KMP é uma prática essencial para escalar projetos de forma eficiente e organizada.

Mas há um ponto crucial que quero destacar: a modularização ajuda a ter granularidade no que queremos exportar para o XCFramework, mais especificamente, para os headers do Objective-C.

Como vimos no último post, [KMP-102 - Otimizando a Exportação do Kotlin para o Obj-c/Swift](https://dev.to/rsicarelli/kmp-102-otimizando-a-exportacao-do-kotlin-para-o-obj-cswift-358p), ser seletivo com o código que exportamos para os headers do Objective-C está diretamente ligado à eficiência do tempo de build (ou seja, compilações do XCFramework mais eficientes).

Por exemplo:

- No **Modelo 1**, garantimos que apenas o `login:common` seja exposto nos headers do Objective-C, enquanto evitamos que qualquer parte do `android-ui` seja exposta.
- No **Modelo 3**, garantimos que nada do "backend" da jornada seja exposto nos headers, apenas o "frontend" multiplataforma.

Essa estratégia é fundamental para a saúde e evolução do repositório, e garante que DEVs KMP possam consumir o XCFramework de forma eficiente e sem conflitos de dependências.

## Conclusão

Neste artigo, exploramos a modularização no KMP e como isso pode ser feito de forma eficiente e organizada. Aprendemos como essa prática pode ser utilizada para escalar projetos e obtivemos uma prévia de como isso impacta diretamente na autonomia e independência dos times.

Geralmente, em exemplos KMP básicos, temos apenas um módulo `shared`. Porém, em cenários reais - onde projetos precisam escalar e adotar estratégias de UI flexíveis - a complexidade é muito maior.

A modularização é uma peça-chave para o sucesso de projetos KMP, e é crucial que seja implementada de forma estruturada e organizada!

No próximo artigo, vamos explorar estratégias de construção do XCFramework em projetos existentes, garantindo autonomia e independência para os times.

Até a próxima!
