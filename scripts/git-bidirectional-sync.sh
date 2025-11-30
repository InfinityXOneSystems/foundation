#!/bin/bash

###############################################################################
# Bidirectional Git Synchronization Script (Bash)
#
# Automatically synchronizes local and remote Git repositories with:
# - Fetch latest changes from remote
# - Pull with automatic merge/rebase
# - Push local commits
# - Conflict detection and resolution strategies
# - Stash management for uncommitted changes
# - Branch tracking and synchronization
# - Dry-run mode for safety
###############################################################################

set -o pipefail

# Default parameters
REMOTE="origin"
BRANCH=""
STRATEGY="merge"
DRY_RUN=false
AUTO_COMMIT=false
FORCE=false
INTERVAL=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Output functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_step() { echo -e "${MAGENTA}→ $1${NC}"; }

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Bidirectional Git synchronization script

OPTIONS:
    -r, --remote REMOTE         Remote name (default: origin)
    -b, --branch BRANCH         Branch to sync (default: current branch)
    -s, --strategy STRATEGY     Merge strategy: merge, rebase, fast-forward-only (default: merge)
    -d, --dry-run               Preview changes without applying them
    -a, --auto-commit           Automatically commit uncommitted changes before sync
    -f, --force                 Force push (use with caution)
    -i, --interval SECONDS      Continuous sync interval (0 = one-time sync)
    -h, --help                  Show this help message

EXAMPLES:
    $0
    $0 --remote origin --branch main --strategy rebase
    $0 --dry-run
    $0 --interval 300 --auto-commit

EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--remote)
            REMOTE="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -s|--strategy)
            STRATEGY="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -a|--auto-commit)
            AUTO_COMMIT=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -i|--interval)
            INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if in a Git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a Git repository"
        return 1
    fi
    return 0
}

# Get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null
}

# Get remote tracking branch
get_remote_branch() {
    local local_branch="$1"
    local remote_branch=$(git rev-parse --abbrev-ref "${local_branch}@{upstream}" 2>/dev/null)
    
    if [ -z "$remote_branch" ]; then
        echo "${REMOTE}/${local_branch}"
    else
        echo "$remote_branch"
    fi
}

# Check for uncommitted changes
has_uncommitted_changes() {
    ! git diff-index --quiet HEAD -- 2>/dev/null
}

# Check for untracked files
has_untracked_files() {
    [ -n "$(git ls-files --others --exclude-standard)" ]
}

# Get commit counts
get_commit_counts() {
    local local_branch="$1"
    local remote_branch="$2"
    
    local ahead=$(git rev-list --count "${remote_branch}..${local_branch}" 2>/dev/null || echo "0")
    local behind=$(git rev-list --count "${local_branch}..${remote_branch}" 2>/dev/null || echo "0")
    
    echo "$ahead $behind"
}

# Stash uncommitted changes
stash_changes() {
    print_step "Stashing uncommitted changes..."
    
    if git stash push -u -m "Auto-stash before sync" > /dev/null 2>&1; then
        print_success "Changes stashed successfully"
        return 0
    else
        print_error "Failed to stash changes"
        return 1
    fi
}

# Pop stashed changes
pop_stash() {
    print_step "Restoring stashed changes..."
    
    if git stash pop > /dev/null 2>&1; then
        print_success "Stashed changes restored"
        return 0
    else
        print_warning "Conflict while restoring stash - manual resolution required"
        return 1
    fi
}

# Auto-commit uncommitted changes
auto_commit() {
    print_step "Auto-committing uncommitted changes..."
    
    git add -A
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    if git commit -m "Auto-commit: ${timestamp} [bidirectional-sync]" > /dev/null 2>&1; then
        print_success "Changes committed automatically"
        return 0
    else
        print_error "Failed to auto-commit changes"
        return 1
    fi
}

# Fetch from remote
fetch_remote() {
    print_step "Fetching from remote '${REMOTE}'..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would fetch from ${REMOTE}"
        return 0
    fi
    
    if git fetch "$REMOTE" --prune --tags > /dev/null 2>&1; then
        print_success "Fetched successfully"
        return 0
    else
        print_error "Failed to fetch from remote"
        return 1
    fi
}

# Pull changes with specified strategy
pull_changes() {
    local local_branch="$1"
    local remote_branch="$2"
    
    print_step "Pulling changes from '${remote_branch}'..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would pull from ${remote_branch} using strategy: ${STRATEGY}"
        return 0
    fi
    
    case "$STRATEGY" in
        merge)
            git pull "$REMOTE" "$local_branch" --no-rebase > /dev/null 2>&1
            ;;
        rebase)
            git pull "$REMOTE" "$local_branch" --rebase > /dev/null 2>&1
            ;;
        fast-forward-only)
            git pull "$REMOTE" "$local_branch" --ff-only > /dev/null 2>&1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Pulled successfully with strategy: ${STRATEGY}"
        return 0
    else
        print_error "Failed to pull changes (conflicts may exist)"
        return 1
    fi
}

# Push changes to remote
push_changes() {
    local local_branch="$1"
    
    print_step "Pushing changes to '${REMOTE}/${local_branch}'..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would push to ${REMOTE}/${local_branch}"
        return 0
    fi
    
    if [ "$FORCE" = true ]; then
        print_warning "Force pushing (use with caution!)"
        git push "$REMOTE" "$local_branch" --force-with-lease > /dev/null 2>&1
    else
        git push "$REMOTE" "$local_branch" > /dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Pushed successfully"
        return 0
    else
        print_error "Failed to push changes"
        return 1
    fi
}

# Check for merge conflicts
has_merge_conflicts() {
    [ -n "$(git diff --name-only --diff-filter=U)" ]
}

# Main synchronization logic
sync_repository() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Git Bidirectional Sync${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # Verify Git repository
    check_git_repo || return 1
    
    # Get current branch
    local current_branch="${BRANCH:-$(get_current_branch)}"
    if [ -z "$current_branch" ]; then
        print_error "Could not determine current branch"
        return 1
    fi
    
    print_info "Branch: ${current_branch}"
    print_info "Remote: ${REMOTE}"
    print_info "Strategy: ${STRATEGY}"
    [ "$DRY_RUN" = true ] && print_warning "DRY RUN MODE - No changes will be applied"
    echo ""
    
    # Get remote tracking branch
    local remote_branch=$(get_remote_branch "$current_branch")
    print_info "Tracking: ${remote_branch}"
    echo ""
    
    # Check for uncommitted changes
    local stashed=false
    if has_uncommitted_changes || has_untracked_files; then
        print_warning "Uncommitted changes detected"
        
        if [ "$AUTO_COMMIT" = true ]; then
            auto_commit || return 1
        else
            stash_changes || {
                print_error "Cannot sync with uncommitted changes. Use --auto-commit or commit manually."
                return 1
            }
            stashed=true
        fi
        echo ""
    fi
    
    # Step 1: Fetch
    fetch_remote || {
        [ "$stashed" = true ] && pop_stash
        return 1
    }
    
    # Get commit counts
    read ahead behind <<< $(get_commit_counts "$current_branch" "$remote_branch")
    
    print_info "Commits ahead: ${ahead}"
    print_info "Commits behind: ${behind}"
    echo ""
    
    # Step 2: Pull if behind
    if [ "$behind" -gt 0 ]; then
        pull_changes "$current_branch" "$remote_branch" || {
            if has_merge_conflicts; then
                print_error "Merge conflicts detected - manual resolution required"
                print_info "Conflicted files:"
                git diff --name-only --diff-filter=U | while read -r file; do
                    echo -e "  ${YELLOW}- ${file}${NC}"
                done
                echo ""
                echo -e "${YELLOW}Resolve conflicts, then run: git add . && git commit${NC}"
            fi
            [ "$stashed" = true ] && pop_stash
            return 1
        }
    else
        print_info "Local branch is up to date with remote"
        echo ""
    fi
    
    # Step 3: Push if ahead
    if [ "$ahead" -gt 0 ]; then
        push_changes "$current_branch" || {
            [ "$stashed" = true ] && pop_stash
            return 1
        }
    else
        print_info "No local commits to push"
        echo ""
    fi
    
    # Restore stashed changes
    if [ "$stashed" = true ]; then
        echo ""
        pop_stash
    fi
    
    # Final status
    echo ""
    echo -e "${GREEN}========================================${NC}"
    print_success "Bidirectional sync completed"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    return 0
}

# Continuous sync loop
continuous_sync() {
    print_info "Starting continuous sync (interval: ${INTERVAL} seconds)"
    print_info "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        if ! sync_repository; then
            print_warning "Sync failed - will retry in ${INTERVAL} seconds"
        fi
        
        echo -e "${BLUE}Waiting ${INTERVAL} seconds until next sync...${NC}"
        sleep "$INTERVAL"
        echo ""
    done
}

# Main execution
main() {
    if [ "$INTERVAL" -gt 0 ]; then
        continuous_sync
    else
        sync_repository
        exit $?
    fi
}

# Run main function
main
