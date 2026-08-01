# OMC Agent Plan

This document maps OMC's available agent roles to the K-Parent Skill planning and implementation workflow.

## Verified Local OMC Context

Observed on 2026-05-01:

- `omc --help` is available.
- `omc info` reports Oh-My-ClaudeCode 3.7.15.
- `omc config` lists multiple specialized agents and routing rules.
- `omc test-prompt` is available for prompt enhancement checks.
- Installed global package path reports `oh-my-codex@0.15.1`.

Important limitation:

- The checked CLI help did not expose a direct `omc run agent` style command. Do not claim automated OMC subagent execution unless a future command or integration is verified. For now, use OMC as the planning convention, role map, and prompt-quality checkpoint.

## Agent Responsibilities

| OMC role | K-Parent responsibility | Expected output |
| --- | --- | --- |
| `analyst` | Turn raw research into product implications, risks, and source priority | issue brief, risk table, decision log |
| `planner` | Convert implications into milestones and sequencing | PRD, roadmap, milestone checklist |
| `architect` | Define repo structure, packages, adapters, schemas, cache, and guardrails | architecture notes, scaffolding plan, data flow |
| `researcher` | Verify official API docs, quotas, licenses, and source freshness | source inventory, citation notes |
| `writer` | Produce clear docs for user briefing and contributor onboarding | README updates, planning docs, briefing copy |
| `critic` | Challenge unsafe automation, overbroad scraping, and weak product scope | review findings, non-goals, risk cuts |
| `designer` | Shape mobile and briefing surfaces | mobile flow notes, visual review, HTML briefing improvements |
| `executor` | Implement a bounded package or doc change after plan approval | commits, tests, validation evidence |

## Planning Workflow

### Step 1: Research Intake

Owner:

- `analyst`
- `researcher`

Inputs:

- `docs/research/*.md`
- `docs/sources.md`
- official API documents
- current repository structure

Outputs:

- confirmed source priority
- source uncertainty list
- product risks
- legal and privacy constraints

### Step 2: Product Planning

Owner:

- `planner`
- `writer`

Inputs:

- research intake
- user product requirements
- existing skill map

Outputs:

- `docs/planning/prd.md`
- MVP/non-goals
- success metrics
- release criteria

### Step 3: Architecture Planning

Owner:

- `architect`
- `critic`

Inputs:

- PRD
- `docs/specs/data-contracts.md`
- `docs/specs/project-structure.md`
- upstream `k-skill` conventions

Outputs:

- `docs/planning/scaffolding-plan.md`
- adapter sequence
- safety boundaries
- package ownership lanes

### Step 4: Feature Planning

Owner:

- `planner`
- `architect`
- `critic`

Inputs:

- PRD
- source priority
- skill concept docs

Outputs:

- `docs/planning/feature-plans.md`
- feature-by-feature inputs, sources, outputs, risks, phase

### Step 5: Review and Briefing

Owner:

- `writer`
- `designer`
- `critic`

Inputs:

- PRD
- scaffolding plan
- feature plans
- `docs/briefing.html`

Outputs:

- concise briefing
- updated document map
- open questions for implementation

## Implementation Handoff Pattern

When code work starts, each implementation ticket should include:

- owning feature
- owning package or skill directory
- source contract
- fixture requirement
- guardrail requirement
- validation command
- expected documentation update

Recommended current follow-up handoff:

```text
Feature: Today Brief source coverage follow-up
Owner role: executor
Support roles: architect, critic
Write scope:
- packages/k-parent-brief/
- packages/k-parent-source-neis/
- packages/k-parent-source-childinfo/
- packages/k-parent-source-tourapi/
- packages/k-parent-source-neis/test/fixtures/
- docs/features/k-parent-meal-planner.md
- docs/features/k-parent-school-info.md
Validation:
- package unit tests for changed workspaces
- skill docs test
- npm run ci
Guardrails:
- no stored child sensitive data
- source freshness visible
- ambiguous school match requires confirmation
```

## OMC Prompt Template

Use this when asking OMC or another agent to plan a bounded slice:

```text
You are working in /Users/sdh/10_Dev/k-parent-skills.
Preserve the parent-only repository boundary: product skills under `skills/*`, generic skills left in upstream `k-skill`, SKILL.md progressive disclosure, docs/features, explicit HITL, and layer-aware packages/tools.
Use docs/research, docs/specs, and docs/planning as source of truth.
Plan only for [FEATURE].
Return:
1. scope
2. non-goals
3. source contracts
4. package/file scaffold
5. fixtures/tests
6. safety risks
7. validation commands
Do not create code unless explicitly asked.
```

## Review Checklist

- Does the plan preserve flat skill install paths?
- Does it start from official data?
- Does it avoid automatic sensitive actions?
- Does it make source freshness visible?
- Does it keep child data minimal?
- Does it avoid ranking sensitive institutions?
- Does it separate affiliate links from core logic?
- Does it include fixture and CI expectations?
