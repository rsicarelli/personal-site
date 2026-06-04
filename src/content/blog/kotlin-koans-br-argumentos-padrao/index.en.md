---
title: 'Kotlin Koans BR: Default arguments'
description: 'Imagine you have several overloads of foo() in your favorite language. You can replace them all with a single function in Kotlin.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 3
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fsz63sj008b26a3aufei7.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-argumentos-padrao-c6m'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Introduction/Default%20arguments/Task.kt)

Imagine you have several overloads of `foo()` in your favorite language.

You can replace all of those overloads with a single function in Kotlin.

Change the declaration of the `foo` function so that the code using `foo` compiles.

<details>
  <summary>Java</summary>

```java
class OverloadJava {
    public String foo(String name, int number, boolean toUpperCase) {
        return (toUpperCase ? name.toUpperCase() : name) + number;
    }

    public String foo(String name, int number) {
        return foo(name, number, false);
    }

    public String foo(String name, boolean toUpperCase) {
        return foo(name, 42, toUpperCase);
    }

    public String foo(String name) {
        return foo(name, 42);
    }
}
```

</details>

<details>
  <summary>C#</summary>

```csharp
using System;

class OverloadCSharp
{
    public string Foo(string name, int number, bool toUpperCase)
    {
        return (toUpperCase ? name.ToUpper() : name) + number;
    }

    public string Foo(string name, int number)
    {
        return Foo(name, number, false);
    }

    public string Foo(string name, bool toUpperCase)
    {
        return Foo(name, 42, toUpperCase);
    }

    public string Foo(string name)
    {
        return Foo(name, 42);
    }
}
```

</details>

<details>
  <summary>Dart</summary>

```dart
class OverloadDart {
  String foo(String name, int number, bool toUpperCase) {
    return (toUpperCase ? name.toUpperCase() : name) + number.toString();
  }

  String foo(String name, int number) {
    return foo(name, number, false);
  }

  String foo(String name, bool toUpperCase) {
    return foo(name, 42, toUpperCase);
  }

  String foo(String name) {
    return foo(name, 42);
  }
}
```

</details>

<details>
  <summary>Go</summary>

```go
package main

import (
	"fmt"
	"strings"
)

type OverloadGo struct{}

func (s OverloadGo) Foo(name string, number int, toUpperCase bool) string {
	if toUpperCase {
		return strings.ToUpper(name) + fmt.Sprintf("%d", number)
	}
	return name + fmt.Sprintf("%d", number)
}

func (s OverloadGo) FooWithNumber(name string, number int) string {
	return s.Foo(name, number, false)
}

func (s OverloadGo) FooWithUpperCase(name string, toUpperCase bool) string {
	return s.Foo(name, 42, toUpperCase)
}

func (s OverloadGo) FooWithName(name string) string {
	return s.Foo(name, 42, false)
}
```

</details>

<details>
  <summary>JavaScript</summary>

```javascript
class OverloadJavaScript {
  foo(name, number, toUpperCase) {
    return (toUpperCase ? name.toUpperCase() : name) + number;
  }

  fooWithNameAndNumber(name, number) {
    return this.foo(name, number, false);
  }

  fooWithNameAndUpperCase(name, toUpperCase) {
    return this.foo(name, 42, toUpperCase);
  }

  fooWithName(name) {
    return this.foo(name, 42);
  }
}
```

</details>

<details>
  <summary>PHP</summary>

```php
<?php
class OverloadPHP {
    public function foo($name, $number, $toUpperCase) {
        return ($toUpperCase ? strtoupper($name) : $name) . $number;
    }

    public function fooWithNumber($name, $number) {
        return $this->foo($name, $number, false);
    }

    public function fooWithUpperCase($name, $toUpperCase) {
        return $this->foo($name, 42, $toUpperCase);
    }

    public function fooWithName($name) {
        return $this->foo($name, 42, false);
    }
}
```

</details>

<details>
  <summary>Python</summary>

```python
class OverloadPython:
    def foo(self, name, number, to_upper_case):
        return (name.upper() if to_upper_case else name) + str(number)

    def foo_with_number(self, name, number):
        return self.foo(name, number, False)

    def foo_with_upper_case(self, name, to_upper_case):
        return self.foo(name, 42, to_upper_case)

    def foo_with_name(self, name):
        return self.foo(name, 42, False)
```

</details>

<details>
  <summary>Swift</summary>

```swift
class OverloadSwift {
    func foo(name: String, number: Int, toUpperCase: Bool) -> String {
        return (toUpperCase ? name.uppercased() : name) + String(number)
    }

    func foo(name: String, number: Int) -> String {
        return foo(name: name, number: number, toUpperCase: false)
    }

    func foo(name: String, toUpperCase: Bool) -> String {
        return foo(name: name, number: 42, toUpperCase: toUpperCase)
    }

    func foo(name: String) -> String {
        return foo(name: name, number: 42)
    }
}
```

</details>

<details>
  <summary>TypeScript</summary>

```typescript
class OverloadTypeScript {
  foo(name: string, number: number, toUpperCase: boolean): string {
    return (toUpperCase ? name.toUpperCase() : name) + number.toString();
  }

  fooWithNumber(name: string, number: number): string {
    return this.foo(name, number, false);
  }

  fooWithUpperCase(name: string, toUpperCase: boolean): string {
    return this.foo(name, 42, toUpperCase);
  }

  fooWithName(name: string): string {
    return this.foo(name, 42);
  }
}
```

</details>

## Use case

When we talk about [`default arguments`](https://kotlinlang.org/docs/functions.html#default-arguments), we're referring to a very handy feature in Kotlin.

It lets you skip some arguments when someone calls a function.

If that happens, the compiler uses those default arguments in place of the ones that were skipped.

```kotlin
fun calculateDiscount(price: Double, discountRate: Double = 0.05) = price - price * discountRate

calculateDiscount(price = 50.0)
calculateDiscount(price = 100.0, discountRate = 0.10)
```

In the example above, the `discountRate` parameter has a default value of a 5% discount. When you call the `calculateDiscount` function without specifying the `discountRate`, the 5% discount is applied to the price.

But when you pass `0.10` as the argument for the `discountRate` parameter, that's the value used instead, changing the default discount from 5% to 10%.

### Parameter vs Argument

The difference between a parameter and an argument in Kotlin can be understood like this:

- **Parameter**: identified inside the definition of a function.
- **Argument**: identified when you invoke or use that function — that is, outside the definition.

Imagine a function that simulates making a coffee:

```kotlin
fun makeCoffee(type: String) = "Making a $type coffee..."
```

In this definition, `type` is considered a parameter of the function.

When you request a coffee:

```kotlin
val order = makeCoffee("espresso")
```

In this context, _"espresso"_ is an argument passed to the `makeCoffee()` function.

### Advantages

- **Fewer overloads**: lets you have a single function instead of several versions with different arguments.
- **Flexibility**: you can call the function with different combinations of parameters, as long as the required arguments are provided.
- **Java compatibility**: functions with default arguments are compatible with Java code, acting as overloads.

### Disadvantages

- **Code complexity**: if overused, they can make the code harder to read and understand.
- **Dropped in Java bytecode**: In Java, Kotlin's default arguments aren't recognized. To work around this, you need to use the `@JvmOverloads` annotation.
