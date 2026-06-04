---
title: 'Kotlin Koans BR: Sealed Classes'
description: 'Reuse your solution from the previous task, but replace the interface with a sealed interface. That way you no longer need the else branch in the when expression.'
pubDate: 2024-03-07
tags:
  - 'kotlin'
  - 'braziliandevs'
series: 'kotlin-koans-br'
seriesOrder: 11
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/kotlin-koans-br-classes-seladas-50m0'
  githubRepo: 'https://github.com/rsicarelli/kotlin-koans-edu-br'
  reactions: 7
topic: kotlin
difficulty: beginner
contentType: tutorial
---

### 🔗 [Task](https://play.kotlinlang.org/koans/Classes/Sealed%20classes/Task.kt)

Reuse your solution from the previous task, but replace the interface with a [`sealed`](https://kotlinlang.org/docs/sealed-classes.html) interface. That way you no longer need the `else` branch in the `when` expression.

### Use cases

[Sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html) in Kotlin are a special feature for creating a specific, limited set of related classes. They're like boxes that hold predefined options and don't allow new options to be created outside that set. This brings safety and control to your code, preventing errors and making it easier to understand.

```kotlin
sealed class MusicalInstrument(
    val name: String,
    val type: InstrumentType,
) {
    data class Guitar(val strings: Int) : MusicalInstrument("guitar", String)
    data class Drums(val drumCount: Int) : MusicalInstrument("drums", Percussion)
    data class Piano(val keys: Int) : MusicalInstrument("piano", Keys)
}

sealed interface InstrumentType
data object String : InstrumentType
data object Percussion : InstrumentType
data object Keys : InstrumentType
```

#### Why use sealed classes?

Sealed classes help define a fixed number of states or types within a structure of classes or interfaces. They guarantee that only certain subclasses can be created, preventing the unexpected addition of new states. As a result, external classes can't inherit from classes marked as sealed unless they're in the same file.

This is handy when only a few specific variations are acceptable. For example, in a payments app, sealed classes can represent states like Approved, Declined, and Pending, ensuring more consistency and preventing errors in your code.

#### Sealed class vs. sealed interface

Both share the same idea and solve the same problem. The main differences are:

##### Sealed class

- Can have properties and methods, just like any other class.

```kotlin
sealed class OrderStatus(open val id: Int) {

    fun isActive(): Boolean = when (this) {
        is AwaitingPayment, is Shipped, is Processing -> true
        is Cancelled, is Delivered -> false
    }

    data class AwaitingPayment(override val id: Int) : OrderStatus(id)
    data class Processing(override val id: Int, val estimatedProcessingDate: String) : OrderStatus(id)
    data class Shipped(override val id: Int, val estimatedDeliveryDate: String, val trackingCode: String) : OrderStatus(id)
    data class Delivered(override val id: Int, val deliveryDate: String) : OrderStatus(id)
    data class Cancelled(override val id: Int, val reason: String) : OrderStatus(id)
}
```

##### Sealed interface

- Can't have stateful properties or methods with implementations (but it can have abstract properties and abstract methods).
- It's the ideal choice when there's no need to share state between subtypes.

```kotlin
sealed interface Discount {

    val appliedAt = System.currentTimeMillis()
    fun calculateDiscount(originalPrice: Double): Double

    data class FixedDiscount(val amount: Double) : Discount {
        override fun calculateDiscount(originalPrice: Double) = originalPrice - amount
    }

    data class PercentageDiscount(private val percentage: Double) : Discount {
        override fun calculateDiscount(originalPrice: Double) = originalPrice * (1 - percentage / 100)
    }

    data object FreeShipping : Discount {
        override fun calculateDiscount(originalPrice: Double) = originalPrice
    }
}
```

#### How sealed classes relate to enums

While enums are used to represent a fixed set of constant values, sealed classes can represent a set of complex types with varied states and behaviors.

The main differences are:

- **Class hierarchy**: While enums are a flat list of constant values, sealed classes are a hierarchy of classes. This means each subclass of a sealed class can have its own specific properties and methods, giving you more flexibility to model complex situations.

```kotlin
sealed interface Kingdom
data class Animalia(val classes: List<String>) : Kingdom
data class Plantae(val families: List<String>) : Kingdom

sealed class Habitat(val description: String)
data object Land : Habitat("on land")
data object Water : Habitat("in water")
data object Air : Habitat("in the air")

sealed class Organism(val name: String) {
    data class Animal(val species: String) : Organism("Animal")
    data class Plant(val type: String) : Organism("Plant")
    data object Microorganism : Organism("Microorganism") {
        const val description: String = "Tiny and single-celled"
    }
}

fun details(organism: Organism, kingdom: Kingdom, habitat: Habitat): String {
    return when (organism) {
        is Animal -> "An $name of the species $species belonging to the kingdom $kingdom and lives $habitat."
        is Plant -> "A $name of the type $type belonging to the kingdom $kingdom and lives $habitat."
        is Microorganism -> "A $name - $description - belonging to the kingdom $kingdom and lives $habitat."
    }
}
```

- **Grouping data and behaviors**: Sealed classes can group not only values, but also specific behaviors tied to each state or type. This is an advantage when you need each state or type to have custom methods.

```kotlin
sealed class GeometricShape {
    data class Circle(val radius: Double) : GeometricShape()
    data class Rectangle(
        val width: Double,
        val height: Double,
    ) : GeometricShape()

    fun calculateArea(): Double = when (this) {
        is Circle -> kotlin.math.PI * radius * radius
        is Rectangle -> width * height
    }
}

val main {
    Circle(5.0).calculateArea() == 78.53981633974483
    Rectangle(3.0, 4.0).calculateArea() == 12.0
}
```

- **More complex use cases**: While enums are ideal for representing simple sets of values, sealed classes are a better fit for more complex use cases, such as modeling states, alternative types, or inheritance patterns.

```kotlin
sealed class OperationResult {
    object Success : OperationResult()
    data class Error(
        val code: Int,
        val message: String,
    ) : OperationResult()
}

fun main() {
    val success: OperationResult = Success
    val error: OperationResult = Error(404, "Page not found")
}
```

- **Exclusive control**: Sealed classes allow stricter control over the subclasses that are allowed. Each case of the sealed class can have its own subclasses, whereas in enums every case shares the same structure.

```kotlin
sealed interface DayOfWeek {
    object Monday : DayOfWeek
    object Tuesday : DayOfWeek
    object Wednesday : DayOfWeek
    object Thursday : DayOfWeek
    object Friday : DayOfWeek
    object Saturday : DayOfWeek
    object Sunday : DayOfWeek
}

fun main() {
    require(Monday is DayOfWeek)
    require(Friday is DayOfWeek)
    require(Monday is Friday) // It isn't true that Monday is Friday
}
```

#### Sealed in functional programming

Functional programming emphasizes function composition and working with immutable data. Sealed classes are used to define data structures with limited, predictable states, following the principles of immutability. This means that once a state is defined by a sealed class, it can't be changed directly - any transformation results in the creation of a new instance.

Combining functional programming with sealed classes promotes clarity, avoids unexpected side effects, and makes it easier to reason about how your code behaves. By modeling states with sealed classes, you create organized, encapsulated structures that represent the possible scenarios, ensuring that handling those states is predictable and doesn't alter the original data.

```kotlin
sealed interface OrderState
object Pending : OrderState
object Preparing : OrderState
object Completed : OrderState

data class Order(
    val number: Int,
    val state: OrderState,
) {
    fun updateState(newState: OrderState): Order =
        this.copy(state = newState) //number will be kept
}

fun main() {
    val pendingOrder = Order(1, Pending)
    val preparingOrder = Order(2, Preparing)

    val completedOrder = pendingOrder.updateState(Completed)
    val orderInPreparation = pendingOrder.updateState(Pending)

    println("Order #${completedOrder.number} is ${completedOrder.state}")
    println("Order #${orderInPreparation.number} is ${orderInPreparation.state}")
}
```

##### Sealed, Kotlin, and strong typing

Strong typing is a fundamental characteristic of languages like Kotlin. It helps prevent errors at compile time and makes code safer and more readable. Sealed classes and sealed interfaces fit perfectly into this context, because they provide a way to define data structures precisely and in a restricted way. This prevents invalid states or types from being used inadvertently, ensuring
safe handling of your data.

```kotlin
sealed interface OrderStatus
data class InProgress(val timeRemaining: Int) : OrderStatus
data class Completed(val deliveryTime: String) : OrderStatus

fun updateOrderStatus(status: PedidoStatus) {
    when (status) {
        is InProgress -> println("Order in progress, time remaining: ${pedido.tempoRestante} minutes")
        is Completed -> println("Order completed, delivered at ${pedido.horaEntrega}")
    }
}

fun main() {
    val inProgressOrder = InProgress(timeRemaining = 15)
    val completedOrder = Completed(deliveryTime = "20:30")

    updateOrderStatus(inProgressOrder)
    updateOrderStatus(completedOrder)
}
```

##### Better IDE support for handling your sealed types

One really nice thing about sealed classes is that they line up with the functional `when` pattern (or pattern matching). This approach lets you handle all possible cases exhaustively, ensuring that every state or type is considered.

This is especially useful when working with pure functions, where the data is immutable and handling each case is crucial.

On top of that, when you add a new item (for example, `Finished` using the example above), the compiler will flag an error and force you to handle that new case. Always be careful with `else`, since it would "swallow" any new type in your sealed hierarchy.

```kotlin
sealed interface OrderStatus
data class Finished(val time: Int) : OrderStatus

fun updateOrderStatus(status: PedidoStatus) {
    when (status) {
        //the compiler will complain that "Finished" must be handled
        is Finished -> println("Order finished at ${status.time}")
    }
}
```

#### Data object

Starting with Kotlin `1.9.0`, we have a new kind of class available called `data object`. This kind of class really shines when used together with sealed classes. Let's understand why.

```kotlin
package com.rsicarelli.koansbr.classes.sealedClasses

sealed interface Work
object Company : Work
object College : Work
object School : Work

println(Company) //Will print com.rsicarelli.koansbr.classes.sealedClasses.Company@2fc14f68
```

The reason is that `object` in Kotlin is "plain" — in other words, there's no extra Kotlin implementation going on.

That is, an `object` has no defined `toString()` function, so when we ask to print its value, we get the default:

`{package} + {ObjectName} + {@MemoryAddress}`

That's where `data object` comes into play:

```kotlin
package com.rsicarelli.koansbr.classes.sealedClasses

sealed interface Work
data object Company : Work
data object College : Work
data object School : Work

println(College) //College
```

Just by adding the `data` modifier in front of my `object`, we already get a much nicer result in the console.

Note that `toString()` is the only function implemented by `data object`. Functions like `equals()` and `hashCode()` will behave just like they do for any other object. Functions like `copy()` and `componentN()` are not available.

### Advantages

- **Explicit hierarchy**: Sealed classes provide a clear, explicit way to define a limited hierarchy of related classes. This helps communicate the structure of the hierarchy to developers working on the code.

- **Design pattern**: Sealed classes follow the "State" design pattern, letting you represent different states or variations of a type in an organized way while keeping consistency throughout the hierarchy.

- **Exhaustiveness in when**: Using sealed classes in a when expression lets the compiler perform exhaustiveness checks, ensuring that all possible cases are handled. This helps prevent errors at compile time.

- **Safety during refactoring**: Sealed classes provide a solid structure for future expansion without breaking existing code. Adding new cases is safe, because you have to update every part of the code that deals with the when expression.

### Disadvantages

- **Hierarchy restriction**: Sealed classes limit the hierarchy to a fixed set of subclasses. This can be restrictive in scenarios where the hierarchy needs to be expanded dynamically.

- **Complexity**: Very complex class hierarchies with many cases and behaviors can make code hard to understand and maintain.

- **Coupling**: Sealed classes can lead to a higher level of coupling, since the cases must be known and defined in the sealed class. This can make it harder to create independent components.

```kotlin
sealed class MediaType
class Image(val url: String) : MediaType()
class Video(val url: String) : MediaType()
// Hard to add new media types without modifying the sealed class
```

- **Improper use**: Sealed classes can be misused, resulting in an unnecessarily restricted hierarchy or creating more complexity than needed.

```kotlin
sealed class FieldState
object EmptyState : FieldState() // Unnecessary use of a sealed class
```

- **Complex behaviors**: Sealed class cases that contain complex logic or multiple states can make the code's control flow harder to follow.

```kotlin
sealed class Result
object Success : Result()
class Error(val message: String) : Result()

@Test
fun testCaseCoverage() {
    assertTrue(Success is Result)
    assertTrue(Error("An error occurred") is Result)
}
```

- **Behavior testing**: Test the specific functions and behaviors of each sealed class case. This helps ensure the internal logic of each case is working as expected.

```kotlin
sealed class Color
object Red : Color()
object Blue : Color()

fun describeColor(color: Color): String {
    return when (color) {
        Red -> "Red color"
        Blue -> "Blue color"
    }
}

// Test
@Test
fun testBehaviors() {
    assertEquals("Red color", describeColor(Red))
    assertEquals("Blue color", describeColor(Blue))
}
```

- **Manipulation testing**: If you have manipulation methods that change the state of a sealed class, test that they alter the instance correctly.

```kotlin
sealed class Shape
object Square : Shape()
object Circle : Shape()

data class Coordinates(val x: Int, val y: Int)

fun moveShape(shape: Shape, coordinates: Coordinates): Coordinates {
    return when (shape) {
        Square -> Coordinates(coordinates.x + 2, coordinates.y + 2)
        Circle -> Coordinates(coordinates.x - 1, coordinates.y - 1)
    }
}

// Test
@Test
fun testManipulation() {
    val initialCoordinates = Coordinates(3, 4)
    assertEquals(Coordinates(5, 6), moveShape(Square, initialCoordinates))
    assertEquals(Coordinates(2, 3), moveShape(Circle, initialCoordinates))
}
```

- **Value checking**: Check that values are being kept correctly when you change the state of a sealed class. This ensures data integrity.

```kotlin
sealed class Currency
object Real : Currency()
object Dollar : Currency()

data class Money(val amount: Double, val currency: Currency)

// Test
@Test
fun testValueChecking() {
    val money = Money(50.0, Real)
    val newMoney = money.copy(currency = Dollar)
    assertEquals(50.0, money.amount)
    assertEquals(Dollar, newMoney.currency)
}
```

- **Use factories**: Create test factories for instances of sealed classes. This helps centralize the creation of instances and makes tests easier to maintain.

```kotlin
sealed class Animal
object Dog : Animal()
object Cat : Animal()

data class Pet(val name: String, val animal: Animal)

fun fakePet(
    name: String = "Rex",
    animal: Animal = Dog,
) = Pet(name, animal)

// Test
@Test
fun testFactory() {
    val dogPet = fakePet()
    assertEquals("Rex", dogPet.name)
    assertEquals(Dog, dogPet.animal)
}
```

- **Error scenarios**: Create test cases for error situations, such as trying to create an invalid instance. Check that exceptions are thrown as expected.

```kotlin
sealed class OperationResult
object Success : OperationResult()
class Error(val message: String) : OperationResult()

fun runOperation(succeeded: Boolean): OperationResult =
    if (succeeded) Success else Error("Operation failed")

// Test
@Test
fun testErrorScenarios() {
    assertTrue(runOperation(true) is Success)
    assertTrue(runOperation(false) is Error)
}
```

- **Performance testing**: If handling sealed instances is a critical aspect of the system, create performance tests to make sure the operations run efficiently.

```kotlin
sealed class Work
object Project : Work()
object Task : Work()

fun runWork(work: Work): String {
    Thread.sleep(100) // Simulates processing
    return when (work) {
        Project -> "Project completed"
        Task -> "Task finished"
    }
}

// Performance test
@Test(timeout = 500) // 500ms limit
fun testPerformance() {
    assertEquals("Project completed", runWork(Project))
}
```
