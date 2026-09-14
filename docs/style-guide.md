# Capstone Engineering Style Guide

## Purpose

This guide defines engineering conventions for capstone projects.

The goal is not arbitrary formatting or process. The goal is to make projects easier to build, review, deploy, debug, operate, secure, and maintain.

These conventions apply to both individual production-platform projects and team capstone projects unless a framework, language, deployment platform, or project architecture provides a good reason to use a different convention.

---

## Core Principle

Prefer conventions that work well in terminals, Git repositories, GitHub Actions, Dockerfiles, scripts, URLs, cloud deployments, logs, documentation, and code review.

Small organizational choices become more important once software is deployed, automated, shared, and maintained by other people.

Consistency should reduce friction, not create unnecessary rules.

### Use Production Practices Proportionally

Production practices should create real engineering value rather than become ceremony.

Introduce a convention, document, check, or operational process when it materially improves one or more of the following:

- deployability
- observability
- reversibility or recovery
- security and privacy
- reliability
- explainability and maintainability

Do not create documents, infrastructure, PR sections, or process steps merely because they might become useful later.

Documentation and engineering controls should describe the system that actually exists. As the system becomes more capable, the corresponding production practices should become stronger.

---

## Development Environment

For this capstone, active project repositories should live in the WSL/Linux filesystem rather than under the Windows-mounted filesystem.

Preferred location:

```text
/home/your-username/capstone/project-name
```

Avoid using the Windows filesystem as the active development location:

```text
/mnt/c/Users/your-username/...
```

Git, npm, Gradle, Docker, scripts, and other development or deployment commands should normally run from Linux.

Windows applications may still be used when they integrate cleanly with WSL. For example, VS Code may run as a Windows application while opening and operating on a repository stored in the WSL/Linux filesystem.

The goal is not to avoid Windows. The goal is to reduce unnecessary differences between local development, CI/CD, containers, cloud runtime environments, and production debugging workflows.

---

## Naming Conventions

Use clear, descriptive names that explain purpose.

### General Files and Directories

For general files, scripts, documentation, and generic directories, use:

```text
lowercase-kebab-case
```

Examples:

```text
deployment-runbook.md
incident-log.md
api-contract.md
security-notes.md
production-deploy-checklist.md
user-profile-service/
project-gallery/
admin-dashboard/
```

Avoid spaces, vague names, and temporary-status names such as:

```text
Deployment Runbook.md
final version 2.md
NewFolder/
stuff.md
updated notes.md
final-final.md
```

Spaces are supported by modern operating systems, but they create avoidable friction in terminals, scripts, Dockerfiles, CI/CD workflows, URLs, Markdown links, and cloud configuration.

For example:

```bash
cat deployment-runbook.md
```

is simpler than:

```bash
cat "Deployment Runbook.md"
```

If a snapshot is genuinely needed, include an ISO-style date:

```text
incident-log-2026-09-15.md
```

Do not use confusing version names such as:

```text
architecture-final.md
architecture-final2.md
architecture-real-final.md
```

Use Git history, pull requests, commits, changelogs, or dated snapshots to track changes over time.

### React Frontend

Follow standard React and TypeScript conventions.

Use `PascalCase` for React component files:

```text
UserProfile.tsx
ProjectCard.tsx
AdminDashboard.tsx
```

Use `camelCase` for hooks, utility files, state helpers, and API clients:

```text
useAuth.ts
useProjects.ts
apiClient.ts
formatDate.ts
```

Component folders may use `PascalCase` when they directly represent a component. Follow the established project convention consistently.

### Java / Javalin Backend

Use `PascalCase` for Java classes, interfaces, records, and enums:

```text
ProjectController.java
AuthMiddleware.java
UserRepository.java
ProjectResponse.java
```

Use lowercase dot-separated package names:

```text
com.capstone.project.controller
com.capstone.project.repository
com.capstone.project.service
```

Do not use kebab-case, underscores, or uppercase letters in Java package names.

### PostgreSQL

When using PostgreSQL, use lowercase `snake_case` for unquoted database identifiers.

Examples:

```text
users
project_cards
user_roles
created_at
password_hash
```

Use plural nouns for tables when that convention fits the domain:

```text
users
projects
deployments
```

Use descriptive nouns for columns:

```text
id
created_at
display_name
deployment_status
```

Avoid quoted mixed-case identifiers because they require repeated quoting and create unnecessary friction.

---

## Documentation Format

Use Markdown for living project documentation unless another format is specifically required.

Documents that may become useful as the project matures include:

```text
README.md
requirements/
docs/style-guide.md
docs/architecture.md
docs/api-contract.md
docs/deployment-runbook.md
docs/engineering-notebook.md
docs/incident-log.md
docs/security-notes.md
docs/accessibility-notes.md
```

Do not create every document immediately just to fill the repository.

Create a document when it has a clear purpose and enough real project information to remain accurate and useful.

Markdown is preferred because it works well in GitHub, code review, diffs, pull requests, and project repositories.

---

## Source-of-Truth Rule

Important project information must have a clear source of truth.

If information is used for requirements, deployment, operations, security, architecture, team coordination, incident response, or production recovery, it should live in the project repository or another clearly identified shared location.

Do not rely on random local files, screenshots, private notes, chat messages, text messages, or verbal agreements as the only copy of important project information.

If a teammate or future maintainer asks, “Where is the current version?” there should be one obvious answer.

Do not create competing sources of truth. If requirements or operational information are maintained in another system such as Jira, the repository should link to or clearly identify that system rather than silently maintaining a conflicting copy.

---

## Requirements

When requirement documents are maintained in the repository, store them under:

```text
requirements/
```

Requirement documents should describe required capabilities, constraints, or acceptance evidence rather than repeat lecture notes or implementation tutorials.

Markdown task lists may be used to track completion when they provide useful traceability between requirements and the pull requests that satisfy them.

Example:

```markdown
- [x] Add repository `.gitignore`
- [x] Verify generated and local-only files are excluded
- [ ] Merge the pull request
```

The requirements record should remain useful as project history. Do not turn it into busywork or maintain duplicate status information that is already better represented elsewhere.

---

## Repository Organization

Project repositories should be organized so that a new developer can quickly find the major parts of the system.

The default structure for full-stack capstone projects is a monorepo so coordinated frontend, backend, documentation, and infrastructure changes can be traced through one commit and pull-request history.

A project may begin with a structure such as:

```text
project-name/
  README.md
  requirements/
  backend/
  frontend/
  docs/
    style-guide.md
```

Additional files and directories should be added when they serve a real need. Examples may eventually include:

```text
scripts/
docs/architecture.md
docs/api-contract.md
docs/deployment-runbook.md
docs/incident-log.md
docker-compose.yml
```

The exact structure may vary by project.

Separate top-level directories should preserve clear boundaries between major parts of the system while keeping related full-stack changes in one repository.

Do not add empty folders or placeholder files unless they serve a real purpose. Temporary `.gitkeep` files are acceptable when intentionally establishing repository structure before application code exists; remove them when the directory contains real files.

A monorepo simplifies coordinated changes, but CI/CD may eventually need to avoid rebuilding or redeploying components that did not change.

---

## README Expectations

Every project repository must have a `README.md`.

The README should describe the project as it exists now, not an imagined future state.

Early in the project, the README should include enough information to orient a new developer or reviewer, such as:

- project purpose
- current project status
- major repository directories
- current development environment or workflow
- links to important repository documentation such as `docs/style-guide.md`

As capabilities are added, update the README with relevant information such as:

- intended users
- major technologies
- how to run the application locally
- how to run tests
- production and staging URLs
- backend or API URLs
- links to architecture, deployment, and operational documentation

Do not claim that a capability exists until it has actually been implemented and verified.

A README is not a marketing page only. It is also an engineering entry point.

For a portfolio project, it should communicate clearly to both technical reviewers and other visitors.

---

## Environment Variables

Environment variables should use `UPPER_SNAKE_CASE`.

Examples:

```text
DATABASE_URL
JWT_SECRET
OPENAI_API_KEY
SUPABASE_URL
APP_ENV
LOG_LEVEL
```

### Frontend and Backend Variables

Backend runtime environment variables may contain secrets when those values remain server-side and are managed securely:

```text
DATABASE_URL
JWT_SECRET
OPENAI_API_KEY
```

Frontend variables are compiled into browser-accessible assets.

With Vite, only intentionally public configuration should use the `VITE_` prefix:

```text
VITE_API_URL
VITE_APP_ENV
```

The `VITE_` prefix does not make a value secret or secure. It makes the value available to frontend code.

Never expose backend secrets through frontend environment variables.

### Secret Management

Never commit real secrets to Git.

It is acceptable to commit a template file such as:

```text
.env.example
```

The file should show the required variable names but must not include real credentials.

Example:

```text
DATABASE_URL=replace-me
JWT_SECRET=replace-me
VITE_API_URL=http://localhost:8080
APP_ENV=local
LOG_LEVEL=debug
```

Local `.env` files containing real values must be excluded through `.gitignore`.

Production secrets should be stored using the deployment platform, CI/CD secret store, or another approved secret-management system.

---

## Branch Names

Use descriptive branch names with this pattern:

```text
type/short-description
```

Recommended prefixes:

```text
setup/
feature/
fix/
docs/
test/
refactor/
```

Examples:

```text
setup/backend-project
feature/admin-login
feature/project-gallery
fix/login-error-handling
docs/deployment-runbook
test/api-auth-tests
refactor/database-access
```

Keep each branch focused on one coherent change.

Separate unrelated capabilities into different branches and pull requests when doing so makes the work meaningfully clearer, safer, or easier to review.

Do not split small related work into multiple branches or pull requests merely to demonstrate process.

A branch name should give reviewers a useful summary of what the branch contains.

---

## Protected `main`

The shared GitHub `main` branch should be protected with a repository ruleset.

At the current stage, the ruleset should normally:

- require changes to reach `main` through a pull request
- block force pushes
- require conversation resolution when review conversations exist

Required approvals may depend on project context. An individual production-platform repository may initially require zero approvals because there is no second developer. Team repositories may use stronger review requirements when appropriate.

Additional gates such as required CI status checks should be added when those checks actually exist and provide useful evidence.

Branch protection applies to the shared GitHub branch. It does not prevent a developer from accidentally editing or committing to local `main`, so engineers must still understand and inspect local repository state.

---

## Commit Messages

Commit history is part of the professional engineering record.

Commit messages should help someone understand what changed.

They do not need to be overly formal, but they should be specific, professional, and useful when scanning project history.

Good commit messages:

```text
Add admin login endpoint
Fix project card layout on mobile
Document production rollback steps
Add health check endpoint
Handle empty project list on dashboard
Update README with local setup instructions
```

Avoid vague, repeated, or unprofessional messages:

```text
update
fix
stuff
changes
work
asdf
oops
please work
```

A commit message should usually answer one of these questions:

- What feature was added?
- What bug was fixed?
- What documentation changed?
- What test was added?
- What refactoring occurred?

Poor:

```text
fix
fix
fix
fix
```

Better:

```text
Fix login redirect after logout
Fix null project description error
Fix mobile spacing on project cards
Fix missing authorization check on admin route
```

Write specific messages as work progresses.

Small corrective commits may be squashed before merging when appropriate, but do not rewrite shared history without understanding the consequences.

### Commit Scope and Frequency

Commits should represent small, understandable increments of work.

When implementing application behavior, prefer frequent commits after a coherent piece of functionality has been implemented and verified rather than one large commit containing an entire feature.

Examples of reasonable increments might include:

- add the initial component structure
- implement one button or interaction
- add validation for one input path
- handle one error state
- add or update a test
- fix one layout or accessibility issue

The exact number of commits is not prescribed. The goal is for each commit to be small enough that a reviewer can understand what changed and why.

Large commits that combine many unrelated or unexplained changes make review, debugging, rollback, and ownership harder.

When using AI-generated or AI-assisted code, integrate and verify the work incrementally. Do not treat a large generated change as trustworthy simply because it compiles or appears to work.

---

## Pull Requests

Pull requests should be small enough to review carefully and should represent one coherent change.

PRs are part of the engineering history of the project. A useful PR should help a future engineer understand what changed, why the change was made, and what evidence supported merging it.

### Use PR Sections Proportionally

Not every PR needs the same sections.

For most substantive changes, the following are useful:

```markdown
## Summary
What changed?

## Why
Why was this change needed?

## Verification
How was the intended behavior or repository state verified?
```

Add the following sections when they are meaningful:

```markdown
## Deployment / Operational Impact
Does this affect environment variables, database schema, build behavior, configuration, rollout, runtime behavior, or operations?

## Observability
What logs, metrics, health checks, probes, screenshots, or other evidence show that this works in the relevant environment?

## Risks / Recovery
What could go wrong, and how would the change be undone or the system recovered?
```

Do not include irrelevant sections merely to fill out a template. A documentation-only PR may only need Summary, Why, and Verification. A production deployment or database change may need every section.

Verification should normally be present. The amount and type of verification should be proportional to the change.

Examples of useful verification include:

- inspecting repository state
- running automated tests
- completing a production build
- exercising the affected UI behavior
- calling an API endpoint
- reviewing rendered Markdown and links
- verifying a migration
- checking staging behavior

Observability is related to, but different from, verification. Verification supports the decision to accept the change; observability provides evidence about the system while it is running in the relevant environment.

Include screenshots or screen recordings when visual evidence materially helps a reviewer understand or verify the change.

Configuration, database, infrastructure, and deployment PRs may require especially careful operational-impact and recovery notes.

---

## API Paths

Use consistent, resource-oriented API paths.

Examples:

```text
GET /api/projects
GET /api/projects/{projectId}
POST /api/projects
PUT /api/projects/{projectId}
DELETE /api/projects/{projectId}
```

Use nouns for resources and HTTP methods to describe actions when possible.

Avoid inconsistent action-style paths such as:

```text
GET /api/getProjects
POST /api/projectMaker
GET /api/project_stuff
```

Use consistent parameter names:

```text
/api/projects/{projectId}
/api/users/{userId}
```

---

## Database Schema Changes

When using a relational database, schema changes should be reproducible and version-controlled.

Do not rely on undocumented manual production changes as the normal schema-management process.

Schema changes should eventually be managed through migration files stored in the repository.

The exact migration tool, naming convention, and file location should be established when the database architecture is selected.

Migration history should make it possible to:

- create a new environment consistently
- reproduce schema changes
- review database changes through PRs
- understand which application version expects which schema
- recover from or correct failed changes

Avoid introducing migration-tool-specific conventions before the tool has been selected.

---

## Dates and Times

Choose database types according to the meaning of the data.

Use `TIMESTAMPTZ` for recorded instants such as:

```text
created_at
updated_at
last_login_at
deployed_at
incident_started_at
```

Use `DATE` when the concept is a calendar date without a specific instant:

```text
birth_date
due_date
graduation_date
```

Use `TIME` or another appropriate representation when the concept is a local time rather than a global instant.

Store and display time zones intentionally.

Do not treat every date or time value as the same kind of data.

---

## Docker Conventions

Docker configuration should support reproducible builds, clear runtime behavior, and safe deployment.

Prefer multi-stage builds for production images so the final image contains only the runtime and files required to operate the service.

Additional tools or packages in the runtime image should be intentional and justified.

Structure Dockerfiles to make useful use of build caching.

For example, copy dependency and build configuration files before copying frequently changing source files when that meaningfully improves build reuse.

For Gradle projects, relevant files may include:

```text
gradlew
gradle/
build.gradle
settings.gradle
```

For frontend projects, relevant files may include:

```text
package.json
package-lock.json
```

Do not optimize layers blindly. Correctness and maintainability are more important than minor build-time improvements.

Run containers with the minimum permissions needed.

Do not place secrets inside Dockerfiles or committed image layers.

---

## Security and Authentication

Security decisions should be based on the project’s actual architecture and threat model.

Do not assume that a token-storage method is secure simply because it is common.

When choosing between cookies, browser storage, runtime memory, or another approach, consider:

- cross-site scripting
- cross-site request forgery
- token refresh
- session expiration
- frontend and backend domains
- CORS
- logout behavior
- deployment architecture

Authorization must always be enforced by the backend.

Frontend route hiding or disabled buttons are not security controls.

Prefer a deny-by-default authorization design where protected operations require explicit authentication and authorization, and public access is intentionally declared.

Document which routes are public, authenticated, or restricted by role.

Do not claim that authentication or authorization is secure until the behavior has been tested and verified.

---

## Logging

Logs should help someone debug and operate production.

Prefer structured, meaningful logs.

Useful fields may include:

```text
timestamp
level
request_id
user_id
route
status_code
duration_ms
error_type
error_message
environment
version
```

Avoid vague or noisy logs such as:

```text
here
made it
test
oops
thing failed
```

Logs should provide enough context to diagnose failures without exposing sensitive information.

Never log:

```text
passwords
API keys
access tokens
refresh tokens
private credentials
full authentication headers
sensitive personal data
```

Be deliberate about logging user identifiers and request content.

Production logging should support debugging while respecting security and privacy.

---

## Production Documentation

Create operational documentation when there is real operational behavior to document.

A deployed production system should eventually include a deployment runbook.

Recommended file:

```text
docs/deployment-runbook.md
```

The runbook should describe tested operational reality, including relevant information such as:

- where the application is deployed
- how a new version is deployed
- how artifacts move between environments
- how production health is verified
- how to roll back or recover
- where logs are found
- where metrics and alerts are found
- what environment variables are required
- what to do during common failures

Do not invent procedures before the deployment system exists.

If the system is live, someone other than the original developer should eventually be able to follow the runbook.

---

## Incident Documentation

If production breaks in a meaningful way, document what happened.

Recommended file:

```text
docs/incident-log.md
```

An incident note should include information such as:

- date and time
- what users experienced
- how the issue was detected
- root cause or suspected cause
- how the issue was mitigated
- how service was restored
- what follow-up work is needed

The goal is not blame.

The goal is learning, recovery, and reducing the chance of recurrence.

Do not hide incidents that reveal useful engineering lessons.

---

## Engineering Notebook — Individual Production Platform

The engineering notebook is a professional portfolio artifact for the individual production platform.

Recommended file:

```text
docs/engineering-notebook.md
```

It is intended for recruiters, hiring managers, technical interviewers, internship supervisors, and future maintainers.

Entries should communicate meaningful production capabilities and engineering decisions, including:

- the decision or capability
- how it was implemented
- why it matters
- meaningful tradeoffs or limitations
- evidence or verification when useful

Do not use the notebook as a list of completed assignments.

Do not create a separate entry for every small setup step or convention. Combine related work into stronger capability-oriented entries when appropriate.

Do not overstate small conventions as major architectural achievements.

The notebook should accurately show how the project became deployable, observable, reversible, secure enough, and explainable.

The team capstone project does not require an engineering notebook. Team projects should instead maintain only the architecture, deployment, operational, security, handoff, and other documentation genuinely needed to build, operate, troubleshoot, or transfer the system.

---

## Style Guide Updates

The source-of-truth copy of this guide should live at:

```text
docs/style-guide.md
```

This guide will evolve as the project and course mature.

If a convention changes, update the source-of-truth file rather than relying on announcements scattered across slides, chats, private notes, or verbal instructions.

Changes to the guide should normally be reviewed through a pull request when they represent a meaningful project convention change.

The guide should remain useful, accurate, and proportional to the project’s actual needs.
