---
title: 'Android Plataforma - Parte 12: Otimizando tempo de compilação para bibliotecas Android'
description: '🌱 Branch: 12/improving-android-library-build-time 🔗 Repositório:...'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 12
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F95wf01w1l93eqd5slfhg.png'
translated: false
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-12-otimizando-tempo-de-compilacao-para-bibliotecas-android-3g36'
  devtoId: 1611061
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/12/improving-android-library-build-time'
  reactions: 2
---

--

No último post, construímos uma DSL robusta que nos permite ter um ajuste fino das nossas decorações.

Agora, vamos entender como podemos reduzir o tempo de compilação das nossas nossas android `library` configurando as **"build features"**

---

## "Build features" do Android Gradle Plugin (AGP)

A classe [`BuildFeatures`](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/BuildFeatures) é uma interface que define uma lista de características de "build" que podem ser habilitadas ou desabilitadas em um projeto Android.

É por meio dessas funcionalidades que classes como `R` e `BuildConfig` são geradas, ou que as pastas `res` e `resource` são reconhecidas e incluídas no projeto.

### Funções e suas responsabilidades

1. **aidl**: AIDL (Android Interface Definition Language) permite definir as interfaces de comunicação que os componentes de um IPC (Inter-Process Communication) usarão. Em outras palavras, é uma forma de determinar como diferentes processos (ou apps) irão se comunicar.

2. **buildConfig**: Esta funcionalidade gera automaticamente uma classe `BuildConfig` com informações meta sobre o aplicativo, como sua versão e se é `debug`.

3. **compose**: Compose é uma toolkit de UI moderna nativa do Android para criação de interfaces.

4. **prefab**: Prefab permite a importação de bibliotecas C e C++ como módulos em projetos Android. Essas bibliotecas são empacotadas como AARs (Android ARchive) e facilitam a integração de código nativo nos projetos Android.

5. **renderScript**: RenderScript é uma API do Android para execução de computações de alto desempenho, útil para apps que processam gráficos ou realizam cálculos intensivos.

6. **resValues**: Facilita a geração de Valores de Recurso, que são constantes colocadas em um arquivo XML para uso no aplicativo.

7. **shaders**: Shaders são programas especializados usados para renderizar gráficos, frequentemente empregados em jogos e outras aplicações gráficas intensivas.

8. **viewBinding**: O View Binding gera automaticamente um código de vinculação de dados para suas views, melhorando a eficiência e segurança da programação da UI no Android.

### Comportamento padrão

Por padrão, tanto o módulo `app` quanto `library` terão estas funcionalidades habilitadas:

- aidl
- buildConfig
- renderScript
- resValues
- shaders

**Funcionalidades desabilitadas por padrão (valor `false`):**

- compose
- prefab
- viewBinding

## Delegando o controle de build features para nossa Plataforma

Sabendo que essas funcionalidades adicionam tempo de compilação, podemos torná-las `false` por padrão e delegar essa configuração para nossa Plataforma.

### Definindo `BuildFeatures` e `BuildFeaturesBuilder`

**1 -** Crie um novo modelo e builder para expressar as opções customizadas.

Note que apenas o `AndroidLibraryOptions` irá receber essas opções. O motivo é que um `app` precisa de todos esses recursos habilitados, então nem damos trabalho de expor essa api no `AndroidAppOptions` também.

```kotlin
data class AndroidLibraryOptions(
    val buildFeatures: BuildFeatures,
    override val proguardOptions: ProguardOptions,
    ...
) : AndroidOptions(..) {

    data class BuildFeatures(
        val generateAndroidResources: Boolean = false,
        val generateResValues: Boolean = false,
        val generateBuildConfig: Boolean = false,
    )
}
```

```kotlin
class AndroidLibraryOptionsBuilder : AndroidOptionsBuilder() {
    ..
    var buildFeaturesBuilder = BuildFeaturesBuilder()

    fun buildFeatures(block: BuildFeaturesBuilder.() -> Unit) {
        buildFeaturesBuilder.apply(block)
    }

    override fun build(): AndroidLibraryOptions = AndroidLibraryOptions(
        ..
        buildFeatures = buildFeaturesBuilder.build()
    )
}
```

**2 -** Vamos atualizar nossa função `applyAndroidLibrary()` para aplicar a decoração a partir do modelo:

```kotlin
internal fun Project.applyAndroidLibrary(androidLibraryOptions: AndroidLibraryOptions) {
    applyAndroidCommon(androidLibraryOptions)

    extensions.configure<LibraryExtension> {
        ...

        buildFeatures {
            androidResources = androidLibraryOptions.buildFeatures.generateAndroidResources
            resValues = androidLibraryOptions.buildFeatures.generateResValues
            buildConfig = androidLibraryOptions.buildFeatures.generateBuildConfig
        }
    }
}
```

**3 -** Nos passos a seguir, vamos desligar a geração do `BuildConfig` por completo, incluindo o módulo `app`. Já que é comum precisar do `BuildConfig` no `app`, vamos adaptar nossos modelos para trazer essa opção:

```kotlin
data class AndroidAppOptions(
    ..
    val versionName: String,
    val generateBuildConfig: Boolean,
    override val proguardOptions: ProguardOptions,
    ..
) : AndroidOptions(..)
```

```kotlin
class AndroidAppOptionsBuilder : AndroidOptionsBuilder() {

    ..
    var generateBuildConfig = false

    override fun build(): AndroidAppOptions = AndroidAppOptions(
        ..
        generateBuildConfig = generateBuildConfig
    )
}
```

**4 -** Vamos adaptar o `applyAndroidApp()` para que possa gerar o `BuildConfig`:

```kotlin
internal fun Project.applyAndroidApp(androidAppOptions: AndroidAppOptions) {
    ..
    extensions.configure<ApplicationExtension> {
        ..

        buildFeatures {
            buildConfig = androidAppOptions.generateBuildConfig
        }
    }
}
```

### Adaptando `build.gradle.kts` dos módulos

Iremos precisar atualizar o módulo `designsystem`, já que temos uma pasta `res` com os assets da aplicação.

Navegue até `designsystem/build.gradle.kts` e inclua a geração dos recursos do Android:

```kotlin
androidLibrary {
    buildFeatures {
        // Isso irá identificar a pasta "res" e adicionar no classpath
        generateAndroidResources = true
    }
}
```

### Desligando as funcionalidades no `gradle.properties`

**1 -** Vamos atualizar nosso `gradle.properties`. Abra o arquivo e adicione as seguintes linhas:

```kotlin
android.library.defaults.buildfeatures.androidresources=false
android.defaults.buildfeatures.buildConfig=false
android.defaults.buildfeatures.aidl=false
android.defaults.buildfeatures.renderScript=false
android.defaults.buildfeatures.compose=false
android.defaults.buildfeatures.resValues=false
android.defaults.buildfeatures.viewBinding=false
```

**2 -** Já que estamos aqui, vamos aproveitar e aplicar outras configurações para otimizar nosso desenvolvimento com múltiplos módulos:

```properties
# -------Gradle--------

# Configurações de argumentos da JVM para a execução do Gradle.
# - Opções de desempenho e limites de memória.
org.gradle.jvmargs=-XX:+UseCompressedOops -XX:G1HeapRegionSize=16M -XX:MinHeapFreeRatio=10 -XX:MaxHeapFreeRatio=20 -XX:GCTimeLimit=20 -Xmx30g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -Djava.awt.headless=true

# Executa tarefas em paralelo para melhorar o desempenho.
org.gradle.parallel=true

# Habilita o cache de tarefas do Gradle para reutilizar resultados de tarefas entre builds.
org.gradle.caching=true

# Configura o projeto apenas quando é necessário, melhorando os tempos de build.
org.gradle.configureondemand=true

# -------Kotlin--------

# Define o estilo de código Kotlin como o estilo oficial.
kotlin.code.style=official

# -------Android-------

# Habilita a utilização das bibliotecas AndroidX em vez das bibliotecas de suporte legadas.
android.useAndroidX=true

# Se verdadeiro, Jetifier converterá bibliotecas que não usam AndroidX para usá-lo.
# Não estamos utilizando nenhuma biblioteca de suporte, então podemos desligar esse passo
android.enableJetifier=false

# Habilita a geração da classe R em tempo de compilação para módulos de aplicativos.
android.enableAppCompileTimeRClass=true

# Desabilita a geração de recursos Android para bibliotecas.
android.library.defaults.buildfeatures.androidresources=false

# Desabilita a geração da classe BuildConfig.
android.defaults.buildfeatures.buildConfig=false

# Desabilita a compilação de AIDL.
android.defaults.buildfeatures.aidl=false

# Desabilita a compilação de RenderScript.
android.defaults.buildfeatures.renderScript=false

# Desabilita a funcionalidade Compose.
android.defaults.buildfeatures.compose=false

# Desabilita a geração de Valores de Recurso.
android.defaults.buildfeatures.resValues=false

# Desabilita a funcionalidade de View Binding.
android.defaults.buildfeatures.viewBinding=false

# Suprime os avisos de opções não suportadas.
android.suppressUnsupportedOptionWarnings=android.suppressUnsupportedOptionWarnings,android.enableAppCompileTimeRClass

# Habilita otimizações de recursos no projeto Android.
android.enableResourceOptimizations=true
```

**3 -** :warning: Importante: precisamos garantir que nosso `gradle.properties` do Composite Builds estejam compartilhando a mesma configuração.

Caso o conteúdo do `gradle.properties` do `build-logic` seja diferente, o Gradle não compartilha os `deamons` entre compilações.

Copie o conteúdo acima, e simplesmente cole no `build-logic/gradle.properties`

## Sucesso!

Agora, nosso projeto assume que os módulos não terão nenhum recurso extra de compilação. Contudo, nossa plataforma se mantém flexível para atender módulos que necessitem de features específicas.

No próximo artigo, daremos um passo adicional na manutenção dos módulos, permitindo que nossa plataforma decore módulos "puro JVM", otimizando ainda mais o tempo de compilação quando possível.
