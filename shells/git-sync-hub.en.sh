#!/bin/bash

CURRENT_BRANCH=$(git branch --show-current)

echo "current branch: " $CURRENT_BRANCH

while true; do
    echo "Please select an operation:"
    echo "[1] Sync"
    echo "[2] Pull"
    echo "[3] Push"
    echo "[4] Branch switch"
    echo "[5] Exit"
    read -p "Enter your choice (1-4): " choice

    case $choice in
        1)
            # Sync: Push current branch to GitHub (github) and Gitee
            echo "Syncing current branch $CURRENT_BRANCH to GitHub and Gitee..."
            git push github $CURRENT_BRANCH
            if [ $? -ne 0 ]; then
                echo "Push to GitHub failed."
                continue
            fi
            git push gitee $CURRENT_BRANCH
            if [ $? -ne 0 ]; then
                echo "Push to Gitee failed."
                continue
            fi
            echo "Sync completed."

            # Prompt if need to switch branch for merge
            read -p "Do you need to switch to another branch for merge? (y/n): " do_merge
            if [ "$do_merge" != "y" ]; then
                continue
            fi

            # List all local branches
            branches=($(git branch | sed 's/* //g' | sed 's/ //g'))
            options=("Cancel" "${branches[@]}")

            echo "Please select target branch (first item is cancel):"
            select target in "${options[@]}"; do
                if [[ -n "$target" ]]; then
                    if [ "$target" = "Cancel" ]; then
                        break
                    fi

                    # Switch to target branch
                    git switch $target
                    if [ $? -ne 0 ]; then
                        echo "Switch branch failed, please check branch name."
                        break
                    fi

                    # Merge githubal branch
                    echo "Merging $CURRENT_BRANCH into $target..."
                    git merge $CURRENT_BRANCH
                    if [ $? -ne 0 ]; then
                        echo "Merge conflicts, please resolve manually."
                        break
                    fi
                    echo "Merge completed."

                    # Prompt if need remote sync
                    read -p "Do you need to sync remotely? (y/n): " do_push
                    if [ "$do_push" = "y" ]; then
                        git push github $target
                        git push gitee $target
                        echo "Remote sync completed."
                    fi

                    # Prompt if switch back to githubal branch
                    read -p "Do you need to switch back to githubal branch $CURRENT_BRANCH? (y/n): " switch_back
                    if [ "$switch_back" = "y" ]; then
                        git switch $CURRENT_BRANCH
                        if [ $? -ne 0 ]; then
                            echo "Switch back to githubal branch failed."
                        fi
                    fi
                    break
                else
                    echo "Invalid selection, please try again."
                fi
            done
            ;;
        2)
            # Pull: Pull current branch from github
            CURRENT_BRANCH=$(git branch --show-current)
            echo "Pulling current branch $CURRENT_BRANCH from GitHub..."
            git pull github $CURRENT_BRANCH
            if [ $? -ne 0 ]; then
                echo "Pull failed."
            else
                echo "Pull completed."
            fi
            ;;
        3)
            # Push: Push current branch to github and gitee
            CURRENT_BRANCH=$(git branch --show-current)
            echo "Pushing current branch $CURRENT_BRANCH to GitHub and Gitee..."
            git push github $CURRENT_BRANCH
            git push gitee $CURRENT_BRANCH
            if [ $? -eq 0 ]; then
                echo "Push completed."
            fi
            ;;
        4)
            branches=($(git branch | sed 's/* //g' | sed 's/ //g'))
            options=("cancel" "${branches[@]}")

            echo "Please select target branch (first item is cancel)"
            select target in "${options[@]}"; do
                if [[ -n "$target" ]]; then
                    CURRENT_BRANCH=$target
                    if [ "$target" = "cancel" ]; then
                        break
                    fi

                    # 切换到目标分支
                    git switch $target
                    if [ $? -ne 0 ]; then
                        echo "Switch branch failed, please check branch name."
                        break
                    fi
                fi
              break
            done
           ;;        
        5)
            echo "Exiting script."
            exit 0
            ;;
        *)
            echo "Invalid choice, please try again."
            ;;
    esac
done