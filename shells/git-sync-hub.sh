#!/bin/bash

CURRENT_BRANCH=$(git branch --show-current)

echo "当前分支：" $CURRENT_BRANCH

while true; do
    echo "请选择操作："
    echo "[1] 同步"
    echo "[2] 拉取"
    echo "[3] 推送"
    echo "[4] 分支切换"
    echo "[5] 退出"
    read -p "输入您的选择（1-4）： " choice

    case $choice in
        1)
            # 同步：推送当前分支到github (github) 和 gitee
            echo "正在同步当前分支 $CURRENT_BRANCH 到 GitHub 和 Gitee..."
            git push github $CURRENT_BRANCH
            if [ $? -ne 0 ]; then
                echo "推送至 GitHub 失败。"
                continue
            fi
            git push gitee $CURRENT_BRANCH
            if [ $? -ne 0 ]; then
                echo "推送至 Gitee 失败。"
                continue
            fi
            echo "同步完成。"

            # 提示是否需要切换分支进行合并
            read -p "是否需要切换到某个分支进行合并操作？ (y/n): " do_merge
            if [ "$do_merge" != "y" ]; then
                continue
            fi

            # 列出所有本地分支
            branches=($(git branch | sed 's/* //g' | sed 's/ //g'))
            options=("取消" "${branches[@]}")

            echo "请选择目标分支（第一项为取消）："
            select target in "${options[@]}"; do
                if [[ -n "$target" ]]; then
                    if [ "$target" = "取消" ]; then
                        break
                    fi

                    # 切换到目标分支
                    git switch $target
                    if [ $? -ne 0 ]; then
                        echo "切换分支失败，请检查分支名。"
                        break
                    fi

                    # 合并原分支
                    echo "正在将 $CURRENT_BRANCH 合并到 $target..."
                    git merge $CURRENT_BRANCH
                    if [ $? -ne 0 ]; then
                        echo "合并冲突，请手动解决。"
                        break
                    fi
                    echo "合并完成。"

                    # 提示是否远程同步
                    read -p "是否需要远程同步当前分支？ (y/n): " do_push
                    if [ "$do_push" = "y" ]; then
                        git push github $target
                        git push gitee $target
                        echo "远程同步完成。"
                    fi

                    # 提示是否切换回原分支
                    read -p "是否需要切换回原分支 $CURRENT_BRANCH？ (y/n): " switch_back
                    if [ "$switch_back" = "y" ]; then
                        git switch $CURRENT_BRANCH
                        if [ $? -ne 0 ]; then
                            echo "切换回原分支失败。"
                        fi
                    fi
                    break
                else
                    echo "无效选择，请重试。"
                fi
            done
            ;;
        2)
            # 拉取：从 github 拉取当前分支
            CURRENT_BRANCH=$(git branch --show-current)
            echo "正在从 GitHub 拉取当前分支 $CURRENT_BRANCH..."
            git pull github $CURRENT_BRANCH
            if [ $? -ne 0 ]; then
                echo "拉取失败。"
            else
                echo "拉取完成。"
            fi
            ;;
        3)
            # 推送：推送当前分支到 github 和 gitee
            CURRENT_BRANCH=$(git branch --show-current)
            echo "正在推送当前分支 $CURRENT_BRANCH 到 GitHub 和 Gitee..."
            git push github $CURRENT_BRANCH
            git push gitee $CURRENT_BRANCH
            if [ $? -eq 0 ]; then
                echo "推送完成。"
            fi
            ;;
        4)
          # 列出所有本地分支
            branches=($(git branch | sed 's/* //g' | sed 's/ //g'))
            options=("取消" "${branches[@]}")

            echo "请选择目标分支（第一项为取消）："
            select target in "${options[@]}"; do
                if [[ -n "$target" ]]; then
                    CURRENT_BRANCH=$target
                    if [ "$target" = "取消" ]; then
                        break
                    fi

                    # 切换到目标分支
                    git switch $target
                    if [ $? -ne 0 ]; then
                        echo "切换分支失败，请检查分支名。"
                        break
                    fi
                fi
              break
            done
           ;;
        5)
            echo "退出脚本。"
            exit 0
            ;;
        *)
            echo "无效选择，请重试。"
            ;;
    esac
done