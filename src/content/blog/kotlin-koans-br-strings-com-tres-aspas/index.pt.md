---
title: 'Kotlin Koans BR: Strings com três aspas'
description: 'Substitua a chamada trimIndent pela chamada trimMargin, definindo # como valor de prefixo, assim a string resultante não conterá o caractere de prefixo.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 4
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F7i8v3zse00a2qe2uta0q.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-strings-com-tres-aspas-3202'
  devtoId: 1783116
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Introduction/Triple-quoted%20strings/Task.kt)

Substitua a chamada `trimIndent` pela chamada `trimMargin`, definindo `#` como valor de prefixo, assim a string resultante não conterá o caractere de prefixo.

Há funções como [`trimIndent`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim-indent.html) e [`trimMargin`] (https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim-margin.html) que servem para formatar strings de múltiplas linhas com aspas triplas conforme o contexto do código.

## Caso de uso

Em Kotlin, as [aspas triplas](https://kotlinlang.org/docs/strings.html#multiline-strings) (`multiline strings`) facilitam a representação de Strings com várias linhas e caracteres especiais, eliminando a necessidade de escapá-los.

Esta técnica realça a clareza do código e simplifica a gestão de textos longos ou com estruturas intrincadas.

Utilizando um par de três aspas `""" """`, é possível declarar um texto de múltiplas linhas em Kotlin.

```kotlin
val texto = """
    Esta é uma string que contém
    várias linhas
    sem a necessidade de caracteres de escape.
"""
```

Neste contexto, sequências como `\n` (nova linha) e `\t` (tabulação) são interpretadas literalmente como texto, sem receber tratamento
especial.

### Vantagens

- **Simplicidade**: facilidade para trabalhar com textos longos ou com formatações específicas.
- **Escape de caracteres não é necessário**: caracteres especiais não precisam ser "escapados", melhorando a clareza e a legibilidade do código.
- **Oferecem um tipo de modelo de String**, facilitando a incorporação de valores dinâmicos em textos e tornando a manipulação de strings mais versátil.

### Desvantagens

- **Espaço em branco indesejado** pode ser evitado utilizando funções como `trimMargin()` e `trimIndent()` para remover esses espaços extras.
- **Menos suporte em algumas IDEs** embora seja raro, é possível que algumas IDEs e ferramentas de edição de texto enfrentam desafios na coloração de sintaxe ou na formatação automática.
- **Problemas de desempenho**: em algumas situações, como loops intensivos, seu uso excessivo pode levar a problemas de desempenho.

## Analogia

As aspas triplas em Kotlin são como os murais nas paredes. Um mural não é interrompido por molduras ou limites, permitindo que a arte se estenda por toda a superfície sem interrupção.

```kotlin
val coracao = """
    ,d88b.d88b,
    88888888888
    `Y8888888Y'
      `Y888Y'
        `Y'
"""
```
