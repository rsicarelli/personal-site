---
title: "Android Plataforma - Parte 7: Decorando o módulo 'app'"
description: "No artigo anterior, preparamos nossa plataforma para receber novas funcionalidades."
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - "kotlin"
  - "android"
  - "gradle"
series: "android-plataforma"
seriesOrder: 7
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Ff845mbutlo4un6a6k21e.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/android-plataforma-parte-7-decorando-o-modulo-app-2ah4"
  devtoId: 1609871
  githubRepo: "https://github.com/rsicarelli/kotlin-gradle-android-platform/"
  githubBranch: "https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/7/decorating-android-app"
  reactions: 3
---

No artigo anterior, preparamos nossa plataforma para receber novas funcionalidades.

Nesta edição, a primeira funcionalidade que adicionaremos é a decoração do módulo 'app'.

---

Nosso objetivo é trazer toda a configuração Gradle da extensão `android` para dentro do nosso Plugin.

```kotlin
android {
    namespace = "com.rsicarelli.kplatform"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.rsicarelli.kplatform"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = libs.versions.composeKotlinCompilerExtension.get()
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}
```

## Opções
Temos três opções para extrair essa configuração. **Optaremos pela última abordagem**, mas acho interessante apresentar todas para entendermos que há várias formas de atingir o mesmo objetivo.

### Opção 1: utilizando o plugin `kotlin-dsl-precompiled-script-plugins`
Esse plugin pode ser aplicado em nosso `build-logic/build.gradle.kts`, podemos incluir scripts customizados, por exemplo `kplatform-android-app-build.gradle.kts`.

Ao sincronizar, um plugin com nome `kplatform-android-app` estará disponível para ser aplicado

Eu não sou fã desse método, por que:
1. Cada script funciona como um plugin novo. Conforme o projeto aumenta, fica um pesadelo lembrar todos os id's, pela minha experiência é meio chato de escalar (mas possível)
2. Nosso `library` e `app` aplicam várias configurações similares. Com essa abordagem, é difícil reutilizar funções e utilitários para cada um deles, nos forçando a copiar e colar configurações.
3. Se formos publicar nossa plataforma no maven, cada um desses plugins pre-compilados vira um artefato. Isso não é um problema caso considere desenvolver apenas para o projeto interno, mas se for considerar extrair sua plataforma para outro repositório, configurar essas coordenadas do Maven é desafiador.

### Opção 2: criando um plugin especial para cada script

Assim como temos nosso plugin `KPlatformPlugin`, seria possível criar um plugin especial para cada script que queremos reutilizar. Algo assim:

```kotlin
class AndroidAppPlugin : Plugin<Project> {
    override fun apply(project: Project) {
       ..
    }
}
```
```kotlin
// build-logic/build.gradle.kts

gradlePlugin {
    val androidApp by plugins.creating {
        id = "com.rsicarelli.kplatform.android.app"
        implementationClass = "com.rsicarelli.AndroidAppPlugin"
    }
}
```

Essa opção é super válida, porém temos duas grandes desvantagens:
1. Assim como a opção anterior, iriamos registrar vários plugins no classpath do projeto, o que pode ser confuso e chato de escalar
2. Assim como na opção anterior, cada um desses plugins viram um novo artefato no Maven, o que pode virar uma dor de cabeça para deixar 100%.

### Opção 3: utilizar o padrão de 'decoration'
Eu vi essa abordagem pela primeira vez nesse repositório: [arkivanov/gradle-setup-plugin](https://github.com/arkivanov/gradle-setup-plugin) e adorei. 

Basicamente, ao invés de termos vários plugins, temos apenas um, o raíz: `KPlatformPlugin`.

Porém, a sacada é que criamos nossos plugins utilizando extension functions do Kotlin, por exemplo:

```kotlin
class KPlatformPlugin : Plugin<Project> {
    // Nosso plugin não faz literalmente nada. Serve apenas como ponto de entrada para nossas decorações
    override fun apply(project: Project) = Unit
}


fun Project.androidApp() { ... }
```

Perceba que nosso plugin serve apenas como um ponto de entrada, e a função `apply` retorna `Unit`.

A mágica é que essas funções podem ser importadas como uma função qualquer nos nossos `build.gradle.kts`, deixando nosso código mais enxuto e evitar o boiler plate de lembrar/aplicar vários plugins diferentes por ai.

Essa abordagem, para mim, é a mais escalável, pois resolve todos os problemas apresentados nas soluções anteriores:
1. Compartilhar scripts entre plugins é super tranquilo
2. Iremos expor apenas 1 plugin. Podemos aplicar esse plugin na raíz, e nunca mais se preocupar em aplicar nos outros módulos.
3. Expondo apenas 1 plugin, nossas dependencias do Maven ficam super simples.


#### Decoration?
Esse é um termo que eu cunhei, e não é necessariamente um padrão adotado (pois percebo que não tem um padrão, rs). Mesmo que não estejamos seguindo o padrão de decoração à risca, acredito que essa terminologia nos ajuda a entender que estamos, de fato, decorando nossos módulos com funções predefinidas.

## Decorando nosso módulo 'app'
Agora que já entendemos todas as opções disponíveis, vamos dar continuidade ao objetivo principal deste post.

### Passo a passo
**1 -** Precisamos de acesso ao plugin do Android e do Kotlin como dependências do nosso `build-logic/build.gradle.kts`.

Primeiro, navegue até o `libs.versions.toml` e inclua as declarações:

```toml
[libraries]
...
androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "androidxComposeActivity" }

# Adicione os plugins do Android e Kotlin para ser incluidas como dependencia
gradlePlugin-android = { module = "com.android.tools.build:gradle", version.ref = "androidBuildTools" }
gradlePlugin-kotlin = { module = "org.jetbrains.kotlin:kotlin-gradle-plugin", version.ref = "kotlin" }
```

**2 -** Sincronize o projeto. Agora, navegue até `build-logic/build.gradle.kts` e adicione essas duas dependências:
```kotlin
plugins {
    `kotlin-dsl`
}

dependencies {
    compileOnly(libs.gradlePlugin.android)
    compileOnly(libs.gradlePlugin.kotlin)
}
..
```
> Note que estamos utilizando `compileOnly`. Isso garante que, ao importar a nossa plataforma, não estaremos trazendo esses plugins como dependencia transitiva do projeto. Isso é especialmente importante caso você decida exportar sua plataforma para um repositório separado e expor via Maven

Tenha certeza de declarar o repositório do Google dentro do `build-logic/settings.gradle.kts`:
```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
    ..
}
```

**3 -** Sincronize o projeto. Crie uma pasta chamada `decoration` dentro do `build-logic/src/main/kotlin`.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/y9yk99duigmkc4aq8vkn.png)

**4 -** Crie um arquivo chamado `android.kt`. Aqui é onde nossas decorações do Android irão morar.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l88dbg26zj278jylpask.png)

**5 -** Utilizaremos o padrão `internal fun applyX()`. Note que, tornando-a `internal`, estaremos protegendo essa função de quem consome nossa plataforma:

```kotlin
package com.rsicarelli.kplatform.decoration

import org.gradle.api.Project

internal fun Project.applyAndroidApp() {
   ...   
}
```

**6 -** Para manipular a extensão `Android`, teremos que utilizar a propriedade `Project.extensions.configure<ApplicationExtension>()`:

Isso é a mesma coisa de utilizar o `android {}` diretamente no `build.gradle.kts`. 

```kotlin
import com.android.build.api.dsl.ApplicationExtension
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidApp() {
    extensions.configure<ApplicationExtension> {
       
    }
}
```
> Verifique os imports! A função configure as vezes não é importada automaticamente. Na duvida, copie e cole o import manualmente

**7 -** Dentro desse bloco, copie e cole o conteúdo:
```kotlin

import com.android.build.api.dsl.ApplicationExtension
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidApp() {
    extensions.configure<ApplicationExtension> {
        namespace = "com.rsicarelli.kplatform"
        compileSdk = 34

        defaultConfig {
            applicationId = "com.rsicarelli.kplatform"
            minSdk = 24
            targetSdk = 34
            versionCode = 1
            versionName = "1.0"

            testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
            vectorDrawables {
                useSupportLibrary = true
            }
        }

        buildTypes {
            release {
                isMinifyEnabled = false
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            }
        }
        compileOptions {
            sourceCompatibility = JavaVersion.VERSION_17
            targetCompatibility = JavaVersion.VERSION_17
        }
//        kotlinOptions {
//            jvmTarget = "17"
//        }
        buildFeatures {
            compose = true
        }
//        composeOptions {
//            kotlinCompilerExtensionVersion = libs.versions.composeKotlinCompilerExtension.get()
//        }
        packaging {
            resources {
                excludes += "/META-INF/{AL2.0,LGPL2.1}"
            }
        }
    }
}
```
**8 -** Observe que o `kotlinOptions` e `libs.versions.composeKotlinCompilerExtension.get()` não funcionarão.

Para configurar o `kotlinOptions`, precisamos configurar a task `KotlinCompile`.

Crie uma outra pasta dentro de `decoration` e por hora chame de `kotlin.kt`.

Utilizando o mesmo padrão `internal fun applyX()`:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qsr1yfghpcd49tlq9z7c.png)

```kotlin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

internal fun Project.applyKotlinOptions() {
    tasks.withType<KotlinCompile>().configureEach {
        kotlinOptions {
            jvmTarget = "17"
        }
    }
}
```

**9 -** Retorne ao `applyAndroidApp()` e substitua o comentário do `kotlinOptions` por `applyKotlinOptions()`:
```kotlin
..
compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

applyKotlinOptions()

buildFeatures {
    compose = true
}
..
```
**10 -** Uma das limitações do composite build é que não temos acesso ao acessor `libs` que foi gerado dentro do kotlin DSL. 

Por hora, iremos precisar criar alguns utilitários para possibilitar utilizar as versões do nosso catálogo dento dos scripts.

Crie um outro arquivo dentro de `decoration` chamado `project.kt`.

Inclua duas extensões: uma para resgatar o `libs`, e outra para encontrar a versão:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dzdoygvjiiygoxindril.png)

```kotlin
internal val Project.libs: VersionCatalog
    get() = extensions.getByType<VersionCatalogsExtension>().named("libs")

internal fun VersionCatalog.version(name: String): String = findVersion(name).get().toString()
```

**11 -** Volte para `applyAndroidApp()` e descomente a parte onde definimos a versão do compose compiler:

```kotlin
buildFeatures {
    compose = true
}

composeOptions {
    kotlinCompilerExtensionVersion = libs.version("composeKotlinCompilerExtension")
}
```
> O nome da versão precisa ser o mesmo do nome da versão declarada no `libs.versions.toml`

**12 -** Verifique a implementação final e veja se está tudo certo:
```kotlin

import com.android.build.api.dsl.ApplicationExtension
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidApp() {
    extensions.configure<ApplicationExtension> {
        namespace = "com.rsicarelli.kplatform"
        compileSdk = 34

        defaultConfig {
            applicationId = "com.rsicarelli.kplatform"
            minSdk = 24
            targetSdk = 34
            versionCode = 1
            versionName = "1.0"

            testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
            vectorDrawables {
                useSupportLibrary = true
            }
        }

        buildTypes {
            release {
                isMinifyEnabled = false
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            }
        }
        compileOptions {
            sourceCompatibility = JavaVersion.VERSION_17
            targetCompatibility = JavaVersion.VERSION_17
        }

        applyKotlinOptions()

        buildFeatures {
            compose = true
        }

        composeOptions {
            kotlinCompilerExtensionVersion = libs.version("composeKotlinCompilerExtension")
        }

        packaging {
            resources {
                excludes += "/META-INF/{AL2.0,LGPL2.1}"
            }
        }
    }
}
```

**13 -** Agora tá na hora de expormos nosso script para o mundo exterior. 

Para isso, navegue até o arquivo `KPlatformPlugin.kt` e inclua uma nova função chamada `fun androidApp()`:

```kotlin
import com.rsicarelli.kplatform.decoration.applyAndroidApp
import org.gradle.api.Plugin
import org.gradle.api.Project

class KplatformPlugin : Plugin<Project> {

    override fun apply(project: Project) = Unit
}

fun Project.androidApp() = applyAndroidApp()
```

**14 -** Sicronize o projeto. Navegue até `app/build.gradle.kts`, remova todo o bloco `android {}` e utilize nossa função que acabamos de criar:

```kotlin
import com.rsicarelli.kplatform.androidApp

plugins {
    id(libs.plugins.android.application.get().pluginId)
    kotlin("android")
}

androidApp()

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(projects.core.designsystem)
    implementation(projects.features.home)
}
```
> Caso tenha problemas, garanta que o nosso plugin está sendo aplicado no `build.gradle.kts` raiz
```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}
```

## Sucesso!
Você deve poder rodar o `app` normalmente em um device/emulador.

Parabéns! Acabamos de simplificar muito nossas vidas. Só com isso, poderiamos até criar outro módulo nesse projeto `demoApp` por exemplo (não iremos criar), e reaproveitar todas essas configurações. 

Próximo objetivo: fazer o mesmo com nossas configurações para library/biblioteca Android!
