---
title: 'Kotlin Koans BR: Nullable types'
description: 'Rewrite the following code so that it uses only a single if expression, and learn how Kotlin handles nullable types safely.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 6
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fggj8j1wgvcmgw1oql67g.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-tipos-anulaveis-3mg'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Nullable%20types/Task.kt)

Rewrite the following code so that it uses only a single `if` expression:

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

```php
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
	// message-sending logic
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

## Use case

In the world of programming, it's common to run into situations where variables don't have a value assigned to them, and are treated as "null".

In Kotlin, the nullable type makes it explicit whether a variable holds a value or not, adding an extra layer of safety to your code. So whenever a value can be null, that's clearly indicated.

### Variables that can be null

Whenever a variable can be null, the language lets you add a `?` right after the variable's type:

To safely access the members of such a nullable type, we can use the `?.` operation:

```kotlin
val nullText: String? = null
val length: Int? = nullText?.length
println(length == null) //Output: true
```

### The Elvis operator `?:`

The Elvis operator returns a fallback or default value when the value on its left is `null`.

Notice that with the Elvis operator, we can drop the nullable type from `Int`:

```kotlin
val nullText: String? = null
val length: Int = nullText?.length ?: 0
println(length == null) //Output: false
```

> If you tilt your head to the left, the `?:` symbol looks like the eyes and signature hair curl of Elvis Presley.

### Bypassing nullability in Kotlin

Even though Kotlin handles nullability safely, there are situations that call for working around that protection.

#### The `!!` operator

When you're certain that a nullable variable isn't null, you can use the `!!` operator to treat it as if it were non-null.

❗❗️However, if the variable really is null, the program will throw a `NullPointerException`.

```kotlin
val name: String? = null
val length = name!!.length  // NullPointerException
```

#### Using `lateinit`

In Kotlin, variables must be initialized with a value.

It's common to use the nullable type to represent the state of a variable that hasn't been initialized yet.

For these cases, we can use the `lateinit` modifier, which tells the compiler that the variable will be initialized before it's accessed, removing the need to make it nullable.

However, if you try to access it before it's initialized, an `UninitializedPropertyAccessException` will occur.

```kotlin
lateinit var name: String
println(name) // UninitializedPropertyAccessException
name = "Kotlin"
```

## Best practices

1. **Minimize their use:** if you're certain a variable will never be null, it's best to define it as non-nullable. This simplifies your code and reduces possible errors.
2. **Be careful with the Elvis operator `?:`** — the default value needs to be appropriate for the context of the expression.
3. **Avoid bypassing nullable types**: instead of forcing a variable to be treated as non-null with `!!`, it's better to reach for `?.` and model your code with safe typing.
4. **Be careful with `lateinit`**: using it carelessly can be risky. It's vital to make sure the variable is initialized before accessing it, and it can also break immutability principles.
5. **Test thoroughly**: when you write tests, it's essential to cover scenarios where variables might be null.

## Analogy

A mailbox may or may not have packages inside it, much like a variable in Kotlin. At some moments it might hold a package (a value), while at others it's empty (null).

Just as someone checks the mailbox before taking out a package, in Kotlin the `?` indicates that this "box" might be empty.

```kotlin
val parcel: Parcel? = checkMailbox()
val sender: String? = parcel?.sender

if (sender == null || parcel == null) {
    println("It hasn't arrived yet")
}
```
