#!/bin/bash

while read oldrev newrev refname
do
    # Check if the received branch is 'live'
    if [ "$refname" = "refs/heads/live" ]; then
        # Specify the target directory
        target_directory="/root/live"

        # Specify the log file
        log_file="/root/git-receive.log"

        # Redirect output to the log file
        exec >> "$log_file" 2>&1

        # Clear the target directory
        rm -rf $target_directory/*

        # Copy the content of the 'live' branch to the target directory
        git --work-tree="$target_directory" checkout -f live -- .

        # Update version.json within the target directory
        echo "{\"revision\": \"${newrev}\", \"date\": \"$(date -u)\"}" > "$target_directory/game/src/version/version.json"
        echo "Wrote version.json: $(cat "$target_directory/game/src/version/version.json")"

        # Get the commit message of the new revision
        commit_message=$(git log --format=%B -n 1 $newrev)
        echo "[$(date)] Live branch content copied to $target_directory. Commit message: '$commit_message'"
        
        # Execute any additional container update scripts in the background
        /root/update-containers.sh &
    fi
done
