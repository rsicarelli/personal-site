---
title: 'Kotlin Koans BR: Smart casts'
description: 'Rewrite the given code using Kotlin smart casts and the when expression.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 10
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-tipagem-inteligente-5b74'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 1
topic: kotlin
difficulty: beginner
contentType: tutorial
---

## 🔗 [Task](https://play.kotlinlang.org/koans/Classes/Smart%20casts/Task.kt)

Rewrite the given code using [smart casts](https://kotlinlang.org/docs/typecasts.html#smart-casts) and Kotlin's [when](https://kotlinlang.org/docs/control-flow.html#when-expression) expression.

Java

```java
class Java {
    public int eval(Expr expr) {
        if (expr instanceof Num) {
            return ((Num) expr).getValue();
        }
        if (expr instanceof Sum) {
            Sum sum = (Sum) expr;
            return eval(sum.getLeft()) + eval(sum.getRight());
        }
        throw new IllegalArgumentException("Unknown expression");
    }
}
```

<details>
  <summary>C#</summary>

```csharp
public interface Expr { }

public class Num : Expr
{
    public int Value { get; set; }
}

public class Sum : Expr
{
    public Expr Left { get; set; }
    public Expr Right { get; set; }
}

public int Eval(Expr expr)
{
    if (expr is Num num)
        return num.Value;

    if (expr is Sum sum)
        return Eval(sum.Left) + Eval(sum.Right);

    throw new ArgumentException("Unknown expression");
}
```

</details>

<details>
  <summary>Dart</summary>

```dart
abstract class Expr {}

class Num implements Expr {
  final int value;

  Num(this.value);
}

class Sum implements Expr {
  final Expr left, right;

  Sum(this.left, this.right);
}

int eval(Expr expr) {
  if (expr is Num) return expr.value;
  if (expr is Sum) return eval(expr.left) + eval(expr.right);
  throw ArgumentError('Unknown expression');
}
```

</details>

<details>
  <summary>Go</summary>

```go
package main

type Expr interface{}

type Num struct {
	Value int
}

type Sum struct {
	Left, Right Expr
}

func Eval(expr Expr) int {
	switch e := expr.(type) {
	case Num:
		return e.Value
	case Sum:
		return Eval(e.Left) + Eval(e.Right)
	default:
		panic("Unknown expression")
	}
}

```

</details>

<details>
  <summary>JavaScript</summary>

```javascript
function eval(expr) {
  if (expr instanceof Num) {
    return expr.value;
  }
  if (expr instanceof Sum) {
    return eval(expr.left) + eval(expr.right);
  }
  throw new Error('Unknown expression');
}

class Num {
  constructor(value) {
    this.value = value;
  }
}

class Sum {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
}
```

</details>

<details>
  <summary>TypeScript</summary>

```typescript
interface Expr {}

class Num implements Expr {
  constructor(public value: number) {}
}

class Sum implements Expr {
  constructor(
    public left: Expr,
    public right: Expr,
  ) {}
}

function eval(expr: Expr): number {
  if (expr instanceof Num) return expr.value;
  if (expr instanceof Sum) return eval(expr.left) + eval(expr.right);
  throw new Error('Unknown expression');
}
```

</details>

<details>
  <summary>PHP</summary>

```php
interface Expr {}

class Num implements Expr {
    public $value;
    function __construct($value) { $this->value = $value; }
}

class Sum implements Expr {
    public $left, $right;
    function __construct($left, $right) { $this->left = $left; $this->right = $right; }
}

function evalExpr($expr) {
    if ($expr instanceof Num) return $expr->value;
    if ($expr instanceof Sum) return evalExpr($expr->left) + evalExpr($expr->right);
    throw new Exception("Unknown expression");
}
```

</details>

<details>
  <summary>Python</summary>

```python
class Expr:
    pass


class Num(Expr):
    def __init__(self, value):
        self.value = value


class Sum(Expr):
    def __init__(self, left, right):
        self.left = left
        self.right = right


def eval_expr(expr):
    if isinstance(expr, Num):
        return expr.value
    if isinstance(expr, Sum):
        return eval_expr(expr.left) + eval_expr(expr.right)
    raise ValueError("Unknown expression")
```

</details>

<details>
  <summary>Swift</summary>

```swift
protocol Expr {}

class Num: Expr {
    let value: Int
    init(_ value: Int) { self.value = value }
}

class Sum: Expr {
    let left, right: Expr
    init(_ left: Expr, _ right: Expr) { self.left = left; self.right = right }
}

func eval(_ expr: Expr) -> Int {
    if let num = expr as? Num {
        return num.value
    }
    if let sum = expr as? Sum {
        return eval(sum.left) + eval(sum.right)
    }
    fatalError("Unknown expression")
}
```

</details>

---

## Use cases

In programming, every data type is represented and handled differently in memory. "Casting" is a technique used to tell the compiler that a variable should be treated as another type. This lets you perform specific operations on that variable, and it also ensures compatibility with other parts of your code.

In Kotlin, there's a compiler feature called **smart casts** that tracks type checks (such as the ones done with the `is` operator) and automatically infers the type when needed.

### Type checking and inference

#### Positive check

When you check a variable with the `is` operator, and the check succeeds, Kotlin immediately recognizes the type of that variable inside the block of code:

```kotlin
class Cat(val catEmoji: String = "🐱")
class Dog(val dogEmoji: String = "🐶")
class Fish(val fishEmoji: String = "🐟")
class Bird(val birdEmoji: String = "🐦")

fun speak(animal: Any): String {
    return when (animal) {
        is Cat -> "Meow ${animal.catEmoji}"
        is Dog -> "Woof woof ${animal.dogEmoji}"
        is Fish -> "Blub blub ${animal.fishEmoji}"
        is Bird -> "Tweet tweet ${animal.birdEmoji}"
        else -> "We don't recognize this animal."
    }
}

fun whereItLives(animal: Any) {
    if (animal is Cat || animal is Dog) {
        println("Lives on land.")
    } else if (animal is Fish) {
        println("Lives in water.")
    } else if (animal is Bird) {
        println("Lives in the air and on land.")
    } else {
        println("We don't recognize this animal.")
    }
}
```

#### Negative check

By using `!` before the `is` operator, you can react when the variable is not of the expected type:

```kotlin
class Bird(val song: String)
class Monkey(val screech: String)
class Reptile(val sound: String = "Ssssss")

fun documentSound(animal: Any) {
    if (animal !is Bird) return

    print("The bird's song is: ${animal.song}")
}

// Testing the function
val toucan = Bird("Pi-pi-piu")
documentSound(toucan)  // Output: "The bird's song is: Pi-pi-piu"
```

#### Limitations with mutable variables (`var`)

The compiler may not perform a smart cast if it can't guarantee that the variable's value hasn't changed between the moment of the check and the moment of use:

```kotlin
open class Animal
class Dog() : Animal() {
    fun feed() = Unit
}

var animal: Animal? = Dog()

if (animal is Dog) {
    animal = null
    animal.feed()  // Compilation error: smart cast to 'Dog' is impossible
}
```

### Smart casts with logical operators

Kotlin goes further and integrates smart casts with logical operators like `&&` and `||`. This avoids the need for explicit conversions, making the code cleaner and more readable.

```kotlin
open class Animal(val name: String, val energy: Int = 100)

class Fish(name: String, energy: Int, val preferredHabitat: String) : Animal(name, energy) {
    fun explore() = "is exploring the $preferredHabitat habitat!"
}

class Bird(name: String, energy: Int, val beakType: String) : Animal(name, energy) {
    fun peck() = "is using its $beakType beak to look for food!"
}

fun specificAction(animal: Animal) {
    when {
        animal is Fish && animal.energy > 50 -> {
            println("${animal.name} ${animal.explore()}")
        }

        animal is Bird && animal.beakType == "sharp" -> {
            println("${animal.name} ${animal.peck()}")
        }

        else -> {
            println("${animal.name} isn't performing a specific action right now.")
        }
    }
}

// Testing the function
val tilapia = Fish("Tilapia", 60, "freshwater lake")
val eagle = Bird("Eagle", 80, "sharp")
val canary = Bird("Canary", 50, "small")

specificAction(tilapia)  // Output: "Tilapia is exploring the freshwater lake habitat!"
specificAction(eagle)    // Output: "Eagle is using its sharp beak to look for food!"
specificAction(canary)   // Output: "Canary isn't performing a specific action right now."
```

### Advantages

- **Clean syntax and readable code**: it allows for cleaner, more direct, and more readable code, avoiding repeated explicit type conversions.
- **Type safety**: the compiler performs the smart cast only when it's safe, reducing the chance of conversion errors at runtime.
- **Integration with control flow**: inside conditionals like `if`, `else`, `when`, or loops like `for`, `while`, Kotlin recognizes and adjusts the variable's type accordingly, allowing direct access to its specific properties without explicit casting.

### Disadvantages

- **Limitations with mutable variables**: with mutable variables, smart casts may not be guaranteed by the compiler, since the type may have changed between the check and the use.
- **Concurrency**: in multi-threaded environments, smart casts can be risky if a variable is changed by another thread after the check.
- **Potential confusion with complex logic**: in certain conditional logic, the compiler may not be able to infer the type, even when it seems clear to the developer.

## Analogy

When hearing the song of a specific bird in the forest, an ornithologist can immediately identify the species, even without seeing it. That instant recognition lets the expert know everything about that bird, from its habits to its habitat.

Smart casts in Kotlin work in a similar way, letting you use the specific type as soon as it's identified, without the need for additional checks.
