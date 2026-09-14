# Team Repository Setup

## Purpose

Establish the shared Git/GitHub repository that your team will use for the capstone project.

Only one designated team member will perform the initial repository setup and repository administration.

Use the `I01-individual-platform-setup-and-workflow` assignment as the reference for Git commands and workflow. This setup intentionally follows the same pattern as your individual platform.

---

## 1. Repository Administrator

Select one student from your team to be the github admin - that student should send me a teams message to get an invite to your team's github repo.

The repository will be owned by the course GitHub organization that i set up - do not set up your own repo in github.

---

## 2. Initialize the Local Repository

The designated repository administrator should open WSL and move to the course workspace:

```bash
cd ~/capstone
```

Create a directory using the same name as your team's GitHub repository:

```bash
mkdir <repository-name>
cd <repository-name>
```

For example:

```bash
mkdir cca-school
cd cca-school
```

Follow the setup process from the `I01-individual-platform-setup-and-workflow`, assignment including:

- initialize Git with `git init`
- check/configure your Git author identity
- rename the default branch to `main`
- create an initial `README.md`
- make the first local commit
- connect the local repository to the provided GitHub repository as `origin`
- push local `main` to GitHub

---

## 3. Protect `main`

After the initial `main` branch has been pushed to GitHub, create the same `main` branch protection/ruleset used for the individual platform.

At minimum:

- require changes to reach `main` through a pull request
- block force pushes
- require at least one team member to approve a PR before merging
- require conversation resolution before merging

---

## 4. Invite the Rest of the Team

The designated repository administrator should invite the remaining team members to the shared GitHub repository.

Each student should use their own GitHub account.

Do not share GitHub credentials.


---

## 5. Create the Initial Team Project Structure

The designated repository administrator should create a setup branch:

```bash
git switch -c setup/project-structure
```

Create the following structure:

```text
<repository-name>/
├── README.md
├── requirements/
│   ├── T01-team-repository-setup.md
│   └── T05-report-draft1.md
├── backend/
│   └── .gitkeep
├── docs/
│   └── style-guide.md
└── frontend/
    └── .gitkeep
```

Add this setup document as:

`requirements/T01-team-repository-setup.md`

Add the provided report-draft requirement as:

`requirements/T05-report-draft1.md`

Add the provided style guide to:

`docs/style-guide.md`

Use `.gitkeep` for directories that do not yet contain real files.

The `requirements/` directory contains course/project requirements and progress-tracking documents.

The `docs/` directory is reserved for engineering and project documentation produced by the team, such as architecture notes, reports, deployment documentation, runbooks, and other maintained project artifacts.

---

## 6. Open the Initial Pull Request

Commit and push the setup branch using the workflow from `I01-individual-platform-setup-and-workflow.md`.

PR title:

`Add initial team project structure`

Suggested PR description:
```markdown
### Summary

Created the initial repository structure for the team capstone project and added the first team requirements.

### Why

A monorepo keeps coordinated frontend and backend changes in the same commit and pull-request history while preserving clear boundaries between major parts of the system.

Separating `requirements/` from `docs/` keeps project requirements distinct from the engineering and project documentation created to satisfy them.

### Verification

Verified that the expected directories and files are present in the repository.

Merge the PR and clean up the completed branch using the same workflow used for the individual platform.
```
---

## 7. Remaining Team Members: Clone the Repository

After accepting the GitHub invitation, every remaining team member should open WSL and move to the course workspace:

```bash
cd ~/capstone
```

Clone the existing shared repository:

```bash
git clone https://github.com/<organization>/<repository-name>.git
```

Git will create a local directory using the repository name.

For example:

```bash
git clone https://github.com/<organization>/cca-school.git
cd cca-school
```

Verify the repository state:

```bash
git status
```

Verify that:

- the expected project structure is present
- `requirements/T01-team-repository-setup.md` is present
- `requirements/T05-report-draft1.md` is present
- the working tree is clean

Do not run `git init`.

You are cloning the existing shared team repository.

---

## Completion

The team is finished when:

- [ ] one designated student has repository Admin access
- [ ] the local repository was initialized from WSL/Linux
- [ ] the initial `main` branch was pushed to the provided GitHub repository
- [ ] `main` is protected by the required branch rule/ruleset
- [ ] all remaining team members have been invited to the repository
- [ ] `requirements/T01-team-repository-setup.md` is present
- [ ] `requirements/T05-report-draft1.md` is present
- [ ] `docs/style-guide.md` is present
- [ ] every remaining team member has cloned the shared repository into WSL/Linux

## Grading

I will check your github repo.
Please check to make sure your teammates have the correct setup on their machines.
