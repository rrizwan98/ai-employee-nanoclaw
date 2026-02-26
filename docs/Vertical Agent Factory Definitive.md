  
**THE VERTICAL AGENT FACTORY**

NanoClaw \+ Claude Agent SDK

**The Definitive Stack for Vertical AI Employees**

Body \+ Brain Architecture for Medicine, Accounting, Finance, Law, and HR

*Portable Vertical Intelligence via the Agent Skills Standard \+ MCP*

*Built by Claude Code: Agents Building Agents*

This research paper will be used to develop Pre-Built Domain-Specific AI Employees of type C₂. Complete details on slide 8 of this presentation: [https://docs.google.com/presentation/d/1YMMOvWjSvEWl9tuNiLShNjruyzjlJydBHUc8j\_y0gAI/edit?usp=sharing](https://docs.google.com/presentation/d/1YMMOvWjSvEWl9tuNiLShNjruyzjlJydBHUc8j_y0gAI/edit?usp=sharing)  

Grok Review [https://grok.com/share/bGVnYWN5\_1aa94043-23c3-4063-8f13-007c4cfe319a?rid=d4b05dcd-fd3d-496e-b834-43de2c725368](https://grok.com/share/bGVnYWN5_1aa94043-23c3-4063-8f13-007c4cfe319a?rid=d4b05dcd-fd3d-496e-b834-43de2c725368) 

Research Paper To Be Incorporated into Agent Factory Book  
[https://agentfactory.panaversity.org/](https://agentfactory.panaversity.org/)

**Zia Khan**

CEO, Panaversity  |  COO, PIAIC

February 2026

**1\. Executive Summary**

Every profession will have its own Vertical AI Employee. This paper provides the complete blueprint for building one.

The architecture is built on three pillars. The first pillar is the **Body \+ Brain** separation: **NanoClaw** provides the always-on persistence layer (the Body), while the **Claude Agent SDK** provides deep reasoning with Programmatic Tool Calling (the Brain). Each NanoClaw agent runs Claude Code directly inside an isolated container — the best available harness for autonomous agent execution.

The second pillar is **portable vertical intelligence** via two open standards that have achieved industry-wide adoption: **Agent Skills** (agentskills.io) for packaging domain expertise as reusable SKILL.md files, and **Model Context Protocol (MCP)** for exposing domain tools via standardized server interfaces. Both standards are supported by Claude Agent SDK, OpenAI Agents SDK (Codex), OpenClaw, NanoClaw, Cursor, GitHub Copilot, and a growing ecosystem of agent platforms. A vertical intelligence plugin built once works everywhere.

The third pillar is **agents building agents**: the entire NanoClaw \+ Claude Agent SDK stack can be built, extended, and customized using Claude Code itself. NanoClaw’s “skills over features” philosophy means new capabilities are contributed as Claude Code skills that transform your fork — not as PRs that bloat the codebase. This creates a recursive development loop where AI agents build and improve AI agents.

The OpenAI Agents SDK serves as the orchestration layer for multi-agent routing, handoffs, guardrails, and tracing. Together, these components form a six-layer reference architecture for production-grade Vertical AI Employees in medicine, accounting, finance, law, and HR.

# **2\. The Body \+ Brain Architecture**

## **2.1 The Body: NanoClaw**

Most AI products today have either a body or a brain, but not both. Claude Code has a brilliant brain but no persistent body — it activates when prompted and vanishes when the session ends. Chatbots have persistent bodies but shallow brains. A Vertical AI Employee requires both.

**NanoClaw** is a minimalist, security-hardened, open-source (MIT license) framework that provides the always-on Body. Created by Gavriel Cohen, it runs as a single Node.js process with approximately 500 lines of core TypeScript. **NanoClaw runs directly on the Claude Agent SDK** — each agent container executes Claude Code, which NanoClaw’s creator describes as “the best harness available” for AI agents.

The Body provides seven capabilities essential for a Digital Employee:

* **Container isolation:** Every agent task executes in its own OS-level container (Apple Containers on macOS, Docker on Linux). No shared memory between agents. This directly addresses the CVE-2026-25253 “Agent Hijacking” vulnerability that compromised OpenClaw’s shared-memory architecture.

* **Multi-channel presence:** WhatsApp integration via @whiskeysockets/baileys out of the box, with additional channels (Telegram, Slack, email) added via Claude Code skills.

* **Per-group memory:** Each conversation group gets isolated filesystem, dedicated CLAUDE.md memory context, and separate container sandbox.

* **Cron scheduling:** Built-in task scheduler supports cron, interval, and one-time scheduling. The Body initiates work proactively without human prompting.

* **Agent Swarms:** NanoClaw is the first personal AI assistant to support Agent Swarms — teams of specialized Claude instances that collaborate on complex tasks in parallel, each in its own isolated container.

* **MCP integration:** Native Model Context Protocol support via container/ipc-mcp.ts, providing standardized tool interfaces between host process and agent containers.

* **Full auditability:** The entire codebase can be reviewed in 8 minutes. Compare this to OpenClaw’s 430,000+ lines with 52+ modules and 45+ dependencies.

## **2.2 The Brain: Claude Agent SDK**

Inside each NanoClaw container, the **Claude Agent SDK** provides the reasoning engine. The SDK gives each agent a computer: full shell access, filesystem tools, browser control, web search, and context compaction for long-running tasks. But the critical differentiator for regulated verticals is **Programmatic Tool Calling**: the agent writes and executes local Python scripts to process sensitive data, rather than sending raw files to the LLM. Patient records, financial statements, and privileged legal communications never leave the container boundary. This is the gold standard for HIPAA, SOX, and zero-trust environments.

## **2.3 The Orchestrator: OpenAI Agents SDK**

For multi-agent workflows requiring routing between specialists, the OpenAI Agents SDK serves as the orchestration layer. Its MIT license, model-agnostic design (100+ LLMs), built-in Handoff mechanism, Guardrails, Session management, and tracing with 10+ integration targets (Logfire, AgentOps, Braintrust) make it the ideal coordination layer above the Brain. Claude handles deep reasoning; the orchestrator routes work to the right specialist.

# **3\. Portable Vertical Intelligence: Agent Skills \+ MCP**

The most consequential development in the AI agent ecosystem in late 2025 and early 2026 is the emergence of **two open standards** that together create truly portable vertical intelligence: **Agent Skills** and **Model Context Protocol (MCP)**. Both are supported across every major agent platform, meaning vertical intelligence plugins built for one platform work on all of them.

## **3.1 Agent Skills (agentskills.io)**

Agent Skills are folders of instructions, scripts, and resources that agents can discover and use to perform tasks more accurately and efficiently. Originally developed by Anthropic and released as an open standard in December 2025, the specification is governed by the open-source community at agentskills.io.

A skill is a directory containing a SKILL.md file with YAML frontmatter (name, description) and markdown instructions. When a user’s request matches a skill’s domain, the agent loads only the relevant instructions — a pattern Anthropic calls “progressive disclosure.” Skills can include scripts, reference files, configuration schemas, and install procedures alongside the core instructions.

**Adoption has been explosive.** Within two months of publication, Agent Skills gained support from Claude Code and Claude.ai, OpenAI’s Codex CLI and ChatGPT, Cursor, GitHub Copilot in VS Code, Google’s Gemini CLI, OpenClaw, NanoClaw, Goose (Block), Windsurf, Amp, Roo Code, Trae, and dozens more. ClawHub alone hosts over 3,000 community-built skills.

**What this means for vertical AI employees:** Domain expertise for medicine, accounting, finance, law, and HR can be packaged as portable Agent Skills that work across any skills-compatible agent platform. A HIPAA compliance skill, a financial ratio analysis skill, or a legal citation verification skill written once can be used by Claude Code, NanoClaw, OpenClaw, Codex, and any future agent product that adopts the standard. Build once, deploy everywhere.

## **3.2 Model Context Protocol (MCP)**

MCP provides the complementary standard for tool integration. While Agent Skills package procedural knowledge (instructions, workflows, domain expertise), MCP packages executable capabilities (API connectors, calculators, data processors). MCP servers are lightweight Python or TypeScript services that expose typed functions any agent can invoke.

Together, Skills and MCP form a complete vertical intelligence layer:

* **Agent Skills** teach the agent *how to think* about a domain: regulatory frameworks, professional standards, decision criteria, workflow patterns.

* **MCP servers** give the agent *tools to act* within a domain: API connectors, calculators, document generators, compliance validators.

## 

## 

## 

## **3.3 The Portability Matrix**

Both standards are supported by every major agent platform in the ecosystem:

| Platform | Agent Skills | MCP | Role in Stack |
| :---- | :---- | :---- | :---- |
| **Claude Agent SDK / Claude Code** | ✓ Native | ✓ Native | The Brain |
| **OpenAI Agents SDK / Codex** | ✓ Native | ✓ Native | The Orchestrator |
| **NanoClaw** | ✓ Native (.claude/skills/) | ✓ Native (ipc-mcp.ts) | The Body |
| **OpenClaw** | ✓ Native (SKILL.md) | ✓ Native | Reference gateway |
| **Cursor, Copilot, Gemini CLI, etc.** | ✓ Adopted | ✓ Adopted | Development tools |

This cross-platform compatibility is architecturally transformative. It means the vertical intelligence you build for your AI employee is not locked to any single vendor, SDK, or platform. If a better Body framework than NanoClaw emerges, your Skills and MCP servers port over unchanged. If a better Brain than Claude appears, the same vertical intelligence works with it. The investment in domain expertise is permanent; the infrastructure around it is replaceable.

# **4\. Building Vertical Intelligence: Skills \+ MCP for Each Profession**

For each regulated vertical, the vertical intelligence layer consists of domain-specific Agent Skills (procedural knowledge) paired with domain-specific MCP servers (executable tools). Both are independently deployable, testable, auditable, and portable.

## **4.1 The Skill Layer: Domain Expertise as SKILL.md Files**

Each vertical requires a constellation of Agent Skills that encode professional knowledge:

\# .claude/skills/hipaa-compliance/SKILL.md

\---

name: hipaa-compliance

description: \>

  Use when processing, analyzing, or generating

  content involving Protected Health Information

  (PHI). Ensures HIPAA Privacy Rule and Security

  Rule compliance in all agent actions.

\---

\#\# Rules

\- NEVER transmit PHI outside the container

\- Process all patient data locally via scripts

\- De-identify before any external API call

\- Log all PHI access for audit trail

\- Apply minimum necessary standard

Because this skill follows the Agent Skills standard, it works identically in NanoClaw, Claude Code, OpenClaw, Codex, Cursor, and every other compatible agent. A hospital building its HIPAA compliance skill gets that intelligence across its entire agent fleet — not just in one tool.

## **4.2 The Tool Layer: Domain Capabilities as MCP Servers**

Alongside the Skills, lightweight FastMCP servers provide executable domain tools:

\# filename: finance\_expert.py

from fastmcp import FastMCP

mcp \= FastMCP('FinanceExpert')

@mcp.tool()

def calculate\_liquidity\_ratios(

    current\_assets: float,

    current\_liabilities: float,

    inventory: float

) \-\> dict:

    '''Calculates Current and Quick Ratios'''

    current\_ratio \= current\_assets \\

                    / current\_liabilities

    quick\_ratio \= (current\_assets \- inventory) \\

                  / current\_liabilities

    return {

        'current\_ratio': round(current\_ratio, 2),

        'quick\_ratio': round(quick\_ratio, 2),

        'status': 'Healthy' if current\_ratio \>= 1.5

                  else 'Action Required'

    }

## **4.3 Domain-Specific Intelligence Map**

|  | Medicine | Accounting | Legal | HR |
| :---- | :---- | :---- | :---- | :---- |
| **Skills** | HIPAA compliance, clinical decision support, drug interaction protocols, discharge workflows | GAAP/IFRS rules, SOX audit procedures, tax code logic, financial statement analysis | Jurisdiction analysis, citation format, privilege review, contract drafting | EEOC compliance, bias detection, compensation benchmarks, onboarding workflows |
| **MCP Tools** | FHIR client, DICOM viewer, PubMed search, dosage calculator, formulary DB | QuickBooks/Xero API, Plaid bank feeds, SAP connector, depreciation calculator | LexisNexis, court filing API, damages calculator, document analyzer | Workday/BambooHR API, ATS connector, compensation survey, policy generator |
| **Compliance** | HIPAA, FDA regulations, clinical trial standards | SOX, GAAP/IFRS, SEC filing standards | Bar association rules, privilege protections, evidence standards | EEOC, GDPR/CCPA, labor law, ADA |

Every Skill and every MCP server in this table is portable across the entire agent ecosystem. This is the fundamental advantage of building on open standards: your investment in vertical intelligence survives any infrastructure change.

# **5\. Agents Building Agents: Claude Code as the Meta-Tool**

## **5.1 NanoClaw’s “Skills Over Features” Philosophy**

NanoClaw introduces a radical development paradigm that is native to the AI era: instead of adding features to the codebase, contributors add Claude Code skills that teach AI how to transform the codebase. New capabilities are contributed as SKILL.md files in .claude/skills/ that Claude Code executes to modify the installation.

For example, adding Telegram support to NanoClaw does not involve a pull request. Instead, a contributor creates a skill file at .claude/skills/add-telegram/SKILL.md that contains instructions for Claude Code on how to transform a NanoClaw installation to support Telegram. The user runs /add-telegram in Claude Code and gets clean, customized code that does exactly what they need — not a bloated system trying to support every use case.

**This is architecturally profound for vertical AI employees.** It means the entire process of building a medical AI employee, a financial AI employee, or a legal AI employee can be driven by Claude Code skills:

* **/add-hipaa-compliance** — Claude Code adds HIPAA-compliant data handling, audit logging, and container security configuration to your NanoClaw fork.

* **/add-fhir-integration** — Claude Code builds the HL7 FHIR MCP server, connects it to your EHR system, and configures NanoClaw to expose it to the Brain.

* **/add-financial-audit** — Claude Code creates the financial ratio MCP servers, adds scheduled weekly audit tasks to NanoClaw’s cron, and installs the GAAP compliance skill.

## **5.2 The Recursive Development Loop**

The setup process itself demonstrates the pattern. Installing NanoClaw requires exactly three steps:

git clone https://github.com/gavrielc/nanoclaw.git

cd nanoclaw

claude

Then you run /setup and Claude Code handles everything: dependencies, WhatsApp authentication, container setup, service configuration. No manual configuration files. No dashboard. Claude Code reads the codebase (which it can understand in 8 minutes), follows the setup skill instructions, and configures the system.

This creates a recursive loop: Claude Code (the agent) builds and configures NanoClaw (the Body), which in turn runs Claude Agent SDK (the Brain), which uses Claude Code skills (the intelligence) to extend its own capabilities. Agents building agents, all the way down.

## **5.3 Docker Sandbox Support**

For additional security, NanoClaw can run inside Docker Shell Sandboxes, adding another isolation layer. Docker’s sandbox provides a minimal microVM with filesystem isolation (NanoClaw can only see mounted workspace directories) and credential management via Docker’s proxy (API keys are never stored inside the sandbox). This nested isolation — NanoClaw in a sandbox, agents in containers within that sandbox — provides defense-in-depth for the most security-sensitive deployments.

# **6\. Security Architecture**

## **6.1 NanoClaw vs. OpenClaw**

| Feature | OpenClaw (Legacy) | NanoClaw (Secure Vault) |
| :---- | :---- | :---- |
| **Codebase** | 430,000+ lines, 52+ modules, 45+ dependencies | \~500 lines core, handful of files, minimal deps |
| **Security Model** | Application-level permissions (allowlists, pairing codes) | OS-level containers (Apple Container / Docker) |
| **Process Isolation** | Shared-memory (vulnerable to CVE-2026-25253) | Per-agent sandboxes with filesystem isolation |
| **Extension Model** | Feature PRs that bloat codebase (ClawHub: 12% malicious skills found) | Claude Code skills that transform your fork |
| **Auditability** | Effectively un-auditable at 430K+ lines | Full review in 8 minutes |

## **6.2 The Programmatic Tool Calling Pattern**

The data flow for a sensitive task demonstrates the security architecture in action:

1. **The Body (NanoClaw)** receives a task via WhatsApp: “Analyze Q3 receivables for overdue accounts.”

2. **NanoClaw spawns** an isolated container and invokes the Claude Agent SDK Brain. The container has access only to explicitly mounted financial data directories.

3. **The Brain generates** a Python script to parse the files, calculate aging buckets, and identify overdue accounts. The script runs locally inside the container.

4. **Only analysis results** (summary statistics, flagged accounts, recommendations) are sent to the LLM for synthesis. Raw financial data never leaves the container.

5. **The container is destroyed** after execution. No persistent access to sensitive data remains.

# **7\. The Six-Layer Reference Architecture**

| Layer | Name | Purpose | Technology |
| :---- | :---- | :---- | :---- |
| **6** | **Body** | Always-on presence, scheduling, message routing, Agent Swarms | **NanoClaw** |
| **5** | **Orchestration** | Multi-agent routing, handoffs, guardrails, tracing | **OpenAI Agents SDK** |
| **4** | **Brain** | Deep reasoning, local data processing, autonomous execution | **Claude Agent SDK** |
| **3** | **Intelligence** | Portable domain knowledge \+ executable tools | **Agent SkillsMCP servers** |
| **2** | **Data** | Persistent state, domain knowledge, vector search | PostgreSQL (compliance logs), Redis (sessions), Qdrant/Weaviate (vectors), S3/MinIO (docs), LlamaIndex RAG |
| **1** | **Security** | Container isolation, sandboxes, secrets, audit logging | NanoClaw containers (Apple Container / Docker), optional Docker Shell Sandbox, K8s \+ Dapr, HashiCorp Vault |

The critical addition is **Layer 3: Intelligence** — the portable vertical intelligence layer built on the Agent Skills \+ MCP open standards. This layer is unique in the architecture because it is the only layer that is fully platform-independent. Your Skills and MCP servers work identically in NanoClaw, OpenClaw, Claude Code standalone, Codex, Cursor, or any future agent platform. Every other layer can be upgraded or replaced without affecting the Intelligence layer, and the Intelligence layer can be reused without any of the layers around it.

# **8\. Scalability: From Personal Agent to Enterprise Fleet**

NanoClaw’s core is a single Node.js process with SQLite state. Scalability comes from deploying NanoClaw as a fleet, not from bloating the core.

### **Instance-Per-Tenant (Recommended for Regulated Verticals)**

Deploy one NanoClaw instance per tenant. Each gets full OS-level isolation — zero risk of cross-tenant data leakage. Deploy via Kubernetes with auto-scaling. This is the recommended approach for HIPAA, SOX, and attorney-client privilege environments.

### **Orchestrated Fleet via Kubernetes**

For medium-scale deployments, use Kubernetes to manage a fleet of NanoClaw pods. A routing proxy dispatches messages to the correct tenant pod. Externalize SQLite to PostgreSQL with row-level security. Auto-scale based on message volume.

### **Shared Brain, Isolated Bodies**

Each tenant gets an isolated NanoClaw Body. The Brain services (Claude Agent SDK, OpenAI Agents SDK, MCP servers) are deployed as shared stateless services. The Brain never stores tenant data. Only the Body maintains persistent tenant state. This dramatically reduces cost without compromising security.

**The fleet principle:** scale by deploying more instances, not by adding complexity. Every line added to NanoClaw’s core must justify itself against the auditability cost.

# **9\. The Final Technology Stack**

| Component | Recommendation |
| :---- | :---- |
| **The Body** | **NanoClaw** |
| **The Brain** | **Claude Agent SDK** |
| **The Orchestrator** | **OpenAI Agents SDK** |
| **Domain Knowledge** | **Agent Skills (agentskills.io)** |
| **Domain Tools** | **MCP Servers (FastMCP, Python)** |
| **LLM Strategy** | Multi-model: Claude Opus 4.6 (deep reasoning), GPT (structured output), domain fine-tuned models (specialized knowledge) |
| **Development Tool** | **Claude Code** |
| **Security** | NanoClaw OS-level containers \+ optional Docker Shell Sandbox \+ Programmatic Tool Calling (data never leaves perimeter) |
| **RAG / Vectors** | LlamaIndex with custom domain embeddings (Voyage AI or Cohere) \+ Qdrant (self-hosted) or Weaviate |
| **Databases** | PostgreSQL (structured data, audit trails, compliance logs), Redis (sessions, cache), S3/MinIO (documents) |
| **Infrastructure** | Kubernetes (AKS/EKS/GKE) \+ Dapr sidecar mesh \+ NanoClaw-managed containers \+ Docker Sandboxes |
| **Scaling Strategy** | Instance-per-tenant NanoClaw Bodies \+ shared stateless Brain services \+ Ray for compute-intensive tasks |
| **Observability** | OpenTelemetry \+ Prometheus \+ Grafana \+ OpenAI Agents SDK built-in tracing \+ LangSmith |

# **10\. Implementation Roadmap**

## **Phase 1: Foundation (Months 1–3)**

1. Clone NanoClaw and run /setup via Claude Code. Configure container isolation, connect primary channel.

2. Build 2–3 domain-specific Agent Skills (SKILL.md files) encoding your vertical’s core compliance rules and professional standards.

3. Build 2–3 FastMCP servers covering highest-value domain tools (calculators, API connectors, document generators).

4. Verify Claude Agent SDK Programmatic Tool Calling against your compliance requirements (HIPAA, SOX, etc.).

5. Create your domain-specific evaluation benchmark (equivalent of Harvey’s BigLaw Bench).

6. Launch with 2–3 design partners.

## **Phase 2: Intelligence (Months 4–6)**

1. Add OpenAI Agents SDK orchestration layer for multi-agent workflows with specialist sub-agents.

2. Expand to 10+ Skills and 5–10 MCP servers covering additional domain workflows.

3. Set up RAG pipeline (LlamaIndex \+ Qdrant) over domain corpus. Build persistent memory beyond NanoClaw’s SQLite.

4. Add second channel via Claude Code skill (e.g., /add-slack or /add-teams).

5. Build multi-model router: Claude for reasoning, GPT for structured output, domain fine-tuned models.

6. Implement compliance and auditability infrastructure.

## **Phase 3: Production (Months 7–12)**

1. Deploy instance-per-tenant NanoClaw fleet on Kubernetes.

2. Achieve compliance certifications (HIPAA, SOC 2, etc.).

3. Build proactive task library via NanoClaw cron: scheduled audits, monitoring alerts, periodic reports.

4. Activate Agent Swarms for complex multi-step professional workflows.

5. Publish your vertical Skills and MCP servers to the community (making them portable across all agent platforms).

## **Phase 4: Scale (Months 12–18)**

1. Externalize to shared Brain services with isolated Bodies.

2. Enterprise onboarding program.

3. Partner ecosystem for system integrations (EHR vendors, accounting software, HRIS platforms).

4. Ray deployment for compute-intensive parallel workloads.

# **11\. Conclusion**

The vertical AI employee market is in its earliest stages. Devin proved the model for coding ($2B+ valuation). Harvey proved it for law ($8B+, talks at $11B). Manus proved horizontal value ($2B Meta acquisition). Medicine, accounting, finance, HR, and dozens of other professions still lack their definitive AI employee.

The technology stack to build one is now clear:

* **NanoClaw as the Body** — always-on persistence, container isolation, Agent Swarms, running Claude Code directly as the best available agent harness.

* **Claude Agent SDK as the Brain** — Programmatic Tool Calling keeps sensitive data inside the security perimeter, non-negotiable for regulated verticals.

* **OpenAI Agents SDK as the Orchestrator** — model-agnostic multi-agent routing, MIT license, production-grade tracing.

* **Agent Skills \+ MCP as the portable intelligence layer** — the two open standards adopted across the entire industry. Build vertical expertise once, deploy everywhere.

* **Claude Code as the meta-tool** — agents building agents. Setup, extension, and vertical intelligence development all driven by AI, creating a recursive improvement loop.

* **Fleet scaling** — instance-per-tenant isolation. Security through simplicity. Scale by deploying more small instances, never by bloating the core.

*NanoClaw is the Body. Claude Agent SDK is the Brain. Agent Skills \+ MCP are the portable intelligence. Claude Code builds it all. **Time to build.***