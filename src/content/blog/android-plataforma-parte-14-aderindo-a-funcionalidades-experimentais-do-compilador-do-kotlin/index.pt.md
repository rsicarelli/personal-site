---
title: 'Android Plataforma - Parte 14: Aderindo a funcionalidades experimentais do compilador do Kotlin'
description: 'No último artigo, extendemos nossa plataforma com a capacidade de declarar módulos JVM.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 14
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F3qk47henua28l33se5vd.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-14-aderindo-a-funcionalidades-experimentais-do-compilador-do-kotlin-3b0g'
  devtoId: 1611131
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/14/opt-in-experimental-kotlin-compiler'
  reactions: 2
topic: android
difficulty: intermediate
contentType: tutorial
---

No último artigo, extendemos nossa plataforma com a capacidade de declarar módulos JVM.

Neste artigo, iremos além e configurar opções de compilação para permitir que cada módulo "adira" a funcionalidades experimentais.

---

## Opt-In no Kotlin

Uma das práticas adotadas por times ao projetar uma API de forma segura é o uso do sistema de "opt-in" para funcionalidades ou APIs específicas.

### Anotação `RequiresOptIn`

A anotação `RequiresOptIn` indica que uma classe de anotação é um marcador para uma API que exige um opt-in explícito.

Quando se depara com uma API anotada com um marcador que também está anotado com `RequiresOptIn`, o compilador nos força a concordar explicitamente em usar essa API.

```kotlin
@Target(ANNOTATION_CLASS)
@Retention(BINARY)
@SinceKotlin("1.3")
public annotation class RequiresOptIn(
    val message: String = "",
    val level: Level = Level.ERROR
) {
    public enum class Level {
        WARNING,
        ERROR,
    }
}
```

### Contagiosidade

APIs anotadas com marcadores que requerem opt-in são "contagiosas". Qualquer uso ou menção a essa API em outras declarações também demandará um opt-in.

Por exemplo:

```kotlin
@UnstableApi
class Unstable

@OptIn(UnstableApi::class)
fun foo(): Unstable = Unstable()
```

Ao tentar usar a função `foo`, seremos alertados sobre a necessidade de optar pela API instável.

### Anotação `OptIn`

A anotação `OptIn` nos permite declarar que estamos cientes e aceitamos os riscos associados ao uso de uma API marcada.

```kotlin
@Target(
    CLASS, PROPERTY, LOCAL_VARIABLE, VALUE_PARAMETER, CONSTRUCTOR, FUNCTION, PROPERTY_GETTER, PROPERTY_SETTER, EXPRESSION, FILE, TYPEALIAS
)
@Retention(SOURCE)
@SinceKotlin("1.3")
public annotation class OptIn(
    vararg val markerClass: KClass<out Annotation>
)
```

## Utilizando APIs experimentais

Para ilustrar tudo o que discutimos, vamos usar um componente do `Material3` que está anotado com `RequiresOptIn`:

```kotlin
import androidx.compose.material3.Card
..

@Composable
fun HomeScreen() {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        //IDE vai dar um erro/alerta nessa linha
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight()
                .padding(all = 16.dp),
            onClick = { },
            content = {
                DetailsScreen()
            }
        )
    }
}
```

Note o erro/alerta que surge na tela:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ziu7l59ez678zltzx6pj.png)

Para resolver esse erro, simplesmente adicionamos o `OptIn` em nosso compose:

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen() {
   ..
}
```

Para situações específicas, essa abordagem funciona. Mas considere funções que são usadas frequentemente, como `Flow.flatMapConcat`:

```kotlin
@OptIn(FlowPreview::class)
fun main() {
    flowOf(null)
        .flatMapConcat { flowOf(true) }
}
```

Repetir essa declaração em cada uso pode ser tedioso, especialmente em codebases extensos.

## Personalizando nossa compilação Kotlin para evitar a necessidade de `OptIn`

A boa notícia é que podemos configurar nosso `applyKotlinOptions()` para dar opt-in nas features necessárias.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1m7xwrr2kspiuxgno236.png)

**1 -** Atualizaremos nosso modelo `CompilationOptions` para aceitar uma lista de `FeatureOptIn`:

```kotlin
data class CompilationOptions(
    ..
    val featureOptIns: List<FeatureOptIn>,
) {

    val extraFreeCompilerArgs: List<String>
        get() = featureOptIns.map { "-opt-in=${it.flag}" }

    enum class FeatureOptIn(val flag: String) {
        ExperimentalMaterial3("androidx.compose.material3.ExperimentalMaterial3Api"),
        ExperimentalCoroutinesApi(flag = "kotlinx.coroutines.ExperimentalCoroutinesApi"),
    }
}

class CompilationOptionsBuilder {

    ..
    private val featureOptInsBuilder = FeatureOptInBuilder()

    fun optIn(vararg optIn: FeatureOptIn) {
        featureOptInsBuilder.apply {
            featureOptIns = optIn.toList()
        }
    }

    internal fun build(): CompilationOptions = CompilationOptions(
        ..
        featureOptIns = featureOptInsBuilder.build()
    )
}

class FeatureOptInBuilder {

    var featureOptIns: List<FeatureOptIn> = mutableListOf()

    internal fun build(): List<FeatureOptIn> = featureOptIns.toList()
}
```

**2 -** Vá até a função `fun applyKotlinOptions()` e atualize o uso:

```kotlin
internal fun Project.applyKotlinOptions(compilationOptions: CompilationOptions) {
    tasks.withType<KotlinCompile>().configureEach {
        kotlinOptions {
            allWarningsAsErrors = compilationOptions.allWarningsAsErrors
            jvmTarget = compilationOptions.jvmTarget
            compilerOptions.freeCompilerArgs.addAll(compilationOptions.extraFreeCompilerArgs)
        }
    }
}
```

**3 -** Sincronize o projeto. Em seguida, vá ao módulo que está usando essas features e utilize a nova DSL:

```kotlin
import com.rsicarelli.kplatform.androidLibrary
import com.rsicarelli.kplatform.options.CompilationOptions.FeatureOptIn.ExperimentalCoroutinesApi
import com.rsicarelli.kplatform.options.CompilationOptions.FeatureOptIn.ExperimentalMaterial3

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary(
    compilationOptionsBuilder = {
        optIn(ExperimentalCoroutinesApi, ExperimentalMaterial3)
    }
)

dependencies {
    ..
}
```

## Sucesso!

Agora, podemos usar as funcionalidades experimentais de Coroutines e Material3 sem a necessidade de adotar a anotação `OptIn`.

No próximo artigo, focaremos na qualidade de código, introduzindo recursos de análise estática com `Detekt` e `Spotless` para auxiliar na autoformatação, aderindo ao estilo de código do projeto (`.editorconfig`).
