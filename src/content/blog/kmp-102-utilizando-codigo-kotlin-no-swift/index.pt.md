---
title: 'KMP-102 - Utilizando Código Kotlin no Swift'
description: 'No último post, aprendemos a criar um XCFramework a partir de código Kotlin e exploramos algumas características dos tipos de build gerados.'
summary: 'No último post, aprendemos a criar um XCFramework a partir de código Kotlin e exploramos algumas características dos tipos de build gerados.'
pubDate: 2024-10-11
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-102'
seriesOrder: 3
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-utilizando-codigo-kotlin-no-swift-2ice'
  devtoId: 2034279
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 7
topic: kmp
difficulty: intermediate
contentType: tutorial
---

Com isso, podemos avançar e aprender como o código Kotlin compilado para Objective-C funciona e como consumi-lo no iOS.

## Exportando um 'Olá mundo' em Kotlin para iOS

Para começar, vamos entender alguns pontos importantes sobre como o código Kotlin é convertido para Objective-C e, consequentemente, como utilizá-lo no iOS.

Vamos criar um simples `HelloWorld` em Kotlin:

```kotlin
//HelloWorld.kt commonMain
expect fun helloWorld(): String

//HelloWorld.apple.kt appleMain
actual fun helloWorld(): String = "Olá mundo Apple Main"
```

Agora precisamos compilar um `XCFramework` e integra-lo no Xcode. Existem diversos tutoriais na internet sobre como realizar essa tarefa; para esta demonstração, segui o guia "[How to Integrate Kotlin Multiplatform (KMP) into Your iOS Project](https://jyotibhambhu.medium.com/part-3-how-to-integrate-kotlin-multiplatform-kmp-into-your-ios-project-7dc4016f7fb5)".

Os passos básicos são:

1. Compilar o `XCFramework` com `./gradlew assembleKotlinSharedXCFramework`. **NOTA:** substitua "KotlinShared" pelo nome do seu `XCFramework`. Explicamos isso nos artigos anteriores.
2. Configurar o projeto Xcode para consumir o `XCFramework` gerado.
3. Utilizar o código Kotlin no iOS.

Depois que toda a configuração for realizada, conseguimos avançar e criar uma tela bem simples em SwiftUI para consumir o código Kotlin:

```swift
import SwiftUI
import KotlinShared

struct ContentView: View {
    @State private var showText = false

    var body: some View {
        Button("Show Text") { showText.toggle() }
        if showText { Text(HelloWorld_appleKt.helloWorld()) }
    }
}
```

Como resultado, teremos:

<img src="https://media.rsicarelli.com/blog/kmp-102/shared/kotlin-shared-hello-world-ios.gif" style="max-width:200px" />

### O que está acontecendo aqui?

Vamos entender o que está acontecendo nos bastidores:

1. O código Kotlin é compilado para Objective-C e empacotado em um `XCFramework`.
2. O `XCFramework` é integrado no projeto Xcode.
3. Com o `XCFramework` integrado, podemos importar o código Kotlin no iOS usando `import KotlinShared`.
4. Dentro de `KotlinShared` (o nome do `XCFramework`), temos acesso ao código Kotlin compilado para Objective-C.
5. A classe `HelloWorld_appleKt` é gerada automaticamente pelo Kotlin/Native, permitindo o acesso ao método `helloWorld()`.
6. Assim, podemos utilizar o código Kotlin no iOS!

```swift
import KotlinShared

let helloWorld = HelloWorld_appleKt.helloWorld()
```

Mas se notarmos, a sintaxe para acessar o código Kotlin no iOS é bem estranha. `HelloWorld_appleKt.helloWorld()` é uma sintaxe nada idiomática para o Swift.

Vamos entender melhor esse ponto.

## Compreendendo o código gerado pelo Kotlin/Native

A maior limitação hoje no Kotlin/Native é a interoperabilidade com Objective-C. O Kotlin/Native não consegue gerar um código que seja 100% compatível com o Swift.

Isso porque o Kotlin/Native é um compilador que gera código Objective-C, e não Swift. O código gerado é compatível com Objective-C, e não Swift.

Ou seja, temos várias funcionalidades em Kotlin traduzidas diretamente para Swift (como **high order functions**, **enums**, etc), mas não temos uma tradução direta de Kotlin --> Objective-c.

Para investigar como o código Kotlin é traduzido para Objective-C, podemos acessar o código gerado pelo Kotlin/Native. Para isso, basta dar um `cmd + click` na nossa classe `HelloWorld_appleKt`:

![Hello world em Obj-c](https://media.rsicarelli.com/blog/kmp-102/shared/kotlin-shared-hello-world-decompiled.png)

Para melhorar a experiência de uso do código Kotlin no iOS, podemos codificar nosso código Kotlin de uma forma diferente, para ser mais idiomático ao Swift.

## Melhorando a interoperabilidade com Swift

Observamos que não podemos simplesmente escrever código Kotlin e esperar que ele seja idiomático ao Swift devida a característica do Kotlin/Native somente gerar código Objective-C.

Para isso, temos que escrever nosso código Kotlin de uma forma que seja mais amigável ao Swift. Vamos refatorar o código `HelloWorld` para ser mais idiomático ao Swift:

```kotlin
// HelloWorld.apple.kt appleMain
package br.com.rsicarelli.example

@HiddenFromObjC
actual fun helloWorld(): String = "Olá mundo Apple Main"

object HelloWorld

fun HelloWorld.get(): String = helloWorld()
```

Agora, realizamos o mesmo passo a passo para utilizar no Xcode:

1. Compilar o XCFramework com `./gradlew assembleKotlinSharedXCFramework`.
2. No Xcode, `Products` > `Build for ...` > `Running`, ou simplesmente `cmd + shift + r`

Logo após o build, notamos que a nossa classe anterior `HelloWorld_appleKt` não está mais disponível.
![Hello world quebrado no Xcode](https://media.rsicarelli.com/blog/kmp-102/shared/kotlin-shared-hello-world-changed-xcode-error.png)

Antes de entender o porquê, vamos integrar nosso código KMP utilizando a nova abordagem:

```swift
import KotlinShared

struct ContentView: View {
    @State private var showText = false

    var body: some View {
        Button("Show Text") { showText.toggle() }
        if showText { Text(HelloWorld.shared.get()) }
    }
}
```

Sucesso! Esse código é mais idiomático ao Swift, e conseguimos utilizar o código Kotlin no iOS de uma forma mais amigável.

Se abrirmos o código Objective-C gerado pelo Kotlin/Native, notamos algumas diferenças:
![Hello world idiomático ao Swift](https://media.rsicarelli.com/blog/kmp-102/shared/kotlin-shared-hello-world-changed-idiomatic-swift.png)

Interessante observar que, agora, nossa classe `HelloWorld` é gerada como um Singleton, e o método `get` é gerado como uma extensão!

### E a anotação `@HiddenFromObjC`?

A anotação `@HiddenFromObjC` é uma anotação do Kotlin/Native que indica que o método não deve ser exposto para Objective-C. Isso é útil para métodos que não devem ser acessados diretamente pelo Objective-C, como funções de extensão.

A lógica do uso dessa anotação nesse contexto é a seguinte: temos duas formas de acessar o método `helloWorld()`:

- Através da função de alto nível (high order function no Kotlin)
- Através da extensão do objeto `HelloWorld`

Nesse caso, expormos as duas maneiras para o Objective-C não faz sentido, pois a função de alto nível apenas delegar para a extensão do objeto `HelloWorld`. Isso pode ser confuso para quem está consumindo o código Kotlin no iOS.

Para isso, utilizamos a anotação `@HiddenFromObjC` para esconder a função de alto nível do Objective-C, e expor apenas a extensão do objeto `HelloWorld`!

Notas importantes:

- A anotação `@HiddenFromObjC` é uma anotação do Kotlin/Native, ou seja, não podemos utilizar em nenhum outro source set do KMP.
- A anotação `@HiddenFromObjC` pode ser utilizada para funções, classes, atributos, etc.

Uma documentação completa entre a interoperabilidade entre Kotlin e Objective-C pode ser encontrada aqui [Interoperability with Swift/Objective-C](https://kotlinlang.org/docs/native-objc-interop.html).

## Outras maneiras de melhorar a interoperabilidade

Essa abordagem já funciona muito bem, porém, pode ser bem tedioso ter que criar uma extensão para cada função que queremos expor para o iOS.

No final, o que queremos é ter um código Kotlin que seja idiomático ao Swift, mas, ao mesmo tempo, codando Kotlin com todo seu potencial.

Para isso, temos três opções:

1. Utilizar o plugin [SKIE (Swift Kotlin Interface Enhancer)](https://github.com/touchlab/SKIE)
2. Atualizar para o Kotlin 2.1 e utilizar o novo sistema de interoperabilidade entre Kotlin --> Swift.
3. Manualmente exportar extensions para cada acesso que queremos utilizar para o iOS, utilizando Swift.

A primeira opção é a mais robusta e a mais recomendada, já que o SKIE possuí uma série de funcionalidades que facilitam a interoperabilidade entre Kotlin e Swift.

A segunda opção, exportar código Swift utilizando Kotlin 2.1, continua em fase experimental, e não é recomendada para produção.

A terceira forma é bem manual e pode ser bem tediosa, mas é uma opção válida para quem não quer utilizar o SKIE. Como DEVs KMP, queremos escrever menos código possível, então é uma abordagem custosa de se escalar.

Para esse artigo, vamos utilizar o SKIE para melhorar a interoperabilidade entre Kotlin e Swift!

### Utilizando o SKIE para melhorar a interoperabilidade

Integrar o SKIE em um módulo KMP é bem tranquilo e o projeto fornece uma documentação detalhada sobre a integração, [SKIE > Installation](https://skie.touchlab.co/Installation)

Mas de forma resumida:

1. Aplicar o plugin `co.touchlab.skie` no `build.gradle.kts` do projeto KMP
2. O plugin deve ser aplicado apenas no módulo que gera o XCFramework.

Basicamente é isso, aplicar o plugin e sincronizar.

Agora, vamos retornar a nossa abordagem anterior e apenas exportar a função `helloWorld()` (sem a anotação `@HiddenFromObjC`):

```kotlin
// HelloWorld.apple.kt appleMain

actual fun helloWorld(): String = "Olá mundo Apple Main"
```

Seguimos o passo a passo para utilizar no Xcode:

1. Compilar o XCFramework com `./gradlew assembleKotlinSharedXCFramework`.
2. Aqui na minha máquina eu precisei de um clean build no Xcode, então `Products` > `Clean Build Folder`
3. No Xcode, `Products` > `Build for ...` > `Running`, ou simplesmente `cmd + shift + r`

Agora, podemos utilizar o código Kotlin no iOS de uma forma mais idiomática ao Swift:

```swift
import SwiftUI
import KotlinShared

struct ContentView: View {
    @State private var showText = false

    var body: some View {
        Button("Show Text") { showText.toggle() }
        if showText { Text(helloWorld()) }
    }
}
```

Analisando a função `helloWorld()`, observamos que o SKIE gera uma função global que é acessível diretamente no Swift. Essa função global acessa a função `helloWorld()` do Kotlin (na forma "feia"), e a expõe para o Swift.

<img src="https://media.rsicarelli.com/blog/kmp-102/shared/kotlin-shared-hello-world-skie.gif" style="max-width:500px" />

Muito melhor hein? Agora, conseguimos utilizar o código Kotlin no iOS de uma forma idiomática ao Swift!

### Considerações sobre o SKIE

O SKIE é extremamente poderoso e facilita muito a interoperabilidade entre Kotlin e Swift.

Porém, é importante lembrar que o SKIE é um plugin experimental, e está sujeito a mudança e depreciações.

Além disso, como é adicionado uma camada extra de conversão, a construção do XCFramework é deteriorada, e o tempo de build pode aumentar consideravelmente.

Isso porque o SKIE percorre todo o código Kotlin e cria seu par em Swift, o que pode ser um processo bem custoso. O SKIE fará isso não só com seu código Kotlin, mas também com todas as dependências que você exporta como "api" para o `KotlinShared`.

#### Reduzindo o tempo de build do SKIE utilizando anotações

Uma funcionalidade muito legal do SKIE é possibilidade de escolher quais funcionalidades do SKIE você quer utilizar.

Para isso, o SKIE fornece uma série de [anotações](https://github.com/touchlab/SKIE/tree/main/SKIE/common/configuration/annotations/impl/src/commonMain/kotlin/co/touchlab/skie/configuration/annotations) que permitem customizar a exportação de código Kotlin para Swift. Isso nos possibilita escolher a dedo qual código queremos exportar para o Swift, e reduzir o tempo de build do SKIE.

## Conclusões finais

Com esse artigo, conseguimos entender como utilizar código Kotlin no Swift, suas características e limitações, e como melhorar a interoperabilidade entre Kotlin e Swift com uma escrita alternativa de código Kotlin ou utilizando o SKIE.

O KMP é craque em exportar código Objective-C, mas estamos atualmente limitados na exportação de código Swift. Com o SKIE, conseguimos melhorar essa limitação e exportar código Kotlin de uma forma mais idiomática ao Swift. E, as próximas versões do Kotlin, a interoperabilidade entre Kotlin e Swift será ainda mais robusta e nativa.

Espero que tenham gostado do artigo! 🚀

Até a próxima 🤙
