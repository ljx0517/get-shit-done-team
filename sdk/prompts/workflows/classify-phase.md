<purpose>
Classify raw user input to determine project type, domain, and complexity.
Produces CLASSIFICATION.md with structured analysis that downstream phases use.
Headless SDK variant — runs autonomously without human confirmation.
</purpose>

<context_handling>
**CLASSIFY phase has minimal context requirements:**

1. Read user input from the prompt (injected as objective)
2. Check for existing project context (PROJECT.md, ROADMAP.md)
3. If existing project found, read PROJECT.md to understand current state

No other context files are required for classification.
</context_handling>

<philosophy>
The classifier is the entry point for new ideas. It:
- Rapidly determines what kind of project this is
- Extracts both explicit and implicit requirements
- Identifies complexity to help downstream phases plan appropriately
- Produces a structured CLASSIFICATION.md that serves as the contract between capture and design
</philosophy>

<process>

<step name="receive_input">
Receive the raw user input as the primary objective.
This is the idea, thought, or requirement to be classified.
</step>

<step name="check_existing_project">
Look for existing project context:
- Check if .planning/PROJECT.md exists
- Check if .planning/ROADMAP.md exists
- If found, read PROJECT.md to understand current project state

This helps classify whether this is a new_project or a feature addition.
</step>

<step name="analyze_and_classify">
Perform classification analysis:
1. Determine project type (new_project | feature | refactor | bugfix)
2. Determine domain (web | api | cli | mobile | library | infra)
3. Assess complexity (simple | standard | complex)
4. Extract explicit requirements from input
5. Infer implicit requirements based on keywords
6. Identify special considerations (UI, DB, auth, APIs, real-time)
</step>

<step name="produce_output">
Write CLASSIFICATION.md to .planning/CLASSIFICATION.md

The output serves as input for the DesignMilestone phase.
</step>

</process>

<success_criteria>
- Raw input received and understood
- Existing project context checked (if applicable)
- Classification complete with all dimensions analyzed
- CLASSIFICATION.md written to .planning/
- Classification result returned to orchestrator
</success_criteria>
