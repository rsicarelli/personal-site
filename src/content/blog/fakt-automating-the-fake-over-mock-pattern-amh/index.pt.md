---
title: 'Fakt: Automatizando o padrão fake-over-mock'
description: 'Os testes em Kotlin têm um problema que piora quanto mais bem-sucedido seu projeto se torna.'
pubDate: 2026-02-25
tags:
  - 'kotlin'
  - 'testing'
  - 'automation'
  - 'kmp'
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fzzcltp2drlweo3amp2tw.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/fakt-automating-the-fake-over-mock-pattern-amh'
  reactions: 1
---

Os testes em Kotlin têm um problema que piora quanto mais bem-sucedido seu projeto se torna.

Fakes de teste escritos à mão não escalam — cada interface exige de 60 a 80 linhas de boilerplate que silenciosamente se distancia da realidade durante refatorações. Frameworks de mocking em runtime (MockK, Mockito) resolvem o boilerplate, mas introduzem penalidades severas de performance e não funcionam em Kotlin/Native ou WebAssembly. Ferramentas baseadas em KSP prometiam geração em tempo de compilação, mas o Kotlin 2.0 quebrou todas elas.

Fakt é um compiler plugin que gera fakes com qualidade de produção por meio de uma integração profunda com as fases de compilação FIR e IR do Kotlin — os mesmos pontos de extensão usados pelo [Metro](https://github.com/ZacSweers/metro), um framework de DI de produção criado por Zac Sweers.

## O que o Fakt faz

https://github.com/rsicarelli/fakt

O Fakt reduz o boilerplate de um fake a uma annotation:

```kotlin
@Fake
interface AnalyticsService {
    fun track(event: String)
    suspend fun flush(): Result<Unit>
}
```

Em tempo de compilação, o Fakt gera uma implementação fake completa. Você a utiliza por meio de uma factory type-safe:

```kotlin
val fake = fakeAnalyticsService {
    track { event -> println("Tracked: $event") }
    flush { Result.success(Unit) }
}

// Use nos testes
fake.track("user_signup")
fake.flush()

// Verifique as interações (StateFlow thread-safe)
assertEquals(1, fake.trackCalls.value.size)
assertEquals(1, fake.flushCalls.value.size)
```

É só isso ✨

## O problema do teste

Considere uma interface simples:

```kotlin
interface AnalyticsService {
    fun track(event: String)
    suspend fun flush(): Result<Unit>
}
```

Um fake completo, com qualidade de produção, exige de 40 a 60 linhas de boilerplate:

```kotlin
// Fake típico escrito à mão — propenso a erros, tedioso
class FakeAnalyticsService(
    private val trackBehavior: ((String) -> Unit)? = null
    private val flushBehavior: (suspend () -> Result<Unit>)? = null
) : AnalyticsService {

    private var _trackCalls = mutableListOf<Unit>()
    val trackCalls: List<Unit> get() = _trackCalls

    private var _flushCalls = mutableListOf<Unit>()
    val flushCalls: List<Unit> get() = _flushCalls

    // Implementação da interface
    override fun track(event: String) {
        _trackCalls.add(Unit)
        trackBehavior?.invoke(event) ?: Unit
    }

    override suspend fun flush(): Result<Unit> {
        _flushCalls.add(Unit)
        return flushBehavior?.invoke() ?: Result.success(Unit)
    }
}
```

Os problemas: N métodos exigem cerca de 10N linhas. Mudanças na interface não quebram fakes não utilizados — eles silenciosamente se distanciam da realidade. Para 50 interfaces, isso significa milhares de linhas de boilerplate frágil.

### O imposto do mock

Frameworks de mocking em runtime resolvem o boilerplate, mas pagam um preço diferente. Classes em Kotlin são `final` por padrão, então MockK e Mockito recorrem à instrumentação de bytecode. Benchmarks independentes[^1] quantificam a penalidade:

| Padrão de mocking                           | Framework | Comparação                  | Penalidade verificada         |
| ------------------------------------------- | --------- | --------------------------- | ----------------------------- |
| `mockkObject` (Singletons)                  | MockK     | vs. Injeção de Dependência  | **1.391x mais lento**         |
| `mockkStatic` (Funções top-level)           | MockK     | vs. DI baseada em interface | **146x mais lento**           |
| `verify { ... }` (Verificação de interação) | MockK     | vs. Teste baseado em estado | **47x mais lento**            |
| Mocks `relaxed` (Chamadas sem stub)         | MockK     | vs. Mocks estritos          | **3,7x mais lento**           |
| `mock-maker-inline`                         | Mockito   | vs. plugin `all-open`       | **2,7-3x mais lento**[^2][^3] |

Uma suíte de testes de produção com 2.668 testes sofreu uma desaceleração de 2,7x (7,3s → 20,0s) ao usar `mock-maker-inline`[^3]. Em projetos grandes, o imposto do mock se acumula em suítes de teste 40% mais lentas[^1].

### O beco sem saída do KMP

O mocking em runtime depende de recursos específicos da JVM: reflection, instrumentação de bytecode, dynamic proxies. Kotlin/Native e Kotlin/Wasm compilam para código de máquina. Não existe JVM. MockK e Mockito não conseguem rodar em source sets `commonTest` que tenham como alvo Native ou Wasm[^6][^7].

A comunidade tentou soluções baseadas em KSP, mas o compilador K2 do Kotlin 2.0 as quebrou. O app StreetComplete (mais de 10.000 testes) foi forçado a migrar no meio do projeto[^8].

## Por que compiler plugins funcionam

Ferramentas baseadas em KSP (Mockative, MocKMP) operavam no nível de símbolos — depois da resolução de tipos, com acesso limitado ao sistema de tipos. Quando o K2 chegou, elas quebraram. Compiler plugins operam durante a compilação, com acesso completo a FIR e IR. Eles sobrevivem às atualizações de versão do Kotlin.

| Aspecto          | KSP                       | Compiler Plugin      |
| ---------------- | ------------------------- | -------------------- |
| Acesso           | Após a resolução de tipos | Durante a compilação |
| Sistema de tipos | Símbolos somente leitura  | Manipulação completa |

O Fakt usa uma arquitetura de duas fases, FIR → IR:

```
┌──────────────────────────────────────────────────────┐
│  FASE 1: FIR (Frontend IR)                           │
│  • Detecta annotations @Fake                         │
│  • Valida a estrutura da interface                   │
│  • Acesso completo ao sistema de tipos               │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│  FASE 2: IR (Intermediate Representation)            │
│  • Analisa métodos e propriedades da interface       │
│  • Gera arquivos-fonte .kt legíveis                  │
│  • Histórico de chamadas com StateFlow thread-safe   │
└──────────────────────────────────────────────────────┘
```

Esse é o mesmo padrão usado pelo [Metro](https://github.com/ZacSweers/metro), o compiler plugin de DI de Zac Sweers. A arquitetura do Metro se mostrou estável ao longo do Kotlin 1.9, 2.0 e 2.1.

## Por que fakes em vez de mocks

Além da performance, fakes representam uma filosofia de teste diferente. O artigo "Mocks Aren't Stubs", de Martin Fowler[^10], descreve duas escolas: teste baseado em estado (verificar resultados) e teste baseado em interação (verificar chamadas de método).

O problema dos testes baseados em interação: eles se acoplam a detalhes de implementação[^11]. Refatore a assinatura de um método sem mudar o comportamento e os testes baseados em mock quebram. O Testing Blog do Google define resiliência como uma qualidade crítica de um teste — "um teste não deveria falhar se o código sob teste não está com defeito"[^12]. Testes baseados em mock frequentemente violam isso.

O app "Now in Android" do Google deixa isso explícito[^14]:

> **"Não use frameworks de mocking. Em vez disso, use fakes."**

O objetivo: "testes menos frágeis que podem exercitar mais código de produção, em vez de apenas verificar chamadas específicas contra mocks"[^15].

A stack de teste assíncrono do Kotlin — `runTest`, `TestDispatcher`, Turbine[^17] — é inerentemente baseada em estado. O `awaitItem()` do Turbine verifica valores emitidos, não chamadas de método. A fonte de dados natural para essa stack é um fake apoiado em `MutableStateFlow`. O Fakt automatiza esse padrão.

## Orientações práticas

### Fakes vs. Mocks: comparação rápida

| Recurso                       | MockK/Mockito              | Fakt                       |
| ----------------------------- | -------------------------- | -------------------------- |
| **Suporte a KMP**             | Limitado (só JVM)          | Universal (todos os alvos) |
| **Segurança em compile-time** | ❌                         | ✅                         |
| **Overhead em runtime**       | Pesado (reflection)        | Zero                       |
| **Type safety**               | Parcial (matchers `any()`) | Completo                   |
| **Curva de aprendizado**      | Íngreme (DSL complexa)     | Suave (funções tipadas)    |
| **Histórico de chamadas**     | Manual (`verify { }`)      | Embutido (StateFlow)       |
| **Thread safety**             | Não garantida              | Baseada em StateFlow       |
| **Facilidade de debug**       | Reflection (opaco)         | Arquivos `.kt` gerados     |

### Escolhendo a ferramenta certa

O Fakt e as bibliotecas de mocking resolvem problemas sobrepostos, mas distintos. A escolha entre eles depende das suas restrições e necessidades de teste.

**O Fakt funciona melhor quando:**

- Você já escolheu fakes em vez de mocks. Se você entende a filosofia do teste baseado em estado e prefere testar resultados em vez de verificar interações, o Fakt automatiza o que você escreveria à mão.

- Você usa mocks apenas por conveniência. Muitos desenvolvedores recorrem a frameworks de mocking não pelos recursos de `verify { }`, mas simplesmente porque escrever fakes à mão é tedioso. O Fakt te dá a conveniência da factory sem o overhead do mock — os fakes gerados são classes Kotlin comuns.

- Você está construindo para Kotlin Multiplatform. O Fakt gera Kotlin puro que compila em JVM, Native e WebAssembly — sem reflection. Isso vale para qualquer source set, não só o `commonTest`.

- Você valoriza exercitar código de produção nos testes. Os fakes gerados pelo Fakt são implementações reais contra as quais seus testes compilam, capturando o desvio da interface em tempo de build, e não em runtime.

- Os testes rodam concorrentemente. O Fakt rastreia o histórico de chamadas com StateFlow, que é thread-safe por design. Fakes à mão com `var count = 0` quebram sob execução paralela.

**Bibliotecas de mocking (Mokkery, MockK) funcionam melhor quando:**

- Você precisa de comportamento de spy. O mocking parcial de implementações reais — chamar métodos reais enquanto intercepta outros — é algo que só frameworks de mocking conseguem fazer. O Fakt gera novas implementações; ele não envolve as existentes.

- Você está mockando classes de terceiros sem interfaces. Se uma biblioteca expõe classes final sem nenhuma interface contra a qual programar, frameworks de mocking podem instrumentar o bytecode. O Fakt exige uma interface para anotar.

**Nenhuma das ferramentas substitui o contract testing.** Para APIs HTTP de terceiros, use WireMock ou Pact. Fakes escritos à mão para serviços externos se distanciam da realidade sem validação de contrato — eles criam ilusões perigosas de fidelidade que quebram em produção.

## Referências

[^1]: Benchmarking Mockk — Avoid these patterns for fast unit tests. Kevin Block. [https://medium.com/@\_kevinb/benchmarking-mockk-avoid-these-patterns-for-fast-unit-tests-220fc225da55](https://medium.com/@_kevinb/benchmarking-mockk-avoid-these-patterns-for-fast-unit-tests-220fc225da55)

[^2]: Effective migration to Kotlin on Android. Aris Papadopoulos. [https://medium.com/android-news/effective-migration-to-kotlin-on-android-cfb92bfaa49b](https://medium.com/android-news/effective-migration-to-kotlin-on-android-cfb92bfaa49b)

[^3]: Mocking Kotlin classes with Mockito — the fast way. Brais Gabín Moreira. [https://medium.com/21buttons-tech/mocking-kotlin-classes-with-mockito-the-fast-way-631824edd5ba](https://medium.com/21buttons-tech/mocking-kotlin-classes-with-mockito-the-fast-way-631824edd5ba)

[^4]: Reflection | Kotlin Documentation. [https://kotlinlang.org/docs/reflection.html](https://kotlinlang.org/docs/reflection.html)

[^5]: Reflection? - Native - Kotlin Discussions. [https://discuss.kotlinlang.org/t/reflection/4054](https://discuss.kotlinlang.org/t/reflection/4054)

[^6]: Did someone try to use Mockk on KMM project. Kotlin Slack. [https://slack-chats.kotlinlang.org/t/10131532/did-someone-try-to-use-mockk-on-kmm-project](https://slack-chats.kotlinlang.org/t/10131532/did-someone-try-to-use-mockk-on-kmm-project)

[^7]: Mock common tests in kotlin using multiplatform. Stack Overflow. [https://stackoverflow.com/questions/65491916/mock-common-tests-in-kotlin-using-multiplatform](https://stackoverflow.com/questions/65491916/mock-common-tests-in-kotlin-using-multiplatform)

[^8]: Mocking in Kotlin Multiplatform: KSP vs Compiler Plugins. Martin Hristev. [https://medium.com/@mhristev/mocking-in-kotlin-multiplatform-ksp-vs-compiler-plugins-4424751b83d7](https://medium.com/@mhristev/mocking-in-kotlin-multiplatform-ksp-vs-compiler-plugins-4424751b83d7)

[^9]: MocKMP: a Mocking processor for Kotlin/Multiplatform. Salomon BRYS. [https://medium.com/kodein-koders/mockmp-a-mocking-processor-for-kotlin-multiplatform-51957c484fe5](https://medium.com/kodein-koders/mockmp-a-mocking-processor-for-kotlin-multiplatform-51957c484fe5)

[^10]: Mocks Aren't Stubs. Martin Fowler. [https://martinfowler.com/articles/mocksArentStubs.html](https://martinfowler.com/articles/mocksArentStubs.html)

[^11]: Unit Testing — Why must you mock me? Craig Walker. [https://medium.com/@walkercp/unit-testing-why-must-you-mock-me-69293508dd13](https://medium.com/@walkercp/unit-testing-why-must-you-mock-me-69293508dd13)

[^12]: Testing on the Toilet: Effective Testing. Google Testing Blog. [https://testing.googleblog.com/2014/05/testing-on-toilet-effective-testing.html](https://testing.googleblog.com/2014/05/testing-on-toilet-effective-testing.html)

[^13]: Trade-offs to consider when choosing to use Mocks vs Fakes. HackMD. [https://hackmd.io/@pierodibello/Trade-offs-to-consider-when-choosing-to-use-Mocks-vs-Fakes](https://hackmd.io/@pierodibello/Trade-offs-to-consider-when-choosing-to-use-Mocks-vs-Fakes)

[^14]: Testing strategy and how to test. Now in Android Wiki. [https://github.com/android/nowinandroid/wiki/Testing-strategy-and-how-to-test](https://github.com/android/nowinandroid/wiki/Testing-strategy-and-how-to-test)

[^15]: android/nowinandroid: A fully functional Android app built entirely with Kotlin and Jetpack Compose. GitHub. [https://github.com/android/nowinandroid](https://github.com/android/nowinandroid)

[^16]: Testing Kotlin coroutines on Android. Android Developers. [https://developer.android.com/kotlin/coroutines/test](https://developer.android.com/kotlin/coroutines/test)

[^17]: Flow testing with Turbine. Cash App Code Blog. [https://code.cash.app/flow-testing-with-turbine](https://code.cash.app/flow-testing-with-turbine)

[^18]: Why we should use wiremock instead of Mockito. Stack Overflow. [https://stackoverflow.com/questions/50726017/why-we-should-use-wiremock-instead-of-mockito](https://stackoverflow.com/questions/50726017/why-we-should-use-wiremock-instead-of-mockito)

[^19]: Stop Breaking My API: A Practical Guide to Contract Testing with Pact. Medium. [https://medium.com/@mohsenny/stop-breaking-my-api-a-practical-guide-to-contract-testing-with-pact-33858d113386](https://medium.com/@mohsenny/stop-breaking-my-api-a-practical-guide-to-contract-testing-with-pact-33858d113386)

[^20]: lupuuss/Mokkery: The mocking library for Kotlin Multiplatform. GitHub. [https://github.com/lupuuss/Mokkery](https://github.com/lupuuss/Mokkery)

[^21]: Kotlin 2.0.0 support · Issue #1 · lupuuss/Mokkery. GitHub. [https://github.com/lupuuss/Mokkery/issues/1](https://github.com/lupuuss/Mokkery/issues/1)

[^22]: Use multiplatform mocking library for tests · Issue #5420 · streetcomplete/StreetComplete. GitHub. [https://github.com/streetcomplete/StreetComplete/issues/5420](https://github.com/streetcomplete/StreetComplete/issues/5420)

[^23]: Kotlin 2.2.0 support · Issue #83 · lupuuss/Mokkery. GitHub. [https://github.com/lupuuss/Mokkery/issues/83](https://github.com/lupuuss/Mokkery/issues/83)

[^24]: Mocking | Mokkery. [https://mokkery.dev/docs/Guides/Mocking/](https://mokkery.dev/docs/Guides/Mocking/)

[^25]: A to Z of Testing in Kotlin Multiplatform. Kinto Technologies. [https://blog.kinto-technologies.com/posts/2024-12-24-tests-in-kmp/](https://blog.kinto-technologies.com/posts/2024-12-24-tests-in-kmp/)

[^26]: Limitations | Mokkery. [https://mokkery.dev/docs/Limitations/](https://mokkery.dev/docs/Limitations/)
