---
title: 'Kotlin Koans BR: Olá, mundo!'
description: 'Altere o código para que a função start retorne a string "OK".'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 1
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F0kuchkfp7latpkvmkj89.png'
translated: false
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-ola-mundo-2dpf'
  devtoId: 1783049
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Introduction/Hello,%20world!/Task.kt)

Altere o código para que a função `start` retorne a string `"OK"`.

Nas tarefas do Kotlin Koans, a função `TODO()` lançará uma exceção.

Para concluir o Kotlin Koans, a invocação de função deve ser substituída por um código significativo conforme o problema.

## Casos de uso

No Kotlin, funções são blocos de código designados para tarefas específicas. Funções são fundamentais na linguagem, ajudando na organização, reutilização e execução eficiente de ações.

```kotlin
fun nomeDaFuncao(
    argumento1: Tipo,
    argumento2: Tipo,
): TipoDeRetorno {
    return valorDeRetorno
}
```

- `fun` palavra-chave reservada para declarar uma função.
- `nomeDaFuncao` indica e declara a função de forma clara e específica.
- `(argumento1: Tipo, argumento2: Tipo)` especifica os parâmetros que a função irá receber, separados por `,`. Obrigatóriamente, todo
  parâmetro precisa ter um nome que fica à esquerda do símbolo `:`, e à direita o seu tipo.
- `: TipoDeRetorno` após o símbolo `:`, indica o tipo de valor que a função vai retornar após sua execução.
- `{}` representa o corpo da função, onde estão as instruções a serem executadas.

### Função simples

A seguir temos uma função simples que soma dois números inteiros e retorna o resultado

```kotlin
fun somar(a: Int, b: Int): Int {
    val resultado = a + b
    return resultado
}

val resultadoSoma = somar(3, 5)
println(resultadoSoma) // Resultado: 8
```

### Funções em uma linha

Em Kotlin, quando a função tem só uma expressão depois do símbolo `=`, e o tipo de retorno é claro ou pode ser inferido, o compilador sabe que o resultado dessa expressão é o retorno da função.

Isso possibilita remover o corpo `{}` e utilizar como expressão `=`.

Ou seja, ela é transformada de **block body** (corpo em block) para **expression body** (corpo como expressão):

```kotlin
fun dobrar(numero: Int): Int = numero * 2

val numeroDobrado = dobrar(7)
println(numeroDobrado) // Resultado: 14
```

> 💡 Em Kotlin, ao ter uma função que avalia uma expressão simples, a prática convencional é utilizar o corpo como expressão (expression
> body) em vez do corpo em bloco (block body). Geralmente, funções mais curtas são mais fáceis de serem compreendidas.

### Função sem retorno

Quando uma função não tem um valor de retorno definido, ela é entendida como `Unit`, que é parecido com o `void` em outras linguagens.

O `Unit` no Kotlin indica que uma função não retorna nada.

A seguir, todas as expressões são equivalentes e válidas:

```kotlin
//Uso comum
fun exibirMensagem() {}
fun exibirMensagem() = Unit

//Uso incomum, porém equivalente
fun exibirMensagem() {
    Unit
}
fun exibirMensagem(): Unit {}
fun exibirMensagem(): Unit {
    Unit
}
fun exibirMensagem(): Unit = Unit
```

### Lidando com múltiplos parâmetros usando _vararg_

O `vararg` no Kotlin é usado para aceitar vários argumentos em uma função.

```kotlin
fun imprimirItens(vararg itens: String) {
    for (item in itens) {
        println(item)
    }
}

imprimirItens("Paçoca", "Cajú", "Açaí")
```

### Declarando variáveis

No Kotlin, há duas maneiras comuns de declarar variáveis: com `val` e com `var`.

- `val` é um valor fixo, apenas para leitura.

```kotlin
val tituloDoLivro = "A Jornada Dev"
// tituloDoLivro = "Outro Título" //impossível
```

- `var` é um valor não fixo, tanto para escrita quanto para leitura.

```kotlin
var paginaDeRascunho = "Minha ideia"
paginaDeRascunho = "Uma ideia diferente" // permitido
```

> 💡 `val` não é sinônimo de imutável. Embora não possa reatribuir um valor, o conteúdo interno ainda pode ser alterado.

```kotlin
val lista = mutableListOf("a", "b", "c")
// lista = mutableListOf("d", "e", "f") // Erro de compilação, pois `val` é só para leitura.

lista.add("d") // Isso é permitido, pois estamos modificando o conteúdo interno da lista e não reatribuindo um novo valor a ela.
```

## 🔗 [Tipos em Kotlin](https://kotlinlang.org/docs/kotlin-tour-basic-types.html)

Os tipos definem a natureza de um valor e determinam as operações que podem ser realizadas com esse valor.

Alguns tipos no Kotlin:

```kotlin
// Int: Representa valores inteiros.
val anoAtual: Int = 2023

// Double: Números com casas decimais de alta precisão.
val peso: Double = 1.534776

// Float: Números com casas decimais de precisão menor.
val altura: Float = 1.82F

// Long: Ideal para grandes valores inteiros.
val populacaoMundial: Long = 7800000000L

// Char: Indica um caractere único.
val inicial: Char = 'K'

// Boolean: Admite apenas verdadeiro ou falso.
val estudandoKotlin: Boolean = true

// String: Conjunto de caracteres formando um texto.
val nome: String = "Chico"

// List: Agrupa vários elementos em uma ordem.
val livros: List<String> = listOf("Kotlin para Iniciantes", "Programação Funcional")

// MutableList: Lista que permite adições e remoções.
val animais: MutableList<String> = mutableListOf("Cão", "Gato")

// Set: Coleção com elementos únicos, sem duplicatas.
val cores: Set<String> = setOf("Vermelho", "Azul", "Verde")

// Sequence: Sequência para grandes coleções ou cálculos complexos.
val numeros: Sequence<Int> = sequenceOf(1, 2, 3, 4, 5)

// Map: Relaciona chaves e valores.
val dicionario: Map<String, String> = mapOf(
    "Kotlin" to "Uma linguagem de programação",
    "Lua" to "Outra linguagem de programação"
)

// HashSet: Conjunto baseado em hash, sem ordenação específica.
val frutas: HashSet<String> = hashSetOf("Maçã", "Banana", "Laranja")

// HashMap: Mapa baseado em hash, sem ordenação específica.
val capitais: HashMap<String, String> = hashMapOf(
    "Brasil" to "Brasília",
    "China" to "Beijing"
)

// Array: Parecido com List, mas tem tamanho definido.
val diasDaSemana: Array<String> = arrayOf("Segunda", "Terça", "Quarta")

// Pair: Agrupa dois valores de possivelmente diferentes tipos.
val nomeIdade: Pair<String, Int> = Pair(first = "Rodrigo", second = 30)

// Triple: Agrupa três valores de possivelmente diferentes tipos.
val coordenadas: Triple<Double, Double, Double> = Triple(first = 12.5, second = 45.6, third = 78.9)

// Any: Superclasse de todos os tipos não-nulos em Kotlin.
val qualquerCoisa: Any = "Isso poderia ser qualquer objeto"

// Nothing: Representa um valor que nunca ocorre, usado para funções que nunca retornam.
val erro: Nothing = Nothing

// Byte: Valor integral de 8 bits, entre -128 e 127.
val exemploByte: Byte = 127

// UByte: Byte positivo, varia de 0 a 255.
val uByteExemplo: UByte = 255u

// UShort: Valor positivo e curto, varia de 0 a 65,535.
val uShortExemplo: UShort = 65535u

// UInt: Valor integral positivo, varia de 0 a 4,294,967,295.
val uIntExemplo: UInt = 4294967295u

// ULong: Valor integral positivo bem grande, varia de 0 a 18,446,744,073,709,551,615.
val uLongExemplo: ULong = 18446744073709551615uL
```
