#!/bin/bash
# 解決 desktop tool wrapper 死鎖於舊 path
# 用 git worktree 喺 tools/pdf/ 開 1 個新 branch,等 desktop wrapper 見到舊 path 又存在
#
# 用法: open Terminal 跑呢個 script:
#   bash /Users/kencheng/workspace/vs code/pdf/scripts/setup-worktree.sh
#
# 之後 desktop tool 入面嘅 workdir 就可以指返 tools/pdf/ 但其實係 worktree 形式

set -e

WORKTREE_PATH="/Users/kencheng/workspace/vs code/tools/pdf"
SOURCE_PATH="/Users/kencheng/workspace/vs code/pdf"
BRANCH_NAME="mavis-bridge"

echo "📍 Source: $SOURCE_PATH"
echo "📍 Worktree target: $WORKTREE_PATH"
echo "🌿 Branch: $BRANCH_NAME"
echo ""

# Step 1: 確認 source path 存在
if [ ! -d "$SOURCE_PATH" ]; then
    echo "❌ Source path 不存在: $SOURCE_PATH"
    exit 1
fi

cd "$SOURCE_PATH"

# Step 2: 確認係 git repo
if [ ! -d ".git" ]; then
    echo "❌ Source path 不是 git repo"
    exit 1
fi

# Step 3: 檢查 worktree 是否已存在
if [ -d "$WORKTREE_PATH" ]; then
    echo "⚠️  Worktree path 已存在: $WORKTREE_PATH"
    echo "   如果想重新 setup,先刪除: git -C \"$SOURCE_PATH\" worktree remove --force \"$WORKTREE_PATH\""
    exit 1
fi

# Step 4: 檢查 branch 是否已存在 (-- 不阻擋,只是提示)
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "⚠️  Branch '$BRANCH_NAME' 已存在,將 reuse"
    USE_EXISTING=1
else
    USE_EXISTING=0
fi

# Step 5: 開 worktree
echo "🌱 開 worktree..."
if [ "$USE_EXISTING" = "1" ]; then
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH"
fi

echo ""
echo "✅ Worktree setup 完成!"
echo ""
echo "📂 結構:"
echo "   Main repo:  $SOURCE_PATH  (branch: main)"
echo "   Worktree:   $WORKTREE_PATH  (branch: $BRANCH_NAME)"
echo ""
echo "🚀 之後 desktop tool 用 workdir: $WORKTREE_PATH"
echo "   Mavis 寫嘅 file 會 commit 落 $BRANCH_NAME branch"
echo ""
echo "📌 Merge 返 main 嘅 workflow:"
echo "   cd \"$SOURCE_PATH\""
echo "   git fetch \"$WORKTREE_PATH\" $BRANCH_NAME"
echo "   git merge $BRANCH_NAME"
echo "   git push origin main"
echo ""
echo "🧹 清理 worktree (完事後):"
echo "   git -C \"$SOURCE_PATH\" worktree remove --force \"$WORKTREE_PATH\""
echo "   git -C \"$SOURCE_PATH\" branch -D $BRANCH_NAME"
