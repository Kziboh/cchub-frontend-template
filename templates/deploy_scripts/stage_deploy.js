// NOTE: this script is emitted from a JS template literal, so inside the
// template: bash `${VAR}` must be written `\${VAR}`, and any literal backslash
// must be doubled. Only `${repoURL}` and `${projectDirName}` are real JS
// interpolations.
const generateStageDeployScript = (repoURL, projectDirName) => {
  return `#!/bin/bash

# any future command that fails will exit the script
set -e

# Load the private key of our aws instance
eval $(ssh-agent -s)
echo "$STAGE_PRIVATE_KEY" | tr -d '\\r' | ssh-add - > /dev/null

# STAGE_SERVER is set in our gitlab settings as comma separated ip addresses.
# Split it into an array.
ALL_SERVERS=(\${STAGE_SERVER//,/ })

echo "Deploying to staging..."
echo "Servers: \${ALL_SERVERS[*]}"

# Iterate over the array and ssh into each EC2 instance
for server in "\${ALL_SERVERS[@]}"; do
  echo "-------------------------------------------"
  echo "Deploying to \${server}"

  # CI_JOB_TOKEN is passed explicitly since ssh does not forward GitLab CI
  # environment variables. The heredoc is quoted so nothing below is expanded
  # locally; it runs on the remote server.
  ssh -o StrictHostKeyChecking=no ubuntu@\${server} "CI_JOB_TOKEN=$CI_JOB_TOKEN bash -s" <<'REMOTE_SCRIPT'
set -e

TARGET_DIR="/var/www/html/${projectDirName}"
REPO_URL="https://gitlab-ci-token:\${CI_JOB_TOKEN}@${repoURL}"

# 1. HANDLE FIRST TIME SETUP
if [ ! -d "$TARGET_DIR/.git" ]; then
  echo "First-time setup..."
  sudo mkdir -p /var/www/html
  sudo chown -R ubuntu:ubuntu /var/www/html
  git clone $REPO_URL $TARGET_DIR
  cd $TARGET_DIR
else
  echo "Repo exists. Refreshing token and syncing..."
  cd $TARGET_DIR
  git remote set-url origin $REPO_URL
fi

# 2. STANDARD UPDATE
git config --global --add safe.directory $TARGET_DIR
git stash || true
git fetch origin
git checkout dev
git reset --hard origin/dev

# 3. DISK CLEANUP
echo "Reclaiming disk space before build..."
sudo docker system prune -f || echo "Prune skipped (already running or failed)"

# Remove stale containers left by an interrupted recreate (names like 586c1acd51de_<project>-redis-1)
sudo docker ps -a --format '{{.Names}}' | grep -E '^[0-9a-f]{12}_${projectDirName}' | xargs -r sudo docker rm -f || true

# 4. DOCKER BUILD
echo "Building fresh Docker images..."
COMPOSE="sudo docker compose -f docker-compose.yml"
if [ -f docker-compose.staging.yml ]; then
  COMPOSE="$COMPOSE -f docker-compose.staging.yml"
fi
$COMPOSE build --no-cache
$COMPOSE down --remove-orphans
$COMPOSE up -d

# 5. POST-BUILD CLEANUP
echo "Removing intermediate build layers..."
sudo docker image prune -f || echo "Prune skipped (already running or failed)"

sudo systemctl restart nginx

echo "--- Frontend staging update complete"
REMOTE_SCRIPT

  echo "Successfully deployed to \${server}"
done

echo "==========================================="
echo "All staging servers updated successfully."
`
}

export default generateStageDeployScript;
