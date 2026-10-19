#!/bin/bash

# any future command that fails will exit the script
set -e
################## Frontend update ###############################
# Change directory to where the project is stored
cd /var/www/html/frontend

sudo docker system prune -f 

sudo git stash

sudo git fetch

sudo git checkout main

# pull the changes
sudo git pull origin main

# Build the application
sudo docker-compose up -d --build web


echo "****************************************************************"
echo "--- Frontend update complete"
echo "****************************************************************"