# Git Rules

## Branches

- `main`: stable and runnable code only.
- `feature/<short-name>`: one focused feature or technical task.
- Avoid committing directly to `main` once implementation begins.

## Commits

Use short, action-oriented commit messages:

- `docs: add technical architecture notes`
- `feat: add lobby websocket events`
- `fix: validate locked patterns`
- `test: cover weighted pattern selection`

Each commit should represent one coherent change and should leave the project in a understandable state.

## Before Pushing

1. Check `git status`.
2. Review the diff with `git diff`.
3. Run the relevant tests or local checks.
4. Confirm that secrets, local databases, build output, and personal notes are not staged.
5. Push only the branch being worked on.

## Documentation

- `docs/technical.md` contains implementation architecture and technical decisions.
- `game.md` contains evolving private game-design notes and is intentionally ignored.
- Update technical documentation when an implementation decision changes.

## Pull Requests

When collaboration begins, merge feature branches into `main` through a pull request. The pull request should explain the behavior change, verification performed, and any known limitations.

