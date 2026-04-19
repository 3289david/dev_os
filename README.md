<div align="center">

# ⚡ DevOS

### AI-Powered Full-Stack Development OS

[![npm version](https://img.shields.io/npm/v/devos-ai.svg?style=flat-square&color=6366f1)](https://www.npmjs.com/package/devos-ai)
[![license](https://img.shields.io/npm/l/devos-ai.svg?style=flat-square&color=22c55e)](LICENSE)
[![node](https://img.shields.io/node/v/devos-ai.svg?style=flat-square&color=eab308)](package.json)
[![node](https://img.shields.io/badge/Website-Github%20Pages-20B2AA?style=for-the-badge)](https://3289david.github.io/dev_os/)


**One command to plan, code, test, debug, and deploy entire applications.**

[Getting Started](docs/getting-started.html) · [Commands](docs/commands.html) · [Agents](docs/agents.html) · [Models](docs/models.html) · [Deployment](docs/deployment.html) · [API](docs/api.html)

</div>

---

## What is DevOS?

DevOS is an AI-powered CLI tool that acts as your full development team. Describe what you want to build in plain English, and DevOS will plan, code, test, debug, and deploy it — automatically.

```bash
npx devos-ai goal "Build a Twitter clone with auth and deploy to Vercel"
```

DevOS will:
1. 📋 **Plan** — Break down your goal into tasks
2. 💻 **Code** — Generate the entire codebase
3. ▶️ **Run** — Start the application
4. 🔧 **Debug** — Catch and fix errors automatically
5. 📝 **Review** — Check code quality
6. 🚀 **Deploy** — Ship to production

---

## Install

```bash
npm install -g devos-ai
```

## Quick Start

```bash
# Set up AI (pick one)
devos config set OPENAI_API_KEY=sk-your-key
# OR use free local models:
ollama pull llama3.3 && devos model add ollama

# Create a project
devos init "Express REST API with JWT auth and PostgreSQL"

# Run with auto-debugging
devos run

# Or go full autopilot
devos goal "Build and deploy a blog with React, markdown support, and Vercel"
```

---

## Features

| Feature | Description |
|---|---|
| 🎯 **Goal Mode** | Describe what you want → get a deployed app |
| 🔄 **Auto-Debug Loop** | Runs your app, catches errors, fixes them automatically |
| 🤖 **Multi-Agent System** | 7 specialized AI agents collaborate on tasks |
| 🧠 **Smart Router** | Auto-selects the best AI model per task |
| 🌐 **40+ AI Models** | OpenAI GPT-5.4, Claude 4.7, Gemini 3.1, Ollama, OpenRouter |
| 🖥️ **Terminal GUI** | Interactive dashboard — just run `devos` |
| 📁 **Workspace Folder** | Set where AI creates files with `devos config set workspace=/path` |
| 🚀 **One-Click Deploy** | Vercel, Railway, Fly.io, Docker |
| 🔍 **Code Search (RAG)** | Natural language search across your codebase |
| 🛡️ **Security Scanner** | Detects secrets, SQL injection, XSS, eval() |
| 💰 **Cost Tracking** | Real-time AI usage costs per provider |
| 📊 **Health Monitor** | Auto-healing deployment monitoring |
| 🔀 **Framework Migration** | AI-powered migration between frameworks |
| ⌨️ **Interactive Shell** | Natural language command interface |

---

## Multi-Agent Architecture

```
User Input → Orchestrator → Planner → Coder → Executor → Debugger → Reviewer → Deployer
                                        ↑______________Auto-Fix Loop______________↓
```

| Agent | Role |
|---|---|
| 🎯 **Orchestrator** | Coordinates all agents, routes tasks |
| 📋 **Planner** | Breaks goals into structured task plans |
| 💻 **Coder** | Generates, edits, and refactors code |
| 🔧 **Debugger** | Analyzes errors and auto-generates fixes |
| 📝 **Reviewer** | Code quality review and security checks |
| ▶️ **Executor** | Runs processes and tests |
| 🚀 **Deployer** | Handles multi-platform deployment |
| 📊 **Monitor** | Health checks with self-healing |

---

## Supported AI Models

### Cloud Providers

| Provider | Models | Setup |
|---|---|---|
| **OpenAI** | GPT-5.4 Pro, GPT-5 Turbo, o3, o4-mini | `devos config set OPENAI_API_KEY=sk-...` |
| **Anthropic** | Claude 4.7 Sonnet/Opus, Claude 4.6 Opus/Sonnet | `devos config set ANTHROPIC_API_KEY=sk-ant-...` |
| **Google** | Gemini 3.1 Pro/Flash, 2.5 Pro | `devos config set GOOGLE_API_KEY=AIza...` |
| **OpenRouter** | 40+ models via single API | `devos config set OPENROUTER_API_KEY=sk-or-...` |

### Local (Free)

| Provider | Models | Setup |
|---|---|---|
| **Ollama** | Llama 3.3, CodeLlama, DeepSeek, Mistral, Qwen | `ollama pull llama3.3 && devos model add ollama` |

### Smart Router

```bash
devos model auto  # Automatically picks the best model per task
```

- **Simple tasks** → cheap/fast model (GPT-4o-mini, Gemini 3.1 Flash)
- **Medium tasks** → balanced model (GPT-5.4 Pro, Claude 4.7 Sonnet)
- **Complex tasks** → premium model (Claude 4.7 Opus, Gemini 3.1 Pro)

Saves 60-80% on AI costs.

---

## CLI Commands

```bash
# Project
devos init [description]        # Create new project
devos run [script]              # Run with auto-fix
devos goal <description>        # Full autopilot
devos auto                      # Auto-debug loop

# Development
devos edit <file> <instruction> # AI-powered editing
devos test [file]               # Generate & run tests
devos refactor [glob]           # AI refactoring
devos explain [file|error]      # Explain code/errors
devos find <query>              # RAG-powered code search
devos watch                     # File watcher
devos shell                     # Interactive AI shell

# AI & Config
devos model list|use|auto|add   # Manage models
devos config set|list|reset     # Configuration
devos cost                      # AI usage costs

# Deployment
devos deploy [--target=platform]# Deploy anywhere
devos rollback [version]        # Rollback deployment
devos env set|list|sync         # Environment vars
devos monitor [url]             # Health monitoring
devos status                    # Project status
devos logs [service]            # View logs

# Tools
devos security                  # Security scan
devos migrate <target>          # Framework migration
```

---

## Deployment

```bash
# Auto-detect platform
devos deploy

# Or specify target
devos deploy --target=vercel
devos deploy --target=railway
devos deploy --target=fly
devos deploy --target=docker
```

DevOS auto-detects your project type:
- **Next.js / React** → Vercel
- **Express / API** → Railway
- **Full-stack** → Fly.io
- **Any project** → Docker

---

## Programmatic Usage

```javascript
import { Orchestrator, AIAdapter } from 'devos-ai';

const orchestrator = new Orchestrator();
await orchestrator.executeGoal('Build a REST API with Express');

// Or use individual agents
import { CoderAgent, DeployerAgent } from 'devos-ai';

const coder = new CoderAgent();
await coder.generateFile('server.js', 'Express server with CORS and rate limiting');
```

---

## Project Structure

```
devos-ai/
├── bin/devos.js              # CLI entry point
├── src/
│   ├── cli/
│   │   ├── index.js          # Command registration
│   │   └── commands/         # 22 CLI commands
│   ├── agents/
│   │   ├── orchestrator.js   # Agent coordinator
│   │   ├── planner.js        # Task planning
│   │   ├── coder.js          # Code generation
│   │   ├── debugger.js       # Error analysis
│   │   ├── reviewer.js       # Code review
│   │   ├── executor.js       # Process management
│   │   ├── deployer.js       # Deployment
│   │   └── monitor.js        # Health monitoring
│   ├── ai/
│   │   ├── adapter.js        # Unified AI interface
│   │   ├── router.js         # Smart model routing
│   │   └── providers/        # OpenAI, Anthropic, Google, Ollama, OpenRouter
│   ├── code/analyzer.js      # Static analysis
│   ├── context/
│   │   ├── rag.js            # Code search engine
│   │   └── memory.js         # Project memory
│   └── utils/                # Config, logger, security, cost, git
├── docs/                     # HTML documentation website
├── package.json
├── LICENSE
└── README.md
```

---

## Requirements

- **Node.js** ≥ 18.0.0
- **AI Provider**: At least one — OpenAI, Anthropic, Google, Ollama (free), or OpenRouter
- **Deployment** (optional): Vercel CLI, Railway CLI, Fly CLI, or Docker

---

## License

MIT © 2025 DevOS Team
