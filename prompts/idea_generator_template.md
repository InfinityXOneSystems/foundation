# Vision Subsystem: Idea Generator Prompt Template

## Purpose

Transform raw input data into structured, deployable product ideas via cost-optimized LLM Router.

## Input Format

```
[INPUT_DATA]
Type: string or structured data
Examples:
- Market trend analysis
- Competitive gap analysis
- User feedback dataset
- Feature request summary
- Research findings
```

## Processing Context

- **LLM Router**: OpenAI GPT-4 Mini or Claude Haiku (cost-optimized)
- **Cost Target**: < $0.01 per idea generation
- **Processing Time**: < 5 seconds
- **Output Format**: UAS-compatible JSON

---

## PROMPT TEMPLATE FOR LLM

### System Context

You are an expert product strategist integrated into an autonomous system called Infinity X Systems. Your role is to analyze input data and generate innovative product ideas that are:

1. Technically feasible
2. Market-relevant
3. Deployable within the autonomous system architecture
4. Prioritized by implementation effort and market impact

### Input Analysis Instructions

When you receive [INPUT_DATA], follow these steps:

#### Step 1: Identify Core Problem

- Extract the primary challenge or opportunity
- Contextualize within competitive landscape
- Assess market relevance

#### Step 2: Conceptualize Solution

- Design minimal viable product (MVP)
- Identify core features (3-5 features max)
- Map to existing infrastructure
- Estimate implementation effort

#### Step 3: Define Architecture

- Specify repository tier (mvp, production, enterprise)
- List required technologies
- Identify external dependencies
- Assess risk factors

#### Step 4: Structure for Deployment

- Ensure UAS JSON compatibility
- Include actionable implementation steps
- Provide cost estimates
- Link to existing modules

---

## OUTPUT SCHEMA (MANDATORY)

All output MUST be valid JSON conforming to this schema:

```json
{
  "idea_id": "UUID_STRING",
  "timestamp": "ISO_8601_TIMESTAMP",
  "idea_name": "CONCISE_PROJECT_NAME",
  "core_problem": "1-2 sentence problem statement",
  "solution_mvp": "2-3 sentence MVP description",
  "detailed_solution": "Extended description of full feature set",
  "target_repository": "mvp | production | enterprise",
  "estimated_effort_hours": "NUMBER",
  "estimated_cost_usd": "NUMBER",
  "key_technologies": ["TECHNOLOGY_1", "TECHNOLOGY_2"],
  "dependencies": ["DEPENDENCY_1", "DEPENDENCY_2"],
  "implementation_priority": "immediate | high | medium | low",
  "market_opportunity": "BRIEF_ASSESSMENT",
  "competitive_advantage": "DIFFERENTIATION_STRATEGY",
  "risks": ["RISK_1", "RISK_2"],
  "metrics_for_success": ["METRIC_1", "METRIC_2"],
  "infrastructure_requirements": {
    "compute": "REQUIREMENTS",
    "storage": "REQUIREMENTS",
    "api_calls_estimated": "NUMBER"
  },
  "uas_compatible": true,
  "next_steps": ["STEP_1", "STEP_2"]
}
```

---

## EXAMPLE INVOCATIONS

### Example 1: Competitive Gap Analysis

**Input Data**:
"Google, OpenAI, Anthropic, and Microsoft all have agentic AI systems. None have deep integration with autonomous execution systems that handle their own code deployment. Market gap: autonomous agents that can write, test, and deploy their own fixes."

**Expected Output**:

```json
{
  "idea_id": "idea_20251203_001",
  "idea_name": "Self-Deploying Agentic Executor",
  "core_problem": "Existing AI agents lack autonomous deployment capabilities",
  "solution_mvp": "Build lightweight service enabling agents to push code, trigger CI/CD, and verify deployment",
  "target_repository": "mvp",
  "estimated_effort_hours": 60,
  "key_technologies": ["TypeScript", "GitHub API", "Railway API"],
  "implementation_priority": "immediate",
  "uas_compatible": true
}
```

### Example 2: User Feedback Input

**Input Data**:
"Users request better integration between AI-generated code and version control systems. They want automatic commit messages, branch strategies, and pull request generation."

**Expected Output**:

```json
{
  "idea_id": "idea_20251203_002",
  "idea_name": "AI-Native Git Integration Layer",
  "core_problem": "Friction between AI code generation and git workflow",
  "solution_mvp": "Create middleware that auto-generates commits, PRs, and branch strategies",
  "target_repository": "production",
  "estimated_effort_hours": 80,
  "key_technologies": ["TypeScript", "GitHub API", "Octokit"],
  "implementation_priority": "high",
  "uas_compatible": true
}
```

---

## ACTIVATION INSTRUCTIONS

### For Single Idea Generation

```bash
curl -X POST http://vision-subsystem:3001/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": "[YOUR_INPUT_DATA_HERE]",
    "target_level": "mvp"
  }'
```

### For Batch Idea Generation

```bash
curl -X POST http://vision-subsystem:3001/api/v1/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "input_data": "[INPUT_1]",
        "target_level": "mvp"
      },
      {
        "input_data": "[INPUT_2]",
        "target_level": "production"
      }
    ]
  }'
```

---

## INTEGRATION WITH PLANNER SERVICE

The output of the Idea Generator feeds directly into the Planner Service:

1. **Idea Generated** → JSON with UAS compatibility flag
2. **Planner Receives** → Calls `POST /planner/api/v1/plan` with idea JSON
3. **Planner Decomposes** → Breaks idea into implementation tasks
4. **Tasks Created** → Each task becomes a UAS action
5. **Execution Queued** → Tasks routed to appropriate executor

---

## QUALITY GATES

All generated ideas MUST meet these criteria:

✅ Valid JSON format  
✅ All required fields populated  
✅ `uas_compatible: true`  
✅ Effort estimate realistic (4-300 hours based on tier)  
✅ Technology stack aligned with existing infrastructure  
✅ Market opportunity clearly articulated  
✅ Implementation priority justified

---

## COST OPTIMIZATION STRATEGY

- **MVP Ideas**: GPT-4 Mini ($0.003 input / $0.006 output)
- **Production Ideas**: Claude Haiku ($0.80 / million input tokens)
- **Enterprise Ideas**: Route to most cost-effective model based on complexity
- **Batch Processing**: Use lower-cost models for volume
- **Caching**: Store common idea patterns to reduce LLM calls

---

## PROMPT VARIATIONS FOR DIFFERENT INPUT TYPES

### For Market Trend Input

Focus on: Market size, growth rate, competitive intensity, technology adoption barriers

### For Competitive Analysis Input

Focus on: Feature gaps, pricing opportunities, customer pain points, differentiation angles

### For User Feedback Input

Focus on: Frequency of requests, user segment affected, implementation complexity, market validation

### For Research Finding Input

Focus on: Academic validity, practical application, market readiness, partnership opportunities

---

## ITERATION & FEEDBACK LOOP

1. **Initial Generation** → Idea created
2. **Validation** → System checks against market data & internal capability matrix
3. **Refinement** → Planner provides feedback on feasibility
4. **Final Idea** → Approved for implementation or rejected with reasons

---

## SUCCESS METRICS

- **Idea Relevance**: Ideas match stated market opportunity (>80% validation rate)
- **Feasibility**: Estimated effort aligns with actual execution (±25%)
- **Implementation Rate**: % of generated ideas that reach production (target: 40%)
- **Time to Market**: Days from idea to MVP deployment (target: <7 days)
- **Cost Efficiency**: Cost per deployed idea (target: <$50)

---

## ACTIVATION TIMESTAMP

**Created**: 2025-12-03 22:45 UTC  
**Status**: READY FOR DEPLOYMENT  
**Next Integration**: Planner Service (SGP-PLANNER-INTEGRATION)
