---
title: "Android Plataforma - Parte 4: Composite Build"
description: "Nos artigos anteriores, compreendemos a importância da modularidade e como os Composite Builds são a escolha certa para escalar projetos Kotlin."
summary: "Nos artigos anteriores, compreendemos a importância da modularidade e como os Composite Builds são a escolha certa para escalar projetos Kotlin."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 4
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fh5b4mdf2bo8tj31ylvtz.png"
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-4-composite-build-lgk"
  devtoId: 1609512
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/3-4/composite-build"
  reactions: 3
---

Incrementaremos o projeto inicial com a criação e inclusão de um composite build.

---

**Primeiro passo** é criar uma pasta para declarar os plugins e funcionalidades.

A nomenclatura mais adotada para essa pasta é `build-logic`, e é comum encontrar vários projetos do Google, Jetbrains e Gradle que seguem essa convenção.

Alguns projetos optam por `conventions` ou `plugins`.

Prefiro seguir padrões reconhecidos pela comunidade, então usaremos o nome mais popular: `build-logic`.

## Passo a passo

**1 -** Crie uma pasta na raiz do projeto:
```shell
mkdir build-logic
```

**2 -** Entre nesta pasta e execute o comando `gradle init`. Este script do Gradle inicializa um projeto Gradle na raiz, acompanhado do Gradlew Wrapper (`gradlew`) e outros arquivos úteis.

Certifique-se de ter o Gradle instalado. Se estiver usando o homebrew:
```shell
brew install gradle
```
```shell
cd build-logic
gradle init
```

**3 -** Após alguns instantes, a mensagem a seguir surgirá no console:

Digite **4** para escolher o tipo gradle plugin e confirme com enter.

```shell
Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 4
```

**4 -** Outra solicitação aparecerá para escolher a linguagem. Digite **"3"** para Kotlin:

```
Select implementation language:
  1: Groovy
  2: Java
  3: Kotlin
Enter selection (default: Java) [1..3] 3
```

**5 -** Em seguida, será pedido para escolher a DSL (domain specific language) dos scripts. Selecione **"2"** para Kotlin:

```shell
Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Kotlin) [1..2] 2
```

**6 -** Depois, o nome do projeto será solicitado. Como já estamos na pasta `build-logic`, simplesmente confirme com enter:

```shell
Project name (default: build-logic): // Apenas pressione enter
```

**7 -** A próxima etapa solicita o source package. Mantenha o padrão:

```shell
Source package (default: build.logic):  // Apenas pressione enter
```

**8 -** Por fim, a opção para gerar utilizando novas API's. Escolha **"yes"** e confirme:

```shell
Generate build using new APIs and behavior (some features may change in the next minor release)? (default: no) [yes, no] yes
```

### Arquivos gerados

Concluindo o passo a passo, observe os arquivos gerados:

```shell
A  .gitattributes
A  .gitignore
A  gradle.properties
A  gradle/wrapper/gradle-wrapper.jar
A  gradle/wrapper/gradle-wrapper.properties
A  gradlew
A  gradlew.bat
A  plugin/build.gradle.kts
A  settings.gradle.kts
```

Vamos nos concentrar nos mais relevantes:

### settings.gradle.kts

A presença deste arquivo permite que este módulo seja tratado como um **Composite Build**.

Note que é um arquivo simples. Por enquanto, não precisamos adicionar nada.

### build.gradle.kts
Esse arquivo gerado contém algumas várias configurações, mas vamos focar nas mais importantes:

```kotlin
plugins {
    `java-gradle-plugin`
     ..
}
..
gradlePlugin {
    // Define the plugin
    val greeting by plugins.creating {
        id = "build.logic.greeting"
        implementationClass = "build.logic.BuildLogicPlugin"
    }
}
..
```

#### `java-gradle-plugin`
Esse plugin traz uma extensão chamada `gradlePlugin`. É com ela que iremos realizar as declarações dos nossos plugins.

Por debaixo dos panos, esse plugin aplica algumas decorações na hora de compilar o `jar` desse módulo, além de adicionar metadata do seu artefato, e a criação de um arquivo de propriedade do Gradle que serve como referencia nossa classe de implementação.

Basicamente, estamos registrando um plugin com o id `build.logic.greeting` no projeto, e, ao aplica-lo, a classe de implementaçào `BuildLogicPlugin` estará disponível, pré-compilada para uso.

### `BuildLogicPlugin.kt`
Esse arquivo é a declaração do nosso plugin, utilizando a api `Plugin<Project>`.

Graças ao Kotlin DSL, é bem fácil de entender o que estamos fazendo:

Registrando uma task chamada `greetings` no projeto que está aplicando esse `Plugin`

```kotlin
@Supress("unused") // invocado por reflexão
class BuildLogicPlugin: Plugin<Project> {
    override fun apply(project: Project) {
        // Register a task
        project.tasks.register("greeting") { task ->
            task.doLast {
                println("Hello from plugin 'build.logic.greeting'")
            }
        }
    }
}
```

## Incluindo nosso `build-logic` no projeto raiz
Chegou a hora de conectarmos os dois mundos. 

Para incluir composite builds em nosso projeto, precisamos utilizar uma função especial chamada `includeBuild()`. O único requisito para utilizar essa função, é que o módulo tenha um arquivo `settings.gradle.kts` em sua raiz. 

Como nosso `build-logic` está pronto pra uso, vamos apenas navegar até o nosso `settings.gradle.kts` e incluir esse módulo:

```kotlin
// settings.gradle.kts da raiz
pluginManagement {
    includeBuild("build-logic")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
```

Basicamente, estamos instruindo o Gradle a utilizar nosso `build-logic` como Composite Build, e incluindo nosso plugin pre-compilado `BuildLogicPlugin` no classpath do projeto.

### Aplicando o plugin no `build.gradle.kts`
Finalmente, iremos aplicar nosso plugin ao projeto principal.

Tenha certeza de que você sincronizou seus arquivos Gradle ("Reload all gradle projects") e navegue até o arquivo `build.gradle.kts` da raiz do projeto:

```kotlin
//build.gradle.kts da raiz

plugins {
    // Plugin do android
    // Plugin do Kotlin
    id("build.logic.greeting")
}
```

## Utilizando nossa task "greeting"
Após sincronizar os arquivos Gradle do projeto, vá até o console e execute o seguinte comando:

Garanta que você esteja na pasta raiz do projeto, e não dentro `build-logic`:

```shell
pwd
.../kplatform/build-logic
cd ..
pwd
.../kplatform
```
```shell
./gradlew greeting

> Task :greeting
Hello from plugin 'build.logic.greeting'

BUILD SUCCESSFUL in 518ms
```

## Sucesso!
Já temos nosso esqueleto para compor nossa plataforma, e incrementar nosso `build-logic` com outras funcionalidades.

No próximo artigo, vamos dar uma "limpada" nesses arquivos auto gerados pelo `gradle init`, e dar continuidade aos trabalhos.
