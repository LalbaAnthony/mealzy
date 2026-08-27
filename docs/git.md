# Git usage

### Branching

We use a Git workflow based on two main branches:

| Branch    | Purpose                                                             |
| --------- | ------------------------------------------------------------------- |
| `main`    | Production-ready code. All hotfixes and critical patches land here. |
| `develop` | A development branch for ongoing work.                              |

For non-main branches, use prefixes to clarify the purpose:

| Prefix  | When to use                 | Example             |
| ------- | --------------------------- | ------------------- |
| `feat/` | New feature                 | `feat/user-auth`    |
| `fix/`  | Bug fix                     | `fix/login-error`   |
| `ref/`  | Code refactoring or cleanup | `ref/api-endpoints` |
| `docs/` | Documentation changes       | `docs/setup-guide`  |
| `test/` | Adding or updating tests    | `test/auth-module`  |

> **Note:** All contributions **must** go through **Pull Requests** (PRs). Direct pushes to `main` are **not** allowed.

### Commits

- Conventional Commits (https://www.conventionalcommits.org/)
  - `feat: add user authentication`
  - `fix: correct product price calculation`
  - `chore: update dependencies`

### Workflows

In any case, make sure you're up to date with the remote repo before starting any work using `git fetch`/`git pull`.

Working on a new feature or bugfix? Here's the standard workflow:

```sh
git fetch

# Create a new branch from develop
git checkout develop
git pull origin develop
git pull origin main # To keep develop up to date with main
git checkout -b feat/my-new-feature

# Make your changes, then stage and commit them, and push to the remote branch
git add . ; git commit -m "feat: add new feature"
git push

# Merge to develop via a pull request on GitHub, get it reviewed and approved, then merge it.
# git checkout develop
# git pull origin develop
# git pull origin feat/my-new-feature
# git push

# Merge to main via a pull request on GitHub, get it reviewed and approved, then merge it.
# git checkout main
# git pull origin main
# git push

# Delete the feature branch if it's no longer needed
git branch -d feat/my-new-feature

# Switch back to develop for the next work
git checkout develop

# Repeat
```

Update `main` using `develop`:

```sh
git fetch

# Keep main up to date with develop
git checkout develop
git pull --rebase
git pull origin main
git push

git checkout main
git pull --rebase
git pull origin develop
git push

# Switch back to develop for the next work
git checkout develop

# Repeat
```

### Line endings

`.gitattributes` declares `* text=auto eol=lf`, so every text file is stored and checked out with LF
on every platform. Known binary extensions are marked `binary` so git never touches them.

This is not a style preference, it is what keeps `npm run format:check` passing on Windows. Prettier
is configured with `endOfLine: "lf"`, and git on Windows defaults to `core.autocrlf=true`, which
rewrites the working copy to CRLF at checkout. Without `.gitattributes` those two disagree and every
file in the repository fails the format check, which fails `npm run verify` and CI.

`.gitattributes` takes precedence over `core.autocrlf`, so nobody has to configure their machine.
Do not delete it, and do not relax prettier to `endOfLine: "auto"` instead: that would hide the
mismatch locally while CI still compares against LF.

A working copy checked out before `.gitattributes` existed keeps its CRLF endings, because git does
not rewrite files that are already up to date. Run `npx prettier --write .` once to normalise it.
That produces no diff, since git already stored the blobs with LF.
