---
title: 'Claude Code 101: Desmistificando os Modelos de Linguagem'
description: 'O que é um token A janela de contexto Como o modelo gera texto O mecanismo de atenção Como o modelo...'
pubDate: 2026-04-09
tags:
  - 'ai'
  - 'claude'
  - 'braziliandevs'
series: 'claude-code-101'
seriesOrder: 2
coverUrl: 'https://media2.dev.to/dynamic/image/width=1200,height=627,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F3404ytflo133004tl73y.png'
provenance:
  devtoUrl: 'https://dev.to/rsicarelli/claude-code-101-desmistificando-os-modelos-de-linguagem-5big'
  devtoId: 3476054
  githubRepo: 'https://github.com/rsicarelli/claude-code-10x'
  reactions: 5
topic: ai-tooling
difficulty: beginner
contentType: tutorial
---

[🌐 Read in English](https://dev.to/rsicarelli/claude-code-101-demystifying-language-models-3h8o)

No [artigo anterior](https://dev.to/rsicarelli/claude-code-101-introducao-a-programacao-agentica-4mk1), montamos a fábrica inteira: a evolução de produção manual pra máquinas autônomas, o ecossistema de ferramentas agênticas, os três pilares (prompt, context e harness engineering). Você sabe o que a fábrica faz, quem trabalha nela e até quanto fatura.

Mas as máquinas da fábrica constroem coisas. E pra entender como elas constroem, a melhor analogia que eu conheço é LEGO. Peças padronizadas que se encaixam uma por vez, seguindo (ou não) um manual, numa mesa com espaço limitado.

Este é o segundo artigo da série **Claude Code 101**, e aqui a gente desmonta essa mecânica. O que são tokens, como funciona a context window, por que modelos geram texto do jeito que geram, e por que eles às vezes erram com uma confiança desconcertante.

---

## O que é um token

Computadores não entendem texto. Entendem números. Antes que um modelo de linguagem processe qualquer coisa que você escreveu, cada palavra, espaço e pontuação precisa virar uma sequência de inteiros. Esses inteiros são os **tokens**: as peças padronizadas com as quais o modelo trabalha.

![O que é um token](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image0-bc01.png?raw=true)

Um token não é necessariamente uma palavra. Pode ser uma palavra inteira ("hello" vira 1 token), um pedaço de palavra ("tokenização" vira vários tokens), um caractere isolado ou até um byte. A regra prática pro inglês: **1 token corresponde a mais ou menos 4 caracteres**, ou cerca de 3/4 de uma palavra. Pro português, fica mais perto de 1 token pra cada 2.7 a 3 caracteres.

### Como o vocabulário é construído

A maioria dos LLMs usa um algoritmo chamado **BPE** (Byte Pair Encoding) pra montar seu vocabulário. A lógica é simples: começa com os 256 valores possíveis de um byte, percorre os bilhões de textos usados pra treinar o modelo, encontra o par de bytes mais frequente, junta num token novo, e repete. O resultado é um vocabulário que varia entre ~100 mil e ~260 mil tokens, dependendo do modelo.

O detalhe que importa: essa massa de textos é dominada por inglês. Palavras como "the", "and", "great" viram tokens únicos, peças inteiras. Palavras em português são fragmentadas em pedaços menores, como se o kit viesse com peças cortadas ao meio. Compare:

![Tokenização: inglês vs português](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image1-354a.png?raw=true)

O caractere "ó" sozinho já vira um token separado porque acentos aparecem pouco nos textos de treinamento. Não é detalhe técnico irrelevante. Afeta diretamente o seu bolso e a capacidade efetiva do modelo quando você trabalha em português.

### O imposto linguístico do português

Um estudo de Petrov et al. apresentado no NeurIPS 2023 mediu o que eles chamaram de "prêmio de tokenização" entre idiomas [[1]](#referências). Os números:

| Tokenizer             | Quanto a mais o português consome vs inglês |
| --------------------- | ------------------------------------------- |
| GPT-2 (`r50k_base`)   | **1.94x** (quase o dobro)                   |
| GPT-4 (`cl100k_base`) | **1.48x** (~50% a mais)                     |
| GPT-4o (`o200k_base`) | **~1.3-1.4x** (melhorou) \*                 |

Os números do GPT-2 e GPT-4 vêm diretamente do estudo de Petrov et al. [[1]](#referências). A estimativa pro GPT-4o reflete a tendência de melhoria com vocabulários maiores, confirmada por estudos posteriores.

A boa notícia: cada geração de tokenizer melhora essa disparidade. A notícia que importa: mesmo no melhor caso, português ainda consome pelo menos 30% mais peças que inglês pra construir a mesma coisa. Esse "imposto" vai reaparecer quando falarmos de context window e de custo, porque ele se acumula em cada interação.

---

## A janela de contexto

Se tokens são as peças, a context window é a mesa onde você monta. Tamanho fixo. Tudo precisa caber ali: as instruções que você mandou, o histórico da conversa, os arquivos de referência e a resposta que o modelo está construindo. Quando a mesa enche, acabou. O modelo não "lembra" de nada que ficou de fora.

### As mesas de 2026

O mercado convergiu pra **1 milhão de tokens** (1M) como padrão nos modelos frontier [[2]](#referências). Na tabela abaixo, "K" significa mil e "M" significa milhão:

| Modelo                                                                          | Tamanho da mesa | Resposta máxima |
| ------------------------------------------------------------------------------- | --------------- | --------------- |
| **[Claude Opus 4.6](https://docs.anthropic.com/en/docs/about-claude/models)**   | 1M tokens       | 128K tokens     |
| **[Claude Sonnet 4.6](https://docs.anthropic.com/en/docs/about-claude/models)** | 1M tokens       | 64K tokens      |
| **[Claude Haiku 4.5](https://docs.anthropic.com/en/docs/about-claude/models)**  | 200K tokens     | 64K tokens      |
| **[GPT-5.4](https://platform.openai.com/docs/models)**                          | 1.05M tokens    | 128K tokens     |
| **[GPT-4.1](https://platform.openai.com/docs/models)**                          | 1M tokens       | 32K tokens      |
| **[Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/models)**              | 1M tokens       | 65K tokens      |
| **[Llama 4 Scout](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)**  | 10M tokens      | varia           |

A mesa é compartilhada. Tudo que você manda pro modelo (sua pergunta, arquivos, histórico de conversa) e tudo que ele responde precisam caber juntos na mesma superfície. Uma mesa de 1 milhão de tokens parece enorme, mas o espaço da resposta já reserva uma parte, e o resto é o máximo que você pode mandar.

Pra ter noção de escala: 1 milhão de tokens equivale a mais ou menos 750 mil palavras em inglês, algo como 8 a 10 livros. Pro português, por conta do imposto de tokenização, cai pra cerca de 500 mil palavras. Uns 7 livros.

### O tamanho anunciado vs. o tamanho real

Aqui entra um ponto que pouca gente discute. Ter uma mesa de 1 milhão de tokens não significa que o modelo usa bem toda essa superfície.

Pesquisas recentes mostram que a capacidade do modelo de prestar atenção (attention, um conceito que vamos explorar logo abaixo) cai conforme o contexto cresce, especialmente pra informações posicionadas no meio do texto [[3]](#referências). O fenômeno tem até nome: **"lost in the middle"**. Na prática, a atenção efetiva do modelo é significativamente menor que a janela anunciada. O benchmark NoLiMa (ICML 2025) mostrou que a maioria dos LLMs erra mais da metade das vezes quando precisa encontrar uma informação específica em contextos a partir de 32K tokens [[9]](#referências).

![A janela de contexto](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image2-934b.png?raw=true)

E aqui o imposto linguístico aparece de novo. Se a janela efetiva de um modelo com 200K tokens já é significativamente menor que o anunciado, pra conteúdo 100% em português, planeje com uma margem generosa de desconto. O espaço útil pode cair pra algo entre 80K e 90K tokens de conteúdo equivalente ao inglês. Peças maiores ocupam mais espaço na mesma superfície.

---

## Como o modelo gera texto

Você já sabe quais são as peças (tokens) e o tamanho da mesa (context window). Agora vem o processo de montagem em si.

A mecânica é surpreendentemente simples. O modelo olha pra tudo que já está na mesa, calcula uma distribuição de probabilidade sobre todo o vocabulário (entre ~100K e ~260K peças possíveis) pra decidir qual encaixa melhor na sequência, coloca uma, e repete. Uma de cada vez, do começo ao fim da resposta. Não existe um plano mestre. Isso se chama **geração autorregressiva** [[4]](#referências), e é a mecânica central da arquitetura Transformer publicada em 2017 por Vaswani et al.

Exemplo: o modelo recebe **"O céu está"** e precisa continuar.

![Geração autorregressiva](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image3-8a04.png?raw=true)
Resultado: **"O céu está azul hoje."**

Cada peça colocada depende de todas as anteriores: tanto o input original quanto o que o modelo já construiu. Por isso respostas às vezes começam bem e descarrilham no meio. O modelo não sabe onde vai terminar quando começa a gerar.

Se você leu o [artigo anterior](https://dev.to/rsicarelli/cc101-programacao-agentica), pode reconhecer esse mecanismo. Lembra do autocomplete, a fase 1 da evolução? O code completion que sugeria a próxima linha no editor? O mecanismo por baixo é o mesmo: next-token prediction. A diferença é a escala. Modelos como o GPT-2 (2019) tinham 1,5 bilhão de parâmetros e uma mesa minúscula. O Claude Opus 4.6 opera numa escala completamente diferente, com uma janela de contexto mil vezes maior. O processo de montagem é o mesmo. A capacidade de construir coisas complexas é que mudou.

---

## O mecanismo de atenção

O processo de montagem explica que o modelo coloca uma peça por vez. Mas falta entender como ele decide as probabilidades. Se a entrada é "O banco está na margem do rio", como o modelo sabe que "banco" aqui é uma formação de areia e não uma instituição financeira?

A resposta é o **mecanismo de atenção** (self-attention), introduzido no paper "Attention Is All You Need" [[4]](#referências). É o coração da arquitetura **Transformer** que sustenta todos os LLMs modernos.

### Como o modelo enxerga o contexto

Imagine que o manual de montagem não mostra só o próximo passo. Pra cada peça nova, ele destaca quais partes da construção importam pra essa decisão: a base brilha forte (sustenta tudo), as torres ao redor acendem (definem o padrão), o jardim do outro lado fica apagado (irrelevante agora). O mecanismo de atenção faz exatamente isso: pra cada token, ele "acende" os anteriores que mais pesam e "apaga" os que não importam.

![Mecanismo de atenção](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image4-f663.png?raw=true)

Antes dos Transformers, era como montar LEGO com alguém ditando as instruções: uma peça por vez, sem repetir, sem voltar atrás. Perdeu o passo 12? Já era. O Transformer é ter o manual inteiro aberto na mesa, todas as páginas visíveis ao mesmo tempo. Essa capacidade de processar tudo em paralelo foi o salto que viabilizou treinar modelos na escala atual.

### Desambiguação na prática

Volte pro exemplo: "O banco está na margem do rio." O mecanismo de atenção faz com que o token "banco" preste muita atenção nos tokens "margem" e "rio", e pouca atenção em "está" e "na". É como numa montagem onde uma peça azul pode ser céu ou mar dependendo do que está ao redor. O contexto resolve a ambiguidade.

Esse mecanismo tem um preço. Pra cada peça na mesa, o modelo olha pra todas as outras antes de decidir o encaixe [[4]](#referências). Numa mesa com 10 peças, tranquilo. Numa mesa com 10 mil, cada decisão exige olhar pra 10 mil peças. Dobrar o tamanho da mesa não dobra o trabalho, quadruplica.

Além disso, montar custa mais que olhar. Quando você manda uma pergunta, o modelo lê tudo de uma vez, como abrir o manual numa página. Mas quando ele constrói a resposta, é uma peça por vez, cada uma exigindo uma olhada na mesa inteira. Por isso o preço por token de resposta é 3x a 5x maior que o de entrada.

### O que isso significa pra você

Se a atenção funciona ponderando a relevância de cada token em relação aos outros, prompts claros e bem estruturados facilitam o trabalho do modelo. Ambiguidade no input produz "confusão" na atenção: o modelo precisa distribuir pesos entre interpretações concorrentes. Um prompt preciso é como código limpo: a intenção fica óbvia e o mecanismo de atenção foca no que importa. Quanto mais organizada a mesa, mais precisa a próxima peça.

Isso não é abstração. É a base técnica de por que prompt engineering funciona, algo que vamos explorar a fundo na Parte 6 desta série.

---

## Como o modelo escolhe entre as opções

Você já entende como o modelo pesa as opções. Mas quando vários tokens têm probabilidades próximas, quem decide qual é escolhido?

A diferença está entre seguir o manual ao pé da letra ou improvisar.

### Temperatura

Você tá montando uma parede azul e precisa da próxima peça. Na caixa, as peças estão organizadas: no topo ficam as azuis que encaixam perfeitamente, no meio aparecem umas verdes que até funcionariam como detalhe, e lá no fundo tem uma roda vermelha que não faz sentido nenhum.

A **temperatura** controla o quão fundo o modelo enfia a mão na caixa. No zero, sempre pega a peça do topo: mesma escolha, toda vez, sem surpresa. No 0.7, às vezes pesca uma verde que ninguém esperava, mas que dá um charme na construção. Acima de 1.0, puxa a roda vermelha e encaixa na parede mesmo assim.

| Temperatura | Completando "A receita leva..."                       | Comportamento           |
| ----------- | ----------------------------------------------------- | ----------------------- |
| 0.0         | "farinha, açúcar e cacau."                            | Sempre a mesma resposta |
| 0.3         | "farinha de trigo, óleo de coco e cacau."             | Pequenas variações      |
| 0.7         | "especiarias exóticas e um toque de limão siciliano." | Criativo                |
| 1.5         | "sonhos derretidos em caramelo de dragão."            | Incoerente              |

![Temperatura: o quão fundo na caixa](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image5-9d21.png?raw=true)

### Top-p

Temperatura não é o único controle. O **top-p** funciona diferente: em vez de mudar o quão fundo o modelo vai na caixa, ele tira peças da caixa antes da escolha. Com top-p de 0.9, as 10% mais improváveis nem ficam disponíveis. O efeito é parecido com temperatura, e a recomendação dos providers é ajustar um ou outro, não os dois ao mesmo tempo.

### O que isso significa na prática

Quando você começar a usar ferramentas agênticas pra escrever código (a partir da Parte 5 desta série), esses valores já vêm calibrados. Mas entender que eles existem ajuda a entender por que o modelo às vezes surpreende com uma resposta inesperada: alguém deixou a mão mais funda na caixa.

Pro que nos interessa nesta série, a regra é simples: pra código, o modelo trabalha melhor no modo previsível. Peça certa no lugar certo, sem improviso.

---

## As famílias de modelos

Nem toda peça serve pra toda construção. LEGO Duplo (peças grandes, simples) é perfeito pra quem está começando, mas não dá pra construir um motor funcional com ele. LEGO Technic (engrenagens, eixos, complexidade) permite construções sofisticadas, mas é mais caro e exige mais tempo. A mesma lógica vale pra modelos de linguagem.

### Modelos de raciocínio

Os kits Technic: "pensam antes de responder", gastando tokens internos em raciocínio passo a passo (extended thinking) antes de produzir a resposta final. São os mais capazes, mais lentos e mais caros. Os preços abaixo estão em dólares por MTok (1 milhão de tokens): o primeiro valor é o custo de entrada (o que você manda), o segundo é o de resposta (o que o modelo gera).

- **Claude Opus 4.6** (Anthropic) alcança 80.8% no SWE-bench Verified [[5]](#referências). $5/$25 por MTok.
- **o3 / o3-pro** (OpenAI) são modelos de raciocínio dedicados. O o3-pro custa $20/$80 por MTok.
- **Gemini 2.5 Pro** (Google) permite configurar o "orçamento de raciocínio". $1.25/$10 por MTok.

### Modelos rápidos

Os kits Duplo: peças maiores, encaixe rápido, resultado imediato. Projetados pra latência baixa e alto volume.

- **Claude Haiku 4.5** (Anthropic): $1/$5 por MTok.
- **GPT-4o-mini** (OpenAI): $0.15/$0.60 por MTok.
- **Gemini 2.5 Flash** (Google): $0.30/$2.50 por MTok.

### Modelos de código

Kits otimizados pra construções específicas. Como a linha Creator Expert, onde cada set é projetado pra um resultado particular.

- **GPT-4.1** (OpenAI): 1M de contexto, $2/$8 por MTok. Explicitamente otimizado pra código.
- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** (Anthropic): usa Opus/Sonnet por baixo, mas com um harness inteiro de ferramentas pra ler, editar, executar e fazer commit.

### Modelos open-weight

Kits com todas as peças expostas: você monta, desmonta e adapta como quiser.

- **Llama 4 Scout** (Meta): 10M de contexto, open-weight [[6]](#referências).
- **Llama 4 Maverick** (Meta): 1M de contexto, 17B parâmetros ativos de 400B total.
- **DeepSeek R1**: open-source (MIT), 671B parâmetros, raciocínio forte.

### Escolhendo o kit certo

Usar Opus pra classificar sentimento de tweets é como comprar um Technic de 4 mil peças pra construir um cubo. A diferença entre Haiku ($1/$5 por MTok) e Opus ($5/$25 por MTok) é **5x no input e 5x no output**. Muita tarefa que parece "precisar" de um modelo grande funciona perfeitamente com um modelo menor.

A regra prática: comece sempre pelo modelo mais barato que pode funcionar. Teste com Haiku, Flash ou mini. Se a qualidade não for suficiente, suba. Opus e o3-pro ficam reservados pra quando realmente necessário.

![Famílias de modelos](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image6-ae0b.png?raw=true)

Mas independente do kit que você escolher, todos compartilham as mesmas limitações fundamentais.

---

## O que modelos não conseguem fazer

A construção pode parecer perfeita. Visualmente impecável, cada peça no lugar. Mas empurre a parede e ela cai. O modelo não "sabe" se o que construiu funciona. Ele encaixa peças onde elas parecem caber, seguindo padrões estatísticos, e o resultado frequentemente se sustenta. Mas nem sempre.

### Alucinações não são bugs

Quando um modelo gera informação que parece correta mas é factualmente falsa, chamamos de **alucinação** (hallucination). É tentador tratar isso como defeito, algo que será "consertado" numa versão futura. Mas alucinações são uma consequência direta do design: o modelo encaixa peças onde elas parecem caber estatisticamente, sem checar se a construção faz sentido no mundo real [[4]](#referências).

Se o padrão estatístico de "X escreveu o livro Y" é forte o bastante nos dados de treinamento, o modelo vai afirmar isso mesmo se for falso. Ele não tem um verificador de fatos interno. Não distingue entre gerar "Paris é a capital da França" e "Paris é a capital da Itália". Ambas são sequências de tokens plausíveis; uma é verdade, a outra não, e o modelo não sabe a diferença.

![Limitações: alucinações e mesa limpa](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image7-2d3e.png?raw=true)

### As limitações concretas

O manual do modelo foi impresso numa data específica. Tudo que aconteceu depois não existe pra ele. E pior: no final de cada montagem, a mesa é limpa. A próxima conversa começa do zero, sem nenhuma peça da anterior. Se você precisa que o modelo lembre de algo, você mesmo precisa colocar de volta na mesa.

A boa notícia: com técnicas de Context Engineering e Harness Engineering (temas das Partes 7 e 8 desta série), dá pra automatizar o que vai na mesa a cada conversa. Mas por enquanto, o importante é saber que o modelo sozinho não lembra de nada.

Matemática continua sendo um ponto fraco. O modelo pode montar uma conta que parece certa mas erra o resultado. Pra cálculos que exigem precisão, é mais seguro pedir pro modelo escrever código que faça a conta do que confiar na resposta direta.

E no contexto de código, testes da Veracode mostraram que **45% do código gerado por IA contém falhas de segurança**, em avaliações com mais de 100 LLMs [[7]](#referências). O modelo monta rápido, mas se ninguém confere a construção, peças mal encaixadas vão parar no produto final.

### O que está melhorando

Mas a comunidade não tá parada. As melhorias estão vindo de várias frentes ao mesmo tempo: modelos que "pensam passo a passo" antes de montar, reduzindo erros em tarefas complexas. Sistemas que preenchem a mesa automaticamente com as peças certas pro seu projeto, em vez de você colocar tudo na mão. Agentes que lembram das montagens anteriores e aprendem com elas. E uma infraestrutura que fica mais rápida e mais barata a cada geração.

Cada uma dessas frentes vai aparecer nos próximos artigos da série. Por enquanto, o importante é saber: as limitações são reais, mas estão encolhendo.

Mesmo com essas limitações, os modelos estão sendo usados em escala. E escala tem um custo.

---

## Quanto custa

Cada peça custa dinheiro. LLMs são cobrados por token processado, dividido em duas categorias: **input tokens** (tudo que você envia) e **output tokens** (o que o modelo gera). Construir algo novo (output) sempre custa mais que consultar o que já existe (input), geralmente entre 3x e 5x o preço [[8]](#referências). Faz sentido: gerar cada token exige um forward pass completo pelo modelo.

![Input vs Output: consultar vs construir](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image8-db69.png?raw=true)

### Tabela de preços (abril 2026)

Preços em USD por 1 milhão de tokens (MTok):

| Modelo                | Input / MTok | Output / MTok | Cache read / MTok |
| --------------------- | ------------ | ------------- | ----------------- |
| **Claude Opus 4.6**   | $5.00        | $25.00        | $0.50             |
| **Claude Sonnet 4.6** | $3.00        | $15.00        | $0.30             |
| **Claude Haiku 4.5**  | $1.00        | $5.00         | $0.10             |
| **GPT-5.4**           | $2.50        | $15.00        | $0.25             |
| **GPT-4.1**           | $2.00        | $8.00         | $0.50             |
| **Gemini 2.5 Pro**    | $1.25        | $10.00        | $0.125            |
| **Gemini 2.5 Flash**  | $0.30        | $2.50         | $0.03             |

Repare na coluna "Cache read". Ela vai ser importante daqui a pouco.

### O imposto linguístico fecha o ciclo

Lembra do custo de tokenização do português? Ele se traduz diretamente em dinheiro. Pro mesmo conteúdo, aplicações em português custam entre **30% e 50% a mais** em tokens de input do que a mesma aplicação em inglês, dependendo do tokenizer. Numa conta de $5.000/mês, isso representa entre $1.150 e $1.650 extras só por causa do idioma.

Ao longo deste artigo, um fio conecta três seções: o português consome mais peças pra construir a mesma coisa (seção 1), isso ocupa mais espaço na mesa (seção 2), e agora cobra mais caro (aqui). Não são três problemas. É o mesmo problema, em três camadas.

![O imposto linguístico em três camadas](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part2/assets/pt-br/part2-image9-fae8.png?raw=true)

### Como otimizar

A boa notícia: existem formas concretas de reduzir esse custo.

**Prompt caching** é a mais impactante. Todos os grandes providers oferecem cache reads a cerca de 10% do preço de input [[8]](#referências). Se o seu system prompt ou contexto de referência se repete entre chamadas, caching pode reduzir o custo de input em até **90%**. Isso mitiga significativamente o imposto linguístico do português.

**Batch API** oferece 50% de desconto em troca de processamento assíncrono (janela de 24h). Pra tarefas que não são real-time (análise de documentos, classificação em massa), é dinheiro fácil de economizar.

**Seleção de modelo** é a terceira alavanca. Muitas tarefas que rodam em Opus funcionariam tão bem em Haiku, a uma fração do custo. Testar com o modelo mais barato primeiro não é otimização prematura. É engenharia responsável.

Combinando batch + caching na Anthropic, o desconto pode chegar a **95%** em cenários ideais [[8]](#referências).

Esse tema vai ser central na Part 4, quando falarmos de context engineering. Gerenciar o que vai na mesa é, na prática, gerenciar dinheiro.

---

## Considerações finais

Tokens, mesa, atenção, temperatura, limitações, custo. Pode parecer muita coisa, mas tudo se conecta. E nada disso é trivia técnica. É a base de cada decisão que você vai tomar com essas ferramentas: por que um prompt funciona e outro não, por que a resposta travou no meio, por que a conta veio mais cara do que o esperado.

Mas tem um gap. Saber como as peças funcionam não explica como digitar um parágrafo no terminal resulta em 50 arquivos editados, testes passando e um commit pronto. Alguma coisa tá pegando essas peças, organizando na mesa, montando, conferindo, desmontando quando erra e tentando de novo. Alguma coisa tá transformando um motor de próximo-token em um sistema que realmente constrói software.

Essa alguma coisa é o que ferramentas como Claude Code, Codex CLI e OpenCode fazem. São elas que envolvem o modelo, dão ferramentas pra ele agir, e orquestram o ciclo de montar, conferir e corrigir. No próximo artigo, a gente abre uma delas por dentro, peça por peça.

---

> 🤖 Este artigo foi escrito com assistência do Claude (Anthropic).
>
> Conteúdo pesquisado, verificado e editado por um humano.
>
> Encontrou algum erro ou crédito faltando? Me manda uma mensagem!

---

## Referências

1. [Petrov, A. et al. — "Language Model Tokenizers Introduce Unfairness Between Languages" (NeurIPS 2023)](https://arxiv.org/abs/2305.15425)
2. [Anthropic — Claude model documentation (2026)](https://docs.anthropic.com/en/docs/about-claude/models)
3. [Liu, N.F. et al. — "Lost in the Middle: How Language Models Use Long Contexts" (TACL 2024, vol. 12)](https://arxiv.org/abs/2307.03172)
4. [Vaswani, A. et al. — "Attention Is All You Need" (NeurIPS 2017)](https://arxiv.org/abs/1706.03762)
5. [SWE-bench](https://www.swebench.com/) — Princeton NLP (ICLR 2024)
6. [Meta — Llama 4 announcement (2025)](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
7. [Veracode — "GenAI and Code Security: What You Need to Know" (2025)](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
8. [Anthropic — API Pricing (2026)](https://www.anthropic.com/pricing)
9. [Kuratov, Y. et al. — "NoLiMa: Long-Context Evaluation Beyond Literal Matching" (ICML 2025)](https://arxiv.org/abs/2502.05167)
