# AGENTS.md
## Non-negotiables

- **Always pick the simplest approach that solves the problem.** This applies to every feature, bug fix, and refactor — no exceptions. The bar is "does it solve what was asked, clearly?" — not "is it elegant / future-proof / clever."
  - **No overengineering.** If a problem is solved in 30 lines of straightforward code, do not turn it into 150 lines with layers, generics, or "extensibility hooks." Three similar `if` branches beat a premature strategy pattern. A `useState` beats a Zustand store for screen-local state.
  - **No abstractions unless explicitly requested or unavoidable.** Do not introduce a new hook, helper, wrapper, HOC, provider, factory, or shared component just because the same code appears in two places. Inline duplication is acceptable; wait for the third occurrence. When in doubt, ask before abstracting.
  - **No speculative features.** Do not add props, config flags, options objects, or "for later" branches that the current task does not need. Build for what's asked; extend when extension is asked.
  - **When fixing a critical bug, fix only the bug.** Do not bundle a refactor, a rename, or a "while I'm here" cleanup into the fix. Surface the cleanup as a separate suggestion; do not silently expand the diff.
  - **If you find yourself reaching for a pattern, stop and justify it in one sentence.** If the sentence is "it might be useful later" or "it feels cleaner," delete the pattern and write the obvious code instead.
  - **If anything is unclear, stop and ask — do not assume.** Silent assumptions are the single biggest source of wasted diffs in this codebase. Before writing code, you must have a clear answer to: *what is being built, where it lives, what it should look like, and how it should behave on the edges.* If any of those is fuzzy, ask a specific question first. Examples that require a question, not a guess: ambiguous requirements ("add a filter" — filter by what, where shown, persisted where?), unclear UX (which screen, which interaction, which empty state), missing data shape (what does the API return, what's optional), conflicting signals between the request and the existing code, or a request that could be solved two materially different ways. Listing 2–3 interpretations and asking "which one?" is always better than picking one silently and rewriting later.
  - **For any infrastructure-level / critical-path change, you MUST ask before acting — never assume.** This is non-negotiable, even if the instruction looks clear.
- **Fix every ESLint issue. Never silence one with an inline disable** (`// eslint-disable-next-line`, `/* eslint-disable */`, file-level disables, or per-rule disables in `eslint.config.mjs`). If a rule fires, the code is wrong — change the code, not the rule. If you genuinely believe a rule is misconfigured for this project, surface it and discuss before changing config; do not paper over the warning at the call site.

- **Always use proper TypeScript types. Never use `any`, and never silence the type-checker with `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, or non-null assertions (`!`) used to dodge a real type error.** If you don't know the shape, find it — read the source, infer from usage, or ask. If a third-party type is wrong or missing, write a precise type (an `interface`, `type`, or `unknown` + narrowing) instead of escaping the type system. `unknown` + a type guard is acceptable at real boundaries (network responses, `JSON.parse`, third-party SDKs returning untyped data); `any` is not. Generics, `as` casts, and type predicates are tools — use them to express the true shape, not to make red squiggles go away. If you genuinely cannot type something without an escape hatch, stop and surface the problem; do not commit the escape hatch.

- **Never explore, search, read, or glob inside `node_modules/` or `dist/` (or any other build/output directory).** These are generated or third-party artifacts and pollute results with noise. When searching the codebase, always restrict scope to `src/` (and other first-party source directories). If you genuinely need to inspect a third-party type, read the package's `.d.ts` via a precise path you already know — do not glob `node_modules/**`.






