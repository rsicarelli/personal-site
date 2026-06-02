---
title: "Claude Code 101: Introdução à Programação Agêntica"
description: "Setembro de 2025. Eu estava tocando a atualização de uma dependência crítica num app mobile com milhões de usuários. O tipo de mudança que quebra testes…"
pubDate: 2026-04-04
updatedDate: 2026-04-09
tags:
  - "claude"
  - "ai"
  - "braziliandevs"
series: "claude-code-101"
seriesOrder: 1
coverUrl: "https://media2.dev.to/dynamic/image/width=1200,height=627,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F6mc3scopj9lxh9vo7yar.png"
provenance:
  devtoUrl: "https://dev.to/rsicarelli/claude-code-101-introducao-a-programacao-agentica-4mk1"
  devtoId: 3454772
  githubRepo: "https://github.com/rsicarelli/claude-code-10x"
  reactions: 4
---

Setembro de 2025. Eu estava tocando a atualização de uma dependência crítica num app mobile com milhões de usuários. O tipo de mudança que quebra testes em cascata. O prazo era Outubro: se não ficasse pronto, o app não subia pra loja.

O problema: quase 10.000 testes precisavam ser adaptados pra nova versão. Código de mais de 20 times, espalhado por centenas de módulos. 

Pensei "e se eu der uma chance pra essas ferramentas de IA que todo mundo fala?" Depois de alguns vídeos e documentação, coloquei quatro terminais rodando em paralelo com Claude Code, cada um migrando uma fatia dos testes. Em uma semana: 2.000+ arquivos alterados, 50 mil linhas de código, 85% migrado de primeira. Na semana seguinte, pente fino no restante.

Quando mergiei tudo com aprovação dos times responsáveis, uma coisa ficou clara: eu **nunca** teria feito aquilo sozinho. Não em duas semanas, talvez nem em dois meses. Era cognitivamente impossível.

Foi aí que eu entendi que alguma coisa tinha mudado de verdade: meu papel tinha mudado, e eu precisava entender como isso funciona por dentro.

Este é o primeiro artigo da série **Claude Code 101**. Ao longo dela, vamos desmontar o que está por trás da **programação agêntica**: de onde veio, como funciona, quais ferramentas existem e o que você precisa aprender pra usar isso de verdade. Vamos construir juntos um modelo mental (a **analogia da fábrica**) e conhecer os três pilares que sustentam tudo: prompt engineering, context engineering e harness engineering.

---

## O desenvolvimento de software como conhecemos

O fluxo que todo dev conhece: ler requisito, projetar solução, escrever código, rodar testes, corrigir bugs, fazer deploy. Nada acontece sem que você esteja ativamente envolvido. É você quem lê a documentação, quem busca no (finado 😅) Stack Overflow, quem mantém o contexto do projeto na cabeça, quem digita cada letra.

O software só avança quando você está sentado na frente da tela, trabalhando nele. Cada linha de código é um produto montado à mão, e o ritmo de produção depende da velocidade dos seus dedos e da capacidade da sua memória.

### O gargalo somos nós

A ciência cognitiva tem dados desconfortáveis pra gente. Nossa memória de trabalho retém, em média, 7 itens ao mesmo tempo [[1]](#referências). Depois de uma interrupção (aquele tapinha no ombro, aquela mensagem no Slack) levamos em média 23 minutos pra retomar o foco [[2]](#referências). E se você parar pra medir, vai perceber que passa apenas uns 30% do tempo efetivamente escrevendo código. O resto é leitura, navegação, debugging e reuniões.

O gargalo não é só o compilador. Não é o CI. Não é o servidor. O gargalo é a gente.

Por décadas, aceitamos isso como o custo natural de construir software. A fábrica produz na velocidade de quem opera. E ponto. Até que a inteligência artificial começou a mudar essa equação.

---

## A era da assistência por IA

### Autocomplete Inteligente (2021-2022)

Em junho de 2021, o GitHub lançou a preview técnica do **Copilot**, que sugeria linhas de código em tempo real dentro do editor [[3]](#referências). Junto com o [TabNine](https://www.tabnine.com/) e outras ferramentas similares, nascia o paradigma do code completion: sugestões de uma ou mais linhas baseadas no contexto do arquivo atual.

Mudou algo? Claro. Menos digitação, boilerplate preenchido automaticamente, sugestões que muitas vezes acertavam o que você ia escrever. Mas o papel de quem desenvolve não mudou em nada. Você ainda decide o quê escrever, onde escrever, quando rodar testes, como corrigir erros. A IA sugere; você executa.

Pense na fábrica: a linha de produção ganhou uma esteira pra mover peças mais rápido. Útil? Sem dúvida. Mas você continua montando tudo à mão.

### O paradigma do chat (2022-2023)

Novembro de 2022: [ChatGPT](https://openai.com/index/chatgpt/) é lançado e muda a forma como devs buscam ajuda [[4]](#referências). O padrão se tornou familiar pra qualquer um: copiar um trecho de código, colar no chat, descrever o problema, receber uma sugestão, copiar de volta pro editor. O [LangChain](https://www.langchain.com/), lançado um mês antes, já ensaiava conectar LLMs a ferramentas externas. Um precursor do que viria depois.

O chat era mais versátil que o autocomplete: explicava conceitos, sugeria refatorações, gerava testes. Mas as limitações eram fundamentais. Sem acesso aos arquivos do projeto, sem contexto da estrutura de pastas, sem capacidade de executar comandos. Você virava um mensageiro entre a IA e o código.

É como ter um consultor muito bom sentado ao seu lado. Alguém que lê qualquer manual em segundos e tem resposta pra quase tudo. Só que esse consultor não pode tocar nas máquinas. O trabalho manual continua sendo seu.

![Autocomplete vs Chat](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part1/assets/pt-br/part1-01-autocomplete-vs-chat-9413.png?raw=true)

### Por que assistência não bastava

No fim das contas, os dois paradigmas esbarram no mesmo problema: **a IA não é agêntica** (ou seja, não tem capacidade de agir por conta própria). Não lê seu projeto. Não roda comandos. Não executa testes. Não itera sobre erros.

A esteira e o consultor ajudam, mas ninguém opera as máquinas por você. Quando você vai embora, a produção para.

Em 2024, a pergunta natural veio: **e se a IA pudesse fazer mais do que sugerir?**

---

## De Assistente a Agente

Olhando pra trás, a evolução das ferramentas de IA para código segue quatro fases bem definidas. Cada fase é como um upgrade na fábrica: primeiro vem a esteira, depois o consultor, depois máquinas melhores, até chegar nas que operam sozinhas.

![A evolução da codificação com IA](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part1/assets/pt-br/part1-02-evolution-timeline-e86c.png?raw=true)

As fases 1 e 2 já vimos. O salto real começa na fase 3.

### Fase 3 — Edição multi-arquivo (2024)

Em 2024, o **[Cursor](https://www.cursor.com/)** (um editor construído como fork do VS Code) popularizou uma nova categoria: edição multi-arquivo via linguagem natural. Você descreve o que quer, a IA propõe mudanças coordenadas em vários arquivos de uma vez.

O crescimento fala por si: de **US$ 1 milhão de receita anual em janeiro de 2024** para **mais de US$ 1 bilhão em novembro de 2025** [[5]](#referências). Devs queriam mais do que sugestões linha a linha.

Mas o modelo fundamental não mudou: o humano orquestra, a IA executa. Você diz o que mudar, a IA muda, você confere. As máquinas ficaram mais sofisticadas, sim — mas você ainda opera cada painel de controle, passo a passo.

### Fase 4 — A codificação agêntica (2024-presente)

Aqui o paradigma inverte. Em vez de você orquestrar a IA, **você define o objetivo e a IA se orquestra sozinha**.

Essa virada não aconteceu do nada. Teve uma sequência de avanços que a tornaram possível:

- **Function calling** (OpenAI, junho de 2023). Pela primeira vez, modelos podiam invocar ferramentas externas. É o pré-requisito técnico pra qualquer comportamento agêntico [[6]](#referências).
- **Andrew Ng cunha "agentic"** (final de 2023). Ele escolheu um adjetivo de propósito, não um substantivo: *"Diferente do substantivo 'agent', o adjetivo 'agentic' nos permite pensar em sistemas como sendo mais ou menos parecidos com agentes, em diferentes graus."* [[7]](#referências)
- **Model Context Protocol** (Anthropic, novembro de 2024). O padrão aberto pra conectar agentes a ferramentas externas, adotado rapidamente por toda a indústria [[8]](#referências).
- **"Building Effective Agents"** (Anthropic, dezembro de 2024). O paper que virou a referência mais citada do campo, diferenciando **workflows** (caminhos predefinidos) de **agents** (processos dinâmicos, autodirigidos) [[9]](#referências).

O que faz algo ser "agêntico"? Cinco coisas:

1. **Autonomia**: decide o que fazer sem guia passo a passo
2. **Tool use**: lê e escreve arquivos, executa comandos, roda testes
3. **Planejamento**: quebra objetivos em subtarefas
4. **Raciocínio em loop**: itera, não responde uma vez só
5. **Autocorreção**: erra, percebe, ajusta e tenta de novo

![O loop agêntico](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part1/assets/pt-br/part1-03-agentic-loop-49e9.png?raw=true)

Aqui é onde a analogia da fábrica muda completamente. Você não está mais na linha de produção apertando parafuso e movendo peça. Agora você **projeta** a fábrica. Programa as máquinas, configura os controles de qualidade, supervisiona a produção. Os agentes executam, reportam problemas e se autocorrigem. Sua produtividade deixa de ser limitada pela velocidade das suas mãos e passa a depender da qualidade das suas instruções.

Como a Anthropic resumiu: o desenvolvimento vai "de *'escrever código, rodar testes, ler erros, corrigir, repetir'* para *'definir objetivo, revisar mudanças, aprovar implementação.'*"

### A linha do tempo completa

Cinco anos, acelerando absurdamente em 2024-2025:

- **2021**: GitHub Copilot (preview) — nasce o code completion com IA
- **2022**: LangChain (outubro), ChatGPT (novembro) — nasce o chat
- **2023**: Function calling (junho), [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) viraliza, Andrew Ng cunha "agentic"
- **2024**: [Devin AI](https://devin.ai/) salta o [SWE-bench](https://www.swebench.com/) de 1,96% pra 13,86%. MCP é lançado. "Building Effective Agents" é publicado
- **2025**: [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Copilot Agent Mode, [Codex CLI](https://github.com/openai/codex). Agentes resolvem **mais de 80%** do SWE-bench — contra 13,86% apenas 18 meses antes [[10]](#referências)

### "Vibe coding" vs. o negócio sério

Vale uma distinção importante aqui. Digitar prompts vagos sem conferir o resultado (o que a comunidade chama de "vibe coding") não é programação agêntica. É só... preguiça com interface bonita. É a diferença entre ligar a máquina sem ler o manual e configurar tudo direitinho antes de apertar o botão.

Programação agêntica profissional, como o blog de engenharia da Tweag define, envolve *"profissionais qualificados que escrevem prompts intencionalmente, validam rigorosamente e guiam a saída dentro de limites arquiteturais claros"* [[11]](#referências).

É essa abordagem que esta série ensina. E pra usá-la direito, vale conhecer o ecossistema de ferramentas disponíveis.

---

## O ecossistema de ferramentas agênticas

Não falta ferramenta nesse espaço. Em 2025, ferramentas de IA pra código geraram **US$ 7,37 bilhões em receita**, o equivalente a 55% de todo o investimento empresarial em IA [[12]](#referências). O Google já atribui 50% do seu código a agentes [[13]](#referências). E 84% de devs dizem que usam ou planejam usar ferramentas de IA [[14]](#referências).

As ferramentas se dividem em três categorias: **CLI** (terminal: Claude Code, Codex CLI, Cursor CLI, Aider, OpenCode), **IDE** (editor com IA integrada: Cursor, [Windsurf](https://windsurf.com/)) e **híbrido** (plugin + nuvem: GitHub Copilot).

Eis as principais:

**[Claude Code](https://github.com/anthropics/claude-code)** opera no terminal: lê o codebase inteiro, edita arquivos, roda comandos, cria commits, abre PRs. As extensões e plugins são open source no GitHub (108K+ stars). Atingiu US$ 2,5 bilhões de receita anual em nove meses, o crescimento mais rápido da história de software empresarial [[15]](#referências). Roda exclusivamente com modelos da Anthropic (Opus, Sonnet, Haiku).

**[Cursor](https://www.cursor.com/)** começou como um fork do VS Code reconstruído em torno de IA e hoje também tem uma [CLI](https://www.cursor.com/cli) pra quem prefere o terminal. Suporta Claude, GPT e Gemini ao mesmo tempo. Passou de US$ 1M pra US$ 1B+ de receita anual em menos de dois anos, com mais de 1 milhão de usuários ativos por dia [[5]](#referências).

**[GitHub Copilot](https://github.com/features/copilot)** é o mais amplamente adotado: 20 milhões de usuários, 90% das empresas Fortune 100. Seu Coding Agent gera cerca de 1,2 milhão de PRs por mês [[16]](#referências).

**[OpenCode](https://github.com/nichochar/opencode)** (MIT) virou o agente de código mais estrelado do GitHub com ~129K stars. Roda no terminal, suporta 75+ provedores de LLM e tem integração nativa de LSP. Totalmente gratuito (você só paga a API do modelo) [[18]](#referências).

No lado open source, mais dois se destacam. **[Aider](https://github.com/paul-gauthier/aider)** (Apache 2.0) funciona com qualquer LLM e é gratuito. Detalhe curioso: o Aider escreve 70-88% do seu próprio código em cada release [[17]](#referências). **[Codex CLI](https://github.com/openai/codex)** da OpenAI (Apache 2.0) tem 2M+ de usuários semanais [[19]](#referências).

| Ferramenta | Interface | Modelos | Open Source | Preço | Usuários aprox. |
|---|---|---|---|---|---|
| **Claude Code** | CLI + extensões | Anthropic | Source-available | $20/mês | 108K+ stars |
| **Cursor** | IDE + CLI | Multi-modelo | Não | $20/mês | 1M+ DAU |
| **GitHub Copilot** | Plugin IDE + cloud | Multi-modelo | Parcial | $10/mês | 20M+ |
| **OpenCode** | CLI/TUI | 75+ provedores | Sim (MIT) | Grátis (usa sua API key) | 129K stars |
| **Codex CLI** | CLI | OpenAI | Sim (Apache 2.0) | $20/mês | 2M+ semanais |
| **Aider** | CLI | Qualquer LLM | Sim (Apache 2.0) | Grátis (usa sua API key) | 42.5K stars |

O que chama atenção: são máquinas de fabricantes diferentes, mas no fim fazem a mesma coisa. Edição multi-arquivo, execução no terminal, extensibilidade via MCP e loop iterativo. O que realmente diferencia cada uma é como o comportamento agêntico é implementado e orquestrado por baixo dos panos: o sistema de tools, a forma de gerenciar contexto, o loop de planejamento e autocorreção. Fora isso, pesam o modelo de entrega (CLI vs IDE vs nuvem), o ecossistema e o preço. E as alternativas open source provam que o paradigma agêntico não exige ferramenta cara. Só um LLM capaz.

Mas ferramentas são só metade da história. A outra metade é como **você** trabalha com elas.

---

## Programação Agêntica — a mudança de paradigma

No desenvolvimento tradicional, você é simultaneamente o cérebro e as mãos da operação. Pensa na solução, digita o código, roda os testes, lê os erros, corrige, repete. Sua produtividade tem um teto físico: velocidade de digitação, capacidade de memória, quantas horas consegue manter o foco.

Na programação agêntica, o papel muda. Você define o objetivo, fornece contexto, configura o ambiente. O agente executa. Você está no início (definição) e no fim (revisão). O ciclo do meio é autônomo.

![Antes vs Depois](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part1/assets/pt-br/part1-04-before-after-ee3b.png?raw=true)

Eu sei o que você pode estar pensando: "então a IA faz o trabalho e eu fico... fazendo o quê?"

A pergunta melhor talvez seja: fazendo o quê de *diferente*. Quando surgiu o compilador, ninguém mais precisou escrever Assembly na mão. Quem programava não ficou sem função. Subiu um nível de abstração. Passou a pensar em lógica de negócio em vez de registradores de memória. Ficou *mais* produtivo, *mais* estratégico, *mais* valioso.

A mesma coisa está acontecendo agora: você não está sendo substituído, está subindo de nível. Quem projeta a fábrica não é menos importante que quem opera, pelo contrário, mas as habilidades são outras.

E quais são essas habilidades?

### Os três pilares

Se o novo papel é orquestrar agentes, três habilidades se tornam essenciais. Eu chamo de **os três pilares da engenharia agêntica**, e cada um vai ganhar um artigo dedicado nesta série.

O primeiro é **prompt engineering**. É como você comunica intenção ao agente. Não só "escreva um bom prompt", mas comunicação estruturada: objetivos claros, restrições explícitas, exemplos do que você quer e do que não quer. Voltando à fábrica, são as instruções que você passa pro operador da máquina. Quanto mais precisas, melhor o resultado.

O segundo é **context engineering**. É a disciplina de curar o que o agente sabe. Quais arquivos são relevantes? Qual documentação deve estar acessível? Como estruturar as regras do projeto no arquivo `CLAUDE.md`? Contexto é o recurso mais precioso num sistema agêntico, e é limitado e caro. Pense na documentação que você entrega pra alguém novo na equipe: sem informação de qualidade, até a melhor máquina produz lixo.

O terceiro é **harness engineering**, a configuração de tudo que envolve e orquestra o agente: hooks de automação, MCP servers pra conectar serviços externos, permissões, ferramentas customizadas. Na fábrica, é a infraestrutura: as esteiras, os sensores, o sistema de segurança. A fábrica que mais produz não é a que tem a melhor mão de obra, é a que tem a melhor estrutura ao redor.

![Os três pilares](https://github.com/rsicarelli/claude-code-10x/blob/main/posts/101/part1/assets/pt-br/part1-05-three-pillars-1e08.png?raw=true)

### Os números — bons e ruins

Vale olhar pros dados com honestidade, porque o cenário tem contradições reais.

Por um lado, o crescimento é inegável: US$ 7,37 bilhões de receita em 2025, 84% dos devs adotando, o SWE-bench saltando de 1,96% pra mais de 80% em 18 meses. O GitHub Copilot gera 1,2 milhão de PRs por mês. Em chamadas de API de LLM pra código, o Claude lidera com 54% [[20]](#referências).

Por outro, os dados independentes são mais sóbrios. O estudo METR (um ensaio randomizado rigoroso com 16 devs experientes) encontrou que ferramentas de IA deixaram o time **19% mais lento**, embora a percepção fosse de estar 20% mais rápido [[21]](#referências). Código gerado por IA carrega **2,74× mais vulnerabilidades** segundo a Veracode [[22]](#referências). E o Gartner prevê que **40% dos projetos agênticos serão cancelados** antes de chegar a produção até 2027 [[23]](#referências).

A frase mais honesta que li sobre o assunto veio do relatório DORA 2025: *"A IA amplifica as forças de organizações de alto desempenho e as disfunções das que estão em dificuldade."* [[24]](#referências)

A fábrica automatizada produz mais, mas sem controle de qualidade, produz defeito mais rápido também. O resultado depende de quem configura e supervisiona. É exatamente isso que os três pilares endereçam.

---

## Considerações finais

Você agora sabe o que é programação agêntica, de onde veio e quais ferramentas existem. Sabe que o papel mudou: de quem escreve cada linha pra quem projeta, orienta e supervisiona. E sabe que três pilares (prompt engineering, context engineering e harness engineering) separam quem usa IA de qualquer jeito de quem usa com consistência.

Só que saber o *que* não é suficiente. Pra usar isso de verdade, você precisa entender o *como*. E o como começa por uma pergunta que pouca gente para pra fazer: como essa tecnologia funciona por dentro?

O que são tokens? O que é uma context window? Por que modelos erram com tanta convicção? Entender isso muda completamente a forma como você interage com qualquer ferramenta agêntica.

É exatamente o que vamos desmontar no próximo artigo: **Desmistificando os Modelos de Linguagem**.

---

> 🤖 Este artigo foi escrito com assistência do Claude (Anthropic).
>
> Conteúdo pesquisado, verificado e editado por um humano.
>
> Encontrou algum erro ou crédito faltando? Me manda uma mensagem!

---

## Referências

1. [Miller, G.A. — "The Magical Number Seven, Plus or Minus Two" (1956)](https://psycnet.apa.org/record/1957-02914-001)
2. [Mark, G. et al. — "The Cost of Interrupted Work: More Speed and Stress" (2008)](https://dl.acm.org/doi/10.1145/1357054.1357072) — ACM CHI 2008
3. [GitHub Copilot](https://github.com/features/copilot) — documentation
4. [ChatGPT](https://openai.com/blog/chatgpt) — OpenAI launch announcement (November 2022)
5. [Cursor / Anysphere — CNBC (November 2025)](https://www.cnbc.com/2025/11/13/cursor-ai-startup-funding-round-valuation.html) — $1B+ ARR, $29.3B valuation
6. [OpenAI Function Calling](https://openai.com/index/function-calling-and-other-api-updates/) — API update (June 2023)
7. [Andrew Ng — "Agentic Design Patterns" (2024)](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/) — The Batch newsletter; [Sequoia AI Ascent talk](https://www.youtube.com/watch?v=sal78ACtGTc)
8. [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) — Anthropic (November 2024)
9. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic (December 2024)
10. [SWE-bench](https://www.swebench.com/) — Princeton NLP (ICLR 2024)
11. [Tweag — "Introduction to Agentic Coding" (2025)](https://www.tweag.io/blog/2025-10-23-agentic-coding-intro/); [Agentic Coding Handbook](https://tweag.github.io/agentic-coding-handbook/)
12. [Mordor Intelligence — AI Code Tools Market Report (2025)](https://www.mordorintelligence.com/industry-reports/artificial-intelligence-code-tools-market) — US$ 7.37B market size
13. [Alphabet Q4 2025 Earnings Call (February 2026)](https://www.fool.com/earnings/call-transcripts/2026/02/04/alphabet-googl-q4-2025-earnings-call-transcript/) — CFO Anat Ashkenazi: "about 50% of our code is written by coding agents"
14. [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/)
15. [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Anthropic documentation
16. [GitHub Blog — "Copilot: Faster, smarter, and built for how you work now" (October 2025)](https://github.blog/ai-and-ml/github-copilot/copilot-faster-smarter-and-built-for-how-you-work-now/) — 20M+ users, 1.2M PRs/month
17. [Aider](https://github.com/paul-gauthier/aider) — GitHub repository
18. [OpenCode](https://github.com/nichochar/opencode) — GitHub repository
19. [OpenAI Codex CLI](https://github.com/openai/codex) — GitHub repository
20. [Menlo Ventures — "2025: The State of Generative AI in the Enterprise" (December 2025)](https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/) — Claude: 54% coding market share
21. [METR — "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (2025)](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/); [arXiv](https://arxiv.org/abs/2507.09089)
22. [Veracode — "GenAI and Code Security: What You Need to Know" (2025)](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
23. [Gartner — "Over 40% of Agentic AI Projects Will Be Canceled by End of 2027" (June 2025)](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)
24. [DORA State of DevOps Report 2025](https://dora.dev/) — Google
