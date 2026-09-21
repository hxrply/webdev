Git tracks changes to files over time. It is how every team on earth collaborates on code, and how you undo the mistake you made at 11pm.

# The model

Three places your work lives:

```text
  working directory  →  staging area  →  repository
   (your files)          (git add)       (git commit)
```

- **Working directory** — the files you're editing right now.
- **Staging area (index)** — changes you've marked for the next commit. This is git's unusual idea, and it's what lets you commit *some* of your changes.
- **Repository** — the permanent history of commits.

A **commit** is a snapshot with a message, an author and a parent. Commits form a chain, and branches are just labels pointing at a commit in it.

# The daily loop

```bash
git status                     # what's changed? run this constantly
git add file.js                # stage one file
git add .                      # stage everything changed
git add -p                     # stage selected chunks, interactively
git commit -m "Add price filter to product list"
git log --oneline --graph      # what happened
git push                       # send to the remote
```

:::tip `git status` is your friend
Run it before and after everything. It tells you which branch you're on, what's staged, what isn't, and usually suggests the exact command you want next. Beginners who get lost are almost always the ones who don't run it.
:::

# First-time setup

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false          # decide merge vs rebase for pulls
```

# Starting a repository

```bash
git init                       # new repo here
git clone https://github.com/user/repo.git     # copy an existing one
```

## .gitignore

```text
node_modules/
.env
.DS_Store
dist/
*.log
```

Anything generated, huge or secret. **Never commit `.env` files, API keys or credentials.**

:::warn A committed secret is a leaked secret
Deleting it in a later commit does not remove it — it's still in the history, and on every clone. If you push a key, treat it as compromised: **rotate it immediately**, then clean the history (`git filter-repo`, or GitHub's secret-scanning guidance). Rotating first is the part people skip and regret.
:::

# Writing commits

```bash
git commit -m "Fix cart total ignoring discount codes"
```

A good message says **what changed and why**, in the imperative mood ("Add", not "Added" — it completes the sentence "this commit will…"). The convention that scales:

```text
Short summary, under 50 characters

A longer explanation if the change isn't self-evident: what problem
it solves, what alternatives you rejected, anything the diff can't
say for itself.

Fixes #123
```

Commit **small and often**. A commit that changes one thing can be reviewed, reverted or cherry-picked. A commit titled "stuff" containing 40 files cannot.

# Branches

```bash
git branch                          # list
git switch -c feature/price-filter  # create and switch (modern)
git checkout -b feature/price-filter # the older equivalent
git switch main                     # move between branches
git branch -d feature/price-filter  # delete when merged
```

Branches are cheap — they're a pointer to a commit, nothing is copied. The standard workflow:

1. Branch from `main`.
2. Commit your work.
3. Push and open a pull request.
4. Get it reviewed, merge, delete the branch.

## Merging

```bash
git switch main
git merge feature/price-filter
```

If the branches touched different lines, git merges automatically. If both changed the same lines, you get a **conflict**:

```text
<<<<<<< HEAD
const total = subtotal + shipping;
=======
const total = subtotal + shipping + tax;
>>>>>>> feature/price-filter
```

Resolve it by editing the file to what it *should* be — deleting the markers — then:

```bash
git add file.js
git commit
```

Conflicts feel alarming and are routine. Read both sides, decide, move on. `git merge --abort` gets you back to safety if you'd rather retreat.

## Rebase

```bash
git switch feature/x
git rebase main         # replay my commits on top of the current main
```

Merge preserves history exactly, adding a merge commit. Rebase rewrites your commits onto a new base, giving a linear history that's easier to read.

:::warn Never rebase shared branches
Rebasing creates **new commits with new hashes**. If someone else has the old ones, their history and yours diverge, and fixing it is miserable.

**The rule: rebase your own unpushed work freely; never rewrite anything others have pulled.** That includes `--force` pushes to `main` and amending pushed commits. (`--force-with-lease` is the safer variant when you must force-push your own feature branch.)
:::

# Remotes

```bash
git remote -v
git remote add origin https://github.com/user/repo.git
git push -u origin main        # -u sets the upstream, so later `git push` suffices
git fetch                      # download without changing your files
git pull                       # fetch + merge into your branch
```

`fetch` is always safe — it only downloads. `pull` changes your working branch, so commit or stash first.

# Undoing things

This is the part people most need and least know.

```bash
# Unstage a file (keep the changes)
git restore --staged file.js

# Discard uncommitted changes to a file — DESTRUCTIVE
git restore file.js

# Change the last commit's message, or add forgotten files
git add forgotten.js
git commit --amend

# Undo the last commit, keep the changes staged
git reset --soft HEAD~1

# Undo the last commit, keep changes unstaged
git reset HEAD~1

# Undo the last commit and DELETE the changes
git reset --hard HEAD~1

# Undo a commit by making a new commit that reverses it — safe on shared branches
git revert abc1234

# Save work in progress without committing
git stash
git stash pop
```

:::tip The reflog is your undo history
```bash
git reflog
git reset --hard HEAD@{3}
```
`reflog` records every position HEAD has been in, including commits you "lost" with a bad reset or rebase. Almost nothing committed is ever truly gone for about 90 days. When you think you've destroyed your work, look here before panicking.
:::

# Investigating

```bash
git log --oneline --graph --all     # the shape of history
git log -p file.js                  # every change to one file
git log --author="Ada" --since="2 weeks ago"
git diff                            # unstaged changes
git diff --staged                   # staged changes
git diff main..feature              # between branches
git blame file.js                   # who last changed each line, and in which commit
git show abc1234                    # one commit in full
git bisect start                    # binary-search history for the commit that broke something
```

`git blame` sounds accusatory; it's genuinely for archaeology — finding the commit whose message explains why a strange line exists.

# GitHub and pull requests

GitHub hosts repositories and adds collaboration around them. The flow:

```bash
git switch -c fix/login-error
# … work, commit …
git push -u origin fix/login-error
```

Then open a **pull request**: a proposal to merge your branch, with a description, a diff, automated checks and review comments. Good PRs are small, explain the *why*, and describe how to test them. A 2,000-line PR gets rubber-stamped; a 100-line PR gets read.

Other GitHub pieces you'll meet: **Issues** (bug and feature tracking), **Actions** (CI — run tests on every push), **Releases**, and **Pages** (free static hosting, which you'll use to deploy).

# Common situations

```bash
# Committed to main by mistake, haven't pushed
git branch feature-x          # bookmark the work
git reset --hard origin/main  # move main back
git switch feature-x

# Need to pull but have uncommitted changes
git stash && git pull && git stash pop

# Want one commit from another branch
git cherry-pick abc1234

# Accidentally committed a huge file
git rm --cached big.zip && echo "big.zip" >> .gitignore && git commit --amend
```

:::quiz
? What does the staging area let you do?
- Back up files
- Choose exactly which changes go into the next commit *
- Share changes with your team
- Undo commits
> `git add -p` lets you commit one logical change even when your working directory has three.

? Why should you never rebase a branch others have pulled?
- It is slow
- Rebase creates new commits, so their history diverges from yours *
- It deletes files
- It requires force-push permissions
> Rebase your own unpushed work freely; use merge or revert on shared branches.

? You committed a secret key and pushed. What comes first?
- Delete it in a new commit
- Rewrite the history
- Rotate the key immediately — it is already compromised *
- Make the repo private
> The history is already on every clone. Cleaning it is step two.

? What does `git revert abc1234` do?
- Deletes that commit from history
- Creates a new commit undoing that commit's changes *
- Resets your branch to that commit
- Restores a deleted file
> Safe on shared branches, because it adds history rather than rewriting it.

? You did a bad `git reset --hard`. What can recover it?
- Nothing, it's gone
- `git reflog` to find the previous HEAD position *
- `git revert`
- `git stash pop`
> The reflog keeps roughly 90 days of every position HEAD has held.

? What is the difference between fetch and pull?
- None
- fetch downloads without changing your working branch; pull downloads and merges *
- pull is faster
- fetch only works on main
> `fetch` is always safe; `pull` modifies your branch.
:::

:::exercise Practise the whole cycle
In a scratch folder:

1. `git init`, create a file, commit it.
2. Branch, make two commits, switch back to main, make a conflicting change.
3. Merge and resolve the conflict by hand.
4. Amend your last commit message.
5. Make a commit, `git reset --hard HEAD~1`, then recover it with `git reflog`.
6. Create a `.gitignore`, add a `.env` file, and confirm `git status` ignores it.

Do the recovery step deliberately, while nothing is at stake. It's the one you'll need under pressure.
:::
