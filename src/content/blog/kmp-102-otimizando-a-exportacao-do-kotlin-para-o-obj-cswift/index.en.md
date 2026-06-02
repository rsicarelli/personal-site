---
title: "KMP-102 - Otimizando o Kotlin para o Obj-c/Swift"
description: "No último post, aprendemos como utilizar código Kotlin no Swift. Aprendemos sobre algumas técnicas para melhorar o codigo exportado para o Swift, e como…"
pubDate: 2025-01-18
updatedDate: 2025-03-07
tags:
  - "mobile"
  - "kmp"
  - "kotlin"
  - "braziliandevs"
series: "kmp-102"
seriesOrder: 4
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fcfwlg9ef4ssxqh9o8v3l.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/kmp-102-otimizando-a-exportacao-do-kotlin-para-o-obj-cswift-358p"
  devtoId: 2222232
  githubRepo: "https://github.com/rsicarelli/KMP-101"
  reactions: 16
---

No último post, aprendemos como utilizar código Kotlin no Swift.
Aprendemos sobre algumas técnicas para melhorar o codigo exportado para o Swift,
e como as anotações como `@HiddenFromObjC` e `@HidesFromObjC` controlam a visibilidade do código no Swift.

Nesse post, vamos aprofundar sobre como essa exportação funciona e o impacto no nosso código gerado.

  * [Como o Kotlin/Native exporta código para o Swift](#como-o-kotlinnative-exporta-código-para-o-swift)
  * [Recapitulando a exportação de código](#recapitulando-a-exportação-de-código)
    * [💡 Resumindo](#-resumindo)
  * [Como o Kotlin/Native resolve os tipos Kotlin para Objective-C?](#como-o-kotlinnative-resolve-os-tipos-kotlin-para-objective-c)
  * [Controlando o que é exportado para os Headers](#controlando-o-que-é-exportado-para-os-headers)
    * [🤔 Mas por que eu devo me preocupar com isso?](#-mas-por-que-eu-devo-me-preocupar-com-isso)
    * [Recomendação de paragidma de exportação](#recomendação-de-paragidma-de-exportação)
    * [Formas de esconder código Kotlin do Objective-C](#formas-de-esconder-código-kotlin-do-objective-c)
      * [1. Utilizando o modificador `internal`](#1-utilizando-o-modificador-internal)
      * [2. Utilizando as anotações `@HiddenFromObjC` e `@HidesFromObjC`](#2-utilizando-as-anotações-hiddenfromobjc-e-hidesfromobjc)
        * [2.1 @HiddenFromObjC](#21-hiddenfromobjc)
        * [2.2 @HidesFromObjC](#22-hidesfromobjc)
  * [Impacto do uso do `internal`, `@HiddenFromObjC` e `@HidesFromObjC` no codebase](#impacto-do-uso-do-internal-hiddenfromobjc-e-hidesfromobjc-no-codebase)
  * [Conclusão](#conclusão)

## Recapitulando a exportação de código

Ao compilar um `.framework` com o Kotlin/Native, o compilador gera uma série de arquivos, sendo eles:

<p align="center">
  <img src="https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/kotlin-native-xcframework-expanded.png?raw=true" width="300" />
</p>

- `Headers/KotlinShared.h`: Interface gerada pelo KMP que expõe as funções e classes Kotlin para o Objective-C/Swift.
- `KotlinShared.c` (ou sem extensão): Arquivo binário compilado que contém as implementações nativas do código Kotlin, traduzido para [LLVM IR](https://mcyoung.xyz/2023/08/01/llvm-ir/).
- Outros componentes (como `.plist` e `bundles`): Informações adicionais necessárias para o funcionamento do framework no iOS.

### 💡 Resumindo

- `KotlinShared.h`: é o que está visível para utilizar no Obj-c/Swift
- `KotlinShared.c`: é a compilação interna, que não está exposto.

## Como o Kotlin/Native resolve os tipos Kotlin para Objective-C?
Ao compilar código com o Kotlin/Native, o compilador segue uma série de etapas para traduzir tipos e estruturas Kotlin para algo compreensível pelo Objective-C (e, consequentemente, pelo Swift). O resultado dessa tradução é o arquivo `KotlinShared.h`, que mapeia os tipos Kotlin para seus equivalentes nativos.

Por exemplo, uma `String` no Kotlin é transformado em `NSString`, enquanto coleções como `List` e `Map` são traduzidas para `NSArray` e `NSDictionary`. Além disso, o compilador preserva informações importantes, como nullability, garantindo que valores nullable e non-nullable sejam representados corretamente no Objective-C.

Aqui, a classe Kotlin `Person` foi mapeada diretamente para uma classe Objective-C, com propriedades como `name` traduzidas para `NSString` e `parents` para `NSArray<Person *>`.

```kotlin
class Person(
    val name: String,
    val age: Int,
    val parents: List<Person>
)
```

```objective-c
#import <Foundation/Foundation.h>

NS_SWIFT_NAME(Person)
@interface Person : NSObject

@property (readonly) NSString * _Nonnull name;
@property (readonly) NSInteger age;
@property (readonly) NSArray<Person *> * _Nonnull parents;

- (instancetype _Nonnull)initWithName:(NSString * _Nonnull)name 
                                  age:(NSInteger)age 
                              parents:(NSArray<Person *> * _Nonnull)parents;

@end
```

## Controlando o que é exportado para os Headers
Esse conceito é crucial, especialmente se você busca escalar o KMP no seu projeto.

Por padrão, tudo que é **público no Kotlin é exportado para o Objective-C**, o que não é ideal em projetos grandes. À medida que o código cresce, o arquivo `KotlinShared.h` pode se tornar extenso, impactando o desempenho da compilação e dificultando a manutenção.

### 🤔 Mas por que eu devo me preocupar com isso?
A medida que seu projeto cresce, você terá mais e mais código Kotlin sendo processado e exportado para os Headers. 

Isso pode (e vai) resultar em **um arquivo `KotlinShared.h` gigante**, com centenas de linhas de código.

Com um `KotlinShared.h` grande, a compilação do seu XCFramework irá ficar mais lenta, pois o compilador precisa processar todas as declarações do Kotlin para gerar os Headers.

Além disso, um `KotlinShared.h` grande pode resultar em **mais erros de compilação** no Xcode, pois o compilador do Swift precisa processar todas as declarações do Kotlin para gerar o binário final.

Por último, a experiência de desenvolvimento é deteriodada, já que toda vez que você precisa checar o `KotlinShared.h` no Xcode, você terá que lidar com um arquivo gigante e difícil de navegar, além de uma demora maior para abrir o arquivo no Xcode.

### 💡 Resumindo
- Se seu time quer escalar o KMP, é importante controlar o que é exportado para o Objective-C.
- Isso garante que o `KotlinShared.h` seja enxuto e fácil de navegar, acelerando a compilação do XCFramework e melhorando a experiência de desenvolvimento (vamos nos aprofundar nisso em um post futuro).
- É extremamente recomendado que seu time propague a cultura de controlar o que é exportado para o Objective-C desde o começo, para evitar problemas de escalabilidade no futuro.
- Esconder código Kotlin do Objective-C é **considerada boa prática**. O famoso "combinado não sai caro" se aplica muito bem aqui 😅.

### Recomendação de paragidma de exportação
Aqui temos muito o que aprender com bibliotecas open source. Ao consumir uma biblioteca open source, é comum você ter acesso apenas a uma interface bem definida, com poucos detalhes de implementação.

Isso ajuda a gente (que consome a biblioteca) a entender o que a biblioteca faz, sem precisar entender como ela faz. Isso é o que chamamos de **encapsulamento**. Além do mais, a experiência na IDE é elevada, já que o auto-complete e a navegação entre arquivos é mais rápida e precisa.

Com isso em mente, a recomendação é **esconder o máximo possível do código Kotlin do Objective-C**. Isso significa que você deve exportar apenas o que é necessário para o Swift consumir, e esconder o resto.

A mentalidade é a seguinte:
> ✅ Esconder por padrão. 
> 
> ⚠️ Expor apenas o necessário.

### Formas de esconder código Kotlin do Objective-C
Existem 3 formas de esconder código Kotlin do Objective-C:

#### 1. Utilizando o modificador `internal`
Essa abordargem é a mais recomendada, pois gera um impacto positivo no seu código Kotlin consumido em outros source sets (Android, Desktop, Common, etc).

Por padrão, o modificador `internal` faz com que a declaração seja visível apenas no módulo em que foi declarada. Isso significa que o código Kotlin marcado como `internal` não será exportado para o Objective-C.

```kotlin
internal data class Person(
    val name: String,
    val age: Int,
    val parents: List<Person>
)
```

#### 2. Utilizando as anotações `@HiddenFromObjC` e `@HidesFromObjC`

As anotações `@HiddenFromObjC` e `@HidesFromObjC` são específicas do Kotlin/Native e têm como objetivo controlar a visibilidade de métodos, propriedades ou classes na interoperabilidade com Objective-C/Swift. Elas influenciam como os elementos Kotlin são expostos ao framework gerado pelo Kotlin/Native para uso em projetos iOS.

##### 2.1 @HiddenFromObjC
Essa anotação é usada para **ocultar completamente um elemento Kotlin da API exposta para Objective-C/Swift**. Qualquer método, propriedade ou classe anotada com `@HiddenFromObjC` não será gerado no framework resultante e, portanto, não será visível em projetos Swift/Objective-C.

```kotlin
@HiddenFromObjC
fun internalUtilityFunction() {
    // Esta função não será exposta para Objective-C/Swift
}
@HiddenFromObjC
class InternalHelper {
    fun doSomething() {
        // Esta classe inteira será invisível no framework gerado
    }
}
```

##### 2.2 @HidesFromObjC
É uma **meta-anotação**, ou seja, ela é usada para marcar outras anotações que serão aplicadas a elementos do código Kotlin.

Quando uma anotação é marcada com `@HidesFromObjC`, qualquer elemento que for anotado com essa anotação será automaticamente removido da API Objective-C pública gerada.

`@HidesFromObjC` permite uma maior flexibilidade, já que você pode criar suas próprias anotações com essa funcionalidade.

Exemplos de uso incluem criar anotações personalizadas que escondem partes do código da API Objective-C, enquanto ainda permitem que o elemento permaneça disponível no Kotlin.

Aqui, a anotação personalizada `@InternalUseOnly` utiliza `@HidesFromObjC`, o que automaticamente remove qualquer função ou classe anotada com ela da API Objective-C.

```kotlin
@HidesFromObjC
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
annotation class InternalUseOnly

@InternalUseOnly
fun internalFunction() {
    println("Esta função não será exposta ao Objective-C")
}
```

## Impacto do uso do `internal`, `@HiddenFromObjC` e `@HidesFromObjC` no codebase
Ao controlar o que é exportado:
•	Você reduz a superfície da API pública, evitando confusões e erros.
•	O tamanho do framework gerado diminui, melhorando o desempenho do build.
•	A segurança aumenta, já que classes ou métodos internos não ficam acessíveis no iOS.
•	A manutenção se torna mais simples, com uma API mais limpa e focada.

## Conclusão
Controlar o que é exportado para o Objective-C é uma prática essencial para manter a qualidade e a escalabilidade do seu projeto KMP.

Ao esconder código Kotlin do Objective-C, você garante que apenas o necessário é exposto para o Swift, mantendo a API enxuta e fácil de navegar.

Além disso, você evita problemas de performance, segurança e manutenção, garantindo que seu projeto KMP seja escalável e fácil de manter.

👍 É de suma importância que você e seu time adotem essa prática desde o início do projeto, para evitar problemas de escalabilidade no futuro.

Com esse conceito bem fixado, podemos avançar no próximo post onde iremos explorar uma estratégia que irá desbloquear a escala do KMP no seu projeto (spoiler: utilizando `.klibs`).

Nos vemos na próxima ✌️
