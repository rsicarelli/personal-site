---
title: 'Kotlin Koans BR: Data Classes'
description: 'Rewrite the following code in Kotlin, then add the data modifier. A beginner-friendly look at Kotlin classes and data classes.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 9
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-classes-de-dados-data-classes-2h9b'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Classes/Data%20classes/Task.kt)

Rewrite the following code in Kotlin:

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

Then add the `data` modifier to the resulting class.

## Introduction to Classes in Kotlin

In programming, a **class** is a blueprint from which objects are created, producing an **instance** of that class. Classes bundle together the data for an object and the methods that work on that data.

Kotlin, as an object-oriented programming language, lets you define and use classes, with a few particularities:

### 1. Simple Classes

A class in Kotlin can be declared using the `class` keyword. If a class has no body, you can leave out the braces `{ }`.

```kotlin
class Car
```

### 2. Methods

These are functions defined inside a class that operate on the class's data.

```kotlin
class Calculator {
    fun add(a: Int, b: Int): Int {
        return a + b
    }
}
```

### 3. Constructors

Kotlin has a concise syntax for declaring constructors right in the class header. The code below declares a class with a primary constructor, but the parameters of this constructor are **not** automatically turned into properties of the class:

```kotlin
class Person(name: String, age: Int) {
    fun printAge() {
        // Not possible, since "age" is not a class property
        // println("Age: $age")
    }
}
```

### 4. Properties

We can declare properties directly in the primary constructor using the `val` and `var` modifiers.
When we do this, we're not just declaring a constructor, but also defining properties for the class:

```kotlin
class Person(val name: String, var age: Int) {
    fun printName() {
        println(name)
    }
}
```

### 5. Access Modifiers

In Kotlin, classes, objects, properties, and functions are `public` by default, which means they can be accessed from any other code. However, you can limit access using the following keywords:

- `private`: visible only inside the Kotlin file where it's declared.
- `protected`: not allowed for top-level classes, but for properties/methods it makes them visible in the class and its
  subclasses.
- `internal`: visible in all files within the same module.

### 6. Special Kinds of Classes

- **Inner Classes (`inner`)**: classes defined inside another class with access to the members of the outer class.
- **Open Classes (`open`)**: In Kotlin, by default, all classes are final (they can't be inherited from). If you want to allow a class to be inherited from, you have to mark the class with `open`.
- **Abstract Classes (`abstract`)**: These are classes that can't be instantiated directly and usually serve as a base for other classes.
- **Sealed Classes (`sealed`)**: We'll learn about these in the next module 🔗 [Sealed classes](https://github.com/rsicarelli/kotlin-koans-edu-br/blob/main/koans/src/commonMain/kotlin/com/rsicarelli/koansbr/classes/sealedClasses/README.md)
- **Data Classes**: Classes optimized for holding data, which we'll explore further throughout this text.

🚫 **Important Note**: `data classes` in Kotlin **cannot** be marked as open (`open`), abstract (`abstract`), sealed (`sealed`), or inner (`inner`).

---

With that context in place, we can dig deeper into **Data Classes** in Kotlin 🧵👇

## Use Case

[Data Classes](https://kotlinlang.org/docs/data-classes.html) in Kotlin are a concise way to create classes that only hold data. They automatically provide useful methods such as `equals()`, `hashCode()`, `toString()`, `copy()`, and `.componentN()`. This helps cut down on verbose code.

Data classes are a very useful and powerful part of Kotlin, and they're used often for cases where you need to store data but don't need much extra logic or behavior in the class.

```kotlin
data class Person(
    val name: String,
    val age: Int,
)
```

### Special Functions of Data Classes

Just by adding the `data` keyword right before `class`, the following special functions become automatically available:

#### 1. **`equals()`**

This function checks the structural equality of the data in the class. In the example, `personA == personC` uses the
`equals()` function under the hood and returns `false` because `personA` ("Ricardo", 35) and `personC` ("Carla", 28) have different names and ages.

```kotlin
val personA = Person("Ricardo", 35)
val personB = Person("Ricardo", 35)
val personC = Person("Carla", 28)

println(personA == personB)  // true, because they have the same name and the same age
println(personA == personC)  // false, because the names and ages are different
```

#### 2. **`hashCode()`**

Provides a hash code value for the data stored in the class, helping with the efficiency of data structures like `HashSet` and `HashMap`.

```kotlin
fun addPeople() {
    val peopleSet = hashSetOf<Person>()

    val personA = Person("Guilherme", 18)
    val personB = Person("Guilherme", 18) // Same data as personA

    peopleSet.add(personA)
    peopleSet.add(personB) // Trying to add a "duplicate"

    println(peopleSet.size) // Prints 1, because personA and personB are considered equal thanks to the equals() method and they have the same hashCode()
}
```

> 💡 You usually don't deal with this method directly, but it works behind the scenes to make sure certain collections operate correctly.

#### 3. **`toString()`**

Converts the class's data into a readable, structured string representation. By default, it shows the class name followed by its fields (names and values) in declaration order.

```kotlin
val juliana = Person("Juliana", 16)

println(juliana)  // Prints "Person(name=Juliana, age=16)"
// println(juliana.toString())
```

> 💡 In Kotlin, and also in many other programming languages, when you print an object directly (like with `println(juliana)`), that object's `toString()` method is called implicitly.

#### 4. **`copy()`**

Creates a shallow copy of the object. You can also change some of the values while copying.

```kotlin
val originalPerson = Person("Tiago", 33)
val modifiedPerson = originalPerson.copy(age = 34)

println(originalPerson)      // Prints "Person(name=Tiago, age=33)"
println(modifiedPerson)      // Prints "Person(name=Tiago, age=34)"
```

#### 5. **`componentN()`**

These functions provide a direct way to access the object's properties, where `N` is the position of the property in the class declaration.

```kotlin
val ana = Person("Ana", 28)
println(ana.component1())  // Output: Ana
println(ana.component2())  // Output: 28
//println(ana.component3()) // If there were a 3rd class property...
```

### Destructuring Objects

Destructuring is a feature that lets you break an object down into several variables. It's a very common practice in other languages, like JavaScript.

This is especially handy when you want to work with
specific parts of an object without having to access each of its properties individually.

Thanks to the `componentN()` function, we can enjoy this convenience in Kotlin:

```kotlin
val jonas = Person("Jonas", 42)
// Destructuring...
val (jonasName, jonasAge) = jonas

println(jonasName)  // Output: Jonas
println(jonasAge)  // Output: 42
```

#### Destructuring the parameters of a lambda

Destructuring is also useful when we work with lambdas, especially when dealing with pairs or triples:

```kotlin
val peopleList = listOf(Person("Carlos", 32), Person("Marta", 29))

peopleList.forEach { (name, age) ->
    println("$name is $age years old.")
}
```

#### Destructuring objects in "regular" classes

You can destructure a class in Kotlin even if it isn't a `data class`.

However, to do this, you need to manually define the `componentN()` functions for each property you want to destructure:

```kotlin
class Book(val title: String, val author: String) {
    operator fun component1() = title
    operator fun component2() = author
}

val myBook = Book("The Great Book", "João Silva")
val (bookTitle, bookAuthor) = myBook

println(bookTitle)  // Output: The Great Book
println(bookAuthor) // Output: João Silva
```

> ℹ️ This practice isn't common and is rarely needed, but it's possible.

> 💡 In Kotlin, the "operator" keyword lets functions behave like traditional operators (such as +, -, \*, etc.) or enables specific operations (such as destructuring objects).

### Data Classes and Immutability

Immutability refers to the impossibility of an object having its state changed after it's created. In other words, once an immutable object is initialized, its data can't be modified.

In Kotlin, `data classes` are often used together with immutability. By using `val` instead of `var`, a property becomes read-only, making sure that once a `Person` object is created, its name and age can't be changed.

```kotlin
data class Person(val name: String, val age: Int)
```

#### Advantages of Immutability with Data Classes

1. **Fewer runtime errors**: since the state of an immutable object doesn't change, the chance of unexpected side effects that could lead to errors is reduced.

2. **Safe concurrency**: immutable objects are naturally safe to use in concurrent environments, since there's no risk of simultaneous changes by multiple threads.

3. **Expressiveness**: immutable `data classes` simplify your logic, because you can assume the object's state will stay constant.

4. **Effective use with immutable collections**: in Kotlin, there are immutable collections (such as `listOf`, `setOf`), and using immutable `data classes` with these collections makes your code even more robust.

#### Performance Benefits

1. **Compiler optimization**: it's easier to perform optimizations because the compiler can make assumptions about how the code behaves.

2. **Garbage collection**: since immutable objects aren't modified, they can be reused instead of created again, which can reduce pressure on the garbage collector.

3. **Predictability and caching**: since immutable objects don't change their state, they're more predictable. This can enable more efficient caching optimizations both at the compiler level and at runtime.
