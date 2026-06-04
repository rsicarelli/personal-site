---
title: 'Android Plataforma - Part 6: Version Catalog'
description: 'In the previous post, we optimized our platform and got it ready for more features.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 6
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F3b7x5zvcghon1kgq5zxn.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-6-version-catalog-59ob'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/6/version-catalog'
  reactions: 2
topic: android
difficulty: intermediate
contentType: tutorial
---

In the previous post, we optimized our platform and got it ready for more features.

In this post, we'll set up Gradle's _Version Catalogs_, giving us a sophisticated way to manage our dependencies.

---

## What are Version Catalogs?

_Version Catalogs_ is a feature that first shipped as experimental in Gradle `7.x` and was later stabilized in the `8.x` release.

In short, it generates a "project accessor", usually named `libs`. You can define it through a DSL in `settings.gradle.kts` or through a `.toml` file. In this tutorial, we'll go with the `.toml` file approach.

## Steps

**1 -** Go to the `gradle` folder in your project's root directory and create a file named `libs.versions.toml`:

```shell
cd gradle
touch libs.versions.toml
```

**2 -** Edit the `libs.versions.toml` file and declare the project's dependencies:

```toml
[versions]
composeBom = "2023.09.01"
composeKotlinCompilerExtension = "1.5.3"
androidxCoreKtx = "1.12.0"
androidxLifecycleRuntimeKtx = "2.6.2"
androidxComposeActivity = "1.7.2"
androidBuildTools = "8.1.1"
kotlin = "1.9.10"

[libraries]
androidx-compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { module = "androidx.compose.ui:ui" }
androidx-compose-ui-graphics = { module = "androidx.compose.ui:ui-graphics" }
androidx-compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
androidx-compose-material3 = { module = "androidx.compose.material3:material3" }
androidx-compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
androidx-compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "androidxCoreKtx" }
androidx-lifecycle-runtime-ktx = { module = "androidx.lifecycle:lifecycle-runtime-ktx", version.ref = "androidxLifecycleRuntimeKtx" }
androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "androidxComposeActivity" }

[plugins]
android-application = { id = "com.android.application", version.ref = "androidBuildTools" }
android-library = { id = "com.android.library", version.ref = "androidBuildTools" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
rsicarelli-kplatform = { id = "com.rsicarelli.kplatform" }
```

**3 -** Go to the `build-logic > settings.gradle.kts` file and wire in our `libs.versions.toml`:

```kotlin
// build-logic/settings.gradle.kts

..

dependencyResolutionManagement {
    ..
    versionCatalogs {
        create("libs") {
            // Note that we go up one folder level to use the root "gradle" folder
            from(files("../gradle/libs.versions.toml"))
        }
    }
}
```

### Important Notes:

1. It's essential that `libs.versions.toml` lives in the `gradle` folder of the root directory. This ensures both the project and our `build-logic` can access the catalog.
2. Adding the version catalog to `build-logic > settings.gradle.kts` ensures the catalog is included in both the project and `build-logic`.

Keep these points in mind, as they can save you from future problems related to file locations.

## Using the `libs` project accessor

After syncing the project, a new `libs` class will be available. Now it's time to update every `build.gradle.kts` to make use of this class:

```kotlin
// root build.gradle.kts

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    id(libs.plugins.rsicarelli.kplatform.get().pluginId)
}
```

```kotlin
// app/build.gradle.kts

plugins {
    id(libs.plugins.android.application.get().pluginId)
    kotlin("android")
}
..

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(projects.core.designsystem)
    implementation(projects.features.home)
}
```

```kotlin
// core/designsystem/build.gradle.kts

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}
..

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
// feature/details/build.gradle.kts
// feature/home/build.gradle.kts

plugins {
    id(libs.plugins.android.library.get().pluginId)
    kotlin("android")
}
..
```

## Updating the Compose Compiler version

Look for references to `kotlinCompilerExtensionVersion` and replace them with our `libs` accessor:

```kotlin
composeOptions {
    kotlinCompilerExtensionVersion = libs.versions.composeKotlinCompilerExtension.get()
}
```

## Done!

With these changes, we now have a robust, unified way to manage our dependencies, whether in the project or in the platform.

In the next article, we'll migrate our `app` module scripts straight into our platform.
