---
title: 'Android Plataforma - Part 16: Final thoughts'
description: 'Over the last articles, we built a platform from scratch, learning and applying concepts to make multi-module Kotlin apps more flexible and scalable.'
summary: 'Over the last articles, we built a platform from scratch, learning and applying several concepts with the goal of making multi-module Kotlin apps more flexible and scalable.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 16
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F2qd3veu7t1vhhf53y720.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-16-consideracoes-finais-53f2'
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/main'
  reactions: 3
---

I'd like to share a few final thoughts on everything we've covered, and suggest some next steps for future series!

---

## Do I really need a platform?

That's the million-dollar question.

As an individual, the main reason to adopt this strategy is if your repository is very large, or if you have several other open source projects and want help maintaining them.

For small or educational projects, all this complexity is hard to justify.

On the other hand, for large applications with many contributors, a solid platform really makes a difference.

A healthy platform encourages the team to embrace modularity, which brings significant gains in productivity and maintenance, since the practices you adopt drastically cut compilation and build times.

This is especially relevant for companies that have several apps published in the store, whether from the same company or, in the case of a consultancy, with internal artifacts.

Just import your platform to automatically get access to a range of features that are essential for scaling your projects.

### What about best practices?

As we saw throughout the articles, there's no single way to build your platform.

It's essential that you and your team are aligned on several aspects, such as:

- Which features do we want to expose to the modules?
- What will the platform's default configurations be?
- What terminology should we use? Resources, Features, or Applications?

The end goal is to have a solid platform that makes sense within the context of your product.

## Next steps

Thank you so much for your patience and persistence in reading through and working through all this material.

I'm curious to hear what you think, the positive (or negative) impacts you've seen, and the ideas you and your team came away with.

As for next steps, I'm still deciding what to cover:

1. Adapting this platform to Kotlin Multiplatform and having a single solution for Android and iOS using Compose Multiplatform.
2. Exploring how to extract our platform into a separate repository, and discussing Maven artifacts and how to consume your platform in any project as a regular dependency.

---

Bye!
