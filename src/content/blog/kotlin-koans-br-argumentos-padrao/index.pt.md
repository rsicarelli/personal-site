---
title: 'Kotlin Koans BR: Argumentos padrão'
description: 'Imagine que você tenha várias sobrecargas de foo() na sua linguagem favorita.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 3
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fsz63sj008b26a3aufei7.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-argumentos-padrao-c6m'
  devtoId: 1783115
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Introduction/Default%20arguments/Task.kt)

Imagine que você tenha várias sobrecargas de `foo()` na sua linguagem favorita.

Você pode substituir todas essas sobrecargas por uma única função em Kotlin.

Altere a declaração da função `foo` de forma que o código que usa `foo` seja compilado.

<details>
  <summary>Java</summary>

```java
class SobrecargaJava {
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

class SobrecargaCSharp
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
class SobrecargaDart {
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

type SobrecargaGo struct{}

func (s SobrecargaGo) Foo(name string, number int, toUpperCase bool) string {
	if toUpperCase {
		return strings.ToUpper(name) + fmt.Sprintf("%d", number)
	}
	return name + fmt.Sprintf("%d", number)
}

func (s SobrecargaGo) FooWithNumber(name string, number int) string {
	return s.Foo(name, number, false)
}

func (s SobrecargaGo) FooWithUpperCase(name string, toUpperCase bool) string {
	return s.Foo(name, 42, toUpperCase)
}

func (s SobrecargaGo) FooWithName(name string) string {
	return s.Foo(name, 42, false)
}
```

</details>

<details>
  <summary>JavaScript</summary>

```javascript
class SobrecargaJavaScript {
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

```phpregexp
<?php
class SobrecargaPHP {
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
class SobrecargaPython:
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
class SobrecargaSwift {
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
class SobrecargaTypeScript {
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

## Caso de uso

Quando se fala em [`default arguments` (https://kotlinlang.org/docs/functions.html#default-arguments) ou argumentos padrão, está se referindo a uma característica bem prática em Kotlin.

Ela permite que alguns argumentos sejam deixados de lado quando alguém chama uma função.

Se isso acontecer, o compilador usa esses argumentos padrão no lugar dos argumentos que foram pulados.

```kotlin
fun calculaDesconto(preco: Double, taxaDesconto: Double = 0.05) = preco - preco * taxaDesconto

calculaDesconto(preco = 50.0)
calculaDesconto(preco = 100.0, taxaDesconto = 0.10)
```

No exemplo acima, o parâmetro `taxaDesconto` tem um valor padrão de 5% de desconto. Ao chamar a função `calculaDesconto` sem especificar a `taxaDesconto`, o desconto de 5% será aplicado sobre o preço.

Porém, ao passar `0.10` como argumento para o parâmetro `taxaDesconto`, esse será o valor utilizado, substituindo o desconto padrão de 5% para 10%.

### Parâmetro x Argumento

A diferença entre parâmetro e argumento em Kotlin pode ser compreendida da seguinte forma:

- **Parâmetro**: identificado dentro da definição de uma função.
- **Argumento**: identificado ao invocar ou usar essa função, ou seja, fora da definição.

Imagine uma função que simula a preparação de um café:

```kotlin
fun prepararCafe(tipo: String) = "Preparando um café $tipo..."
```

Nesta definição, `tipo` é considerado um parâmetro da função.

Ao solicitar a preparação de um café:

```kotlin
val pedido = prepararCafe("espresso")
```

Neste contexto, _"espresso"_ é um argumento passado para a função `prepararCafe()`.

### Vantagens

- **Menos sobrecargas**: permite uma única função em vez de várias versões com diferentes argumentos.
- **Flexibilidade**: é possível chamar a função com diferentes combinações de parâmetros, contanto que os argumentos obrigatórios sejam fornecidos.
- **Compatibilidade com Java**: funções com argumentos padrão são compatíveis com código Java, atuando como sobrecargas.

### Desvantagens

- **Complexidade do código**: se usados em excesso, podem complicar a leitura e o entendimento do código.
- **Descarte no bytecode Java**: No Java, argumentos padrão do Kotlin não são reconhecidos. Para contornar isso, é necessário usar a anotação `@JvmOverloads`
