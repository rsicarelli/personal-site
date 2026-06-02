---
title: 'Kotlin Koans BR: Extension functions e properties (funções e propriedades estendidas)'
description: 'Implemente as funções de extensão Int.r() e Pair.r() e faça com que elas convertam Int e Pair em um RationalNumber.'
pubDate: 2024-04-06
tags:
  - 'kotlin'
  - 'braziliandevs'
  - 'mobile'
  - 'kmp'
series: 'kotlin-koans-br'
seriesOrder: 13
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fi1sa1wvhb23tg0s9tvkx.png'
translated: false
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-extension-functions-e-properties-funcoes-e-propriedades-estendidas-e39'
  devtoId: 1813363
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 7
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Classes/Extension%20functions/Task.kt)

Implemente as funções de extensão `Int.r()` e `Pair.r()` e faça com que elas convertam `Int` e `Pair` em um `RationalNumber`.

## Introdução as extension functions no Kotlin

Em Kotlin, as [extension functions](https://kotlinlang.org/docs/extensions.html#extension-functions) são uma ferramenta poderosa que permite adicionar novas funcionalidades a uma classe sem a necessidade de modificá-la ou herdá-la: você a "estende".

Essa ferramenta nos ajuda a isolar melhor nosso código, reaproveitar, e contextualizar dependendo do uso.

Vamos supor que você possua a seguinte classe hipotética que calcula valores de frete:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String {
        val value : Double = 10.50
        return "${value * 100}%"
    }

    fun calculateFastDelivery(): String {
        val value : Double = 22.90
        return "${value * 100}%"
    }

    fun calculateScheduledDelivery(): String {
        val value : Double = 15.50
        return "${value * 100}%"
    }
}
```

Perceba que estamos repetindo a lógica de cálculo de porcentagem 3 vezes: `"${valor * 100}%"`

Para evitar a repetição do código, podemos extrair apenas esse cálculo em uma função que recebe o `valor`:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String {
        val value : Double = 10.50
        return formatAsPercentage(value)
    }

    fun calculateFastDelivery(): String {
        val value : Double = 22.90
        return formatAsPercentage(value)
    }

    fun calculateScheduledDelivery(): String {
        val value : Double = 15.50
        return formatAsPercentage(value)
    }

    private fun formatAsPercentage(value: Double) = "${value * 100}%"
}
```

Essa opção já é ótima e nos ajuda a reaproveitar nosso código. Porém, com as extension functions do Kotlin, existe uma forma mais idiomática e elegante de resolver o mesmo problema

Ao criar uma extensão, essa função atua como se fosse um membro daquela classe, mas internamente o compilador a trata como apenas uma função comum que aceita uma instância daquela classe como seu primeiro parâmetro.

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String {
        val value : Double = 10.50
        return value.formatAsPercentage()
    }

    fun calculateFastDelivery(): String {
        val value : Double = 22.90
        return value.formatAsPercentage()
    }

    fun calculateScheduledDelivery(): String {
        val value : Double = 15.50
        return value.formatAsPercentage()
    }

    private fun Double.formatAsPercentage() = "${this * 100}%"
}
```

Ou ainda:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String = 10.50.formatAsPercentage()

    fun calculateFastDelivery(): String = 22.90.formatAsPercentage()

    fun calculateScheduledDelivery(): String = 15.50.formatAsPercentage()

    private fun Double.formatAsPercentage() = "${this * 100}%"
}
```

A maior vantagem é que estamos contextualizando a função e estendendo a classe `Double` (que é fechada), adaptando apenas para nosso contexto específico.

Também é possível declarar funcões de "high-order" e reaproveitar em todo o repositório:

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String = 10.50.formatAsPercentage()

    fun calculateFastDelivery(): String = 22.90.formatAsPercentage()

    fun calculateScheduledDelivery(): String = 15.50.formatAsPercentage()
}

// Pública para todo o repositório
fun Double.formatAsPercentage() = "${this * 100}%"
```

### Extension properties (estendendo propriedades)

No caso acima, uma função pode ser redundante, já que não há nenhum parâmetro para a função `formatAsPercentage()`.

Para resolver isso, o Kotlin também nos possibilita estender propriedades da classe, tornando o código ainda mais limpo.

```kotlin
class DeliveryCalculator {
    fun calculateDefaultDelivery(): String = 10.50.asPercentage

    fun calculateFastDelivery(): String = 22.90.asPercentage

    fun calculateScheduledDelivery(): String = 15.50.asPercentage

    private val Double.asPercentage
        get() = "${this * 100}%"
}
```

### Como elas funcionam?

Por baixo dos panos, uma extensão é apenas uma função estática que recebe o objeto que você está "expandindo" (o objeto receptor) como seu primeiro argumento.

Dessa forma, não existe uma sobrecarga de desempenho ao usar funções de extensão em comparação com funções normais.

### Vantagens

- **Melhora a legibilidade do código**: Muitas vezes, chamar um método em um objeto é mais intuitivo do que passar o objeto como um argumento para uma função.
- **Evita poluição do namespace**: Ao invés de criar funções de utilidade genérica, você pode criar as suas próprias extensões privadas apenas no contexto onde ela é utilizada.
- **Evita subclasses desnecessárias**: Em vez de criar uma subclasse apenas para adicionar algumas funcionalidades, você pode criar extensões

### Desvantagens

- **Não substituem métodos originais**: Se a classe original tiver um método com a mesma assinatura da função de extensão, a função original será chamado.
- **Acesso limitado**: funções de extensão não podem acessar membros protegidos ou privados da classe.
- **Podem levar à confusão**: O uso excessivo sem organização adequada pode tornar o código difícil de entender.

#### Testabilidade

- **Isolamento e pureza**: Idealmente, as funções de extensão devem operar como funções puras, tornando os testes mais previsíveis.
- **Restrição de acesso**: Sua incapacidade de acessar membros privados torna as funções de extensão mais fáceis de testar.
- **Simplicidade**: funções de extensão devem ter uma única responsabilidade. Isto facilita o teste.

### Pair

No exercício, nos deparamos com uma classe específica do Kotlin.

Em Kotlin, [Pair](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-pair/) é uma classe que representa um valor composto por dois elementos - uma 'dupla'. É uma maneira simples de armazenar dois valores relacionados juntos, mas sem semântica particular.

`Pair` é uma classe definida na `stdlib`:

```kotlin
data class Pair<out A, out B>(
    val first: A,
    val second: B
)
```

## Conclusão

As extension functions e properties do Kotlin serão ferramentas que irão acompanhá-lo durante toda a sua trajetória como DEV Kotlin.

Elas nos ajudam a organizar e reaproveitar nosso código, contextualizando e incentivando funções puras e isoladas que facilitam a compreensão do código-fonte.
