---
title: 'KMP 101: How to Share Code in KMP - Connecting Platforms with expect and actual'
description: 'Unpacking the expect and actual keywords in Kotlin Multiplatform and the different ways they let you share code across platforms.'
summary: 'Over the last few articles, we dug into the inner workings of Kotlin Multiplatform: its paradigm, the compiler architecture, the source sets, the development environment, building and running a sample project, and the essential role of Gradle.'
pubDate: 2023-12-13
updatedDate: 2024-01-27
tags:
  - 'kotlin'
  - 'kmp'
  - 'braziliandevs'
  - 'mobile'
series: 'kmp-101'
seriesOrder: 7
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kmp-101-como-compartilhar-codigo-no-kmp-conectando-plataformas-com-expect-e-actual-49ma'
  githubRepo: 'https://github.com/rsicarelli/KMP-101'
  reactions: 11
topic: kmp
difficulty: beginner
contentType: tutorial
---

Now let's come up to the surface of KMP, unpacking the `actual` and `expect` keywords and how they make code sharing easier.

---

## How KMP Makes Code Sharing Easier

In the article [🔗 Mastering the Principles of Source Sets](https://dev.to/rsicarelli/kotlin-multiplataforma-101-dominando-os-principios-dos-source-sets-4pg), we learned that KMP uses the source set structure and that every platform-specific source set inherits from the root source set `commonMain`. All Kotlin code in `commonMain` automatically becomes accessible from the platform-specific source sets, such as `androidMain`, `appleMain`, and others.

Code in `commonMain` can be:

1. Generic enough to be resolved with Kotlin alone.
2. Consistent in behavior, but with implementations that vary according to each platform's requirements.

> Remember: Kotlin always compiles to native code, regardless of the type of sharing.

Let's take a closer look at each type of sharing.

### 1. Sharing generic code using 100% Kotlin

This type of sharing assumes there are no platform-specific implementations to write. That way, we can use Kotlin alone to meet our requirements.

In KMP's early days, this approach wasn't common, because the open-source community and KMP libraries were still in their infancy. Today, with the growing number of open-source resources available, it has become the most frequent way of sharing code.

Let's explore a few cases.

#### 1.1 Constants

Constants are static, highly specific pieces of information. They usually have a primitive type (`String`, `Int`, `Boolean`, etc.) and are consistent across all platforms.

```kotlin
object AppConfig {
    const val API_KEY: String = "your_api_key"
    const val ENVIRONMENT: String = "production"
}

object AuthConfig {
    const val LOGIN_URL: String = "https://..."
    const val TOKEN_EXPIRY: Long = 3600 // 1 hour in seconds
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

#### 1.2 Models: entities, DTOs, value objects, responses, and requests

Models reflect more specific aspects of the business and rarely require platform-specific implementations.

Sharing models is more than just a convenience—it also reinforces a single domain language across the entire frontend team (mobile, web, and desktop). For practitioners of [Domain Driven Design (DDD)](https://en.wikipedia.org/wiki/Domain-driven_design), this practice is an extremely powerful artifact, since the team ends up with a single domain dictionary.

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

With [kotlin.serialization](https://github.com/Kotlin/kotlinx.serialization), platform-specific serialization implementations are unnecessary, allowing you to use Kotlin exclusively:

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

> ⏱️ We'll learn about this library in upcoming articles

#### 1.3 Business logic

A business rule is generally platform-agnostic by nature, imposed by your project's specific context, making it a perfect candidate to be solved with Kotlin alone.

Beyond enforcing the same business behavior across all platforms, sharing business rules also means sharing the unit and integration tests for those rules. Instead of repeating the same test on each platform, we test only once.

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

> In the Kotlin/Android world, the [UseCase](https://en.wikipedia.org/wiki/Use_case) pattern has become a common practice, used constantly in both inner-source and open-source projects.
>
> There are several ways to create UseCases in Kotlin. If you're curious to learn other approaches:
>
> [🔗 How To Avoid Use Cases Boilerplate in Android](https://betterprogramming.pub/how-to-avoid-use-cases-boilerplate-in-android-d0c9aa27ef27)

#### 1.4 Unit and integration tests

One of the great advantages of KMP is being able to test your code once and reuse it across all platforms. Keep in mind that, inside the `commonMain` or `commonTest` source set, we can't use any platform-specific library. In other words, we need to write tests on a multiplatform infrastructure.

For that, we have [🔗 kotlin.test](https://kotlinlang.org/api/latest/kotlin.test/), which offers an API similar to `JUnit4/5` with support for `@Test` annotations, plus features to verify content through functions like `assertEquals` and `assertContains`.

Let's see what a unit test for our use case above would look like:

```kotlin
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlin.test.assertFalse

// Fake implementation
private class FakeAccountRepository(val balance: Double) : AccountRepository {
    override val currentBalance: Double
        get() = balance
}

// Test class
class CheckBalanceForTransferUseCaseTest {

    @Test
    fun `deve retornar HasSufficientFunds quando o saldo atual é maior que o valor da transferência`() {
        // GIVEN: A fake repository with sufficient balance
        val fakeRepository = FakeAccountRepository(balance = 1000.0)
        val useCase = CheckBalanceForTransferUseCase(fakeRepository)

        // WHEN: Checking the balance for a transfer
        val result = useCase(500.0)

        // THEN: It should return HasSufficientFunds
        assertTrue(result is HasSufficientFunds)
    }

    @Test
    fun `deve retornar InsufficientFunds com o valor correto faltante quando o saldo é menor que o valor da transferência`() {
        // GIVEN: A fake repository with insufficient balance
        val fakeRepository = FakeAccountRepository(balance = 300.0)
        val useCase = CheckBalanceForTransferUseCase(fakeRepository)

        // WHEN: Checking the balance for a transfer
        val result = useCase(500.0)

        // THEN: It should return InsufficientFunds with the correct missing amount
        assertTrue(result is InsufficientFunds)
        val insufficientFundsResult = result as InsufficientFunds
        assertTrue(insufficientFundsResult.missingAmount == 200.0)
    }
}
```

> To learn about annotations in Kotlin: [The Full Guide to ANNOTATIONS In Kotlin by Philipp Lackner](https://www.youtube.com/watch?v=qdnhQzVGywQ)
>
> To learn about using "fakes" in Kotlin: [No Mocks Allowed by Marcello Galhardo](https://marcellogalhardo.dev/posts/no-mocks-allowed/)

> ⏱️ We'll learn more about testing in KMP in future articles

#### Wrapping up on sharing 100% Kotlin code

We've seen that we can use Kotlin alone in many aspects of our project. This KMP capability is extremely powerful, since with little effort we can use the KMP machinery to generate native builds of our code.

But, as you can tell from the examples, we usually get to use this 100% Kotlin approach for implementations specific to your domain (the `domain` layer).

But what about accessing platform-specific, native resources in KMP?

### 2. Sharing code with platform-specific implementations

We learned that each platform has a specific way of accessing exclusive operating-system resources like the internet, Bluetooth, disk, notifications, images, etc. These resources, although in theory they share the same concept, differ in their implementations.

To solve this challenge, KMP introduces [two new keywords](https://kotlinlang.org/docs/multiplatform-expect-actual.html): `expect` (the contract) and `actual` (the implementation).

#### 2.1 The `expect` keyword in KMP

The `expect` keyword tells the Kotlin compiler that it can "expect" or "require" a platform-specific implementation for that particular component while compiling a specific source set. We can use the `expect` keyword for functions, properties, classes, objects, interfaces, enums, or annotations.

You can only use `expect` in the common source set (`commonMain`): the common source set declares, and the platform-specific source sets implement.

- When you declare a component with the `expect` keyword, you are required to declare the implementation (`actual`) in each platform-specific source set. In fact, the moment you declare any `expect`, the IDE flags an error telling you that you need to declare the `actual` version for each platform.
  ![Error declaring expect](https://media.rsicarelli.com/blog/kmp-101/shared/error-expect-actual-kotlin.png)
- You can't provide an implementation or assign a value to your component. For example, when you declare a variable with `expect`, you can't assign a value to it
  ![Error initializing expect](https://media.rsicarelli.com/blog/kmp-101/shared/error-expect-no-initializer.png)

Now that we understand the `expect` keyword, let's learn more about its counterpart: `actual`

#### 2.2 The `actual` keyword in KMP

The `actual` keyword satisfies the `expect` contract, telling the compiler that this declaration is the "actual" or "real" implementation for the platform-specific source set. During compilation, Kotlin will try to match every `actual` with its originating `expect` in the common source set.

This keyword is reserved for the platform-specific source sets. In other words, you can't use it in the common source set `commonMain`.

The Kotlin compiler guarantees that:

- Every expected declaration in the common source set has a corresponding actual declaration in each platform-specific source set.

![Demo across all platforms](https://media.rsicarelli.com/blog/kmp-101/shared/fullfilling-expect-actual.gif)

- Every actual declaration shares the same package as its corresponding expected declaration, such as `br.com.rsicarelli.example`. The image below shows the error you get when trying to refactor declarations that don't share the same package:

![Error: cannot have different packages](https://media.rsicarelli.com/blog/kmp-101/shared/error-cannot-have-different-packages.gif) <br> _"Cannot Perform Refactoring. <br> This refactoring will move the selected declaration without its expected/actual counterparts, which may lead to compilation errors."_

## Conclusions

In this article, we explored the capabilities of the `actual` and `expect` keywords, which are key pieces for making code portable across different platforms. We came to understand how these keywords orchestrate the harmony between common code and the specifics of each platform, ensuring the cohesion and integrity of our multiplatform project.

In the next article, we'll dive deeper into the ecosystem of KMP libraries. We'll learn how to navigate this territory, choose the right libraries for our needs, understand their details and quirks, and how they can push our multiplatform development work even further.

See you next time!

---

> 🤖 This article was written with the help of ChatGPT 4, using the Web plugin.
>
> The sources and content are reviewed to ensure the relevance of the information provided, as well as the sources used in each prompt.
>
> That said, if you find any incorrect information or believe some credit is missing, please get in touch!

---

> References
>
> - [Rules for expected and actual declarations](https://kotlinlang.org/docs/multiplatform-expect-actual.html)
