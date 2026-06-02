---
title: 'Android Plataforma - Parte 16: Considerações finais'
description: 'Nos últimos artigos, construímos uma plataforma do zero, aprendendo e aplicando diversos conceitos com o objetivo de flexibilizar e escalar aplicações…'
summary: 'Nos últimos artigos, construímos uma plataforma do zero, aprendendo e aplicando diversos conceitos com o objetivo de flexibilizar e escalar aplicações multimodulares em Kotlin.'
pubDate: 2023-09-27
updatedDate: 2023-11-27
tags:
  - 'kotlin'
  - 'android'
  - 'gradle'
series: 'android-plataforma'
seriesOrder: 16
coverUrl: 'https://media2.dev.to/dynamic/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F2qd3veu7t1vhhf53y720.png'
translated: false
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/android-plataforma-parte-16-consideracoes-finais-53f2'
  devtoId: 1611230
  githubRepo: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/'
  githubBranch: 'https://github.com/rsicarelli/kotlin-gradle-android-platform/tree/main'
  reactions: 3
---

Gostaria de fazer algumas considerações finais sobre tudo o que foi abordado e sugerir alguns próximos passos para as séries futuras!

---

## Eu realmente preciso de uma plataforma?

Essa é a pergunta do milhão.

Como indivíduo, a principal justificativa para adotar essa estratégia é se seu repositório for muito grande ou se você tiver vários outros projetos open source e desejar auxílio na manutenção desses projetos.

Para projetos pequenos ou com fins educativos, essa complexidade toda dificilmente se justifica.

Por outro lado, para aplicações de grande porte e que contam com a colaboração de várias pessoas, uma plataforma robusta realmente faz a diferença.

Uma plataforma saudável encoraja o time a adotar a modularidade, o que traz ganhos significativos de produtividade e manutenção, já que as práticas adotadas reduzem drasticamente o tempo de compilação e build dos projetos.

Essa prática é especialmente relevante para empresas que têm vários aplicativos publicados na loja, seja da mesma empresa ou no caso de uma consultoria com artefatos internos.

Basta importar sua plataforma para automaticamente acessar diversos recursos essenciais para escalar seus projetos.

### E as boas práticas?

Como vimos ao longo dos artigos, não existe uma única maneira de criar sua plataforma.

É fundamental que você e seu time estejam alinhados em diversos aspectos, tais como:

- Quais recursos queremos disponibilizar para os módulos?
- Quais serão as configurações padrão da plataforma?
- Qual terminologia usar? Recursos, Funcionalidades ou Aplicações?

O objetivo final é ter uma plataforma robusta e que faça sentido dentro do contexto do seu produto.

## Próximos passos

Agradeço imensamente pela paciência e perseverança ao ler e consumir todo esse material.

Estou curioso para saber a opinião de vocês, os impactos positivos (ou negativos) alcançados e as inspirações que você e seu time tiveram.

Quanto aos próximos passos, ainda estou decidindo sobre o que abordar:

1. Adaptar essa plataforma para Kotlin Multiplataforma e ter uma solução para Android e iOS utilizando Compose Multiplataforma.
2. Explorar a extração da nossa plataforma para um repositório separado e discutir sobre artefatos Maven e como consumir sua plataforma em qualquer projeto como uma dependência comum.

---

Tchau!
