#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e
# Set environment paths so cron can locate git and docker command line tools
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
# Project directory
REPO_DIR="/home/muji-rahman/Public/medium-clone-fullstack"
LOG_FILE="$REPO_DIR/auto-pull-rebuild.log"
# Function to log messages with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}
# Redirect all stdout and stderr from this block into the log file
exec >> "$LOG_FILE" 2>&1
log "Starting auto pull and rebuild process..."
cd "$REPO_DIR"
# Fetch latest main branch from origin
log "Fetching latest changes from origin..."
git fetch origin main
# Get local and remote hashes
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)
log "Local hash: $LOCAL_HASH"
log "Remote hash: $REMOTE_HASH"
if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    log "New updates found on branch main. Pulling changes..."
    git pull origin main
    log "Rebuilding and restarting docker compose services..."
    docker compose up -d --build
    log "Services successfully rebuilt and restarted!"
else
    log "No changes detected on branch main. Rebuild skipped."
fi
log "Auto pull and rebuild check finished."
echo "------------------------------------------------"
