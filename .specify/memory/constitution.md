# Static Web App Constitution
<!-- Minimal requirements for a static web application (no dedicated backend required). -->

## Core Principles

### I. Static-First Architecture
- The app must be deployable as static files (HTML/CSS/JS + assets).
- Prefer build-time generation over runtime server logic.
- Any external services (APIs) must be optional and degrade gracefully.

### II. Simple Tooling
- Use standard, well-supported tooling (Node-based build system is acceptable).
- Keep configuration minimal; avoid custom build steps unless required.
- Prefer widely adopted libraries over bespoke utilities.

### III. Quality Gates
- Every change must build successfully in CI.
- Linting and formatting must be enforced (auto-fix where possible).
- Tests are required for non-trivial logic (e.g., utilities, data transforms).

### IV. Accessibility & UX Baseline
- Aim for WCAG 2.1 AA for new UI.
- Keyboard navigation must work for all interactive elements.
- Provide meaningful page titles, labels, and accessible names.

### V. Security & Privacy by Default
- Do not store secrets in the client.
- Do not log sensitive user data.
- Use HTTPS-only endpoints; avoid mixed content.
- Prefer least-privilege for any API keys; rotate if exposed.

## Additional Constraints

- Deployment must produce a deterministic `dist/` (or equivalent) artifact.
- Supported browsers: latest 2 versions of major evergreen browsers (Chrome, Edge, Firefox, Safari).
- Performance baseline:
	- Avoid unnecessary JS; code-split if the framework supports it.
	- Optimize images (responsive formats preferred).
	- No blocking network calls during initial render unless essential.
- Security baseline:
	- Use a Content Security Policy (CSP) if hosting supports it.
	- Dependencies must be kept reasonably up to date; address high severity advisories.
- Accessibility baseline: new pages/components should meet the Core Principles above.

## Development Workflow

- Branching: feature branches merged via PR.
- PR requirements:
	- Clear description and screenshots for UI changes.
	- Passing CI (build + lint + tests).
	- No unused code or dead flags.
- Release process:
	- Main branch must always be deployable.
	- Tag releases when shipping user-visible changes.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

- This constitution is the default standard for the repository.
- Any exception must be documented in the PR description with rationale.
- Amendments require:
	- Updated text in this document.
	- A short migration note if the change affects existing code.
	- Agreement from at least one maintainer/reviewer.

**Version**: 1.0.0 | **Ratified**: 2025-12-31 | **Last Amended**: 2025-12-31
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
