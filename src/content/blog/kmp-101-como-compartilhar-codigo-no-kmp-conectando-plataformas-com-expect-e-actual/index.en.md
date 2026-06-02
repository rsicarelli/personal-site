---
title: "KMP 101: Como compartilhar código no KMP - conectando plataformas com expect e actual"
description: "Nos últimos artigos, aprofundamos nos bastidores do Kotlin Multiplataforma: seu paradigma, a arquitetura do compilador, os source sets, o ambiente de…"
summary: "Nos últimos artigos, aprofundamos nos bastidores do Kotlin Multiplataforma: seu paradigma, a arquitetura do compilador, os source sets, o ambiente de desenvolvimento, a criação e execução de um projeto exemplo, e o papel fundamental do Gradle."
pubDate: 2023-12-13
updatedDate: 2024-01-27
tags:
  - "kotlin"
  - "kmp"
  - "braziliandevs"
  - "mobile"
series: "kmp-101"
seriesOrder: 7
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F3x2ugp064gbq2qgpcrje.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/kmp-101-como-compartilhar-codigo-no-kmp-conectando-plataformas-com-expect-e-actual-49ma"
  devtoId: 1696574
  githubRepo: "https://github.com/rsicarelli/KMP-101"
  reactions: 11
---

Agora, vamos emergir à superfície do KMP, desvendando as palavras reservadas `actual` e `expect` e como elas facilitam o compartilhamento de código.

---

## Como o KMP Facilita o Compartilhamento de Código

No artigo [🔗 Dominando os Princípios dos Source Sets](https://dev.to/rsicarelli/kotlin-multiplataforma-101-dominando-os-principios-dos-source-sets-4pg), aprendemos que o KMP usa a estrutura de source sets e que todo source-set específico é herdeiro do source-set raiz `commonMain`. Todo código Kotlin no `commonMain` fica automaticamente acessível nos source-sets específicos, como `androidMain`, `appleMain`, entre outros.

O código no `commonMain` pode ser:

1. Suficientemente genérico para ser resolvido apenas com Kotlin.
2. Comportar-se de maneira consistente, mas com implementações que variam conforme as exigências de cada plataforma.

> Lembre-se: o Kotlin sempre compilará para código nativo, independente do tipo de compartilhamento.

Vamos examinar mais detalhadamente cada tipo de compartilhamento.

### 1. Compartilhando código genérico utilizando 100% Kotlin

Esse tipo de compartilhamento pressupõe que não existem implementações específicas de plataforma a serem feitas. Assim, podemos utilizar apenas Kotlin para atender aos nossos requisitos.

No início do KMP, essa abordagem não era comum, pois a comunidade open-source e as bibliotecas KMP ainda estavam em fase inicial. Atualmente, com o aumento de recursos open-source disponíveis, tornou-se o método mais frequente de compartilhamento de código.

Vamos explorar alguns casos.

#### 1.1 Constantes

Constantes são informações estáticas e altamente específicas. Geralmente, possuem um tipo primitivo (`String`, `Int`, `Boolean`, etc.) e são consistentes em todas as plataformas.

```kotlin
object AppConfig {
    const val API_KEY: String = "your_api_key"
    const val ENVIRONMENT: String = "production"
}

object AuthConfig {
    const val LOGIN_URL: String = "https://..."
    const val TOKEN_EXPIRY: Long = 3600 // 1 hora em segundos
}

object UIConfig {
    const val PRIMARY_COLOR: String = "#FF5733"
    const val FONT_SIZE: Int = 14
}

object ErrorMessages {
    const val NETWORK_ERROR: String = "Erro de conexão com a internet."
    const val LOGIN_FAILED: String = "Falha no login, tente novamente."
}

object DatabaseConfig {
    const val DB_URL: String = "jdbc:mysql://localhost:3306/mydb"
    const val TABLE_USER: String = "users"
}

object DomainSpecific {
    const val TAX_RATE: Double = 0.2
    const val MAX_DISCOUNT: Double = 50.0
    const val FAQ_URL: String = "https://..."
}

object WebServiceRoutes {
    private const val BASE_URL: String = "https://api.example.com/"
    const val USER_PROFILE: String = "${BASE_URL}user/profile"
    const val PRODUCT_LIST: String = "${BASE_URL}product/list"
}

object AnalyticsEvents {
    const val BUTTON_CLICKED_EVENT_NAME: String = "..."
}
```

#### 1.2 Modelos: entidades, DTOs, objetos de valor, respostas e requisições

Modelos refletem aspectos mais específicos do negócio e raramente exigem implementações específicas de plataforma.

Compartilhar modelos vai além da conveniência, mas também reforça uma linguagem de domínio único para todo o time de frontend (mobile, web e desktop). Para os praticantes do [Domain Driven Design (DDD)](https://en.wikipedia.org/wiki/Domain-driven_design), essa prática é um artefato extremamente poderoso, já que dessa forma, o time terá um único dicionário do domínio.

```kotlin
data class User(
    val id: Int,
    val name: String,
    val email: String
) {
    init {
        require(id != 0)
        require(name.isNotBlank())
        require(email.isNotBlank())
    }
}
```

```kotlin
data class UserDTO(
    val name: String,
    val email: String
)
```

```kotlin
data class Money(
    val amount: Double,
    val currency: String
)
```

Com [kotlin.serialization](https://github.com/Kotlin/kotlinx.serialization), as implementações específicas de serialização são desnecessárias, permitindo o uso exclusivo de Kotlin:

```kotlin
@Serializable
data class ApiResponse<T>(
    @SerialName("data")
    val data: T,

    @SerialName("message")
    val message: String? = null,

    @SerialName("status")
    val status: Int
)
```

```kotlin
@Serializable
data class LoginRequest(
    @SerialName("username")
    val username: String,

    @SerialName("password")
    val password: String
)
```

> ⏱️ Vamos aprender sobre essa biblioteca nos próximos artigos

#### 1.3 Lógica de negócio

A natureza de uma regra de negócio é geralmente agnóstica a plataforma, e imposta pelo contexto específico do seu projeto, sendo um candidato perfeito para ser solucionado apenas com Kotlin.

Além de impor o mesmo comportamento de negócio para todas as plataformas, compartilhar a regra de negócio também significa compartilhar os testes unitários e integração dessa regra. Ao invés de repetir o mesmo teste em cada plataforma, testaremos apenas uma vez.

```kotlin
interface AccountRepository {
    val currentBalance: Double
}

class CheckBalanceForTransferUseCase(
    val accountRepository: AccountRepository
) {
    operator fun invoke(valueToTransfer: Double): CheckBalanceForTransferResult {
        require(valueToTransfer > 0)

        val currentBalance: Double = accountRepository.currentBalance

        return if (currentBalance >= valueToTransfer)
            HasSufficientFunds
        else InsufficientFunds(missingAmount = valueToTransfer - currentBalance)
    }

    sealed interface CheckBalanceForTransferResult {
        data object HasSufficientFunds : CheckBalanceForTransferResult
        data class InsufficientFunds(val missingAmount: Double) : CheckBalanceForTransferResult
    }
}
```

> No mundo do Kotlin/Android, o uso do padrão [UseCase](https://en.wikipedia.org/wiki/Use_case) se tornou uma prática comum e constantemente utilizada em projetos inner e open source.
>
> Existem diversas formas de criar UseCases no Kotlin, caso tenha curiosidade em aprender outras formas:
>
> [🔗 How To Avoid Use Cases Boilerplate in Android](https://betterprogramming.pub/how-to-avoid-use-cases-boilerplate-in-android-d0c9aa27ef27)

#### 1.4 Testes unitários e de integração

Uma das grandes vantagens do KMP é a possibilidade de ter seu código testado uma vez e reutilizada em todas as plataformas. Lembrando que, dentro do source-set `commonMain` ou `commonTest`, não podemos utilizar nenhuma biblioteca específica da plataforma. Ou seja, precisamos escrever testes numa infraestrutura multiplataforma.

Para isso, temos o [🔗 kotlin.test](https://kotlinlang.org/api/latest/kotlin.test/), que oferece uma API parecida com o `JUnit4/5` com suporte a anotações de `@Test`, além de recursos para verificar o conteúdo por funções como `assertEquals` e `assertContains`.

Vamos ver como seria um teste unitário para nosso use case acima:

```kotlin
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlin.test.assertFalse

// Implementação Fake
private class FakeAccountRepository(val balance: Double) : AccountRepository {
    override val currentBalance: Double
        get() = balance
}

// Classe de teste
class CheckBalanceForTransferUseCaseTest {

    @Test
    fun `deve retornar HasSufficientFunds quando o saldo atual é maior que o valor da transferência`() {
        // DADO: Um repositório fake com saldo suficiente
        val fakeRepository = FakeAccountRepository(balance = 1000.0)
        val useCase = CheckBalanceForTransferUseCase(fakeRepository)

        // QUANDO: Verificando o saldo para uma transferência
        val result = useCase(500.0)

        // ENTÃO: Deve retornar HasSufficientFunds
        assertTrue(result is HasSufficientFunds)
    }

    @Test
    fun `deve retornar InsufficientFunds com o valor correto faltante quando o saldo é menor que o valor da transferência`() {
        // DADO: Um repositório fake com saldo insuficiente
        val fakeRepository = FakeAccountRepository(balance = 300.0)
        val useCase = CheckBalanceForTransferUseCase(fakeRepository)

        // QUANDO: Verificando o saldo para uma transferência
        val result = useCase(500.0)

        // ENTÃO: Deve retornar InsufficientFunds com o valor faltante correto
        assertTrue(result is InsufficientFunds)
        val insufficientFundsResult = result as InsufficientFunds
        assertTrue(insufficientFundsResult.missingAmount == 200.0)
    }
}
```

> Para aprender sobre anotações no Kotlin: [The Full Guide to ANNOTATIONS In Kotlin por Philipp Lackner](https://www.youtube.com/watch?v=qdnhQzVGywQ)
>
> Para aprender sobre o uso de "fakes" no Kotlin: [No Mocks Allowed por Marcello Galhardo](https://marcellogalhardo.dev/posts/no-mocks-allowed/)

> ⏱️ Vamos aprender mais sobre testes no KMP em artigos futuros

#### Conclusão sobre compartilhando códigos 100% Kotlin

Percebemos que podemos utilizar apenas o Kotlin em diversos aspectos do nosso projeto. Essa capacidade do KMP é extremamente poderosa, já que sem muito esforço, podemos utilizar o maquinário do KMP para gerar compilações nativas do nosso código.

Mas, como pode perceber pelos exemplos, geralmente conseguimos utilizar essa abordagem e 100% Kotlin para implementações específicas do seu domínio (camada `domain`).

Mas e quanto ao acesso a recursos específicos e nativos da plataforma no KMP?

### 2. Compartilhando código com implementações específicas de cada plataforma
Aprendemos que cada plataforma tem uma forma específica de acessar recursos exclusivos do sistema operacional como internet, bluetooth, disco, notificações, imagens, etc. Esses recursos, apesar de na teoria terem o mesmo conceito, diferem nas suas implementações.

Para resolver esse desafio, o KMP introduz [duas novas palavras reservadas](https://kotlinlang.org/docs/multiplatform-expect-actual.html): `expect` (o contrato) e `actual` (a implementação).

#### 2.1 A palavra reservada `expect` no KMP
A palavra reservada `expect` informa o compilador do Kotlin para ele pode "esperar" ou "exigir" uma implementação específica de cada plataforma para aquele componente específico durante a compilação de um source-set específico. Podemos utilizar a palavra `expect` para funções, propriedades, classes, objetos, interfaces, enumerações ou anotações.

Só é possível utilizar o `expect` no source set comum (`commonMain`): o source set comum declara, e os source sets específicos implementam.

- Ao declarar um componente com a palavra `expect`, você tem a obrigação de declarar a implementação (`actual`) em cada source-set específico. Inclusive, ao declarar um `expect` qualquer, a IDE já sinaliza um erro informando que precisamos declarar a versão `actual` de cada plataforma. 
 ![Erro ao declarar expect](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/error-expect-actual-kotlin.png?raw=true) 
- Não é possível declarar a implementação ou atribuir um valor para seu componente. Por exemplo, ao declarar uma variável com `expect`, não é possível assinar um valor 
 ![Erro ao inicializar expect](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/error-expect-no-initializer.png?raw=true) 

Agora que entendemos a palavra reservada `expect`, vamos aprender mais sobre seu outro par: o `actual`

#### 2.2 A palavra reservada `actual` no KMP

A palavra reservada `actual` satisfaz o contrato do `expect`, informando o compilador que aquela declaração é a implementação "atual" ou "real" do source-set específico. Durante a compilação, o Kotlin vai tentar combinar todo `actual` com seu `expect` de origem no source-set comum.

Essa palavra é reservada para os source-sets específicos. Ou seja, não é possível utilizar no source-set comum `commonMain`.

O compilador do Kotlin garante que:

- Toda declaração esperada no source-set comum tem uma declaração real correspondente em cada source-set específico da plataforma.

 ![Demo em todas as plataformas](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/fullfilling-expect-actual.gif?raw=true)                                                                                                                                                                                                             
- Toda declaração real compartilha o mesmo pacote que a declaração esperada correspondente, como `br.com.rsicarelli.example`. A imagem a seguir mostra o erro relacionado a tentar refatorar declarações que não compartilham o mesmo pacote:

 ![Error: não pode ter pacotes diferentes](https://github.com/rsicarelli/KMP-101/blob/main/posts/assets/error-cannot-have-different-packages.gif?raw=true) <br> _"Não é Possível Realizar Refatoração. <br> Esta refatoração moverá a declaração selecionada sem seus correspondentes esperados/reais que podem levar a erros de compilação."_

## Conclusões

Neste artigo, desbravamos as funcionalidades das palavras reservadas `actual` e `expect`, que são peças-chave para a portabilidade do código entre diferentes plataformas. Compreendemos como essas palavras reservadas orquestram a harmonia entre o código comum e as especificidades de cada plataforma, assegurando a coesão e a integridade do nosso projeto multiplataforma.

No próximo artigo, vamos nos aprofundar no ecossistema das bibliotecas KMP. Aprenderemos como navegar por este território, escolher as bibliotecas adequadas para as nossas necessidades, entender seus detalhes e peculiaridades, e como elas podem impulsionar ainda mais nosso trabalho no desenvolvimento multiplataforma.

Até a próxima!

---

> 🤖 Artigo foi escrito com o auxílio do ChatGPT 4, utilizando o plugin Web.
>
> As fontes e o conteúdo são revisados para garantir a relevância das informações fornecidas, assim como as fontes utilizadas em cada prompt.
>
> No entanto, caso encontre alguma informação incorreta ou acredite que algum crédito está faltando, por favor, entre em contato!

---

> Referências
> - [Rules for expected and actual declarations](https://kotlinlang.org/docs/multiplatform-expect-actual.html)
