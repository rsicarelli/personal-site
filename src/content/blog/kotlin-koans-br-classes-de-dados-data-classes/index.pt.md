---
title: 'Kotlin Koans BR: Classes de dados (Data Classes)'
description: 'Reescreva o seguinte código para Kotlin: <details> <summary>Java</summary>'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 9
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F337vd4c2gz7beq7st1ow.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-classes-de-dados-data-classes-2h9b'
  devtoId: 1783184
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
---

## 🔗 [Tarefa](https://play.kotlinlang.org/koans/Classes/Data%20classes/Task.kt)

Reescreva o seguinte código para Kotlin:

<details>
  <summary>Java</summary>

```java
public class Person {
    private final String name;
    private final int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }
}
```

</details>
<details>
  <summary>JavaScript</summary>

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getName() {
    return this.name;
  }

  getAge() {
    return this.age;
  }
}
```

</details>

<details>
  <summary>TypeScript</summary>

```typescript
class Person {
  readonly name: string;
  readonly age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  getName(): string {
    return this.name;
  }

  getAge(): number {
    return this.age;
  }
}
```

</details>

<details>
  <summary>Python</summary>

```python
class Person:
    def __init__(self, name, age):
        self._name = name
        self._age = age

    @property
    def name(self):
        return self._name

    @property
    def age(self):
        return self._age
```

</details>

<details>
  <summary>Swift</summary>

```swift
struct Person {
    let name: String
    let age: Int
}
```

</details>

<details>
  <summary>PHP</summary>

```php
class Person {
    public function __construct(private string $name, private int $age) {}

    public function getName(): string {
        return $this->name;
    }
    public function getAge(): int {
        return $this->age;
    }
}
```

</details>

<details>
  <summary>Dart</summary>

```dart
class Person {
  final String name;
  final int age;

  Person(this.name, this.age);
}
```

</details>

<details>
  <summary>Go</summary>

```go
type Person struct {
    Name string
    Age  int
}

func NewPerson(name string, age int) *Person {
    return &Person{Name: name, Age: age}
}
```

</details>

<details>
  <summary>C#</summary>

```csharp
public class Person
{
    public string Name { get; }
    public int Age { get; }

    public Person(string name, int age)
    {
        Name = name;
        Age = age;
    }
}
```

</details>

Em seguida, adicione o modificador `data` à classe resultante.

## Introdução às Classes em Kotlin

Em programação, uma **classe** é um modelo a partir do qual os objetos são criados, gerando uma **instância** daquela classe. As classes encapsulam dados para o objeto e métodos para manipular esses dados.

Kotlin, como uma linguagem de programação orientada a objetos, permite a definição e uso de classes, com algumas particularidades:

### 1. Classes Simples

Uma classe em Kotlin pode ser declarada usando a palavra-chave `class`. Se uma classe não tiver corpo, você pode omitir as chaves `{ }`.

```kotlin
class Carro
```

### 2. Métodos

São funções definidas em uma classe que operam sobre os dados da classe.

```kotlin
class Calculadora {
    fun somar(a: Int, b: Int): Int {
        return a + b
    }
}
```

### 3. Construtores

Kotlin tem uma sintaxe concisa para declarar construtores diretamente nos cabeçalhos das classes. O código abaixo declara uma classe com um construtor primário, mas os parâmetros deste construtor **não** são automaticamente transformados em propriedades da classe:

```kotlin
class Pessoa(nome: String, idade: Int) {
    fun imprimirIdade() {
        // Não é possível, já que "idade" não é atributo de class
        // println("Idade: $idade")
    }
}
```

### 4. Propriedades

Podemos declarar propriedades diretamente no construtor primário, usando os modificadores `val` e `var`.
Quando fazemos isso, estamos não apenas declarando um construtor, mas também definindo propriedades para a classe:

```kotlin
class Pessoa(val nome: String, var idade: Int) {
    fun imprimeNome() {
        println(nome)
    }
}
```

### 5. Modificadores de acesso

Em Kotlin, classes, objetos, propriedades e funções têm um modificador de acesso `public` por padrão, o que significa que podem ser acessados a partir de qualquer outro código. Porém, é possível limitar o acesso utilizando as seguintes palavras reservadas:

- `private`: visível apenas dentro do arquivo Kotlin onde está declarado.
- `protected`: não é permitido para classes de nível superior, mas para propriedades/métodos, eles são visíveis na classe e em suas
  subclasses.
- `internal`: visível em todos os arquivos no mesmo módulo.

### 6. Especialidades de classes

- **Classes Internas (`inner`)**: são classes definidas dentro de outra classe com acesso aos membros da classe externa.
- **Classes Abertas (`open`)**: Em Kotlin, por padrão, todas as classes são finais (não podem ser herdadas). Se você quiser permitir que uma classe seja herdada, você deve marcar a classe com `open`.
- **Classes Abstratas (`abstract`)**: São classes que não podem ser instanciadas direta e geralmente servem como base para outras classes.
- **Classes Seladas (`sealed`)**: Iremos aprender no próximo modulo 🔗 [Classes seladas (Sealed classes)](https://github.com/rsicarelli/kotlin-koans-edu-br/blob/main/koans/src/commonMain/kotlin/com/rsicarelli/koansbr/classes/sealedClasses/README.md)
- **Data Classes**: Classes otimizadas para armazenar dados, que serão mais exploradas no decorrer desse texto.

🚫 **Nota Importante**: As `data classes` em Kotlin **não podem** ser marcadas como abertas (`open`), abstratas (`abstract`), seladas (`sealed`) ou internas (`inner`).

---

Dado esse contexto, podemos explorar mais sobre as **Data Classes** em Kotlin 🧵👇

## Caso de uso

As [Data Classes](https://kotlinlang.org/docs/data-classes.html) no Kotlin são uma maneira concisa de criar classes que apenas mantêm dados. Elas automaticamente fornecem métodos úteis, como `equals()`, `hashCode()`, `toString()`, `copy()` e `.componentN()`. Isso ajuda a reduzir a verbosidade do código

As data classes são uma parte muito útil e poderosa do Kotlin, sendo usadas frequentemente para casos em que você precisa armazenar dados, mas não precisa de muita lógica ou comportamento adicional na classe.

```kotlin
data class Pessoa(
    val nome: String,
    val idade: Int,
)
```

### Funções Especiais das Data Classes

Apenas adicionando a palavra reservada `data` logo antes de `class`, as seguintes funções especiais são automaticamente disponíveis

#### 1. **`equals()`**

Esta função verifica a igualdade estrutural dos dados na classe. No exemplo, `carlo == luiza` usa internamente a
função `equals()` e retorna `false` porque Carlo e Luiza têm dados diferentes, mesmo que tenham a mesma idade.

```kotlin
val pessoaA = Pessoa("Ricardo", 35)
val pessoaB = Pessoa("Ricardo", 35)
val pessoaC = Pessoa("Carla", 28)

println(pessoaA == pessoaB)  // true, pois têm o mesmo nome e a mesma idade
println(pessoaA == pessoaC)  // false, pois os nomes e idades são diferentes
```

#### 2. **`hashCode()`**

Fornece um valor de código hash para os dados armazenados na classe, ajudando na eficiência de estruturas de dados como `HashSet` e `HashMap`.

```kotlin
fun adicionaPessoas() {
    val conjuntoPessoas = hashSetOf<Pessoa>()

    val pessoaA = Pessoa("Guilherme", 18)
    val pessoaB = Pessoa("Guilherme", 18) // Mesmos dados que pessoaA

    conjuntoPessoas.add(pessoaA)
    conjuntoPessoas.add(pessoaB) // Tentativa de adicionar uma "duplicata"

    println(conjuntoPessoas.size) // Imprime 1, pois pessoaA e pessoaB são consideradas iguais graças ao método equals() e têm o mesmo hashCode()
}
```

> 💡 Normalmente, não se lida diretamente com esse método, mas ele opera nos bastidores para garantir a correta operação de algumas coleções.

#### 3. **`toString()`**

Converte os dados da classe para uma representação em string de forma legível e estruturada. Por padrão, ele exibe o nome da classe seguido por seus campos (nomes e valores) em ordem de declaração

```kotlin
val juliana = Pessoa("Juliana", 16)

println(juliana)  // Imprime "Pessoa(nome=Juliana, idade=16)"
// println(juliana.toString())
```

> 💡No Kotlin, e também em muitas outras linguagens de programação, ao imprimir um objeto diretamente (como usando `println(juliana)`), o método `toString()` daquele objeto é chamado implicitamente.

#### 4. **`copy()`**

Cria uma cópia superficial do objeto. Pode-se também modificar alguns dos valores ao copiar.

```kotlin
val pessoaOriginal = Pessoa("Tiago", 33)
val pessoaModificada = pessoaOriginal.copy(idade = 34)

println(pessoaOriginal)      // Imprime "Pessoa(nome=Tiago, idade=33)"
println(pessoaModificada)    // Imprime "Pessoa(nome=Tiago, idade=34)"
```

#### 5. **`componentN()`**

Essas funções fornecem uma maneira direta de acessar os atributos do objeto, onde `N` é a ordem do atributo na declaração da classe.

```kotlin
val ana = Pessoa("Ana", 28)
println(ana.component1())  // Saída: Ana
println(ana.component2())  // Saída: 28
//println(ana.component3()) // Se existesse um 3 atributo de classe...
```

### Desconstrução de objetos

A desconstrução é um recurso que permite decompor um objeto em várias variáveis. É uma prática super comum em outras linguagens, como JavaScript.

Isso é especialmente útil quando se quer trabalhar com
partes específicas de um objeto sem a necessidade de acessar individualmente os seus atributos.

Graças a função `componentN()`, nós podemos usufruir dessa praticidade no Kotlin:

```kotlin
val jonas = Pessoa("Jonas", 42)
// Desconstruíndo...
val (nomeJonas, idadeJonas) = jonas

println(nomeJonas)  // Saída: Jonas
println(idadeJonas)  // Saída: 42
```

#### Desconstruíndo parâmetros de um lambda

A desconstrução também é útil quando trabalhamos com lambdas, especialmente quando se lida com pares ou trios:

```kotlin
val listaPessoas = listOf(Pessoa("Carlos", 32), Pessoa("Marta", 29))

listaPessoas.forEach { (nome, idade) ->
    println("$nome tem $idade anos.")
}
```

#### Desconstruíndo objetos em classes "normais"

É possível desconstruir uma classe em Kotlin mesmo que ela não seja uma `data class`.

Porém, para fazer isso, você precisa definir manualmente as funções `componentN()` para cada propriedade que deseja desconstruir:

```kotlin
class Livro(val titulo: String, val autor: String) {
    operator fun component1() = titulo
    operator fun component2() = autor
}

val meuLivro = Livro("O Grande Livro", "João Silva")
val (tituloDoLivro, autorDoLivro) = meuLivro

println(tituloDoLivro)  // Saída: O Grande Livro
println(autorDoLivro)   // Saída: João Silva
```

> ℹ️ Essa prática não é comum e raramente é necessária, porém possível

> 💡 Em Kotlin, a palavra-chave "operator" permite que funções se comportem como operadores tradicionais (como +, -, \*, etc.) ou permita operações específicas (como a desconstrução de objetos).

### Data Classes e a Imutabilidade

A imutabilidade se refere à impossibilidade de um objeto ter seu estado alterado após sua criação. Em outras palavras, uma vez que um objeto imutável é inicializado, seus dados não podem ser modificados.

No Kotlin, as `data classes` são frequentemente usadas em conjunção com a imutabilidade. Ao usar `val` em vez de `var`, a propriedade torna-se somente de leitura, garantindo que, uma vez criado um objeto `Pessoa`, seu nome e idade não possam ser alterados.

```kotlin
data class Pessoa(val nome: String, val idade: Int)
```

#### Vantagens da Imutabilidade com Data Classes

1. **Menos erros em tempo de execução**: como o estado de um objeto imutável não muda, a possibilidade de efeitos colaterais inesperados que podem levar a erros é reduzida.

2. **Concorrência segura**: objetos imutáveis são naturalmente seguros para serem usados em ambientes concorrentes, pois não há risco dealteração simultânea por múltiplas threads.

3. **Expressividade**: `data classes` imutáveis simplificam a lógica, pois é possível assumir que o estado do objeto permanecerá constante.

4. **Uso eficaz com coleções imutáveis**: em Kotlin, existem coleções imutáveis (como `listOf`, `setOf`), e o uso de `data classes` imutáveis com essas coleções torna o código ainda mais robusto.

#### Benefícios de desempenho

1. **Otimização do compilador** mais facilidade em realizar otimizações porque pode supor sobre o comportamento do código.

2. **Garbage collection**: como os objetos imutáveis não são modificados, eles podem ser reutilizados em vez de criados novamente, podendo reduzir a pressão sobre o garbage collector.

3. **Previsibilidade e cache**: como objetos imutáveis não mudam seu estado, eles são mais previsíveis. Isso pode permitir otimizações de cache mais eficientes tanto no nível do compilador quanto em tempo de execução.
