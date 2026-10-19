export const generateProdDeployScript = (repoURL, projectDirName, awsRegion = "us-east-2") => {
  return `#!/bin/bash

set -e

ALL_INSTANCES=(\${PROD_INSTANCE_IDS//,/ })

echo "Deploying to production..."
echo "Instances: \${ALL_INSTANCES[*]}"

for instance_id in "\${ALL_INSTANCES[@]}"; do
  echo "-------------------------------------------"
  echo "Deploying to instance: \${instance_id}"

  # Send deployment commands via SSM
  # Note: CI_JOB_TOKEN is passed explicitly as a parameter since SSM
  # does not inherit GitLab CI environment variables
  COMMAND_ID=$(aws ssm send-command \\
    --region ${awsRegion} \\
    --instance-id "\${instance_id}" \\
    --document-name "AWS-RunShellScript" \\
    --parameters 'commands=["bash -c '\\''set -e
      TARGET_DIR=/var/www/html/${projectDirName}
      REPO_URL=\\"https://gitlab-ci-token:'"\${CI_JOB_TOKEN}"'@${repoURL}\\"

      if [ ! -d \\"$TARGET_DIR/.git\\" ]; then
        echo \\"First-time setup...\\"
        sudo mkdir -p /var/www/html
        sudo chown -R ubuntu:ubuntu /var/www/html
        git clone $REPO_URL $TARGET_DIR
      else
        echo \\"Repo exists. Syncing...\\"
        sudo chown -R ubuntu:ubuntu $TARGET_DIR
        sudo git config --global --add safe.directory $TARGET_DIR
        sudo git -C $TARGET_DIR remote set-url origin $REPO_URL
      fi

      sudo git -C $TARGET_DIR stash || true
      sudo git -C $TARGET_DIR fetch origin
      sudo git -C $TARGET_DIR checkout main
      sudo git -C $TARGET_DIR reset --hard origin/main

      echo \\"Reclaiming disk space...\\"
      sudo docker system prune -f || true
      echo \\"Stopping existing containers...\\"
      sudo docker compose -f $TARGET_DIR/docker-compose.yml down
      echo \\"Building and restarting...\\"
      sudo docker compose -f $TARGET_DIR/docker-compose.yml up -d --build
      echo \\"Removing intermediate build layers...\\"
      sudo docker image prune -f || true
      sudo systemctl restart nginx
      echo \\"--- Frontend production update complete\\"
      '\\''"]' \\
    --comment "GitLab CI deploy - $CI_COMMIT_SHORT_SHA" \\
    --timeout-seconds 1200 \\
    --query "Command.CommandId" \\
    --output text)

  echo "SSM Command ID: $COMMAND_ID"

  echo "Waiting for deployment to finish on \${instance_id}..."
  for i in $(seq 1 60); do
    STATUS_CHECK=$(aws ssm get-command-invocation \\
      --region ${awsRegion} \\
      --command-id "$COMMAND_ID" \\
      --instance-id "\${instance_id}" \\
      --query "StatusDetails" \\
      --output text)
    echo "[$i/60] Status: $STATUS_CHECK"
    if [ "$STATUS_CHECK" = "Success" ] || [ "$STATUS_CHECK" = "Failed" ] || [ "$STATUS_CHECK" = "Cancelled" ]; then
      break
    fi
    sleep 20
  done

  # Fetch and print the result
  RESULT=$(aws ssm get-command-invocation \\
    --region ${awsRegion} \\
    --command-id "$COMMAND_ID" \\
    --instance-id "\${instance_id}")

  STATUS=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['StatusDetails'])")
  OUTPUT=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['StandardOutputContent'])")
  ERROR=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['StandardErrorContent'])")

  echo "Status: $STATUS"
  echo "Output: $OUTPUT"

  if [ "$STATUS" != "Success" ]; then
    echo "DEPLOYMENT FAILED on \${instance_id}: $ERROR"
    exit 1
  fi

  echo "Successfully deployed to \${instance_id}"
done

echo "==========================================="
echo "All production servers updated successfully."
`
}
