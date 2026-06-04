---
title: "Android Plataforma - Part 8: Decorating the 'library' modules"
description: 'In the last post, we introduced the first decoration in the Platform and set up our entire app module using the Kotlin DSL.'
summary: 'In the last post, we introduced the first decoration in the Platform and set up our entire app module using the Kotlin DSL.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 8
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-8-decorando-os-modulo-library-4mm0'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/8/decorating-android-library'
  reactions: 3
topic: android
difficulty: intermediate
contentType: tutorial
---

Now let's extend that setup to the designsystem, home, and details modules.

We'll follow exactly the same strategy for this decoration:

1. Expose and implement the `internal fun applyAndroidLibrary()` function in the `decorations/android.kt` file.
2. Make our API available to the other modules in the `KPlatformPlugin.kt` file through the `fun androidLibrary()` function.
3. Replace the module configuration with this new function.

---

## Step by step

**1 -** Create a new `internal fun applyAndroidLibrary()` function in `build-logic/decorations`. Then, retrieve the extensions registered on the `Project` to configure the `LibraryExtension`:

```kotlin
import com.android.build.api.dsl.LibraryExtension
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidLibrary() {
    extensions.configure<LibraryExtension> {

    }
}
```

**2 -** Move the contents of the `android {}` block from any of the modules (`designsystem`, `home`, `details`) into the `LibraryExtension` configuration.

In this step, we'll also reuse `applyKotlinOptions()` from the previous solution along with the Compose compiler configuration:

```kotlin
import com.android.build.api.dsl.LibraryExtension
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.kotlin.dsl.configure

internal fun Project.applyAndroidLibrary() {
    extensions.configure<LibraryExtension> {
        namespace = "com.rsicarelli.kplatform"
        compileSdk = 34

        defaultConfig {
            minSdk = 24
            targetSdk = 34

            vectorDrawables {
                useSupportLibrary = true
            }
        }

        buildTypes {
            release {
                isMinifyEnabled = false
                proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            }
        }
        compileOptions {
            sourceCompatibility = JavaVersion.VERSION_17
            targetCompatibility = JavaVersion.VERSION_17
        }

        applyKotlinOptions()

        buildFeatures {
            compose = true
        }
        composeOptions {
            kotlinCompilerExtensionVersion = libs.version("composeKotlinCompilerExtension")
        }
        packaging {
            resources {
                excludes += "/META-INF/{AL2.0,LGPL2.1}"
            }
        }
    }
}
```

**3 -** It's time to make this decoration available to our projects. In `KPlatformPlugin.kt`, declare the `fun androidLibrary()` function:

```kotlin
import com.rsicarelli.kplatform.decorations.applyAndroidApp
import com.rsicarelli.kplatform.decorations.applyAndroidLibrary
import org.gradle.api.Plugin
import org.gradle.api.Project

class KplatformPlugin : Plugin<Project> {

    override fun apply(project: Project) = Unit
}

fun Project.androidApp() = applyAndroidApp()

fun Project.androidLibrary() = applyAndroidLibrary()
```

**4 -** Sync the project. Then go into each module's `build.gradle.kts` and apply the `androidLibrary()` decoration:

```kotlin
// core/designsystem/build.gradle.kts

import com.rsicarelli.kplatform.androidLibrary

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    api(libs.androidx.compose.ui)
    api(libs.androidx.compose.ui.graphics)
    api(libs.androidx.compose.ui.tooling.preview)
    api(libs.androidx.compose.material3)
    debugApi(libs.androidx.compose.ui.tooling)
    debugApi(libs.androidx.compose.ui.test.manifest)
}
```

```kotlin
// features/home/build.gradle.kts

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(projects.core.designsystem)
    implementation(projects.features.details)
}
```

```kotlin
// features/details/build.gradle.kts

import com.rsicarelli.kplatform.androidLibrary

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}

androidLibrary()

dependencies {
    implementation(projects.core.designsystem)
}
```

## Success!

So, what do you think of this change? Look at how much code and repetition we managed to cut!

With this, scaling our modules in future development becomes far more viable.

That said, there are still significant opportunities to make our platform more optimized and robust.

In the next post, we'll look at the redundant code in the `applyAndroidApp()` and `applyAndroidLibrary()` functions. We'll also dig deeper into `ApplicationExtension` and `LibraryExtension`.
