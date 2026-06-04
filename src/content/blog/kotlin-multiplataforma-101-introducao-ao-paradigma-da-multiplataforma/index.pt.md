---
title: 'KMP 101: Introdução ao paradigma da Multiplataforma'
description: 'Usamos diariamente uma variedade de aplicativos em dispositivos como celulares, relógios, TVs e computadores, inseridos em um amplo ecossistema digital.'
summary: 'Usamos diariamente uma variedade de aplicativos em dispositivos como celulares, relógios, TVs e computadores, inseridos em um amplo ecossistema digital.'
pubDate: 2023-11-14
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 1
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-multiplataforma-101-introducao-ao-paradigma-da-multiplataforma-eo3'
  devtoId: 1662061
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 18
topic: kmp
difficulty: beginner
contentType: tutorial
---

Essa diversidade de plataformas exige estratégias de desenvolvimento que proporcionem atualizações simultâneas e experiências de usuário uniformes.

Neste artigo, exploraremos o [Kotlin Multiplataforma (KMP)](https://kotlinlang.org/docs/multiplatform.html) e como ele se compara com outras tecnologias cross-plataforma, como React Native e Flutter. Discutiremos as vantagens e desafios dessas abordagens, oferecendo visões úteis para devs que buscam soluções eficientes para desenvolvimento multiplataforma.

---

## O que é desenvolver "nativo"?

Desenvolvimento nativo é a criação de aplicativos feitos para operar especificamente em uma plataforma, como Android, iOS, desktop, web, tirando proveito de todas as suas capacidades.

Aplicativos nativos se integram perfeitamente com o hardware e seguem as diretrizes de design da plataforma, resultando em interfaces responsivas e acesso imediato às últimas atualizações do sistema.

Para cada plataforma, os fabricantes fornecem um SDK (Kit de Desenvolvimento de Software) que facilita a criação de aplicações dedicadas.

Contudo, o desenvolvimento nativo implica desafios, como:

- Necessidade de se adaptar a diferentes ambientes e linguagens
- Gerenciar múltiplas base de código
- Lidar com a fragmentação de dispositivos, como tamanhos de tela e versões de sistema variados
- Requer atenção constante a novas atualizações dos sistemas operacionais
- Retrocompatibilidade para garantir o funcionamento em versões antigas

A complexidade aumenta com a necessidade de dominar ferramentas e APIs específicas, resultando em uma manutenção mais trabalhosa.

[🔗 Versão interativa](https://mermaid.live/edit#pako:eNp1U9Fu2jAU_ZUr79UgEiCk0VSJEtKHddK0VtrUpA8mdsCQxJbjFFrKx1R72NOe9gn5sToJDMpUK7Jyr8-5Pj6-3qJYUIY8NFdELuDOj3IwoyhnbSJC5mtz7_JEMWJBGKFJ9ZfyuYBE5JoBJUBkymNS_a5-iQg9HKn1GIcHeNDCBdyKRK9NtTPkJPzO4lIVojhZYDn9QIpdSwmYUiRjuSZFU9n_8p-Aq3AiMslTQoXCcMPzFVNnED-cZpLEQteYczp0Opcv45wqwWm9Af48U5fws_YQA9PxC0zD6cYo19XrI0thxvPqVXHxUBPBPzvKMRyH_3xokFfHJb9JBOG3WhMDnxda8VlZ_TH1T-QFjTQiVxg2RGJohBEp97KuwxuxrH1hMG4uSPPHd962_GduCGtSZAfadfiDzU5gkwYm8zmGpTTTJkv3ey0Lke9ZH1kYp6QofJY0VwYJT1MPPo2CoR0EGGKRCmXiJEkwmDOKFTNRv98_RJ01p3rhgSU3ZyXbbsRtI9Rzu248RhhlTGWEU9Pi2zodIb1gGYuQZ34pUau6vXcGR0otbp_yGHlalQyjUlKimc-J6bLskJQkvxfiNETeFm2QZ18Mu8Oea_fcgeNYjm1koyfkuU53MHBc1-n1rIvRyN1h9Nzwe13Xsob2sO8YuD1yLAsjRrkW6mv7HptnuXsDt5gXKQ)

![Desenvolvimento nativo](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091436.png?raw=true)

> [🔗 Decision framework for mobile development](https://www.researchgate.net/publication/314165913_Decision_Framework_for_Mobile_Development_Methods)

## Introduzindo frameworks cross-plataforma

Frameworks cross-plataforma como React Native e Flutter apresentam um SDK próprio, que pode atuar como uma camada adicional sobre o SDK nativo.

É inegável a ascensão dessa solução no ecossistema de aplicativos. Usando dados do Flutter:

- Em **2021**, Flutter representava 3.2% do total, contando com mais de **150.000 dos 4,67 milhões** de aplicativos na Play Store [[1](https://developers.googleblog.com/2021/03/announcing-flutter-2.html), [2](https://www.statista.com/statistics/289418/number-of-available-apps-in-the-google-play-store-quarter/)].

![Flutter Play Store 2021](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091647.png?raw=true)

- No terceiro trimestre de **2022**, Flutter representava cerca de 14.1% contando com mais de **500.000 dos 3,55 milhões** aplicativos publicados na Play Store [[1](https://techcrunch.com/2023/05/10/with-over-1m-published-apps-googles-flutter-expands-its-support-for-web-apps-and-webassembly/?guccounter=1#:~:text=Google%20also%20noted%20that%20there,adopt%20Flutter%20in%20existing%20projects.), [2](https://www.statista.com/statistics/289418/number-of-available-apps-in-the-google-play-store-quarter/#:~:text=Google%20Play%3A%20number%20of%20available%20apps%20as%20of%20Q3%202022)].

![Flutter Play Store 2022](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091703.png?raw=true)

- Em novembro de **2023**, Flutter conta com cerca de 35% contando com **1 milhão dos 2,87 milhões** de aplicativos disponíveis na Play Store [[1](https://bloggersideas.com/pt/apps-statistics/#:~:text=,de%20aplicativos%20dispon%C3%ADveis%20para%20download), [2](https://www.nomtek.com/blog/flutter-app-examples)].

![Flutter Play Store 2023](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091710.png?raw=true)

A demanda por soluções cross-plataforma vem do desejo de simplificar o complexo processo de desenvolvimento de aplicativos para múltiplas plataformas.

A necessidade de dominar linguagens e SDKs diferentes para cada plataforma, como Kotlin para Android e Swift para iOS, além das constantes atualizações tecnológicas, impõe um grande desafio ao longo prazo.

Frameworks cross-plataforma, como Flutter e React Native, oferecem um caminho mais eficiente, permitindo o uso de um único código-base para várias plataformas, economizando tempo e esforço significativos.

## Introduzindo o React Native

[React Native](https://github.com/facebook/react-native) é um framework de código aberto que conecta o JavaScript e React com componentes nativos para Android e iOS.

Essa metodologia é especialmente conveniente para devs com experiência no universo Web/React.

- Um componente `Text` no React Native é convertido em um `UITextView` no iOS.
- No Android, o mesmo componente `Text` se torna um `TextView`.

Atualmente, o React Native possuí 2 tipos de arquiteturas: uma atual e a [nova](https://reactnative.dev/docs/next/the-new-architecture/landing-page).

### Arquitetura atual do React Native

A arquitetura atual e estável do React Native é baseada em três threads principais:

1. **Thread do JavaScript**: Responsável pela execução do código JavaScript.
2. **Main Thread Nativa**: Ou "thread principal", gerencia a UI e as interações do usuário.
3. **Thread de Background (Shadow Node)**: Administra a criação e manipulação dos nodes.

A comunicação entre o JavaScript e o código nativo é realizada via uma "ponte", que funciona como um terminal de transmissão de dados, permitindo a desserialização e execução das operações necessárias.

[🔗 Versão interativa](https://mermaid.live/edit#pako:eNqNVO9u2jAQfxXLU9VNMowQAiOdJq3tKrUaVTW6D1uyD0fsgEViZ45DyxAPs2foI_BiuyRQGFBtJ8XK_b_73dkLGmkuqE_HBrIJuT8PFUHKi1EtCOlH87OQVtjCADkFW0DyVuR29XsmklPCNfkiILLkFqyciZDW7iWdG8nHIgjpnVYWNT9CtVU-xwcjwEGj-wn-cHIDMxhGRma2ciA7VOX5LEcBfuRm-FfeY6YXOs2C8tBKYAG1cMdQKP5iRe1tRapMAOR1ZqSKZIbdpyDVm4PysJCB5tdplgSD1RMvEp3Xvjrfs_x6jYYbI8IFCg5j3SVgg_KAWJsU1rEg_88G3G0DIiUjiKZjowt02C_7mx5DMJwA1w_kFjehEpBPaiyVOJ7r5IRcIKSRBYXTL7tcPeUk0ikBUo9aHcyBNBof1guxpy2H-f6YtkLpuGoL9Yv6ErnjyponjSbqyl5rzU5_UQJ5finiCkcSyyTxyavelde-umLYZqIN8nEcM5Jbo6cCOdd1N1zjQXI78YmTPe6F4yKGIrFDO0_Ev1zPdnzrK8KqtaxOt5LsWtQ9sWe42QZatoWKVYCyNTasGvNuSWeU0VTgqkmOr8GiDB9SOxEpXl0ffzmYaXm9l2gHhdXDuYqob00hGC0yDlZcSsAFTKkfQ5KjNAP1Xet0Y4Qs9Rf0kfpOq9lp913H8xykntduMzqnfqfXbHU6_ZbnvOt2va7ndpeM_qoiOM1WTV6_2-p03V6PUcGl1WZQv17VI7b8A-WLexI)

![Arquitetura estável do React Native](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091730.png?raw=true)

> [🔗 Understanding React Native Architecture](https://dev.to/goodpic/understanding-react-native-architecture-22hh)

#### Desafios da Arquitetura Antiga

1. **Assincronicidade**: a ponte opera de forma assíncrona, causando possíveis atrasos na atualização da UI quando a espera não é necessária.
2. **Execução Single-threaded do JavaScript**: restringe todas as computações a uma única thread, podendo causar bloqueios e atrasos em operações intensivas.
3. **Overheads de serialização**: a transferência de dados entre as camadas requer serialização (geralmente em JSON) e desserialização, adicionando sobrecarga computacional e afeta o desempenho.

### A Nova arquitetura do React Native

A nova arquitetura do React Native foca em melhorar a comunicação entre as threads, eliminando a necessidade de serialização/desserialização e utilizando múltiplas threads para aprimorar o desempenho.

#### ⚠️ Fase experimental

Essa nova arquitetura ainda é experimental e está sujeita a mudanças à medida que o projeto evolui.

É importante estar ciente de que a implementação atual inclui várias etapas manuais e não reflete a experiência final de desenvolvimento prevista para a arquitetura renovada.

#### Principais componentes da nova arquitetura

- **[Fabric](https://reactnative.dev/architecture/fabric-renderer)**: Uma reescrita total da camada de renderização, otimizando a interação entre JavaScript e código nativo. O Fabric elimina a necessidade de serialização e desserialização, permitindo atualizações de UI imediatas e animações mais fluidas, reduzindo simultaneamente a carga computacional geral.
- **JSI (JavaScript Interface, uma interface em JavaScript para código nativo)**: Substitui a ponte tradicional, oferecendo uma camada de abstração mais leve que permite chamadas sincronizadas entre JavaScript e código nativo.
- **TurboModules**: Módulos otimizados que usam o JSI para um acesso mais direto e eficiente.
- **React Renderer**: Um novo renderizador que colabora com o JSI para melhorar o desempenho da UI.

[🔗 Versão interativa](https://mermaid.live/edit#pako:eNqFVFFv0zAQ_iuWeeiLOy1NupVMQoKWikkrQmw8QIO0a3xprTl2cJxupeqPQTzwQ_rHcBxK044KP0T-7r67--zceU1TzZHGdG6gWJC7UaKIW2U1awwJfW2-VcKirQyQjtJL6BCuyUeE1JL3YMUSE9oEHQSCQQimCfXEhH7dU-r1donKvgPFJZrpBJQoKglcG8KRYO3TZSsCFT9RoecqjGFmRPqsxJ1BHDqKFVpNh0bA9tf2pyYcyPaHWWqDR_wbWOnKTsdQYq2iIz3uHLGGOs9Fi5V63DkWe0Ju6OR-kGAh0yaHZ5InulJWqPnf9Pf5H8v96QLtqyTd7quDg-9pbaunNefdExrsXc0h964Ge9dO4j-dbSl7wi7kBKV1nFRCWY4w83dFMiFlTF5cjvu98ZiRVEttHM6yjJHSGv2ADoVhuEPdR8HtIiZB8XSUjmMGlbS3diXxf6FXrdimiZlvNP8NvaXNeGMEnyPzXe5uomh2N2LG3GxMNL_OC8k-Xbtdbaj_Pfus53Ag6YoymqNrCMHdIK7r9Am1C8zdZMVuy8E81DO2cTyorL5dqZTG1lTIaFVwsDgS4Josp3EGsnTWAtQXrfMdyUEar-kTjYNBdBZcvIzOw36vH0XB-QWjK2cOzoJ-NLh0uNe_CAa9aMPod58hYBS5sNpMmnfCPxeb34ZgUH0)

![React Native nova arquitetura](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091745.png?raw=true)

#### Turbo Modules

Anteriormente, a comunicação no React Native entre as camadas Nativa e JavaScript era realizada através da ponte JavaScript, ou os "Native Modules".

Os Turbo Modules representam uma evolução significativa dos `NativeModule` no React Native, abordando desafios como a inicialização prematura e a serialização de dados.

- **Carregamento preguiçoso:** permitem o carregamento preguiçoso de módulos, acelerando a inicialização do aplicativo.
- **Comunicação direta:** Ao evitar a JavaScript Bridge e comunicar-se diretamente com o código nativo, reduzem a sobrecarga de comunicação entre o JavaScript e o código nativo.
- **Codegen para tipagem segura:** O Codegen gera uma interface JavaScript no momento da construção, garantindo que o código nativo permaneça sincronizado com os dados provenientes da camada JavaScript.
- **Uso de JSI:** As ligações JSI (JavaScript Interface) possibilitam uma interação eficiente e direta entre JavaScript e código nativo sem a necessidade da ponte, proporcionando uma comunicação mais rápida e otimizada.

O Fabric aproveita das capacidades dos Turbo Modules e do Codegen. Juntos, esses componentes formam os pilares da nova arquitetura no React Native, oferecendo desempenho aprimorado e interoperabilidade mais eficiente entre código nativo e JavaScript.

> [🔗 Exploring React Native's new architecture](https://blog.logrocket.com/exploring-react-natives-new-architecture/)
>
> [🔗 A guide to Turbo Modules in React Native](https://dev.to/amazonappdev/a-guide-to-turbo-modules-in-react-native-5aa3)
>
> [🔗 Documentação oficial sobre a nova arquitetura](https://reactnative.dev/docs/next/the-new-architecture/landing-page)

---

## Introduzindo o Flutter

[Flutter](https://github.com/flutter/flutter) é um kit de desenvolvimento de interface de usuário (UI toolkit e framework), de código aberto, criado pela empresa Google em 2015, baseado na linguagem de programação Dart, que possibilita a criação de aplicativos compilados nativamente, para os sistemas operacionais Android, iOS, Windows, Mac, Linux, Fuchsia e Web.

Do ponto de vista arquitetural, o Flutter possui três camadas – o framework, a engine e a plataforma – e se baseia em especificidades da linguagem Dart, como a compilação ahead-of-time (AOT).

Como dev, você interage principalmente com o framework, escrevendo o aplicativo e os widgets (componentes da UI no Flutter) de maneira declarativa usando Dart.

A engine, então, renderiza isso em uma tela usando o [Skia](https://github.com/google/skia), que é posteriormente enviada às plataformas nativas: Android, iOS ou web. A plataforma nativa apresenta o canvas e envia os eventos que ocorrem de volta:

[🔗 Versão interativa](https://mermaid.live/edit#pako:eNqVVMlu2zAQ_RWCvSpGvMhulSKAI8eA0aQwohZFK_cwkUYyYYokKMrZv6aHnPoV_rGSkp06SoKiPEizvHkYzsI7msgUaUBzDWpJvkwWgthTVpeNYUHJlFfGoCbR5NOCNu5nENAI3XiqocArqVc__0LcOQcby4DHO6HlDyuF2jAh4yephfjG0hxNGW__Le8FitTyijzudDp7PmteiDey7cWnImcCW1QR6jVLcK6lkYnk8U6QJMXGuXlsJxfKQsmSGSZFvJU3j5tfbdicg8mkLsIlCIG8jEMQwEpH7FzgfNCKmYA2s1JaN0ZoKvUfF-zHb7I29YoqnUGy5Q2lyFheaagzJymQyLUi2_xOGJKPl_rY5bkt9C28dr_PYNga57yyZS3j7b-xynbHxkrNIVlB7pp2WihIpLGzI0xd57HiLKnjWmGnaws5k1LNhB0k-Wo5WnVJOJTlBLO6JiRjnAfk3Wjq96ZTj7jGaqtnWeaR0mi5Qqv1-_2ddnDFUrMMSFddt-hSzKDiJjI3HP8VerQX26yKV49g_e3Xln3EiXZT7l0gJMbNUyOdsUvPFvNcprNCce_rzErO4LrsfZc5PEvp6OUO7y_ueG9XycHB8f12se7Jycu9OKkRdlrXUJJoxeCehK8PV1gj6y5Jx9XmePKMn_pEPVqgZWGpfYDunHlBzRILXNDAiinolUv8weKgMjK6EQkNjK7Qo5VK7V5MGNgrFjTIgJfWqkD8kLLYgaxKgzt6TQO_Mxwc-j3_0B--748GI9-jNzTo-cPOaNQd-h8Go6E_6A6GDx69rQm6HsWUGanPm-exfiUf_gA_RqLp)

![Flutter SDK](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-14-091807.png?raw=true)

### Flutter vs React Native

A transição do React Native para o Flutter revela uma evolução no desenvolvimento cross-plataforma. Enquanto o React Native oferece um caminho eficiente com JavaScript, o Flutter se destaca com a flexibilidade do Dart, uma linguagem otimizada para UIs interativas.

Embora a arquitetura do Flutter seja semelhante à do React Native, há uma diferença significativa em termos de desempenho.

Um dos componentes-chave que permite ao Flutter alcançar um desempenho superior ao do React Native é a integração mais profunda com o lado nativo, o que significa que ele não usa os SDKs tradicionais.

Em vez disso, o Flutter utiliza o Android NDK e o LLVM do iOS para compilar o código C/C++ que vem do engine.

Com a nova arquitetura do React Native, essa diferença de desempenho poderá ficar menos expressiva.

### Desvantagens do Flutter

Embora o Flutter tenha um desempenho satisfatório, superando o React Native em termos de compilação de Dart para código nativo, ele enfrenta desafios como o tamanho aumentado dos aplicativos, devido à inclusão de seu motor de execução e widgets.

Além disso, a extensão de funcionalidades não suportadas nativamente pelo Flutter exige a comunicação entre Dart e as linguagens nativas por meio de canais e estruturas de dados específicas, o que pode ser uma solução menos eficiente e mais complexa em comparação com a interoperabilidade entre Java e Kotlin ou Objective-C e Swift.

![Nativo vs Flutter vs Compose](https://www.jacobras.nl/wp-content/uploads/2023/09/chart_app_size-5-1024x633.png)

> [🔗 Android & iOS native vs. Flutter vs. Compose Multiplatform](https://www.jacobras.nl/2023/09/android-ios-native-flutter-compose-kmp/)

#### O desafio do Dart no Flutter

Como toda linguagem, Dart impõe um desafio natural de aprendizado e aplicação.

Embora o Dart seja uma linguagem moderna e dinâmica, é comum que devs de outras plataformas nativas possam encontrar uma barreira ao adentrar neste novo ecossistema, como funcionalidades específicas de linguagens como Kotlin ou Swift.

Dart está constantemente se aprimorando e, embora possa não ter a mesma percepção de maturidade que linguagens estabelecidas, ela oferece uma série de recursos interessantes que estão ganhando reconhecimento na comunidade de desenvolvimento.

### Considerações finais sobre cross-plataforma

As soluções cross-plataforma abstraem as complexidades nativas, permitindo escrever um único código para diversos dispositivos.

Porém, é comum encontrar limitações ao se integrar com a plataforma nativa, impactando o desempenho e a experiência da aplicação.

Além disso, a adaptação a atualizações das plataformas pode ser lenta, pois o framework cross-plataforma precisa ser atualizado para suportar novas funcionalidades nativas.

---

## Introduzindo o Kotlin Multiplataforma (KMP)

O KMP se destaca na integração com plataformas nativas. Esta abordagem permite devs compartilhem a lógica de negócios mantendo as interfaces nativas, oferecendo um equilíbrio ideal entre eficiência e personalização.

Em vez de tentar abstrair completamente a plataforma nativa, o KMP empodera devs nativos com um maquinário open-source que trata de compilar as aplicações para Android, iOS, Web, macOS, Windows, Linux entre outros.

[🔗 Versão interativa](https://mermaid.live/view#pako:eNqFk81OwkAQx19lM14XtC0gVuMFwkGDlxpNpBwGdisrbbfZblUkPJWP4Iu57bZSxYRNk85Mf__5SGe3sJSMgw_PCrMVuR-HKTEnLxY2EIJ5bKw8yxjzfMwjgoojiUQc--TkfNJ3JxNKljKWyvhRFFGSayXX3Hie5zVe500wvfKJk73_k5LxCItYB3oT82Pyy71-JJNEpiMzxWz09cnEsyS3UsciNf0kGSot4hUyOSedznX95eZhOrPWqTHn_-Vq08EPHBxj71CLV97w1jumecQ8mYVQa0ovhJbmp-VKYt7VqN0XVORqoa5JF1Ed4oGlgxrOD4iyTsWUhqXejHXA2Rkq0pqWzeX8zy_cN0qbHmg7BW3VLbfn8q--Ho3apum-Gm1a_LUitZ6nDCgkXCUomNnjbRkOQa94wkPwjclQrcsd3hkOCy2DTboEX6uCUygyhpqPBZptT5pghumTlG0X_C28g--edXtDp-85nnvR6_XdAYUN-N6w6_SH7oXrng3PB2ZfdxQ-Kr1DgTOhpZraO1Zdtd037awVvw)

![KMP compartilhando código](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/mermaid-diagram-2023-11-21-164030.png?raw=true)

O KMP visa:

- Manter o desenvolvimento de recursos específicos da plataforma tão natural e próximo quanto possível do desenvolvimento nativo.
- Assegurar que os desenvolvedores nativos não enfrentem dificuldades ao trabalhar com o código compartilhado.
- Facilitar a interoperabilidade entre o código nativo e compartilhado, tornando a interação com o código compartilhado intuitiva e familiar.

### Flexibilidade e UI Nativa

Com KMP, as versões do seu aplicativo podem ter muito em comum, mas também diferir significativamente, especialmente em termos de UIs.

KMP não impõe limitações em como você desenvolve a UI do seu aplicativo. Você pode usar qualquer estilo e frameworks que quiser, incluindo os mais modernos, como Jetpack Compose para Android e SwiftUI para iOS. Isso permite o uso de elementos específicos de cada plataforma, proporcionando uma experiência de UI nativa para seus usuários.

[🔗 Gráfico em tela cheia](https://mermaid.live/view#pako:eNp9VNtu2kAQ_ZXV9iWRHBowhEurSCkoapqQoqCoUkNVDd5x2GLvurvrkAv5mfahUl-rvvSVH-vYBgoh1ELYu3N8Zub4zD7wQAvkLX5tIBmxs4uBYnTZdFhsnHZ7VwN-ZL6m0qFLDTChs80B_1Qg19AnKjRA-LdgxAQMMmRHvROmwMkbsGvvZNeREkZL8Xnx2pkOIJL3MPsx-6430PJ9f4m8QIEbgA7asdPJEtSRNtik-YDDJaI9-xajgTUMKjFQ_5an2kVS5Sq0Z7-EvNYs0HEaM4w3dMhp2eu9vcNpmzBKBkUrTEiDjiJDc8hAs37nlJ1nmujpkv9pRuImjkRGIDTlLn0B47ES0H_OgrcYpA6GERZrOyK5xUvriDZgkRx6RTYqKMaJNuMcNgEbs7WSF-lZVnTPaJHes3j2J3IyicBmrWYlUBe_0c4pBSakEf2oL4IQzkGoTUzP83golaTQ9JlW_tdmXgN9tEQrOZSZERisVEA6JkD6WjRFokArm8aUKQPpeV2znyqQMGVvUhmtfcilSfNIZo8V_IZLcite7eS33SexC4y101c7xX13u3eWKS9PKN_lYhC2zkEOe4cugWDMMlm0xWfHIAf2JzJ0RP2sw3NEITHVC4Hbgqrkw0TxwpC4BeYT7DhKnUOzdezylPOqWTctLOQyZ_xvvkiVYl6U1TGyRBvWhRtUHjvvdeeOKzrtkSpwndmwrQMNiRZ2PgsuWH7vJxkCMrHtYMhoOoCFMopa7EX9uFY5PvbINZE2tA7D0GPWGT1GWvm-v1jtTaRwoxYrJ7crdFSyV0x6RvqKe5zOkBikoFP0IcMNuBthTFK26FGAGQ_4QD0SDlKn-3cq4C1nUvR4mghw2JFALokXmwmoj1qvLnnrgd_yVnm_UirXageVcrla9Wt-w_f4HW03Sw2_fFCp1Or71UbNr1YfPX6fM-yXmo1y_aDmV5oNv15vNsseRyGdNt3i0M_P_se_AG7kHA)

![Arquitetura simplificada KMP](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-15-153615.png?raw=true)

### Compartilhando código Kotlin com as plataformas

Dado o espírito flexível do KMP, atualmente existem uma série de estratégias que devs podem adotar para usar o KMP.

Algumas abordagens comuns:

- **Compartilhando modelos do domínio**: Utilização de classes comuns como entidades, DTOs (Data Transfer Objects), respostas do servidor, etc., consistentes em todas as plataformas.
- **Componentes de infraestrutura**: Compartilhamento de lógica relacionada ao uso da internet, persistência de dados, e manipulação de cache, etc.
- **Experimentação e analytics**: Códigos que permite experimentação no app, como a definição de feature flags, eventos de analytics, etc.
- **Lógica de negócios**: Códigos que definem regras de negócios, validações, e algoritmos essenciais para o funcionamento da aplicação.
- **Utilitários**: Funções e classes auxiliares que podem ser usadas em diferentes partes da aplicação, como manipulação de strings, formatação de datas, constantes, etc.
- **Testes**: Escrever testes unitários e de integração que podem ser executados em todas as plataformas, garantindo a consistência e a confiabilidade do código compartilhado.
- **Abstrações de Hardware e SO**: Códigos que abstraem funcionalidades específicas do sistema operacional ou do hardware, como acesso a sensores, armazenamento de arquivos, etc., permitindo que sejam usados de maneira uniforme em diferentes plataformas.

[🔗 Versão interativa](https://mermaid.live/view#pako:eNqNVEtu2zAQvQrBblpUSWwr8kctAjh2gxqN-4ntBGjcBSWNbSIUqZKU80NO00VXXfUIvlhJSXYkxynChcQ3M3zzZiTOPQ5FBNjHc0mSxZQjs1QaZAj1GAWuQeXmimsoAsrg0WFXl0dS0OhyiovdFP-oRtAvI-M1z4oHeLQjwwUQSQJWzm7XNdHhYk2zRk8S2cNZUKEkM6AX5e2DutIiqfLFJMzpkoRBjp7mpDwS18pEFbsnEaeUpzfGn71fIGV8Xj0_XpZE6OUODUW54_NS6YblJd0OtjsYXBAV22og6CoFccBu0QGyxh3tDs6AhNpEfxwPT9Fb1Bs90-tss_WfdeXPlGrQqSR5eQhi9EloRjkapkzThBFNZkLGpELaN9YSEjGh_BFPBs9ntCdNqoygzHj2YTTufh0YV29BYhIRhQyshIxAUsLoHdFUcBO4wavfq18CvQ_kkf2HKtYqwbc-MDpf2G4dEx4KFAGKSCTUQY-EC9gE7xI-sdomVUWfjZSlsOUAg7khQom5OkioXMxj8xTiNpQUjtdhcb_f_Ddl3ldLL-LVH06r1RyninJQ6lTMaXh5BuaMsgVxmK_-hlSore81NOOGqcvstXGW0k4GaG_vaGv0hIwo1YcZIhIImlHGfPSqdeI1Tk4cFAompMGz2cxBSktxBQa5rrtGe9c00gsf1ZObEl0xwpzNnHGKm28sgWO-6hKkMxk4efmO1e6MzzMF77CDYzANpZGZnPeWdIr1AmLz7XyzjYi8muIpfzBxJNVidMtD7GuZgoPTJCIa-pSYRsVrY0L4dyHKEPv3-Ab7Xmu_1XYbNa_ZabU77XrbwbfYP_T2D1uder3h1Wu1w0az0Xxw8F1GUNvvuK2m2_Bq1u26XsvBEFEt5DCf89m4f_gHd2rNtA)

![Arquitetura KMP](https://github.com/rsicarelli/KMP101/blob/main/posts/assets/mermaid-diagram-2023-11-15-150050.png?raw=true)

Lembrando que a escolha de quais partes compartilhar depende das necessidades específicas do projeto e da equipe. O KMP oferece a flexibilidade para adaptar a estratégia de compartilhamento de código conforme o projeto evolui.

## Considerações finais

Nesse artigo, conseguimos sair do zero no mundo KMP e compreendemos tecnicamente a diferença entre desenvolvimento nativo, cross-plataforma e multiplataforma.

Em resumo, cada tecnologia - React Native, Flutter e Kotlin Multiplatform - tem seus pontos fortes e fracos.

Ao escolher a ferramenta certa para o seu projeto, considere fatores como desempenho, facilidade de uso e suporte da comunidade. Kotlin Multiplatform emerge como uma opção promissora, especialmente para quem valoriza a eficiência do código compartilhado sem comprometer a experiência do usuário nativo.

Com esse conhecimento, podemos avançar para os conceitos mais específicos do funcionamento do Kotlin Multiplataforma, como o compilador, síntaxe, configuração, etc.

### Próximos passos

Iremos aprender como o compilador do Kotlin funciona, e como sua estrutura de frontend + backend + IR possibilitam as múltiplas compilações.

---

> 🤖 Artigo foi escrito com o auxílio do ChatGPT 4, utilizando o plugin Web.
>
> As fontes e o conteúdo são revisados para garantir a relevância das informações fornecidas, assim como as fontes utilizadas em cada prompt.
>
> No entanto, caso encontre alguma informação incorreta ou acredite que algum crédito está faltando, por favor, entre em contato!

---

> Referencias
>
> - [Simplifying Application Development with Kotlin Multiplatform Mobile Robert Nagy](https://github.com/PacktPublishing/Simplifying-Application-Development-with-Kotlin-Multiplatform-Mobile)
> - [Kotlin In-Depth - Aleksei Sedunov ](https://www.amazon.com/Kotlin-Depth-Multipurpose-Programming-Multiplatform/dp/9391030637)
