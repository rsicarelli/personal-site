---
title: 'O Custo Oculto do Default Hierarchy Template no Kotlin Multiplatform'
description: 'O Default Hierarchy Template em projetos KMP é uma ótima forma de reduzir código boilerplate e começar a trabalhar rapidamente. Porém, ele veio com um custo inesperado…'
pubDate: 2025-11-02
updatedDate: 2025-11-14
tags:
  - 'kotlin'
  - 'kmp'
  - 'mobile'
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F6nh7bfue7eck9yqnr91b.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/the-hidden-cost-of-default-hierarchy-templates-in-kotlin-multiplatform-256a'
  reactions: 6
---

## Introdução

O Default Hierarchy Template em projetos KMP é uma ótima forma de reduzir código boilerplate e começar a trabalhar rapidamente. Porém, ele veio com um custo inesperado na nossa base de código de larga escala. Um projeto com mais de 70 módulos KMP visando Android, iOS e JVM viu os tempos de sync explodirem de 15 minutos para mais de uma hora. Mais grave ainda, um projeto enterprise com mais de 180 módulos ficou completamente inutilizável, travando após mais de 10 horas tentando sincronizar.

Não foi uma configuração errada nem um plugin problemático. O culpado? Uma única linha de código, aparentemente inofensiva, introduzida com o Kotlin 1.9.20:

```kotlin
applyDefaultHierarchyTemplate()
```

Antes de mergulharmos na solução, vamos entender o que está acontecendo por baixo dos panos. O que são hierarchy templates, e por que o template padrão cria um gargalo de performance tão grande?

## O Que São Hierarchy Templates no Kotlin Multiplatform?

Na sua essência, o Kotlin Multiplatform é construído sobre um sistema elegante, porém complexo, de **source sets** — coleções lógicas de código que compartilham dependências e configurações de compilação em comum.

Quando você cria um projeto KMP, você declara **targets** (as plataformas para as quais você está compilando) e **source sets** (onde seu código vive):

```kotlin
kotlin {
    androidTarget()
    jvm()
    iosArm64()
    iosX64()
    iosSimulatorArm64()
}
```

Cada target automaticamente ganha seu próprio source set (`androidMain`, `jvmMain`, `iosArm64Main`), onde você pode escrever código específico de plataforma com acesso às APIs daquela plataforma. Mas o real poder do KMP está no `commonMain` — código escrito aqui é compartilhado entre _todos_ os seus targets.

### A Relação dependsOn: Conectando os Pontos

Os source sets formam uma hierarquia por meio da relação `dependsOn`. Quando `iosArm64Main` depende de `commonMain`, ele consegue acessar todo o código escrito no source set comum. Essa relação cria um grafo direcionado que determina:

1. **Visibilidade de código** - Quais declarações são acessíveis onde
2. **Propagação de dependências** - Bibliotecas adicionadas ao `commonMain` descem para todos os source sets dependentes
3. **Segurança de API** - O compilador garante que você só use APIs disponíveis em todas as plataformas para as quais um source set compila

### Source Sets Intermediários: O Meio-Termo

É aqui que fica interessante. E se você quiser compartilhar código entre _algumas_ plataformas, mas não todas?

Imagine que você tem lógica específica de iOS que funciona em todas as variantes de iOS (arm64 para dispositivos, x64 para simuladores Intel, simulatorArm64 para simuladores Apple Silicon). Você não quer duplicar esse código em três lugares, mas também não pode colocá-lo no `commonMain` porque ele usa APIs específicas do iOS.

Entram em cena os **source sets intermediários**. Um source set `iosMain` fica entre o `commonMain` e os seus source sets específicos de iOS, permitindo que você:

- Acesse APIs específicas do iOS (como o framework Foundation)
- Compartilhe esse código entre todos os targets iOS
- Mantenha-o separado do código Android e JVM

Essa hierarquia poderia ficar assim:

```
commonMain
├── androidMain
├── jvmMain
└── iosMain (intermediário)
    ├── iosArm64Main
    ├── iosX64Main
    └── iosSimulatorArm64Main
```

### O Que os Hierarchy Templates Fazem

Criar source sets intermediários manualmente e conectar todas as relações `dependsOn` era tedioso e propenso a erros. Você escreveria algo como:

```kotlin
val iosMain by creating {
    dependsOn(commonMain.get())
}
val iosArm64Main by getting {
    dependsOn(iosMain)
}
// ... repita para cada target iOS
```

Os **hierarchy templates** automatizam esse boilerplate. Eles são plantas predefinidas que analisam os targets que você declarou e criam automaticamente os source sets intermediários apropriados, com as relações de dependência corretas.

A partir do Kotlin 1.9.20, o default hierarchy template passou a ser ativado automaticamente, eliminando a necessidade de configurar os source sets de iOS manualmente. Parece ótimo, não é?

E é — até que deixa de ser.

## O Default Hierarchy Template na Prática

Para entender o problema de performance, precisamos ver o que o template padrão realmente _faz_.

Quando você chama `applyDefaultHierarchyTemplate()` (ou deixa que ele se aplique automaticamente), o Kotlin Gradle Plugin analisa seus targets e cria source sets intermediários com base em uma estrutura abrangente e predefinida, desenhada para suportar _todos os targets possíveis_ do Kotlin Multiplatform.

Vamos considerar um cenário comum do mundo real. Seu projeto tem como alvo:

```kotlin
kotlin {
    applyDefaultHierarchyTemplate()

    androidTarget()
    jvm()
    iosArm64()
    iosX64()
    iosSimulatorArm64()
}
```

Você poderia esperar uma hierarquia simples:

```
commonMain
├── androidMain
├── jvmMain
└── iosMain
    ├── iosArm64Main
    ├── iosX64Main
    └── iosSimulatorArm64Main
```

Mas aqui está o que o template padrão _realmente_ cria:

```
commonMain
├── androidMain
├── jvmMain
├── nativeMain (compartilhado por TODOS os targets nativos)
    └── appleMain (compartilhado por TODOS os targets Apple)
        └── iosMain (compartilhado pelos targets iOS)
            ├── iosArm64Main
            ├── iosX64Main
            └── iosSimulatorArm64Main
```

Repare nas camadas extras: nativeMain e appleMain. O template cria esses source sets intermediários (e seus respectivos diretórios src/nativeMain e src/appleMain) para habilitar o compartilhamento de código em cenários como:

- `nativeMain`: Compartilhar código entre _todos_ os targets Kotlin/Native (iOS, macOS, Linux, Windows Native, watchOS, tvOS, etc.)
- `appleMain`: Compartilhar código entre _todas_ as plataformas Apple (iOS, macOS, watchOS, tvOS)

A filosofia de design é sólida. O template padrão otimiza para o cenário mais abrangente de compartilhamento de código. Se mais tarde você adicionar `macosArm64()` aos seus targets, ele automaticamente se encaixa na hierarquia existente, abaixo de `appleMain`, e qualquer código que você tenha escrito ali simplesmente vai funcionar.

Isso é "convention over configuration" no seu melhor momento — o template lida com a complexidade por você.

Mas aqui vai a pergunta crucial: e se você nunca for mirar macOS, Linux ou tvOS? E se os seus targets "native" forem apenas iOS?

Em um projeto iOS-only, você provavelmente não tem código nenhum em nativeMain ou appleMain — esses diretórios ficam vazios na estrutura do seu projeto. Ainda assim, eles continuam gerando build tasks e overhead de configuração.

## O Custo Oculto: Uma Explosão de Tasks

Os source sets não são apenas um modelo conceitual — eles têm consequências reais e tangíveis no seu sistema de build. Cada source set na sua hierarquia dispara a criação de várias tasks do Gradle.

Quando o Kotlin Gradle Plugin processa a hierarquia de source sets, ele gera tasks para cada source set. O padrão é previsível e mensurável.

Os resultados foram impressionantes:

- **Template otimizado**: 158 tasks por módulo
- **Template padrão**: 166 tasks por módulo
- **Diferença**: **8 tasks extras por módulo**

Extrapolando para a nossa base de código de produção com 70 módulos, você está olhando para **560 tasks desperdiçadas**. Na nossa base enterprise com mais de 180 módulos temos "apenas" **1440** **tasks desperdiçadas** 🫣.

Para cada source set intermediário (`nativeMain`, `appleMain`), o Gradle cria uma família de tasks:

- `compile<SourceSet>KotlinMetadata` - Compila o source set em Kotlin IR (Intermediate Representation) agnóstico de plataforma, armazenado em um arquivo `.klib`
- `metadata<SourceSet>Classes` - Reúne os outputs da compilação
- `metadata<SourceSet>ProcessResources` - Processa os recursos do source set
- `transform<SourceSet>DependenciesMetadata` - Gera metadados de dependência serializados para o ferramental da IDE

### Olhando de Perto: As Tasks de Compilação de Metadata

**`compileNativeMainKotlinMetadata`** e **`compileAppleMainKotlinMetadata`** são responsáveis por compilar os source sets (conceituais) `nativeMain` e `appleMain` em metadata do Kotlin.

Aqui está o problema: **esses source sets não têm código.** Os diretórios `src/nativeMain/kotlin` e `src/appleMain/kotlin` existem, mas ficam vazios porque não estamos compartilhando nenhum código nesses níveis. Mesmo assim, o compilador do Kotlin ainda roda, processando um source set vazio, gerando um arquivo `.klib` (essencialmente vazio).

Os source sets existem no grafo de dependências porque o template os criou. A compilação de `iosArm64Main` precisa saber quais APIs estão disponíveis a partir de `appleMain`, que por sua vez precisa saber o que está disponível a partir de `nativeMain`. Mesmo que esses source sets estejam vazios, o metadata precisa ser compilado para satisfazer a cadeia de dependências.

Pense nisso como compilar um arquivo `.kt` vazio — o compilador ainda precisa inicializar, fazer o parse (de nada), rodar as passagens de análise e escrever o output. O overhead não é zero.

### Olhando de Perto: As Tasks de Transform da IDE

**`transformNativeMainCInteropDependenciesMetadataForIde`** e **`transformAppleMainCInteropDependenciesMetadataForIde`** são ainda mais traiçoeiras.

Se você tiver testes sob `iosTest`, você ganhará também um **`transformNativeTestCInteropDependenciesMetadataForIde`** e um **`transformAppleTestCInteropDependenciesMetadataForIde`** extras.

Essas tasks existem especificamente para o suporte da IDE. Quando você sincroniza seu projeto no Android Studio ou no IntelliJ IDEA, essas tasks rodam para processar as dependências de C-interop (bindings do Kotlin/Native para bibliotecas C/Objective-C) e torná-las compreensíveis para o motor de análise de código da IDE.

**A ironia?** Nosso projeto não tem dependências de C-interop em `nativeMain` ou `appleMain`, porque esses source sets não existem na nossa base de código. Estamos transformando... nada.

Mas a task ainda roda. Ela ainda precisa:

1. Resolver o grafo de dependências do source set
2. Verificar a existência de arquivos `.klib` de C-interop
3. Processar resultados (vazios)
4. Escrever metadata para a IDE

Essas tasks criaram gargalos reais no nosso fluxo de trabalho. O projeto de 70 módulos passou de syncs de 15 minutos para mais de uma hora e vinte minutos. O projeto de 180 módulos ficou completamente inutilizável, com os syncs travando consistentemente após mais de 10 horas.

Depois de implementar a correção, não conseguimos reproduzir as condições exatas para capturar métricas detalhadas — o caching do Gradle e fatores de ambiente tornaram isso difícil. Mas o impacto agregado foi consistente em todo o nosso time, e a análise teórica bateu com a realidade: eliminar 1.440 tasks desperdiçadas restaurou a funcionalidade do projeto quebrado.

## A Solução: Uma Hierarquia Customizada e Otimizada

Uma vez que entendemos o problema, a solução ficou clara: **construir exatamente a hierarquia que precisamos, nem mais, nem menos.**

O Kotlin oferece a DSL `applyHierarchyTemplate()` exatamente para isso — definir hierarquias customizadas que correspondam à estrutura real do seu projeto.

### A Hierarquia Otimizada

Em vez da hierarquia profunda e de propósito geral do template padrão, criamos uma estrutura mínima e plana:

```kotlin
kotlin {
    applyHierarchyTemplate {
        common {
            withAndroidTarget()
            withJvm()
            group("ios") {
                withIosArm64()
                withIosX64()
                withIosSimulatorArm64()
            }
        }
    }

    androidTarget()
    jvm()
    iosArm64()
    iosX64()
    iosSimulatorArm64()
}
```

Isso cria a hierarquia:

```
commonMain
├── androidMain
├── jvmMain
└── iosMain
    ├── iosArm64Main
    ├── iosX64Main
    └── iosSimulatorArm64Main
```

Repare no que está faltando: `nativeMain` e `appleMain`. Reduzimos a hierarquia para incluir apenas os source sets intermediários que de fato usamos.

Essa mudança de configuração transformou a nossa experiência de desenvolvimento. O projeto de 70 módulos viu os tempos de sync melhorarem de cerca de uma hora e vinte minutos para aproximadamente 14 minutos. O projeto de 180 módulos passou de completamente quebrado para funcional. A melhoria foi universal em todo o nosso time ✨.

Ao eliminar os source sets intermediários não utilizados, removemos o overhead que vinha se acumulando silenciosamente em toda a nossa base de código.

## Uma Nota Sobre Reproduzir Esse Problema

Depois de implementar a correção, tentei reproduzir o problema original para capturar métricas mais detalhadas. Surpreendentemente, a degradação severa não voltou a ocorrer — provavelmente por causa do caching agressivo do Gradle e do estado de configuração.

**Se você está considerando essa otimização:** você pode não ver melhorias dramáticas imediatamente após a troca, especialmente se o Gradle já tiver cacheado artefatos da sua configuração atual. Os benefícios ficam mais aparentes em syncs limpos ou ao integrar novos membros ao time. A redução na contagem de tasks é objetiva — se isso vira um gargalo depende do contexto e da escala específicos do seu projeto.

## Quando Usar a Hierarquia Padrão vs. a Customizada

O default hierarchy template não é inerentemente ruim — ele está resolvendo um caso de uso diferente do nosso. Entender quando usar cada abordagem é crucial.

Se o seu projeto realmente mira macOS, Linux, Windows, iOS e watchOS, o source set `nativeMain` se torna valioso. Você _quer_ compartilhar código específico de native entre todas essas plataformas, então a Default Hierarchy é ouro aqui.

Por outro lado, se você está começando um projeto novo e não tem certeza se vai adicionar suporte a macOS daqui a seis meses, o template padrão fornece uma base estável que escala conforme você adiciona targets.

No entanto, se "native" significa exclusivamente iOS no seu projeto, `nativeMain` e `appleMain` são peso morto. O efeito de multiplicação de tasks se torna severo em escala, já que adiciona de 8 a 10 tasks por módulo.

Então, quando usar o Default Hierarchy Template? Desculpe, mas "depende" 🫠.

## Conclusão

O default hierarchy template no Kotlin Multiplatform é uma ferramenta poderosa que encarna a filosofia de "convention over configuration". Para muitos projetos, é a escolha certa — ele simplifica o setup, reduz o boilerplate e escala sem esforço conforme você adiciona targets.

Mas, como a nossa experiência demonstra, **o padrão otimiza para a máxima flexibilidade, não para a máxima performance.** Quando você conhece as suas restrições de plataforma (targets nativos iOS-only) e opera em escala (mais de 70 módulos), essa flexibilidade vira um passivo. Você está pagando o custo de tempo de build para suportar plataformas que nunca vai mirar.

A transformação que vivemos — de inutilizável para funcional, de frustrante para gerenciável — veio de uma constatação simples: **não precisamos de uma hierarquia desenhada para todo o universo do Kotlin Multiplatform. Precisamos de uma desenhada para o nosso projeto.** A DSL `applyHierarchyTemplate()` nos deu a precisão para definir exatamente isso, eliminando centenas de tasks desperdiçadas e restaurando a nossa velocidade de desenvolvimento.

É isso! ✌️ Espero que você consiga aplicar no seu projeto hoje mesmo e dar um boost de performance no seu dia!
