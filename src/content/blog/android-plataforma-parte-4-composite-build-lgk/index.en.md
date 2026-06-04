---
title: 'Android Plataforma - Part 4: Composite Build'
description: 'In the previous articles we saw why modularity matters and why Composite Builds are the right choice for scaling Kotlin projects.'
summary: 'In the previous articles we saw why modularity matters and why Composite Builds are the right choice for scaling Kotlin projects.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 4
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fh5b4mdf2bo8tj31ylvtz.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-4-composite-build-lgk'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/3-4/composite-build'
  reactions: 3
topic: android
difficulty: intermediate
contentType: tutorial
---

We'll build on the initial project by creating and including a composite build.

---

**The first step** is to create a folder to declare the plugins and features.

The most widely adopted name for this folder is `build-logic`, and you'll find plenty of projects from Google, JetBrains, and Gradle that follow this convention.

Some projects go with `conventions` or `plugins`.

I prefer to follow patterns the community already recognizes, so we'll use the most popular name: `build-logic`.

## Step by step

**1 -** Create a folder at the root of the project:

```shell
mkdir build-logic
```

**2 -** Go into this folder and run `gradle init`. This Gradle script initializes a Gradle project at the root, along with the Gradle Wrapper (`gradlew`) and other useful files.

Make sure you have Gradle installed. If you're using Homebrew:

```shell
brew install gradle
```

```shell
cd build-logic
gradle init
```

**3 -** After a moment, the following message will show up in the console:

Type **4** to choose the Gradle plugin type and confirm with enter.

```shell
Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 4
```

**4 -** Another prompt will appear asking you to choose the language. Type **"3"** for Kotlin:

```
Select implementation language:
  1: Groovy
  2: Java
  3: Kotlin
Enter selection (default: Java) [1..3] 3
```

**5 -** Next, you'll be asked to choose the DSL (domain specific language) for the scripts. Select **"2"** for Kotlin:

```shell
Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Kotlin) [1..2] 2
```

**6 -** After that, you'll be asked for the project name. Since we're already inside the `build-logic` folder, just confirm with enter:

```shell
Project name (default: build-logic): // Just press enter
```

**7 -** The next step asks for the source package. Keep the default:

```shell
Source package (default: build.logic):  // Just press enter
```

**8 -** Finally, the option to generate using the new APIs. Choose **"yes"** and confirm:

```shell
Generate build using new APIs and behavior (some features may change in the next minor release)? (default: no) [yes, no] yes
```

### Generated files

With the step-by-step done, take a look at the generated files:

```shell
A  .gitattributes
A  .gitignore
A  gradle.properties
A  gradle/wrapper/gradle-wrapper.jar
A  gradle/wrapper/gradle-wrapper.properties
A  gradlew
A  gradlew.bat
A  plugin/build.gradle.kts
A  settings.gradle.kts
```

Let's focus on the most relevant ones:

### settings.gradle.kts

The presence of this file is what lets this module be treated as a **Composite Build**.

Notice it's a simple file. For now, we don't need to add anything.

### build.gradle.kts

This generated file has several settings, but let's focus on the most important ones:

```kotlin
plugins {
    `java-gradle-plugin`
     ..
}
..
gradlePlugin {
    // Define the plugin
    val greeting by plugins.creating {
        id = "build.logic.greeting"
        implementationClass = "build.logic.BuildLogicPlugin"
    }
}
..
```

#### `java-gradle-plugin`

This plugin brings in an extension called `gradlePlugin`. That's what we use to declare our plugins.

Under the hood, this plugin applies some decorations when compiling the module's `jar`, adds metadata to its artifact, and creates a Gradle properties file that points to our implementation class.

Essentially, we're registering a plugin with the id `build.logic.greeting` in the project, and when it's applied, the `BuildLogicPlugin` implementation class becomes available, pre-compiled and ready to use.

### `BuildLogicPlugin.kt`

This file is the declaration of our plugin, using the `Plugin<Project>` API.

Thanks to the Kotlin DSL, it's easy to follow what we're doing:

Registering a task called `greetings` in the project that applies this `Plugin`

```kotlin
@Supress("unused") // invoked by reflection
class BuildLogicPlugin: Plugin<Project> {
    override fun apply(project: Project) {
        // Register a task
        project.tasks.register("greeting") { task ->
            task.doLast {
                println("Hello from plugin 'build.logic.greeting'")
            }
        }
    }
}
```

## Including our `build-logic` in the root project

Now it's time to connect the two worlds.

To include composite builds in our project, we use a special function called `includeBuild()`. The only requirement for using it is that the module has a `settings.gradle.kts` file at its root.

Since our `build-logic` is ready to use, we just need to open our `settings.gradle.kts` and include this module:

```kotlin
// root settings.gradle.kts
pluginManagement {
    includeBuild("build-logic")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
```

Essentially, we're telling Gradle to use our `build-logic` as a Composite Build, and adding our pre-compiled `BuildLogicPlugin` plugin to the project's classpath.

### Applying the plugin in `build.gradle.kts`

Finally, we'll apply our plugin to the main project.

Make sure you've synced your Gradle files ("Reload all gradle projects") and open the `build.gradle.kts` file at the root of the project:

```kotlin
//root build.gradle.kts

plugins {
    // Android plugin
    // Kotlin plugin
    id("build.logic.greeting")
}
```

## Using our "greeting" task

Once the project's Gradle files are synced, head to the console and run the following command:

Make sure you're in the project's root folder, not inside `build-logic`:

```shell
pwd
.../kplatform/build-logic
cd ..
pwd
.../kplatform
```

```shell
./gradlew greeting

> Task :greeting
Hello from plugin 'build.logic.greeting'

BUILD SUCCESSFUL in 518ms
```

## Success!

We now have our skeleton in place to compose our platform and grow our `build-logic` with more features.

In the next article, we'll do some cleanup on these files auto-generated by `gradle init` and carry on with the work.
