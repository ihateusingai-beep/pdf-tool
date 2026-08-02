# Desktop Tool Wrapper 死鎖修復指南

**寫低日期：** 2026-08-02 (Mavis)
**目的：** 永久解 bash wrapper 死鎖於舊 `tools/pdf/` path,讓 future session 嘅所有 bash / git / npm 都正常用
**嚴重性：** 🔴 HIGH — 影響所有 Mavis capability 嘅一半 (cron, npm test, git ops, 任何 shell command)

---

## 0. 問題重現 (Reproduce)

**症狀 (任何 bash call 都 fail):**
```bash
$ bash -c 'pwd'
Working directory does not exist: /Users/kencheng/workspace/vs code/tools/pdf
Cannot execute commands.

$ bash -c 'cd / && ls'
Working directory does not exist: /Users/kencheng/workspace/vs code/tools/pdf
Cannot execute commands.

$ bash -c 'git -C "/Users/kencheng/workspace/vs code/pdf" log'
Working directory does not exist: /Users/kencheng/workspace/vs code/tools/pdf
Cannot execute commands.
```

連 `cd / && ...` / `env -C ...` / `git -C ...` 都救唔返 — **wrapper 係 hard-code 死 `workdir` env var**。

**但 Read/Edit/Write 工具用 absolute path 入到新 path** — 因為佢哋唔用 `workdir`,直接用 `path` arg。

---

## 1. Root cause

Desktop tool (Mavis runtime) 嘅 session 設定入面有 1 個 `workspace` / `workdir` env var,hard-code 咗:

```
/Users/kencheng/workspace/vs code/tools/pdf
```

但 user 喺 2026-07-19 rename 咗:
- ❌ 舊: `~/workspace/vs code/tools/pdf` (已不存在)
- ✅ 新: `~/workspace/vs code/pdf/`

12 日後(2026-08-01),desktop tool 嘅 workdir 設定仍然指住舊 path,所有 bash call 永久死。

### 1.1 2026-08-02 update:Method 1+2 唔 work (Mavis 試過)

**Mavis 親自 recon 嘅 finding (2026-08-02):**
- ❌ `/Users/kencheng/.minimax/permission.json` — 冇 workdir 設定,只係 tool permission allow list
- ❌ `/Users/kencheng/.minimax/agents/mavis/opencode/opencode.json` — opencode config,冇 workdir setting
- ❌ `/Users/kencheng/.minimax/agents/mavis/*/opencode.json` — 同上
- ❌ `~/Library/Preferences/com.openjarvis.desktop.plist` — **binary plist,Read tool 廢** (NUL bytes 截斷)
- ❌ `~/Library/Preferences/com.electron.nativefier.*.plist` — **binary plist,Read tool 廢**
- ❌ bash 死,冇辦法用 `plutil` / `defaults read` 改 binary plist
- ✅ **唯一可行 fix:Method 3 開 git worktree** (但要 user 手動跑,因為 Mavis bash 死咗)

**結論:** desktop tool 嘅 workdir hard-code 喺 process level (Electron app runtime state),**冇 user-accessible config file** 可以改。Method 1+2 理論可行但實際上搵唔到入口。

---

## 2. 修復 step-by-step (3 個 method)

### 2.1 Method 1: Desktop GUI 直接改 (最 simple)

1. 開 desktop tool (Mavis / MiniMax Code) 嘅 preference / settings
2. 搵 "Workspace" / "Working Directory" / "Project Root" 設定
3. 將 value 改去:
   ```
   /Users/kencheng/workspace/vs code/pdf
   ```
4. Save + 重新開新 session
5. Test: 開新 session 後跑 `pwd` 確認係 `~/workspace/vs code/pdf`

**如果搵唔到呢個 setting:** skip 去 Method 2 / 3

### 2.2 Method 2: 用 desktop tool 嘅 init command / project file

如果 desktop tool 有 `init` / `setup` command 或會讀 `.minimax/` config:
- 搵 desktop tool 嘅 config dir (通常 `~/Library/Application Support/<app-name>/` on Mac)
- 入面搵 `workspace.json` / `session.json` / `config.yaml` 類似 file
- 改入面嘅 `workdir` / `workspace` 字段

### 2.3 Method 3: 開 git worktree 喺舊 path (workaround) — **RECOMMENDED**

**2026-08-02 update:** 經過 recon 之後,Method 1 同 Method 2 實際上搵唔到 config 入口(詳見 §1.1),**Method 3 係唯一可行 fix**。

如果前面 2 個 method 都唔得 (desktop tool 嘅 setting 係 immutable / admin 鎖咗):

**Option A: 跑 ready-made script (推薦)**
```bash
# Terminal 開新 session
bash "/Users/kencheng/workspace/vs code/pdf/scripts/setup-worktree.sh"
```

**Option B: 逐個 command 跑**
```bash
# 喺 terminal (user 手動,因為 Mavis bash 死咗):
cd "/Users/kencheng/workspace/vs code/pdf"
git worktree add "/Users/kencheng/workspace/vs code/tools/pdf" -b mavis-bridge
```

呢個會:
- 喺舊 path 開新 branch `mavis-bridge` (git worktree 形式)
- Desktop tool 嘅 wrapper 見到 `tools/pdf/` 又存在咗 → 唔再 fail
- Mavis 喺 worktree 改嘅 file 會 commit 落 `mavis-bridge` branch
- User 之後可以 `git merge mavis-bridge` 落 main (喺 `pdf/` path 入面)

**Trade-off:** 多 1 個 branch 要 merge,但**唔需要動 desktop tool config**。

**Merge 返 main workflow:**
```bash
cd "/Users/kencheng/workspace/vs code/pdf"
git fetch "/Users/kencheng/workspace/vs code/tools/pdf" mavis-bridge
git merge mavis-bridge
git push origin main
```

**Cleanup (完事後):**
```bash
git -C "/Users/kencheng/workspace/vs code/pdf" worktree remove --force "/Users/kencheng/workspace/vs code/tools/pdf"
git -C "/Users/kencheng/workspace/vs code/pdf" branch -D mavis-bridge
```

---

## 3. Verify fix 成功

開新 session 跑:
```bash
pwd
# 預期: /Users/kencheng/workspace/vs code/pdf
# (唔再係 /Users/kencheng/workspace/vs code/tools/pdf)

git status --short
# 預期: 4 個 uncommitted (見 PROJECT-PLAN.md §7.2)
#  M index.html
#  M README.md
#  M PLAN_v3.md
# ?? docs/

node -e "console.log('test')"
# 預期: 印 "test" (唔再係 "Working directory does not exist")
```

如果全部 pass → wrapper 修好咗,Mavis 可以正常行所有 git / npm / node command。

---

## 4. 修好之後嘅 cadence

按 PROJECT-PLAN.md §6 + §7 嘅順序:
1. **Q1 push** — 跑 PROJECT-PLAN.md §7.4 嘅 command,把 v3.0.4 + v3.0.5 + docs/tinywow-comparison.md + PROJECT-PLAN.md 4 個 uncommitted file 一次過推上 main
2. **Q3 badge ship** — 加 3 個 trust signal badge 喺 header (見 §5 細節),跟住 commit
3. **Q1+Q3 combined commit** — 一齊 push, 之後可以 update PLAN_v3.md + PROJECT-PLAN.md 嘅 §12 change log

---

## 5. Q3 細節: Trust Signal Badge 設計 (screenshot spec)

### 5.1 Desktop layout
```
┌──────────────────────────────────────────────────────────┐
│ 🛠️ 改 pdf 工具箱 [K.C]  🛡️純前端 🌐內網部署 📁SRI  🌙🔤🖼️ │
└──────────────────────────────────────────────────────────┘
```

3 個 pill 喺 header 中間 / 左邊,3 個 button 喺右邊。

### 5.2 Mobile layout (responsive)
- 3 個 pill 摺埋做 1 個 tooltip button "🛡️ info"
- click 後 popover 顯示 3 個 badge detail

### 5.3 HTML snippet (for v3.0.5 → v3.0.6 batch)
```html
<div class="hidden md:flex items-center gap-2 ml-4">
    <span class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium" title="所有檔案均在本地端處理,絕不外傳">
        🛡️ 100% 純前端
    </span>
    <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium" title="學校 IT 可自行 host 喺內部 web server">
        🌐 內網部署 ready
    </span>
    <span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium" title="8 個 CDN library 全部 integrity hash 驗證">
        📁 8 CDN SRI pinned
    </span>
</div>
```

### 5.4 Cost & benefit
- **LoC:** ~25 (3 pill + 1 mobile responsive collapse)
- **Risk:** 0 (pure presentation)
- **Benefit:** 對標 TinyWow 嘅 unique value prop + trust anchor 對 SEN 學校 IT

---

## 6. 仲有 1 個長期 fix: 改 desktop tool 嘅 default workdir

如果 desktop tool 嘅 `init` / `setup` 有 `default_workspace` 設定,可以一勞永逸:
- 將 default 改去 `~/workspace/vs code/` (parent dir)
- 咁 future project 開 worktree 都唔會撞呢個死鎖
- 或者乾脆 disable hard-code workdir (auto-detect git root)

呢個係 Q4 嘅 long-term 治本 fix,但要 desktop tool 嘅 admin permission。

---

## 7. 如果 user 唔郁 desktop tool,接受摩擦

選擇 Method 3 嘅 worktree workaround 嘅話:
- Mavis 仍然寫-only (Read/Edit/Write 正常)
- 每個 batch commit 都要:
  1. Mavis 寫 file 落 worktree branch
  2. User 喺 main path (`pdf/`) 跑 `git fetch + git merge mavis-bridge`
  3. User push
- Friction: 每 batch 3 step (vs fix 咗之後 1 step)
- 但**唔需要治本**,可以慢慢解

**Bottom line:** Method 1 (GUI 直接改) 30 秒搞掂,Method 3 (worktree) fallback。

---

**Status:** Q4 doc ship 咗,等 user 揀 method + execute。Q3 ship 等 Q4 fix 之後做。
