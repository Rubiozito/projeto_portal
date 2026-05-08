# Project Guidelines — projeto_portal

Backend API project built with **Node.js + TypeScript**.

## Tech Stack

- Runtime: Node.js
- Language: TypeScript (strict mode)
- Framework: Express
- Formatter: Prettier
- Build output: `dist/`, source in `src/`

## Code Style

- Use **single quotes**, **semicolons**, and **2-space indentation** (enforced by Prettier — see `.prettierrc`)
- Prefer `const` over `let`; never use `var`
- Use `async/await` over raw Promises or callbacks
- Always type function parameters and return values explicitly — avoid `any`
- Use `unknown` instead of `any` when the type is truly unknown
- Comments should explain _why_ something is done, not _what_ is being done (the code should be self-explanatory), document the code not the process

## Architecture

- All source code lives under `src/`
- Organize by feature/module (e.g., `src/users/`, `src/products/`), not by layer
- Each module should expose a single entry point (`index.ts`)
- Keep business logic in services, routing/controllers thin
- Avoid circular dependencies between modules

## Conventions

- File names: `kebab-case.ts` (e.g., `user-service.ts`, `auth-controller.ts`)
- Exported types and interfaces: `PascalCase`, prefixed with `I` for interfaces (e.g., `IUser`)
- Environment variables: access only through a typed config module, never use `process.env` directly in business logic
- Errors: use custom error classes that extend `Error`; never throw raw strings
- Prefer named exports over default exports

## Build and Test

```bash
npm run build       # compiles TypeScript to dist/
npm run dev         # runs with ts-node (development)
npm run format      # formats all src files with Prettier
npm run format:check  # CI check for formatting
```

## Security

- Validate all external input at the boundary (HTTP request, CLI args, env vars)
- Never log sensitive data (passwords, tokens, PII)
- Keep secrets in environment variables — never commit them
