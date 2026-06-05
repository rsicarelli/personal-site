---
title: 'Kotlin Koans BR: Alias para importação (import alias)'
description: 'Ao importar uma classe ou função, você pode especificar um nome diferente para ela adicionando como NewName após a diretiva de importação. Isso pode ser…'
pubDate: 2024-04-06
tags:
  - 'kotlin'
  - 'braziliandevs'
  - 'mobile'
  - 'kmp'
series: 'kotlin-koans-br'
seriesOrder: 12
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-alias-para-importacao-import-alias-5ahe'
  devtoId: 1813348
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 3
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Classes/Rename%20on%20import/Task.kt)

Ao [importar](https://kotlinlang.org/docs/packages.html#imports) uma classe ou função, você pode especificar um nome diferente para ela adicionando como NewName após a diretiva de importação. Isso pode ser útil se você quiser usar duas classes ou funções com nomes semelhantes de bibliotecas diferentes.

Descomente o código e faça-o compilar. Renomeie `Random` do pacote Kotlin para `KRandom` e `Random` do pacote Java para `JRandom`.

## Introdução ao "rename imports" do Kotlin.

Constantemente, durante o dia a dia do desenvolvimento, utilizamos diversas funções e classes que têm o mesmo nome.

Por exemplo, suponha que você precise usar o Random do pacote `kotlin.random` e, ao mesmo tempo, o `Random` do pacote `java.util`:

```kotlin
fun useDifferentRandomClasses(): String {
   val kotlinRandom = kotlin.random.Random.nextInt(2)
   val javaRandom = java.util.Random().nextInt(2)

   return "Kotlin: $kotlinRandom, Java: $javaRandom."
}
```

Aqui, você precisa fazer uma escolha: ou importar o `java.util` ou `kotlin.random`:

```kotlin
import kotlin.random.Random

fun useDifferentRandomClasses() {
    val kotlinRandom = Random.nextInt(2)
    val javaRandom= java.util.Random().nextInt(2)
}
```

ou...

```kotlin
import java.util.Random

fun useDifferentRandomClasses(): String {
    val kotlinRandom = kotlin.random.Random.nextInt(2)
    val javaRandom = Random().nextInt(/* bound = */ 2)
}
```

Ao tentar importar os 2, recebemos um erro na IDE:

![Conflito ao importar](https://media.rsicarelli.com/blog/kotlin-koans-br/shared/import-conflict-kotlin.png)

## Introduzindo o "import alias"

Existem duas formas de resolver esse problema. A primeira é você utilizar o "full qualifier", ou seja, declarar a classe que deseja usar juntamente com o pacote:

```kotlin
kotlin.random.Random.nextInt(2)
java.util.Random().nextInt(2)
```

Essa abordagem é totalmente válida, mas requer um esforço cognitivo adicional para compreender a origem de cada instância de `Random`.

Há também uma preocupação estética e de organização. Imagine, por exemplo, que você tenha duas classes com o mesmo nome em seu repositório, e ambas estejam em pacotes extensos:

```kotlin
val errorCore = br.com.rsicarelli.multiplatform.core.errorMessages.shared.apiErrors.Error
val errorFeature = br.com.rsicarelli.multiplatform.feartures.home.errorMessages.shared.apiErrors.Error
```

A leitura fica bastante prejudicada, o que causa problemas de compreensão.

É aqui que os _import aliases_ do Kotlin entram em jogo:

```kotlin
import br.com.rsicarelli.multiplatform.core.errorMessages.shared.apiErrors.Error as CoreError
import br.com.rsicarelli.multiplatform.feartures.home.errorMessages.shared.apiErrors.Error as FeatureError

val errorCore = CoreError
val errorFeature = FeatureError
```

Dessa forma, os imports ficam organizados, reaproveitáveis, e você reduz o esforço cognitivo de ler e seguir seu código, tornando-o mais limpo e coeso!

## Conclusão

O import alias no Kotlin serve para ajudar a organizar melhor nosso código, além de resolver conflitos de import com classes e funções com o mesmo nome.

Essa funcionalidade é poderosa e nos permite contextualizar melhor nosso código, auxiliando na leitura e compreensão.
