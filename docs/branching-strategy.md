# Branching strategy

## Recommendation: `main` plus versioned release branches

Use `main` for ongoing development and create a long-lived `release/<major>.<minor>` branch when a version enters release stabilization. This keeps new feature work moving on `main` while allowing a release to receive focused testing, fixes, and patches without pulling in unfinished work.

For example, `release/1.2` is the maintenance line for the `1.2.x` release series. Keep a release branch only while that version needs support; close it when the version is no longer maintained. Do not add a permanent `develop` branch—the task branches and `main` already cover day-to-day development.

## Branch types and naming

- `main` — integration branch for the next version. Keep it buildable and tested. It may contain work intended for a future release.
- `release/<major>.<minor>` — stabilization and maintenance branch, cut from `main` at feature freeze. Only release-critical fixes, documentation, and version metadata changes go here.
- Short-lived task branches — created from `main` for features and regular fixes, or from the relevant release branch for a release-only fix. Merge them through pull requests.

Use a type prefix and a brief, lowercase, hyphen-separated description for task branches:

| Work type | Prefix | Example |
| --- | --- | --- |
| Feature | `feat/` | `feat/group-currency-settings` |
| Bug fix | `fix/` | `fix/expense-split-rounding` |
| Documentation | `docs/` | `docs/branching-strategy` |
| Tests | `test/` | `test/group-settings-api` |
| Maintenance | `chore/` | `chore/update-jest` |
| Release-only fix | `hotfix/` | `hotfix/release-1.2-login-redirect` |

Name release branches `release/<major>.<minor>` (for example, `release/1.2`). Keep task branches focused on one change. Do not put personal names in branch names.

## Day-to-day development

1. Update local `main` before starting regular development.
2. Create a task branch from `main` for a feature or normal bug fix. For a fix needed only by a supported release, create the task branch from that release branch instead.
3. Make focused commits. Conventional prefixes such as `feat:`, `fix:`, `docs:`, `test:`, and `chore:` are recommended.
4. Run relevant checks before asking for review (`npm test` and `npm run lint`; run `npm run build` for changes that affect the application build).
5. Push the branch and open a pull request targeting the branch from which the work started.
6. Review the diff, address feedback, and ensure the checks pass. Prefer squash merging for short-lived task branches.
7. If a fix is merged into a release branch and also applies to future versions, backport it to `main` with a separate pull request. Do not let release fixes exist only on a release branch by accident.
8. Delete the short-lived task branch after it is merged. Keep supported release branches until their maintenance period ends.

## Release lifecycle

1. **Feature development:** merge completed work into `main` through pull requests.
2. **Cut a release branch:** when the release scope is agreed and stabilization starts, create `release/1.2` from the reviewed `main` commit. Record the source commit in the release notes or pull request.
3. **Stabilize:** test the release branch. Merge only fixes required for this release; defer new features to `main` and a later release.
4. **Publish:** after final checks, tag the exact release commit, such as `v1.2.0`, and build/deploy from that tag or corresponding release branch according to the deployment process.
5. **Patch:** for a production fix, create a short-lived `fix/` branch from `release/1.2`, open a PR back to `release/1.2`, and run checks. Tag the next patch version, such as `v1.2.1`. Backport the fix to `main` if it is still relevant there.
6. **End support:** when `1.2.x` is no longer supported, stop accepting fixes on `release/1.2` and document the end of support.

Use semantic version tags: `vMAJOR.MINOR.PATCH`. A release branch tracks a minor series; tags mark immutable, individually deployable releases.

## PowerShell examples

Run commands from the repository root and replace example names/versions with the actual task or release.

### Start feature work

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/group-currency-settings
# Make and test the change
git add -A
git commit -m "feat: add group currency settings"
git push -u origin feat/group-currency-settings
```

Open a pull request from `feat/group-currency-settings` into `main`. After it is merged, update local `main` and delete the task branch:

```powershell
git switch main
git pull --ff-only origin main
git branch -d feat/group-currency-settings
```

### Start a release branch

Cut a release branch only after the release scope is agreed and feature work is ready to stop flowing into that release:

```powershell
git switch main
git pull --ff-only origin main
git switch -c release/1.2
git push -u origin release/1.2
```

If the repository requires branch changes to be reviewed, use its normal review process when creating the release branch. After the branch exists, release fixes target `release/1.2`; new features continue to target `main`.

### Patch a released version

```powershell
git switch release/1.2
git pull --ff-only origin release/1.2
git switch -c fix/release-1.2-login-redirect
# Make the smallest safe fix and run relevant checks
git add -A
git commit -m "fix: correct login redirect in 1.2"
git push -u origin fix/release-1.2-login-redirect
```

Open a pull request into `release/1.2`. After merging and verifying the release, tag the resulting commit (for example `v1.2.1`). If the fix applies to future development, open a separate PR to backport it to `main`.

## Pull request checklist

- The pull request has a clear summary and explains user-visible behavior.
- The target branch is correct: normal work goes to `main`; release-only fixes go to the corresponding release branch.
- The change is limited to the stated task; unrelated cleanup is separate.
- `npm test` and `npm run lint` pass. Include build or manual verification when applicable.
- No secrets, `.env` values, generated build output, or temporary files are included.
- API, data model, and UI changes are reviewed together when a feature spans those layers.
- A release fix that also applies to `main` has a backport PR or a documented reason not to backport.

## Urgent production fixes

Start the fix from the release branch that is actually deployed (for example, `release/1.2`), make the smallest safe change, run relevant checks, and merge through a pull request. Tag and deploy the patch from the merged release commit. Backport the fix to `main` when it applies there. If production is deployed directly from `main` and no release branch exists, create the fix from `main`.

## Branch protection and support

Protect `main` and supported release branches with pull-request review and passing checks where the Git hosting service permits. Add another active release branch only when the team must maintain another version line at the same time. Avoid a `develop` branch unless a future integration or deployment requirement clearly justifies the extra merge path.
