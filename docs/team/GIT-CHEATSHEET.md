# Git Cheat Sheet

For the founder. No jargon. Copy, paste, done.

## The only question that matters: is my work safe?

```
git status --short && git log --oneline -3 && git ls-remote --heads origin main | cut -c1-7
```

Blank status, and the top hash matches the last hash → **everything is on GitHub.**

## The three places your work can be

| Place | Meaning | Safe? |
|---|---|---|
| Working tree | Edited, not committed | ❌ one bad command from gone |
| Local repo | Committed, on this Mac | ⚠️ only if the Mac survives |
| GitHub | Pushed | ✅ |

**Committed is not saved.** Committed means "written down on this machine." Pushed means
"it's in my repo on the internet." Agents finish work at step 2 and stop.

## If an agent died mid-work

```
git fetch --all
git log --oneline --all -20        # every commit on every branch
git branch -a                      # every branch, local and remote
git status --short                 # anything uncommitted right here
```

Nothing committed is ever really lost. Even a deleted branch survives ~30 days:

```
git reflog                         # every position HEAD has been in
```

## Rescue uncommitted work an agent left behind

```
git stash list                     # did it stash something?
git diff                           # unstaged changes
git diff --cached                  # staged but uncommitted
```

To save it all immediately, without deciding anything:

```
git add -A && git commit -m "wip: rescue" && git push -u origin HEAD
```

## Everyday

```
git checkout main && git pull        # get the latest
git checkout -b role/what-im-doing   # start something new
git add -A && git commit -m "..."    # write it down
git push -u origin HEAD              # send it to GitHub
```

## Merging a branch into main

```
git checkout main && git pull
git merge --no-ff role/their-branch
npm run lint && npm run build        # must pass
git push
```

## When a merge stops with a conflict

Not an error. Two branches changed the same lines and git won't guess.

```
git diff --name-only --diff-filter=U   # which files
```

Open each one. You'll see:

```
<<<<<<< HEAD
what main says
=======
what the branch says
>>>>>>> their-branch
```

Delete the three marker lines, keep the text you want (often both), then:

```
git add -A && git commit -m "Merge branch 'role/their-branch'"
```

To back out entirely and pretend it never happened:

```
git merge --abort
```

## Undo

```
git restore <file>                  # throw away edits to one file
git reset --soft HEAD~1             # undo last commit, KEEP the changes
git revert <hash>                   # undo a pushed commit, safely
```

Avoid `git reset --hard` — it deletes work with no confirmation.

## Seeing what happened

```
git log --oneline --graph -20       # recent history as a picture
git show <hash>                     # what one commit changed
git log --oneline -- path/to/file   # history of one file
git log --oneline --all --not main  # work not yet in main
```

## Branch housekeeping

```
git branch --no-merged main         # work not yet merged — check before deleting
git branch --merged main            # safe to delete
git branch -d role/old-branch       # delete (refuses if unmerged)
```

## Worktrees (how parallel agents avoid each other)

A worktree is a second folder holding a different branch of the same project, so two
agents never edit the same files.

```
git worktree list                   # who has what checked out
git worktree remove <path>           # clean up a finished one
```

## Issues

```
gh issue list                        # what's open
gh issue list --label ready-for-agent
gh issue view 12 --comments
gh issue create --title "..." --body "..."
```

## Emergency: "I have no idea what state this is in"

```
git status --short && git log --oneline -5 && git branch --show-current && git stash list
```

Paste the output to Claude and ask. Nothing here changes anything.
