# Repository Settings Configuration

This document describes how to configure the repository settings to enforce squash merges and auto-delete branches after merge.

## Automated Configuration

The `.github/workflows/cleanup.yml` workflow will automatically delete branches after they are merged into main.

## Manual Configuration Required

The following settings must be configured manually through the GitHub web interface:

### 1. Enable Squash Merge and Disable Other Merge Methods

1. Go to: `https://github.com/stevenaubertin/movie-metadata-mcp/settings`
2. Scroll down to **"Pull Requests"** section
3. Configure merge button settings:
   - ✅ **Check**: "Allow squash merging"
   - ❌ **Uncheck**: "Allow merge commits"
   - ❌ **Uncheck**: "Allow rebase merging"

### 2. Enable Auto-Delete Branches

In the same **"Pull Requests"** section:

- ✅ **Check**: "Automatically delete head branches"

This will automatically delete branches after pull requests are merged.

### 3. Set Up Branch Protection for Main

1. Go to: `https://github.com/stevenaubertin/movie-metadata-mcp/settings/branches`
2. Click **"Add branch protection rule"**
3. Configure as follows:

#### Branch name pattern
```
main
```

#### Protection Settings

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - Required approvals: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks** (search and add):
    - `Build and Test (18.x)`
    - `Build and Test (20.x)`
    - `Build and Test (22.x)`
    - `Code Quality`

- ✅ **Require conversation resolution before merging**

- ✅ **Require linear history**
  - This enforces squash or rebase merges (prevents merge commits)

- ❌ **Do not allow bypassing the above settings** (unless you're the only maintainer)

- ❌ **Allow force pushes** - Keep unchecked

- ❌ **Allow deletions** - Keep unchecked

4. Click **"Create"** or **"Save changes"**

## Using GitHub CLI (Alternative)

If you have GitHub CLI installed and authenticated, you can use this script:

```bash
#!/bin/bash

REPO="stevenaubertin/movie-metadata-mcp"

# Enable squash merging only
gh api -X PATCH "/repos/$REPO" \
  -f allow_squash_merge=true \
  -f allow_merge_commit=false \
  -f allow_rebase_merge=false \
  -f delete_branch_on_merge=true

echo "✅ Repository merge settings updated"

# Note: Branch protection rules are more complex and typically
# require the GitHub web UI or a more detailed API call
```

## Verification

After configuration, verify:

1. **Merge button** on PRs should only show "Squash and merge"
2. **After merging** a PR, the source branch should be automatically deleted
3. **Direct pushes** to main should be blocked (must use PR)
4. **CI checks** must pass before merge is allowed

## Troubleshooting

### Issue: Can't merge PRs
- Check that all required status checks are passing
- Verify the status check names match exactly

### Issue: Branch not auto-deleted
- Check that "Automatically delete head branches" is enabled
- The cleanup.yml workflow provides a backup deletion mechanism

### Issue: Can see "Merge commit" or "Rebase and merge" options
- Verify merge settings are configured correctly
- Only "Allow squash merging" should be checked

## Reference

- See `.github/settings.yml` for complete recommended settings
- GitHub Docs: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository
