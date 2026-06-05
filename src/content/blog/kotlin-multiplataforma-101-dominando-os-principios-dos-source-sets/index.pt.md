---
title: 'KMP 101: Dominando os princípios dos Source Sets'
description: 'No último artigo (🔗 KMP 101: Entendendo como o Kotlin compila para multiplas plataformas), aprendemos sobre o frontend, IR e backend do compilador do…'
summary: 'No último artigo (🔗 KMP 101: Entendendo como o Kotlin compila para multiplas plataformas), aprendemos sobre o frontend, IR e backend do compilador do Kotlin.'
pubDate: 2023-11-24
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 3
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-multiplataforma-101-dominando-os-principios-dos-source-sets-4pg'
  devtoId: 1677323
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 11
topic: kmp
difficulty: beginner
contentType: tutorial
---

Dessa vez, vamos entender um conceito-chave para codar em KMP: os _source sets_

---

## Introdução aos _source sets_ no KMP

Os _source sets_ no Kotlin são essenciais para o desenvolvimento multiplataforma. Utilizando uma arquitetura hierárquica, os _source sets_ nos permitem organizar nosso código-fonte, declarar dependências específicas para cada alvo e também nos permitem configurar opções de compilação de forma isolada para diferentes plataformas em um mesmo projeto.

Pense em um _source set_ no KMP como uma 'pasta especial' em um projeto, onde cada pasta tem um propósito (ou plataforma) específico. Por exemplo, a pasta "comum" contém arquivos usados em todas as plataformas, enquanto pastas específicas, como "android" ou "iOS", abrigam arquivos exclusivos para essas plataformas.

O compilador do Kotlin identifica essas pastas especiais e se encarrega de compilar seu conteúdo (código-fonte), conforme as estratégias de compilação exploradas em 🔗 [KMP 101: Entendendo como o Kotlin compila para multiplas plataformas](https://dev.to/rsicarelli/kotlin-multiplataforma-101-entendendo-como-o-kotlin-compila-para-multiplas-plataformas-5hba).

## Entendendo a função e a estrutura básica de um _source set_

Cada _source set_ em um projeto multiplataforma possui **um nome único** e contém um conjunto de arquivos de código-fonte e recursos (arquivos, ícones, etc). Ele especifica **um alvo** (_target_) para o qual o código será compilado.

Assumindo que as configurações necessárias foram aplicadas (as quais abordaremos em artigos futuros), a estrutura de pastas abaixo orienta o compilador do Kotlin a:

1. Inicializar e compilar os seguintes alvos: `android`, `iOS`, `watchOS`, `tvOS`, `js`, `wasm` e `desktop`.
2. Compilar o código-fonte dentro do _source set_ `common` para todas as plataformas, tornando os membros do arquivo `Common.kt` disponíveis nativamente para cada plataforma definida.
3. Ao final da compilação, gerar arquivos específicos para cada plataforma (`.class`, `.so`, `.js`, `.wasm`), com todos os membros do `Common.kt` disponíveis.

![Estrutura basica source set](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kmp101-sourcesets-basic.png?raw=true)

### A natureza hierárquica dos _source sets_

Os _source sets_ do KMP funcionam como uma árvore genealógica.

Na base da árvore, temos os ancestrais comuns (o _source set_ `commonMain`), cujas características são compartilhadas por todos na família. À medida que avançamos para os galhos, encontramos os _source sets_ intermediários, que representam ramos da família com características únicas compartilhadas por um subconjunto de membros (por exemplo, `apple` ou `native`).

Finalmente, nas extremidades dos galhos, estão os membros individuais da família (os _source sets_ específicos da plataforma, como `iosArm64` ou `iosSimulatorArm64`), cada um com suas próprias características únicas.

Isso permite organizar uma hierarquia de _source sets_ intermediários com total controle do que cada _source set_ irá compartilhar.

![Hierarquia padrão do KMP](https://kotlinlang.org/docs/images/default-hierarchy-example.svg)

## _Source sets_ comuns vs. específicos

No KMP, a distinção entre _source sets_ comuns e específicos de plataforma é fundamental para entender como o código é compartilhado e gerenciado entre diferentes alvos.

### _Source set_ comum (`commonMain`)

O _source set_ comum, geralmente localizados no diretório `commonMain`, representa a base do compartilhamento de código no Kotlin Multiplataforma. Aqui, você escreve o código Kotlin que é compartilhado entre todas as plataformas-alvo do projeto. Este código pode incluir lógica de negócios, modelos de dados, e funcionalidades agnósticas em relação à plataforma subjacente.

É importante notar que, embora este código seja compartilhado, ele não deve conter nenhuma funcionalidade ou chamada de API que seja específica a uma plataforma. O compilador Kotlin assegura isso, evitando o uso de funções ou classes específicas de plataforma no código comum, uma vez que esse código é compilado para diferentes alvos.

### _Source sets_ específicos de plataforma

Enquanto o código comum oferece uma grande vantagem na reutilização de código, nem tudo pode ser generalizado para todas as plataformas. É aqui que entram os _source sets_ específicos de plataforma, como `androidMain`, `iosMain`, `desktopMain`, entre outros. Esses _source sets_ contêm código específico para uma plataforma, sendo compilados apenas para seu respectivo alvo.

Por exemplo, o _source set_ `androidMain` pode conter chamadas de API Android, enquanto `iosMain` pode utilizar APIs específicas do iOS. Isso permite que você tire proveito das características e APIs únicas de cada plataforma, mantendo simultaneamente, uma base de código comum significativa no `commonMain`.

### Escolhendo entre comum e específico

Ao desenvolver um projeto Kotlin Multiplataforma, uma parte significativa do seu esforço será dedicada a decidir o que vai ao código comum e o que precisa ser implementado de forma específica para cada plataforma. A regra geral é maximizar o código comum, recorrendo a _source sets_ específicos de plataforma apenas quando for necessário acessar funcionalidades ou APIs que não estão disponíveis de forma genérica.

Essa abordagem não só simplifica a manutenção do código, como também assegura a consistência em todas as plataformas, aproveitando ao máximo o potencial do Kotlin Multiplataforma.

## _Source set_ intermediário

Vamos supor que temos um projeto KMP com os _source sets_ `commonMain`, `androidMain` e `appleMain`. Dentro do _source set_ comum, temos uma interface definida chamada `InterfaceComum` que funciona como um contrato ao qual todas as plataformas precisam aderir.

Derivando da `InterfaceComum`, temos `InterfaceApple` e `InterfaceAndroid`: a `InterfaceApple` adiciona funcionalidades específicas para o ecossistema Apple, enquanto `InterfaceAndroid` faz o mesmo para dispositivos Android.

Esse design garante que, embora compartilhemos a lógica comum pela `InterfaceComum`, cada plataforma pode ter suas próprias extensões e funcionalidades, mantendo a separação e a especialização do código conforme necessário.

Esse conceito é chamado de [intermediary _source sets_](https://kotlinlang.org/docs/multiplatform-discover-project.html#intermediate-source-sets):

> Um _source set_ intermediário é um conjunto de _source set_ que compila para alguns, mas não para todos os alvos do projeto.

![Exemplo *source sets*](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/mermaid-diagram-2023-11-24-110205.png?raw=true)

## _Source set_ de teste

Os testes no Kotlin Multiplataforma também são tratados como um _source set_. O que significa que cada plataforma pode ter seus próprios testes específicos se utilizando, por exemplo, o SDK nativo ou outras bibliotecas open source nativas.

O _source set_ comum também pode (e deve!) ter seus próprios testes, porém você irá precisar utilizar outras bibliotecas KMP para a escrita multiplataforma, como, por exemplo, o [🔗 kotlin.test](https://kotlinlang.org/api/latest/kotlin.test/), [🔗 turbine](https://github.com/cashapp/turbine) ou [🔗 assertk](https://github.com/willowtreeapps/assertk).

![Exemplo *source sets*](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/test-source-set-kmp.png?raw=true)

## Gerenciando dependências nos _source sets_

Em projetos Kotlin Multiplataforma, a gestão eficiente de dependências nos _source sets_ é crucial para manter a modularidade e a eficiência do código.

O KMP nos permite ter controle individual das dependências de cada _source set_, nos possibilitando ainda criar relações/dependências entre elas.

### Dependências no _source set_ comum

No _source set_ comum (`commonMain`), as dependências incluem bibliotecas utilizáveis em todas as plataformas suportadas pelo projeto. Estas bibliotecas fornecem funcionalidades que são independentes de qualquer plataforma específica, como lógica de negócios, algoritmos ou utilitários comuns. A inclusão de uma biblioteca no source set comum significa que essa funcionalidade estará disponível para todos os alvos do projeto, promovendo a reutilização do código e a consistência entre plataformas.

Isso significa que, ao declarar uma depêndencia comum, todos os outros _source sets_ também terão essa dependencia, que, por sua vez, é uma dependência KMP que oferece funcionalidades agnósticas de plataforma.

### Dependências em _source sets_ específicos

Contrastando com o _source set_ comum, os _source sets_ específicos de plataforma, como `androidMain` ou `iosMain`, focam em dependências que são relevantes apenas para uma plataforma particular. Essas dependências são utilizadas para acessar APIs, bibliotecas ou recursos que são exclusivos a uma plataforma, permitindo que os desenvolvedores aproveitem as funcionalidades nativas e otimizem a experiência do usuário em cada plataforma.

![Exemplo *source sets*](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/mermaid-diagram-2023-11-24-125307.png?raw=true)

## Convenções adotadas pela comunidade

O KMP é extremamente flexível, nos possibilitando nomear e manipular nossos _source sets_ como preferirmos.

Porém, no decorrer dos anos, a comunidade foi adotando algumas convenções, e o próprio KMP foi se adequando ao redor dessas convenções, oferecendo algumas facilidades na configuração do projeto. Vamos explorar as principais delas

### 1: Nomes utilizando "camelCase"

A comunidade geralmente adota a nomenclatura `cammelCase` para a definição dos _source sets_.

### 2: Sufixo "main"

O diretório `main` em projetos que utilizam linguagens da JVM, como Java e Kotlin, é tradicionalmente usado para armazenar o código-fonte principal da aplicação. Este diretório é parte de uma estrutura de pastas convencional, onde `main` geralmente contém os pacotes e classes que implementam a lógica principal do programa.

Em projetos KMP, essa tradição foi levada adiante e se utiliza o `main` como sufixo para declarar nossos _source sets_: `commonMain`, `androidMain`, `nativeMain`, `desktopMain`, etc.

### 3: Código compartilhado usando o `commonMain`

O código compartilhado geralmente reside em um _source set_ chamado `commonMain`. Não é comum, mas alguns projetos também adotam a nomenclatura `sharedMain`.

### 4: Utilizando os "Source set conventions"

Como aprendemos, o próprio KMP foi se ajustando ao redor dessas definições da comunidade.

A partir do Kotlin `1.9.20`, o plugin Gradle do KMP oferece **um modelo de hierarquia padrão**, que contém _source sets_ intermediários predefinidos para casos de uso comuns. Esse modelo é automaticamente configurado com base nos alvos especificados no projeto.

Dentro do KPM Gradle Plugin, temos uma classe chamada [🔗 KotlinMultiplatformSourceSetConventions](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/dsl/KotlinMultiplatformSourceSetConventions.kt) que reduz e muito a tarefa tediosa de definir e controlar os _source sets_:

| Source Set          | Plataforma  |
| ------------------- | ----------- |
| `androidMain`       | Android     |
| `androidNativeMain` | Android     |
| `androidNativeTest` | Android     |
| `appleMain`         | Apple       |
| `appleTest`         | Apple       |
| `commonMain`        | Comum       |
| `commonTest`        | Comum       |
| `iosMain`           | iOS         |
| `iosTest`           | iOS         |
| `jsMain`            | JavaScript  |
| `jsTest`            | JavaScript  |
| `jvmMain`           | JVM         |
| `jvmTest`           | JVM         |
| `linuxMain`         | Linux       |
| `linuxTest`         | Linux       |
| `macosMain`         | macOS       |
| `macosTest`         | macOS       |
| `mingwMain`         | Windows     |
| `mingwTest`         | Windows     |
| `nativeMain`        | Nativo      |
| `nativeTest`        | Nativo      |
| `tvosMain`          | tvOS        |
| `tvosTest`          | tvOS        |
| `wasmJsMain`        | WebAssembly |
| `wasmJsTest`        | WebAssembly |
| `wasmWasiMain`      | WebAssembly |
| `wasmWasiTest`      | WebAssembly |
| `watchosMain`       | watchOS     |
| `watchosTest`       | watchOS     |

---

## Conclusão

Neste artigo, exploramos o conceito vital de _source sets_ no KMP, desvendando como eles facilitam a organização do código, a declaração de dependências específicas para cada plataforma e a configuração de opções de compilação de forma isolada. Compreendemos a distinção entre _source sets_ comuns e específicos, a importância dos _source sets_ intermediários, e como gerenciar eficientemente as dependências para manter a modularidade e eficiência do código.

A flexibilidade e o poder do KMP nos permitem criar aplicações robustas e eficientes, maximizando a reutilização do código e mantendo a consistência em todas as plataformas. A adoção das convenções da comunidade e a compreensão profunda da estrutura de _source sets_ são essenciais para qualquer dev que busca aproveitar ao máximo o potencial do Kotlin Multiplataforma.

No nosso próximo artigo, mergulharemos no Plugin do KMP para Gradle, explorando como ele nos ajuda a configurar e gerenciar nossos projetos multiplataforma de maneira eficiente.

Até a próxima!

---

> 🤖 Artigo foi escrito com o auxílio do ChatGPT 4, utilizando o plugin Web.
>
> As fontes e o conteúdo são revisados para garantir a relevância das informações fornecidas, assim como as fontes utilizadas em cada prompt.
>
> No entanto, caso encontre alguma informação incorreta ou acredite que algum crédito está faltando, por favor, entre em contato!

---

> Referencias
>
> - [Hierarchical project structure | Kotlin Documentation](https://kotlinlang.org/docs/multiplatform-hierarchy.html)
> - [The basics of Kotlin Multiplatform project structure | Kotlin Documentation](https://kotlinlang.org/docs/multiplatform-basic-project-structure.html)
> - [Create your multiplatform project | Kotlin Multiplatform Development Documentation](https://www.jetbrains.com/lp/mobile-multiplatform/)
> - [Adding dependencies on multiplatform libraries | Kotlin Documentation](https://kotlinlang.org/docs/mpp-add-dependencies.html)
> - [Use platform-specific APIs | Kotlin Multiplatform Development Documentation](https://www.jetbrains.com/lp/mobile-multiplatform/platform-specific-apis/)
