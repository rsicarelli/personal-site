---
title: 'Android Plataforma - Part 12: Optimizing build time for Android libraries'
description: '🌱 Branch: 12/improving-android-library-build-time 🔗 Repository:...'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 12
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F95wf01w1l93eqd5slfhg.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-12-otimizando-tempo-de-compilacao-para-bibliotecas-android-3g36'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/12/improving-android-library-build-time'
  reactions: 2
topic: android
difficulty: intermediate
contentType: tutorial
---

--

In the last post, we built a robust DSL that lets us fine-tune our decorations.

Now, let's understand how we can reduce the build time of our Android `library` modules by configuring **"build features"**.

---

## Android Gradle Plugin (AGP) "build features"

The [`BuildFeatures`](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/BuildFeatures) class is an interface that defines a list of "build" features you can enable or disable in an Android project.

These features are what generate classes like `R` and `BuildConfig`, or make the `res` and `resource` folders recognized and included in the project.

### Features and their responsibilities

1. **aidl**: AIDL (Android Interface Definition Language) lets you define the communication interfaces that the components of an IPC (Inter-Process Communication) will use. In other words, it's a way to define how different processes (or apps) will talk to each other.

2. **buildConfig**: This feature automatically generates a `BuildConfig` class with meta information about the app, such as its version and whether it's a `debug` build.

3. **compose**: Compose is Android's modern native UI toolkit for building interfaces.

4. **prefab**: Prefab lets you import C and C++ libraries as modules in Android projects. These libraries are packaged as AARs (Android ARchive) and make it easier to integrate native code into Android projects.

5. **renderScript**: RenderScript is an Android API for running high-performance computations, useful for apps that process graphics or do intensive calculations.

6. **resValues**: Makes it easier to generate Resource Values, which are constants placed in an XML file for use in the app.

7. **shaders**: Shaders are specialized programs used to render graphics, often used in games and other graphics-intensive applications.

8. **viewBinding**: View Binding automatically generates data-binding code for your views, improving the efficiency and safety of UI programming on Android.

### Default behavior

By default, both the `app` and `library` modules have these features enabled:

- aidl
- buildConfig
- renderScript
- resValues
- shaders

**Features disabled by default (value `false`):**

- compose
- prefab
- viewBinding

## Delegating build feature control to our Platform

Knowing that these features add to build time, we can set them to `false` by default and delegate that configuration to our Platform.

### Defining `BuildFeatures` and `BuildFeaturesBuilder`

**1 -** Create a new model and builder to express the custom options.

Note that only `AndroidLibraryOptions` will receive these options. The reason is that an `app` needs all of these features enabled, so we don't even bother exposing this API on `AndroidAppOptions` as well.

```kotlin
data class AndroidLibraryOptions(
    val buildFeatures: BuildFeatures,
    override val proguardOptions: ProguardOptions,
    ...
) : AndroidOptions(..) {

    data class BuildFeatures(
        val generateAndroidResources: Boolean = false,
        val generateResValues: Boolean = false,
        val generateBuildConfig: Boolean = false,
    )
}
```

```kotlin
class AndroidLibraryOptionsBuilder : AndroidOptionsBuilder() {
    ..
    var buildFeaturesBuilder = BuildFeaturesBuilder()

    fun buildFeatures(block: BuildFeaturesBuilder.() -> Unit) {
        buildFeaturesBuilder.apply(block)
    }

    override fun build(): AndroidLibraryOptions = AndroidLibraryOptions(
        ..
        buildFeatures = buildFeaturesBuilder.build()
    )
}
```

**2 -** Let's update our `applyAndroidLibrary()` function to apply the decoration from the model:

```kotlin
internal fun Project.applyAndroidLibrary(androidLibraryOptions: AndroidLibraryOptions) {
    applyAndroidCommon(androidLibraryOptions)

    extensions.configure<LibraryExtension> {
        ...

        buildFeatures {
            androidResources = androidLibraryOptions.buildFeatures.generateAndroidResources
            resValues = androidLibraryOptions.buildFeatures.generateResValues
            buildConfig = androidLibraryOptions.buildFeatures.generateBuildConfig
        }
    }
}
```

**3 -** In the following steps, we'll turn off `BuildConfig` generation entirely, including the `app` module. Since it's common to need `BuildConfig` in the `app`, let's adapt our models to bring that option back:

```kotlin
data class AndroidAppOptions(
    ..
    val versionName: String,
    val generateBuildConfig: Boolean,
    override val proguardOptions: ProguardOptions,
    ..
) : AndroidOptions(..)
```

```kotlin
class AndroidAppOptionsBuilder : AndroidOptionsBuilder() {

    ..
    var generateBuildConfig = false

    override fun build(): AndroidAppOptions = AndroidAppOptions(
        ..
        generateBuildConfig = generateBuildConfig
    )
}
```

**4 -** Let's adapt `applyAndroidApp()` so it can generate `BuildConfig`:

```kotlin
internal fun Project.applyAndroidApp(androidAppOptions: AndroidAppOptions) {
    ..
    extensions.configure<ApplicationExtension> {
        ..

        buildFeatures {
            buildConfig = androidAppOptions.generateBuildConfig
        }
    }
}
```

### Adapting the modules' `build.gradle.kts`

We'll need to update the `designsystem` module, since it has a `res` folder with the application's assets.

Go to `designsystem/build.gradle.kts` and enable Android resource generation:

```kotlin
androidLibrary {
    buildFeatures {
        // This will pick up the "res" folder and add it to the classpath
        generateAndroidResources = true
    }
}
```

### Turning the features off in `gradle.properties`

**1 -** Let's update our `gradle.properties`. Open the file and add the following lines:

```kotlin
android.library.defaults.buildfeatures.androidresources=false
android.defaults.buildfeatures.buildConfig=false
android.defaults.buildfeatures.aidl=false
android.defaults.buildfeatures.renderScript=false
android.defaults.buildfeatures.compose=false
android.defaults.buildfeatures.resValues=false
android.defaults.buildfeatures.viewBinding=false
```

**2 -** While we're here, let's take the opportunity to apply some other settings to optimize our multi-module development:

```properties
# -------Gradle--------

# JVM argument settings for the Gradle run.
# - Performance options and memory limits.
org.gradle.jvmargs=-XX:+UseCompressedOops -XX:G1HeapRegionSize=16M -XX:MinHeapFreeRatio=10 -XX:MaxHeapFreeRatio=20 -XX:GCTimeLimit=20 -Xmx30g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -Djava.awt.headless=true

# Runs tasks in parallel to improve performance.
org.gradle.parallel=true

# Enables the Gradle task cache to reuse task outputs across builds.
org.gradle.caching=true

# Configures the project only when needed, improving build times.
org.gradle.configureondemand=true

# -------Kotlin--------

# Sets the Kotlin code style to the official style.
kotlin.code.style=official

# -------Android-------

# Enables the use of AndroidX libraries instead of the legacy support libraries.
android.useAndroidX=true

# If true, Jetifier will convert non-AndroidX libraries to use it.
# We're not using any support libraries, so we can turn this step off.
android.enableJetifier=false

# Enables compile-time generation of the R class for application modules.
android.enableAppCompileTimeRClass=true

# Disables Android resource generation for libraries.
android.library.defaults.buildfeatures.androidresources=false

# Disables BuildConfig class generation.
android.defaults.buildfeatures.buildConfig=false

# Disables AIDL compilation.
android.defaults.buildfeatures.aidl=false

# Disables RenderScript compilation.
android.defaults.buildfeatures.renderScript=false

# Disables the Compose feature.
android.defaults.buildfeatures.compose=false

# Disables Resource Values generation.
android.defaults.buildfeatures.resValues=false

# Disables the View Binding feature.
android.defaults.buildfeatures.viewBinding=false

# Suppresses warnings about unsupported options.
android.suppressUnsupportedOptionWarnings=android.suppressUnsupportedOptionWarnings,android.enableAppCompileTimeRClass

# Enables resource optimizations in the Android project.
android.enableResourceOptimizations=true
```

**3 -** :warning: Important: we need to make sure the `gradle.properties` of our Composite Builds shares the same configuration.

If the contents of `build-logic`'s `gradle.properties` differ, Gradle won't share `deamons` across builds.

Copy the contents above and simply paste them into `build-logic/gradle.properties`.

## Success!

Now our project assumes that modules won't have any extra build features. Still, our platform stays flexible enough to serve modules that need specific features.

In the next article, we'll take an additional step in maintaining our modules, letting our platform decorate "pure JVM" modules, optimizing build time even further when possible.
