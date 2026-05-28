# DeepSeek / OpenCode Context Pack — ParisLocalStack

This ZIP contains project context files to paste into the ParisLocalStack repository before using DeepSeek 4 Pro with OpenCode.

## Where to copy

Copy the `.opencode` folder into the root of the repo:

```txt
ParisLocalStack/
  .opencode/
    context/
      project/
        project-goals.md
        architecture.md
        coding-standards.md
        tech-stack.md
        current-state.md
```

## Recommended workflow

1. Create a branch before allowing OpenCode to edit files.
2. Give OpenCode only one narrow ticket at a time.
3. Run builds/typechecks after each ticket.
4. Do not deploy until the diff is reviewed.
5. Prioritize security hardening before new features.

## First recommended ticket

Use `prompts/01-production-hardening.md` first.
