---
title: "Kotlin Koans BR: Tipos anuláveis"
description: "Reescreva o código a seguir para que ele tenha apenas uma expressão if: <details> <summary>Java</summary>"
pubDate: 2024-03-07
tags:
  - "kotlin"
  - "braziliandevs"
series: "kotlin-koans-br"
seriesOrder: 6
coverUrl: "https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fggj8j1wgvcmgw1oql67g.png"
translated: false
provenance:
  devtoUrl: "https://dev.to/rsicarelli/kotlin-koans-br-tipos-anulaveis-3mg"
  devtoId: 1783123
  githubRepo: "https://github.com/rsicarelli/kotlin-koans-edu-br"
  reactions: 1
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Introduction/Nullable%20types/Task.kt)

Reescreva o código a seguir para que ele tenha apenas uma expressão `if`:
<details>
  <summary>Java</summary>

```java
package main;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

public class MinhaClasse {

    public void sendMessageToClient(
        @Nullable Client client,
        @Nullable String message,
        @NotNull Mailer mailer
    ) {
        if (client == null || message == null) return;

        PersonalInfo personalInfo = client.getPersonalInfo();
        if (personalInfo == null) return;

        String email = personalInfo.getEmail();
        if (email == null) return;

        mailer.sendMessage(email, message);
    }
}
```

</details>
<details>
  <summary>JavaScript</summary>

```javascript
function sendMessageToClient(client, message, mailer) {
    if (client === null || message === null) return;

    const personalInfo = client.getPersonalInfo();
    if (personalInfo === null) return;

    const email = personalInfo.getEmail();
    if (email === null) return;

    mailer.sendMessage(email, message);
}
```

</details>

<details>
  <summary>TypeScript</summary>

```typescript
interface Client {
    getPersonalInfo: () => PersonalInfo | null;
}

interface PersonalInfo {
    getEmail: () => string | null;
}

interface Mailer {
    sendMessage: (email: string, message: string) => void;
}

function sendMessageToClient(client: Client | null, message: string | null, mailer: Mailer): void {
    if (client === null || message === null) return;

    const personalInfo: PersonalInfo | null = client.getPersonalInfo();
    if (personalInfo === null) return;

    const email: string | null = personalInfo.getEmail();
    if (email === null) return;

    mailer.sendMessage(email, message);
}
```

</details>

<details>
  <summary>Python</summary>

```python
def send_message_to_client(client, message, mailer):
    if client is None or message is None:
        return

    personal_info = client.get_personal_info()
    if personal_info is None:
        return

    email = personal_info.get_email()
    if email is None:
        return

    mailer.send_message(email, message)
```

</details>

<details>
  <summary>Swift</summary>

```swift
func sendMessageToClient(client: Client?, message: String?, mailer: Mailer) {
    guard let client = client, let message = message else { return }

    guard let personalInfo = client.getPersonalInfo() else { return }

    guard let email = personalInfo.getEmail() else { return }

    mailer.sendMessage(email: email, message: message)
}
```

</details>

<details>
  <summary>PHP</summary>

```injectablephp
<?php

function sendMessageToClient($client, $message, $mailer) {
    if($client === null || $message === null) {
        return;
    }

    $personalInfo = $client->getPersonalInfo();
    if($personalInfo === null) {
        return;
    }

    $email = $personalInfo->getEmail();
    if($email === null) {
        return;
    }

    $mailer->sendMessage($email, $message);
}
?>
```

</details>

<details>
  <summary>Dart</summary>

```dart
void sendMessageToClient(Client client, String message, Mailer mailer) {
  if (client == null || message == null) return;

  PersonalInfo personalInfo = client.getPersonalInfo();
  if (personalInfo == null) return;

  String email = personalInfo.getEmail();
  if (email == null) return;

  mailer.sendMessage(email, message);
}
```

</details>

<details>
  <summary>Go</summary>

```go
package main

func sendMessageToClient(client *Client, message string, mailer *Mailer) {
	if client == nil || message == "" {
		return
	}

	personalInfo := client.getPersonalInfo()
	if personalInfo == nil {
		return
	}

	email := personalInfo.getEmail()
	if email == "" {
		return
	}

	mailer.sendMessage(email, message)
}

type Client struct {
	personalInfo *PersonalInfo
}

func (c *Client) getPersonalInfo() *PersonalInfo {
	return c.personalInfo
}

type PersonalInfo struct {
	email string
}

func (pi *PersonalInfo) getEmail() string {
	return pi.email
}

type Mailer struct{}

func (m *Mailer) sendMessage(email string, message string) {
	// lógica de envio de mensagem
}

```

</details>

<details>
  <summary>C#</summary>

```csharp
public void SendMessageToClient(
    Client client,
    string message,
    Mailer mailer
){
    if(client==null || message==null) return;
    
    PersonalInfo personalInfo=client.GetPersonalInfo();
    if(personalInfo==null) return;
    
    string email=personalInfo.Email; 
    if(email==null) return;
    
    mailer.SendMessage(email, message);
}
```

</details>

## Caso de uso

No mundo da programação, é comum encontrar situações em que variáveis não possuem um valor atribuído, sendo identificadas como "nulas".

No Kotlin, o tipo nulo assegura que variáveis tenham ou não um valor, proporcionando uma camada extra de segurança ao código. Assim, quando um valor pode ser nulo, isso é claramente indicado.

### Variáveis que podem ser nulas

Sempre que uma variável pode ser nula, a linguagem permite adicionar um `?` logo após o tipo da variável:

Para acessar os atributos desse tipo nulo de forma segura, podemos utilizar a operação `?.`

```kotlin
val textoNulo: String? = null
val tamanho: Int? = textoNulo?.length
println(tamanho == null) //Saída: true
```

### O operador Elvis `?:`

O operador Elvis entrega um valor substituto ou padrão quando o valor à sua esquerda é `null`.

Note que com o operador Elvis, podemos remover o tipo nulo do `Int`:

```kotlin
val textoNulo: String? = null
val tamanho: Int = textoNulo?.length ?: 0
println(tamanho == null) //Saída: false
```

> Inclinando a cabeça para o lado esquerdo, nota-se que o símbolo `?:` lembra os olhos e a mecha de cabelo típica de Elvis Presley.

### Burlando a Nulabilidade em Kotlin

Embora Kotlin trate nulabilidade de maneira segura, existem situações que exigem um contorno dessa proteção.

#### Operador `!!`

Ao ter certeza de que uma variável nullable não está nula, é possível utilizar o operador `!!` para tratá-la como se não fosse nula.

❗❗️No entanto, se a variável for realmente nula, o programa lançará uma `NullPointerException`.

```kotlin
val nome: String? = null
val tamanho = nome!!.length  // NullPointerException
```

#### Utilizando `lateinit`

No Kotlin, as variáveis devem ser inicializadas com um valor.

É comum utilizar o tipo nulo para representar o estado de uma variável não inicializada.

Para esses casos, podemos utilizar o modificador `lateinit`, que informa ao compilador que essa variável será inicializada antes de seu acesso, evitando a necessidade de torná-la nullable.

No entanto, se tentarem acessá-la antes da sua inicialização, ocorrerá uma `UninitializedPropertyAccessException`.

```kotlin
lateinit var nome: String
println(nome) // UninitializedPropertyAccessException
nome = "Kotlin"
```

## Boas práticas

1. **Minimizar o uso:** se há certeza de que uma variável nunca será nula, é aconselhável defini-la como não anulável. Isso simplifica o código e minimiza possíveis erros.
2. **Prudência no uso do Elvis `?:`** é crucial. o valor padrão precisa ser apropriado para o contexto da expressão.
3. **Evitar burlar os tipos nulos**: ao invés de forçar uma variável a ser tratada como não nula com `!!`, é benéfico optar pelo `?.` e modelar seu código com uma tipagem segura.
4. **Cuidado ao utilizar `lateinit`**: seu uso imprudente pode ser arriscado. É vital garantir a inicialização da variável antes de acessá-la, além de poder violar princípios de imutabilidade.
5. **Realize testes rigorosos**: quando criar testes, é fundamental abordar cenários onde variáveis possam estar nulas.

## Analogia

Uma caixa de correio pode ter ou não encomendas em seu interior, semelhante a uma variável no Kotlin. Em certos momentos, ela pode conter uma encomenda (um valor), enquanto em outros, está vazia (nula).

Assim como alguém checa a caixa antes de retirar uma encomenda, no Kotlin o `?` indica que essa "caixa" pode estar vazia.

```kotlin
val encomenda: Encomenda? = checarCaixaDeCorreio()
val remetente: String? = encomenda?.remetente

if (remetente == null || encomenda == null) {
    println("Ainda não chegou")
}
```
