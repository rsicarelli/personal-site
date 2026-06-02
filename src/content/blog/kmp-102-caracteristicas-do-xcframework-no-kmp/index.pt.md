---
title: 'KMP-102 - Características do XCFramework no KMP'
description: 'No post anterior, aprendemos sobre como o Kotlin/Native exporta uma coleção de .frameworks no formato XCFramework.'
pubDate: 2024-07-21
updatedDate: 2024-07-25
tags:
  - 'kotlin'
  - 'kmp'
  - 'mobile'
  - 'braziliandevs'
series: 'kmp-102'
seriesOrder: 2
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fgvs6z4hfiqdph7rc8zdt.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-102-caracteristicas-do-xcframework-no-kmp-3162'
  devtoId: 1930624
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 12
---

No post anterior, aprendemos sobre como o Kotlin/Native exporta uma coleção de `.frameworks` no formato XCFramework.

Agora, vamos entender as características desse XCFramework.

## Como utilizar um XCFramework no iOS

O pacote XCFramework irá oferecer um `.framework` para cada Kotlin Native target. Lá dentro, alvos como o device físico (`iosArm64`), simulador (`iosSimulatorArm64`) e simuladores para processadores intel (`iosX64`) estarão presentes.

Consumir um `.framework` varia conforme o ambiente e o codebase existente, mas de forma geral, basta criar um _build phase_ no projeto Xcode para conseguir utilizar o import das classes exportadas pelo Kotlin/Native.

- :link: [Utilizando o Swift Package Manager](https://kotlinlang.org/docs/native-spm.html)
- :link: [CocoaPods overview and setup](https://kotlinlang.org/docs/native-cocoapods.html)
- :link: [Kotlin/Native as an Apple framework – tutorial](https://kotlinlang.org/docs/apple-framework.html)

Existem diversas formas que podemos utilizar para importar no projeto.

Todos esses modelos possuem características importantes a serem exploradas.

## Entendendo como o XCFramework é gerado

No KMP, o `.framework` é do tipo "Fat". Isso significa que ele inclui não apenas seu código, mas também todas as dependências necessárias. Isso difere de outros tipos, que podem incluir menos conteúdo:

- **Skinny**: Contém apenas o seu código, sem nenhuma dependência externa.
- **Thin**: Inclui seu código e suas dependências diretas.
- **Hollow**: O oposto do Thin, contendo apenas as dependências, sem seu código.
- **Fat**: Inclui tudo: seu código, dependências diretas e tudo o necessário para funcionar de forma independente.

Essa abordagem "Fat" tem implicações importantes para a modularização e o gerenciamento de dependências, como discutiremos a seguir.

A natureza "Fat" dos frameworks no KMP cria um desafio técnico para modularizar nossas distribuições. Isso ocorre porque todas as dependências são empacotadas juntas, forçando-nos a consolidar todo o código do KMP em uma única exportação. Esse modelo pode levar a duplicações de dependências e aumento do tamanho do pacote final, complicando a gestão do projeto, especialmente em ambientes de desenvolvimento colaborativos.

## Contexto sobre aplicações Kotlin

Projetos Kotlin possuem uma natureza multi modular para reutilização de cache e desempenho de build. Modularizar projetos influenciam positivamente a experiência de desenvolvimento em projetos Kotlin que utilizam o Gradle.

[Nesse artigo](https://dev.to/rsicarelli/android-plataforma-parte-1-modularizacao-2016) eu exploro um pouco mais sobre modularização em projetos Android, que também se aplicam para projetos KMP.

Projetos Kotlin costumam a ter múltiplos módulos como:

```
- legado
- core/design-system
- core/logging
- core/analytics
- feature1
- feature2
```

Esses módulos podem ser utilizados individualmente em projetos Kotlin, mas isso não significa que podemos ter um `.framework` para correspondente.

Quer dizer, até podemos, porém, tem uma característica a ser observada.

Considere que a `feature1` e `feature2` utilizam as seguintes dependências em KMP:

```kotlin
// feature1
kotlinx-serialization
kotlinx-coroutines

// feature2
kotlinx-serialization
kotlinx-coroutines
```

Ao exportar o XCFramework, as dependencias do `kotlinx-serialization` e `kotlinx-coroutines` **estariam duplicadas em cada `.framework`**, causando:

- Aumento do pacote final (`.ipa`);
- Aumento de tempo de build, considerando uma escala de módulos.

Isso acontece por uma característica imposta pelo `.framework` no iOS: um `.framework` não consegue se comunicar com o outro.

Em um cenário ideal, o `kotlinx-serialization` seria um `.framework` isolado e nosso `.framework` se comunicasse com esse `.framework`.

Então, esse modelo "fat" se torna uma característica adotada em projetos KMP, como uma forma de otimização do uso e redução do tamanho final do aplicativo.

Com isso, vamos avançar e entender melhor quais desafios esse modelo impõe.

## Utilizando um "fat" KMP no iOS

Consideremos um cenário onde temos um projeto iOS existente e desejamos integrar código KMP. Para ilustrar, vamos supor que fizemos uma alteração em um módulo, como adicionar um novo parâmetro a uma função. Esta mudança, embora pareça simples, pode quebrar o código no iOS, pois o projeto iOS espera a versão anterior da função. Aqui está um exemplo passo a passo:

Primeiro, vamos assumir o seguinte `build.gradle.kts`:

```kotlin
kotlin {
    val xcFramework = XCFramework(xcFrameworkName = "KotlinShared")

    val exportedDependencies = listOf(feature1, feature2, core)

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "KotlinShared"

            exportedDependencies.forEach { dependency ->
                export(dependency.get())
            }

            xcFramework.add(this)
        }
    }
}
```

Ao executar a task `assembleKotlinSharedXCFramework`, teremos um pacotão com todos os módulos exportados.

Para projetos KMP, é essencial ter um módulo central, muitas vezes chamado de `ios-interop`. Esse módulo funciona como um ponto de integração que agrupa e exporta todas as dependências necessárias para serem usadas no Xcode. Esse método centraliza a gestão das dependências e facilita a manutenção e atualização do projeto.

## Desafios para modularizar o KMP

Como discutimos anteriormente, a natureza "fat" dos frameworks XCFramework no KMP implica que cada módulo exportado inclui todas as suas dependências. Isso resulta em duplicação de dependências comuns entre módulos e um aumento geral no tamanho do pacote final. Além disso, essa abordagem gera desafios significativos na modularização, que são especialmente evidentes em projetos que integram o SwiftUI como interface de usuário no iOS. Vejamos esses desafios mais detalhadamente.

Vamos assumir que a `feature1` e `feature2` expõem as seguintes classes Kotlin a serem consumidas no iOS:

```kotlin
class Feature1ViewModel(
    val repository: Feature1Repository
) {
    fun fetch() = Unit
}

class Feature2ViewModel(
    val repository: Feature2Repository
) {
    fun fetch() = Unit
}
```

Ao exportar o XCFramework, todas as classes de `feature1` e `feature2` estarão presentes no `.framework`, ou seja, conseguimos utilizar ambas `Feature1ViewModel` e `Feature2ViewModel` no iOS:

```swift
import KotlinShared

class Feature1ViewModelWrapper {
    private let viewModel: KotlinSharedFeature1ViewModel

    init(repository: Feature1Repository) {
        self.viewModel = KotlinSharedFeature1ViewModel(repository: repository)
    }

    func fetch() {
        viewModel.fetch()
    }
}

class Feature2ViewModelWrapper {
    private let viewModel: KotlinSharedFeature2ViewModel

    init(repository: Feature2Repository) {
        self.viewModel = KotlinSharedFeature2ViewModel(repository: repository)
    }

    func fetch() {
        viewModel.fetch()
    }
}
```

Até aqui, tudo certo. Nosso código KMP foi integrado no iOS com sucesso e vamos assumir que esse código já está até em produção. Agora, vamos adicionar um novo parâmetro no `Feature1ViewModel`:

```kotlin
class Feature1ViewModel(
    val repository: Feature1Repository,
    val repository2: Feature1Repository2
) {
    fun fetch() = Unit
    fun fetchRepository2() = Unit
}
```

Ao exportar o XCFramework, **o código no iOS irá quebrar**, pois a classe `Feature1ViewModelWrapper` não possui o novo parâmetro `repository2`:

```swift
class Feature1ViewModelWrapper {
    private let viewModel: KotlinSharedFeature1ViewModel

    init(repository: Feature1Repository) {
        //irá quebrar, `repository2` não está sendo enviado
        self.viewModel = KotlinSharedFeature1ViewModel(repository: repository)
    }
}
```

Agora, vamos assumir que esse XCFramework já foi gerado e exportado, porém, ainda não foi integrado no repositório do iOS. O time responsável pela `feature2` precisa de uma nova funcionalidade e também precisa realizar uma alteração na `Feature2ViewModel`:

```kotlin
class Feature2ViewModel(
    val repository: Feature2Repository,
    val repository2: Feature2Repository2,
) {
    fun fetch() = Unit
}
```

Ao exportar o XCFramework, **o código no iOS irá quebrar**, pelo mesmo motivo acima, já que a classe `Feature2ViewModelWrapper` não possui o novo parâmetro `repository2`:

```swift
class Feature2ViewModelWrapper {
    private let viewModel: KotlinSharedFeature2ViewModel

    init(repository: Feature2Repository) {
        self.viewModel = KotlinSharedFeature2ViewModel(repository: repository) //irá quebrar, `repository2` não foi passado como parametro
    }

    func fetch() {
        viewModel.fetch()
    }
}
```

**Agregando esse cenário acima, temos a seguinte linha do tempo:**

1. `Feature1ViewModel` e `Feature2ViewModel` são integradas ao projeto iOS.
2. `Feature1ViewModel` é atualizada para incluir um novo parâmetro, causando uma quebra no iOS.
3. Após o merge das alterações, uma nova versão do `XCFramework` é gerada e publicada através de ferramentas como Swift Package Manager, CocoaPods, controle de versão, etc.
4. Essa versão, contendo as mudanças em `Feature1ViewModel`, resulta em quebras no iOS.
5. Antes que essa versão seja integrada ao projeto iOS (corrigindo a quebra), o time de `feature2` realiza alterações no `Feature2ViewModel`.
6. Uma versão subsequente do `XCFramework` é gerada e publicada, incluindo as novas alterações em `Feature2ViewModel` que também resultam em quebras no iOS.

**Neste cenário complexo:**

- O time responsável por `feature2` precisa esperar que o time de `feature1` corrija as quebras no iOS antes de poder integrar a correção da `feature2`. Este processo pode criar um ciclo de espera e correção que retarda a entrega de novas funcionalidades.

**Para resumir e simplificar a compreensão:**

1. A versão 1.0.0 do XCFramework, já integrada no iOS, funciona sem problemas.
2. A versão 1.1.0 introduz uma mudança significativa (`breaking change`) em `feature1`, causando problemas.
3. A versão 1.2.0 traz uma mudança significativa em `feature2`.
4. A versão 1.2.0 só pode ser integrada ao iOS depois que as correções de `feature1` na versão 1.1.0 forem integradas e validadas.

![Timeline of KMP breaking changes](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/timeline-kmp-breaking-changes.png?raw=true)

## Dores do desenvolvimento KMP

Integrar código KMP em projetos iOS existentes, especialmente aqueles desenvolvidos com SwiftUI, apresenta desafios únicos devido à necessidade de uma comunicação direta entre módulos. Este desafio é menos intenso em projetos que utilizam Compose Multiplatform (CMP), onde a comunicação entre módulos ocorre de forma mais indireta e desacoplada.

O modelo "fat" de frameworks impõe várias complicações no desenvolvimento com KMP, entre elas:

- **Gestão de Dependências:** É necessário seguir uma linha do tempo específica para incorporar mudanças no código KMP ao repositório iOS, garantindo que todas as dependências estejam sincronizadas.
- **Sensibilidade a Mudanças:** Qualquer alteração em atributos, parâmetros ou funções pode resultar em quebras no projeto iOS, exigindo correções imediatas para manter a estabilidade do projeto.
- **Dependência entre times**: Devs frequentemente precisam esperar que outras times corrijam quebras no iOS antes de poderem avançar com a integração de novas funcionalidades do KMP.

## Impacto no ciclo de desenvolvimento diário

No dia a dia, esses desafios tornam-se ainda mais evidentes. Por exemplo, ao integrar novas funcionalidades na branch principal (`main`) do projeto KMP — geralmente associada ao desenvolvimento Android — e tentar testá-las no iOS, frequentemente nos deparamos com quebras devido a mudanças que ainda não foram integradas ao projeto iOS.

Para mitigar esse problema, geralmente geramos um XCFramework localmente para testes no iOS. No entanto, essa abordagem ainda sofre com o risco de quebras se a branch main contiver alterações não sincronizadas com o iOS, criando um ciclo contínuo de identificação e correção de quebras, o que atrasa significativamente o desenvolvimento.

Isso gera um gargalo enorme no dia a dia, pois temos um desafio enorme de identificar qual time responsável pela quebra e, consequentemente, aguardar a correção para então integrar o código KMP no iOS.

Em times pequenos ou projetos pessoais isso não é um problema, mas isso em escala é definitivamente o maior gargalo do desenvolvimento KMP atualmente.

## Como contornar esse problema

- **Melhoria na Comunicação**: Reforçar a comunicação entre as times de desenvolvimento para planejar e sincronizar mudanças pode reduzir a frequência de quebras inesperadas.
- **Automação de Testes**: Implementar testes automatizados e processos de integração contínua para detectar e corrigir quebras antes que elas impactem outros desenvolvedores ou o projeto principal.

Existe uma estratégia que podemos adotar, porém, ficará para um artigo futuro. Primeiro, precisamos subir a escadinha de conhecimento em KMP em outros conceitos para conseguirmos compreender melhor essa estratégia alternativa.

## Conclusão

É importante sermos realistas e encararmos os problemas reais de uma tecnologia. Às vezes, no calor do "boom" de uma nova tecnologia, deixamos passar alguns aspectos cruciais para escalarmos uma solução, e se não tratarmos esses problemas, podemos ter (teremos!) um gargalo enorme no desenvolvimento. Isso pode gerar um barulho interno no seu time, como pessoas não adotando a tecnologia devido a má experiência de desenvolvimento, e constantes quebras no código causados por outros times em outros contextos.

Entender a natureza do XCFramework é crucial para termos um projeto escalável e saudável, com uma experiência de desenvolvimento de ponta a ponta sem gargalos.

Nos próximos artigos, vamos entender melhor sobre o código que que é exportado para o iOS, algumas características e limitações do código Kotlin > Objective-C e Objective-C > Swift, como escrever nosso código Kotlin para ser idiomático em Swift, e algumas abordagens para melhorarmos a integração Kotlin <--> Swift.

Nos vemos na próxima, tchau!

### Referências

> https://dzone.com/articles/the-skinny-on-fat-thin-hollow-and-uber
