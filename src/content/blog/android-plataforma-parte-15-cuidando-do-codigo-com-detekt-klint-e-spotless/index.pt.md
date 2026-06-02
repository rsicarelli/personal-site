---
title: "Android Plataforma - Parte 15: Cuidando do código com Detekt, Klint e Spotless"
description: "No último artigo, abordamos a capacidade de nossa plataforma aderir a funcionalidades experimentais em diferentes módulos."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 15
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fqeipccc0f9v0d70smukv.png"
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-15-cuidando-do-codigo-com-detekt-klint-e-spotless-50n7"
  devtoId: 1611222
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/15/enhancing-code-quality"
  reactions: 2
---

No último artigo, abordamos a capacidade de nossa plataforma aderir a funcionalidades experimentais em diferentes módulos. 

Agora, vamos explorar a garantia da qualidade do código através da integração de plugins.

---

## Por que focar em automatizar verificações do código?
Quando se trabalha em equipe, é vital ter padrões de estilo e nomenclatura para manter a consistência. Estabelecer um padrão sólido ajuda a reduzir a sobrecarga de decisões e facilita a colaboração.

Pense assim: ao se juntar a uma orquestra, seguimos a pessoa contudora que dita ritmo da música. É o mesmo com nosso módulos; seguimos padrões preestabelecidos e acordados pelo time de forma automatizada.

Essa prática é especialmente útil para quando uma pessoa nova entra no time, além de que os acordos fiquem documentados e codificados, abertos para colaboração.

## Incluíndo análise de código estático com Detekt
O `Detekt` é talvez a ferramenta mais famosa em Kotlin para analisar o código e garantir que algumas práticas são aplicadas.

Não iremos focar muito nas suas funcionalidades, vamos direto pra implementação

### Passo a passo
**1 -** Vamos começar declarando o `detekt` no nossos `libs.versions.toml`:
```toml
[versions]
detekt = "1.23.1"
detektCompose = "0.2.3"

[libraries]
gradlePlugin-detekt = { module = "io.gitlab.arturbosch.detekt:detekt-gradle-plugin", version.ref = "detekt" }

detektRules-compose = { module = "io.nlopez.compose.rules:detekt", version.ref = "detektCompose" }
detektRules-formatting = { module = "io.gitlab.arturbosch.detekt:detekt-formatting", version.ref = "detekt" }
detektRules-libraries = { module = "io.gitlab.arturbosch.detekt:detekt-rules-libraries", version.ref = "detekt" }

[plugins]
arturbosch-detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
```

**2 -** Sincronize o projeto. Navegue até `build-logic/build.gradle.kts` e vamos compilar a dependencia do `detekt` na nossa plataforma:

```kotlin
dependencies {
    compileOnly(libs.gradlePlugin.android)
    compileOnly(libs.gradlePlugin.kotlin)
    compileOnly(libs.gradlePlugin.detekt)
}
```

**3 -** Sincronize o projeto. Agora, vamos declarar nossa DSL do `DetektOptions`.

Crie um arquivo `DetektOptions` em `build-logic/src/../options`

```kotlin
data class DetektOptions(
    val parallel: Boolean,
    val buildUponDefaultConfig: Boolean,
    val configFileNames: List<String>,
    val includes: List<String>,
    val excludes: List<String>
)

class DetektOptionsBuilder {

    var parallel: Boolean = true
    var configFiles: List<String> = listOf(".detekt.yml, .detekt-compose.yml")
    var buildUponDefaultConfig: Boolean = true
    var includes: List<String> = listOf("**/*.kt", "**/*.kts")
    var excludes: List<String> = listOf(".*/resources/.*", ".*/build/.*")

    internal fun build(): DetektOptions = DetektOptions(
        parallel = parallel,
        configFileNames = configFiles,
        includes = includes,
        excludes = excludes,
        buildUponDefaultConfig = buildUponDefaultConfig
    )
}
```

**4 -** Em seguida, crie um novo arquivo `detekt.kt` em `build-logic/src/.../decorations` e declare uma função `applyDetekt()`

Essa configurações impoe que:
1. Esse plugin só poderá ser chamado no `build.gradle.kts` da raíz
2. Exista um arquivo `.detekt.yml` na raíz do projeto
3. Exista um arquivo `.detekt-compose.yml` na raíz do projeto

```kotlin
import com.rsicarelli.kplatform.options.DetektOptions
import io.gitlab.arturbosch.detekt.Detekt
import io.gitlab.arturbosch.detekt.extensions.DetektExtension
import org.gradle.api.Project
import org.gradle.api.artifacts.MinimalExternalModuleDependency
import org.gradle.kotlin.dsl.DependencyHandlerScope
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.dependencies
import org.gradle.kotlin.dsl.withType

internal fun Project.applyDetekt(
    detektOptions: DetektOptions
) {
    check(rootProject == this) { "Must be called on a root project" }

    pluginManager.apply("io.gitlab.arturbosch.detekt")

    extensions.configure<DetektExtension> {
        parallel = detektOptions.parallel
        toolVersion = libs.version("detekt")
        buildUponDefaultConfig = detektOptions.buildUponDefaultConfig
        config.setFrom(detektOptions.configFileNames.map { "$rootDir/$it" })
    }

    tasks.withType<Detekt> {
        setSource(files(projectDir))
        include(detektOptions.includes)
        exclude(detektOptions.excludes)
    }

    addDetektPlugins(listOf("compose", "formatting", "libraries"))
}

fun Project.addDetektPlugins(detektPlugins: List<String>) {
    fun DependencyHandlerScope.detektPlugin(dependency: MinimalExternalModuleDependency) {
        add("detektPlugins", dependency)
    }

    dependencies {
        detektPlugins.forEach { plugin ->
            detektPlugin(libs.findLibrary("detektRules-$plugin").get().get())
        }
    }
}

```

**5 -** Em seguida. vamos expor essa decoração no `KPlatformPlugin.kt`:

```kotlin
fun Project.detekt(builderAction: DetektBuilder = {}) =
    applyDetekt(DetektOptionsBuilder().apply(builderAction).build())
```

**6 -** Sincronize o projeto. Em seguida, va até o `build.gradle.kts` da raiz do projeto, e inclua o plugin do `detekt`:

```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.arturbosch.detekt) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}
```

**6 -** Sincronize o projeto. Em seguida, aplique a decoração `detekt()` no mesmo arquivo:

```kotlin
import com.rsicarelli.kplatform.detekt

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.arturbosch.detekt) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}

detekt()
```

**7 -** Vamos criar 2 arquivos na raíz do projeto: `.detekt.yml` e `.detekt-compose.yml`

- [github.com/rsicarelli/kplatform/.detekt.yml](https://github.com/rsicarelli/kplatform/blob/13/enhancing-code-quality/.detekt.yml)
- [github.com/rsicarelli/kplatform/.detekt-compose.yml](https://github.com/rsicarelli/kplatform/blob/13/enhancing-code-quality/.detekt-compose.yml)

**8 -** Sincronize o projeto. Perceba que uma série de tasks `detektX` foram adicionadas no projeto:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pm2238ij1zni4t7dput9.png)

**8 -** Verifique que está funcionando rodando o seguinte comando.

Alternativamente, pode simplesmente dar um clique duplo na task `detekt` na lista de tasks do Gradle:

```sh
./gradlew detekt
```

Você vai perceber que vamos ter várias penalidades. 

A seguir, vamos usar o Spotless para nos ajudar a reduzir a lista de faltas.

## Adicionando o Spotless
O spotless é outra ferramenta indispensável nos projetos Kotlin.

Seu objetivo é formatar seu código magicamente de acordo com um estilo de código/configurações pre estabelecidas.

Novamente, não vamos focar muito nos detalhes da biblioteca, vamos direto ao uso

### Passo a passo
**1 -** Declare as coordenadas do `spotless` no `libs.versions.toml`

```toml
[versions]
spotless = "6.21.0"

[libraries]
gradlePlugin-spotless = { module = "com.diffplug.spotless:spotless-plugin-gradle", version.ref = "spotless" }

[plugins]
diffplug-spotless = { id = "com.diffplug.spotless", version.ref = "spotless" }
```

**2 -** Sincronize o projeto. Em seguida, vamos criar os arquivos `SpotlessOptions` na pasta `build-logic/src/.../options`:

Aqui, nossa plataforma será capaz de:
1. Fornecer 2 configurações padrões para o projeto: `SpotlessKtsRule` e `SpotlessXmlRule`. Isso configura o spotless para nossos arquivos Gradle com extensão `.kts`, além de `.xml` do Android.
2. Possibilta outras configurações de arquivos, de acordo com a necessidade de cada projeto.

```kotlin
data class SpotlessOptions(
    val fileRules: List<SpotlessFileRule> = listOf(SpotlessKtRule, SpotlessXmlRule),
)

interface SpotlessFileRule {

    val fileExtension: String
    val targets: List<String>
    val excludes: List<String>
}

object SpotlessKtsRule : SpotlessFileRule {

    override val fileExtension: String = "kts"
    override val targets: List<String> = listOf("**/*.kts")
    override val excludes: List<String> = listOf("**/build/**/*.kts")
}

object SpotlessXmlRule : SpotlessFileRule {

    override val fileExtension: String = "xml"
    override val targets: List<String> = listOf("**/*.xml")
    override val excludes: List<String> = listOf("**/build/**/*.xml")
}

class SpotlessOptionsBuilder {

    var fileRules: List<SpotlessFileRule> = listOf(SpotlessKtRule, SpotlessXmlRule)

    internal fun build(): SpotlessOptions = SpotlessOptions(
        fileRules = fileRules
    )
}
```

**3 -** Vamos criar um arquivo `spotless.kt` dentro de `build-logic/src/.../decorations` e declarar a função `applySpotless()`

Note que:
1. Estamos aplicando o Spotless no projeto raíz. Isso faz com que as formatações também aconteçam nos scripts da raíz, assim como na plataforma `build-logic`
2. Estamos aplicando o Spotless também para todos os sub projetos.
3. Estamos utilizando o `klint` como regras do `Spotless`
4. O plugin assume que existe um arquivo `.editorconfig` na raíz do projeto

```kotlin
import com.diffplug.gradle.spotless.SpotlessExtension
import com.diffplug.gradle.spotless.SpotlessPlugin
import com.rsicarelli.kplatform.options.SpotlessOptions
import org.gradle.api.Project
import org.gradle.kotlin.dsl.apply
import org.gradle.kotlin.dsl.configure

internal fun Project.applySpotless(spotlessConfig: SpotlessOptions) {
    val project = this

    configureSpotlessPlugin(spotlessConfig, project)

    rootProject.subprojects {
        configureSpotlessPlugin(spotlessConfig, project)
    }
}

private fun Project.configureSpotlessPlugin(
    spotlessConfig: SpotlessOptions,
    project: Project
) {
    apply<SpotlessPlugin>()

    extensions.configure<SpotlessExtension> {
        kotlin {
            target("src/**/*.kt")
            ktlint().setEditorConfigPath("${project.rootDir}/.editorconfig")
        }

        spotlessConfig.fileRules.forEach { spotlessFileRule ->
            with(spotlessFileRule) {
                format(fileExtension) {
                    target(targets)
                    targetExclude(excludes)
                }
            }
        }
    }
}
```

**4 -** Crie um arquivo `.editorconfig` na raiz do projeto:

- [github.com/rsicarelli/kplatform/.editorconfig](https://github.com/rsicarelli/kplatform/blob/13/enhancing-code-quality/.editorconfig)

**5 -** Vamos expor essa decoração no `KPlatformPlugin.kt`:
```kotlin
fun Project.spotless(builderAction: SpotlessBuilder = { }) =
    applySpotless(SpotlessOptionsBuilder().apply(builderAction).build())
```

**6 -** Sincronize o projeto. Em seguida, navegue até `build.gradle.kts` da raiz do projeto e declare o plugin do spotless:

```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.arturbosch.detekt) apply false
    alias(libs.plugins.diffplug.spotless) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}
```

**7 -** Sincronize o projeto. Em seguida. altere o mesmo `build.gradle.kts` e aplique a decoração `spotless()`:

```kotlin
import com.rsicarelli.kplatform.detekt
import com.rsicarelli.kplatform.spotless

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.arturbosch.detekt) apply false
    alias(libs.plugins.diffplug.spotless) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}

detekt()
spotless()
```

**8 -** Sincronize o projeto. Perceba que agora várias tasks `spotless` estarão disponíveis na lista de tarefas do Gradle:


![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8lnbvzudyiqmg3zwpg88.png)

**9 -** Verifque o funcionamento rodando o comando, ou clique duplo na tarefa `spotlessApply` na lista de tarefas do Gradle:
```shell
./gradlew spotlessApply
```

## Sucesso!
O Spotless vai conseguir solucionar várias faltas automaticamente pra gente. Porém, tem algumas, como por exemplo nomeação dos arquivos, que não é suportado pelo Spotless.

Aproveitando, nessa branch, adicionei várias documentações para todas nossas API's da plataforma!

No próximo artigo, iremos fechar o essa série de posts, e contar um pouquinho sobre os próximos passos!
