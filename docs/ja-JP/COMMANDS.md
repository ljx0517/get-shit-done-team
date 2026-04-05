# GSD コマンドリファレンス

> コマンド構文、フラグ、オプション、使用例の完全なリファレンスです。機能の詳細については[機能リファレンス](FEATURES.md)を、ワークフローのチュートリアルについては[ユーザーガイド](USER-GUIDE.md)をご覧ください。

---

## コマンド構文

- **Claude Code / Gemini / Copilot:** `/gsdt:command-name [args]`
- **Vibe Agent Team:** `/gsd-command-name [args]`
- **Codex:** `$gsd-command-name [args]`

---

## コアワークフローコマンド

### `/gsdt:new-project`

詳細なコンテキスト収集を行い、新しいプロジェクトを初期化します。

| フラグ | 説明 |
|------|-------------|
| `--auto @file.md` | ドキュメントから自動抽出し、対話的な質問をスキップ |

**前提条件:** 既存の `.gsdt-planning/PROJECT.md` がないこと
**生成物:** `PROJECT.md`、`REQUIREMENTS.md`、`ROADMAP.md`、`STATE.md`、`config.json`、`research/`、`CLAUDE.md`

```bash
/gsdt:new-project                    # 対話モード
/gsdt:new-project --auto @prd.md     # PRDから自動抽出
```

---

### `/gsdt:new-workspace`

リポジトリのコピーと独立した `.gsdt-planning/` ディレクトリを持つ分離されたワークスペースを作成します。

| フラグ | 説明 |
|------|-------------|
| `--name <name>` | ワークスペース名（必須） |
| `--repos repo1,repo2` | カンマ区切りのリポジトリパスまたは名前 |
| `--path /target` | 対象ディレクトリ（デフォルト: `~/gsdt-workspaces/<name>`） |
| `--strategy worktree\|clone` | コピー戦略（デフォルト: `worktree`） |
| `--branch <name>` | チェックアウトするブランチ（デフォルト: `workspace/<name>`） |
| `--auto` | 対話的な質問をスキップ |

**ユースケース:**
- マルチリポ: リポジトリのサブセットを分離されたGSD状態で作業
- 機能の分離: `--repos .` で現在のリポジトリのworktreeを作成

**生成物:** `WORKSPACE.md`、`.gsdt-planning/`、リポジトリコピー（worktreeまたはclone）

```bash
/gsdt:new-workspace --name feature-b --repos hr-ui,ZeymoAPI
/gsdt:new-workspace --name feature-b --repos . --strategy worktree  # 同一リポジトリの分離
/gsdt:new-workspace --name spike --repos api,web --strategy clone   # フルクローン
```

---

### `/gsdt:list-workspaces`

アクティブなGSDワークスペースとそのステータスを一覧表示します。

**スキャン対象:** `~/gsdt-workspaces/` 内の `WORKSPACE.md` マニフェスト
**表示内容:** 名前、リポジトリ数、戦略、GSDプロジェクトのステータス

```bash
/gsdt:list-workspaces
```

---

### `/gsdt:remove-workspace`

ワークスペースを削除し、git worktreeをクリーンアップします。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `<name>` | はい | 削除するワークスペース名 |

**安全性:** コミットされていない変更があるリポジトリの削除を拒否します。名前の確認が必要です。

```bash
/gsdt:remove-workspace feature-b
```

---

### `/gsdt:discuss-phase`

計画の前に実装に関する意思決定を記録します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは現在のフェーズ） |

| フラグ | 説明 |
|------|-------------|
| `--auto` | すべての質問で推奨デフォルトを自動選択 |
| `--batch` | 質問を一つずつではなくバッチ取り込みでグループ化 |
| `--analyze` | ディスカッション中にトレードオフ分析を追加 |

**前提条件:** `.gsdt-planning/ROADMAP.md` が存在すること
**生成物:** `{phase}-CONTEXT.md`、`{phase}-DISCUSSION-LOG.md`（監査証跡）

```bash
/gsdt:discuss-phase 1                # フェーズ1の対話的ディスカッション
/gsdt:discuss-phase 3 --auto         # フェーズ3でデフォルトを自動選択
/gsdt:discuss-phase --batch          # 現在のフェーズのバッチモード
/gsdt:discuss-phase 2 --analyze      # トレードオフ分析付きディスカッション
```

---

### `/gsdt:ui-phase`

フロントエンドフェーズのUIデザイン契約書を生成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは現在のフェーズ） |

**前提条件:** `.gsdt-planning/ROADMAP.md` が存在し、フェーズにフロントエンド/UI作業があること
**生成物:** `{phase}-UI-SPEC.md`

```bash
/gsdt:ui-phase 2                     # フェーズ2のデザイン契約書
```

---

### `/gsdt:plan-phase`

フェーズの調査、計画、検証を行います。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは次の未計画フェーズ） |

| フラグ | 説明 |
|------|-------------|
| `--auto` | 対話的な確認をスキップ |
| `--research` | RESEARCH.mdが存在しても強制的に再調査 |
| `--skip-research` | ドメイン調査ステップをスキップ |
| `--gaps` | ギャップ解消モード（VERIFICATION.mdを読み込み、調査をスキップ） |
| `--skip-verify` | プランチェッカーの検証ループをスキップ |
| `--prd <file>` | discuss-phaseの代わりにPRDファイルをコンテキストとして使用 |
| `--reviews` | REVIEWS.mdのクロスAIレビューフィードバックで再計画 |

**前提条件:** `.gsdt-planning/ROADMAP.md` が存在すること
**生成物:** `{phase}-RESEARCH.md`、`{phase}-{N}-PLAN.md`、`{phase}-VALIDATION.md`

```bash
/gsdt:plan-phase 1                   # フェーズ1の調査＋計画＋検証
/gsdt:plan-phase 3 --skip-research   # 調査なしで計画（馴染みのあるドメイン）
/gsdt:plan-phase --auto              # 非対話型の計画
```

---

### `/gsdt:execute-phase`

フェーズ内のすべてのプランをウェーブベースの並列化で実行するか、特定のウェーブを実行します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | **はい** | 実行するフェーズ番号 |
| `--wave N` | いいえ | フェーズ内のウェーブ `N` のみを実行 |

**前提条件:** フェーズにPLAN.mdファイルがあること
**生成物:** プランごとの `{phase}-{N}-SUMMARY.md`、gitコミット、フェーズ完了時に `{phase}-VERIFICATION.md`

```bash
/gsdt:execute-phase 1                # フェーズ1を実行
/gsdt:execute-phase 1 --wave 2       # ウェーブ2のみを実行
```

---

### `/gsdt:verify-work`

自動診断付きのユーザー受入テスト。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは最後に実行されたフェーズ） |

**前提条件:** フェーズが実行済みであること
**生成物:** `{phase}-UAT.md`、問題が見つかった場合は修正プラン

```bash
/gsdt:verify-work 1                  # フェーズ1のUAT
```

---

### `/gsdt:next`

次の論理的なワークフローステップに自動的に進みます。プロジェクトの状態を読み取り、適切なコマンドを実行します。

**前提条件:** `.gsdt-planning/` ディレクトリが存在すること
**動作:**
- プロジェクトなし → `/gsdt:new-project` を提案
- フェーズにディスカッションが必要 → `/gsdt:discuss-phase` を実行
- フェーズに計画が必要 → `/gsdt:plan-phase` を実行
- フェーズに実行が必要 → `/gsdt:execute-phase` を実行
- フェーズに検証が必要 → `/gsdt:verify-work` を実行
- 全フェーズ完了 → `/gsdt:complete-milestone` を提案

```bash
/gsdt:next                           # 次のステップを自動検出して実行
```

---

### `/gsdt:session-report`

作業サマリー、成果、推定リソース使用量を含むセッションレポートを生成します。

**前提条件:** 直近の作業があるアクティブなプロジェクト
**生成物:** `.gsdt-planning/reports/SESSION_REPORT.md`

```bash
/gsdt:session-report                 # セッション後のサマリーを生成
```

**レポートに含まれる内容:**
- 実施した作業（コミット、実行したプラン、進行したフェーズ）
- 成果と成果物
- ブロッカーと意思決定
- 推定トークン/コスト使用量
- 次のステップの推奨事項

---

### `/gsdt:ship`

完了したフェーズの作業から自動生成された本文でPRを作成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号またはマイルストーンバージョン（例: `4` または `v1.0`） |
| `--draft` | いいえ | ドラフトPRとして作成 |

**前提条件:** フェーズが検証済み（`/gsdt:verify-work` が合格）、`gh` CLIがインストールされ認証済みであること
**生成物:** 計画アーティファクトからリッチな本文を持つGitHub PR、STATE.mdの更新

```bash
/gsdt:ship 4                         # フェーズ4をシップ
/gsdt:ship 4 --draft                 # ドラフトPRとしてシップ
```

**PR本文に含まれる内容:**
- ROADMAP.mdからのフェーズ目標
- SUMMARY.mdファイルからの変更サマリー
- 対応した要件（REQ-ID）
- 検証ステータス
- 主要な意思決定

---

### `/gsdt:ui-review`

実装済みフロントエンドの事後的な6軸ビジュアル監査。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは最後に実行されたフェーズ） |

**前提条件:** プロジェクトにフロントエンドコードがあること（単体で動作、GSDプロジェクト不要）
**生成物:** `{phase}-UI-REVIEW.md`、`.gsdt-planning/ui-reviews/` 内のスクリーンショット

```bash
/gsdt:ui-review                      # 現在のフェーズを監査
/gsdt:ui-review 3                    # フェーズ3を監査
```

---

### `/gsdt:audit-uat`

全フェーズを横断した未処理のUATおよび検証項目の監査。

**前提条件:** 少なくとも1つのフェーズがUATまたは検証付きで実行されていること
**生成物:** カテゴリ分類された監査レポートと人間用テストプラン

```bash
/gsdt:audit-uat
```

---

### `/gsdt:audit-milestone`

マイルストーンが完了定義を満たしたかを検証します。

**前提条件:** 全フェーズが実行済みであること
**生成物:** ギャップ分析付き監査レポート

```bash
/gsdt:audit-milestone
```

---

### `/gsdt:complete-milestone`

マイルストーンをアーカイブし、リリースをタグ付けします。

**前提条件:** マイルストーン監査が完了していること（推奨）
**生成物:** `MILESTONES.md` エントリ、gitタグ

```bash
/gsdt:complete-milestone
```

---

### `/gsdt:milestone-summary`

チームのオンボーディングやレビューのために、マイルストーンのアーティファクトから包括的なプロジェクトサマリーを生成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `version` | いいえ | マイルストーンバージョン（デフォルトは現在/最新のマイルストーン） |

**前提条件:** 少なくとも1つの完了済みまたは進行中のマイルストーンがあること
**生成物:** `.gsdt-planning/reports/MILESTONE_SUMMARY-v{version}.md`

**サマリーに含まれる内容:**
- 概要、アーキテクチャの意思決定、フェーズごとの詳細分析
- 主要な意思決定とトレードオフ
- 要件カバレッジ
- 技術的負債と先送り項目
- 新しいチームメンバー向けのスタートガイド
- 生成後に対話的なQ&Aを提供

```bash
/gsdt:milestone-summary                # 現在のマイルストーンをサマリー
/gsdt:milestone-summary v1.0           # 特定のマイルストーンをサマリー
```

---

### `/gsdt:new-milestone`

次のバージョンサイクルを開始します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | いいえ | マイルストーン名 |
| `--reset-phase-numbers` | いいえ | 新しいマイルストーンをフェーズ1から開始し、ロードマップ作成前に古いフェーズディレクトリをアーカイブ |

**前提条件:** 前のマイルストーンが完了していること
**生成物:** 更新された `PROJECT.md`、新しい `REQUIREMENTS.md`、新しい `ROADMAP.md`

```bash
/gsdt:new-milestone                  # 対話モード
/gsdt:new-milestone "v2.0 Mobile"    # 名前付きマイルストーン
/gsdt:new-milestone --reset-phase-numbers "v2.0 Mobile"  # マイルストーン番号を1からリスタート
```

---

## フェーズ管理コマンド

### `/gsdt:add-phase`

ロードマップに新しいフェーズを追加します。

```bash
/gsdt:add-phase                      # 対話型 — フェーズの説明を入力
```

### `/gsdt:insert-phase`

小数番号を使用して、フェーズ間に緊急の作業を挿入します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | このフェーズ番号の後に挿入 |

```bash
/gsdt:insert-phase 3                 # フェーズ3と4の間に挿入 → 3.1を作成
```

### `/gsdt:remove-phase`

将来のフェーズを削除し、後続のフェーズの番号を振り直します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | 削除するフェーズ番号 |

```bash
/gsdt:remove-phase 7                 # フェーズ7を削除、8→7、9→8等に番号振り直し
```

### `/gsdt:list-phase-assumptions`

計画前にClaudeの意図するアプローチをプレビューします。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/gsdt:list-phase-assumptions 2       # フェーズ2の前提を確認
```

### `/gsdt:plan-milestone-gaps`

マイルストーン監査のギャップを解消するフェーズを作成します。

```bash
/gsdt:plan-milestone-gaps             # 各監査ギャップに対してフェーズを作成
```

### `/gsdt:research-phase`

詳細なエコシステム調査のみを実行します（単体機能 — 通常は `/gsdt:plan-phase` を使用してください）。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/gsdt:research-phase 4               # フェーズ4のドメインを調査
```

### `/gsdt:validate-phase`

遡及的にNyquistバリデーションのギャップを監査・補填します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/gsdt:validate-phase 2               # フェーズ2のテストカバレッジを監査
```

---

## ナビゲーションコマンド

### `/gsdt:progress`

ステータスと次のステップを表示します。

```bash
/gsdt:progress                       # "今どこにいる？次は何？"
```

### `/gsdt:resume-work`

前回のセッションから完全なコンテキストを復元します。

```bash
/gsdt:resume-work                    # コンテキストリセットまたは新しいセッション後に使用
```

### `/gsdt:pause-work`

フェーズの途中で中断する際にコンテキストのハンドオフを保存します。

```bash
/gsdt:pause-work                     # continue-here.mdを作成
```

### `/gsdt:manager`

1つのターミナルから複数のフェーズを管理する対話的なコマンドセンター。

**前提条件:** `.gsdt-planning/ROADMAP.md` が存在すること
**動作:**
- 全フェーズのビジュアルステータスインジケータ付きダッシュボード
- 依存関係と進捗に基づいた最適な次のアクションを推奨
- 作業のディスパッチ: discussはインラインで実行、plan/executeはバックグラウンドエージェントとして実行
- 1つのターミナルから複数フェーズの作業を並列化するパワーユーザー向け

```bash
/gsdt:manager                        # コマンドセンターダッシュボードを開く
```

---

### `/gsdt:help`

すべてのコマンドと使用ガイドを表示します。

```bash
/gsdt:help                           # クイックリファレンス
```

---

## ユーティリティコマンド

### `/gsdt:quick`

GSDの保証付きでアドホックタスクを実行します。

| フラグ | 説明 |
|------|-------------|
| `--full` | プランチェック（2回のイテレーション）＋実行後検証を有効化 |
| `--discuss` | 軽量な事前計画ディスカッション |
| `--research` | 計画前にフォーカスされたリサーチャーを起動 |

フラグは組み合わせ可能です。

```bash
/gsdt:quick                          # 基本的なクイックタスク
/gsdt:quick --discuss --research     # ディスカッション＋調査＋計画
/gsdt:quick --full                   # プランチェックと検証付き
/gsdt:quick --discuss --research --full  # すべてのオプションステージ
```

### `/gsdt:autonomous`

残りのすべてのフェーズを自律的に実行します。

| フラグ | 説明 |
|------|-------------|
| `--from N` | 特定のフェーズ番号から開始 |

```bash
/gsdt:autonomous                     # 残りの全フェーズを実行
/gsdt:autonomous --from 3            # フェーズ3から開始
```

### `/gsdt:do`

フリーテキストを適切なGSDコマンドにルーティングします。

```bash
/gsdt:do                             # その後、やりたいことを説明
```

### `/gsdt:note`

手軽にアイデアをキャプチャ — メモの追加、一覧表示、またはTodoへの昇格。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `text` | いいえ | キャプチャするメモテキスト（デフォルト: 追加モード） |
| `list` | いいえ | プロジェクトおよびグローバルスコープからすべてのメモを一覧表示 |
| `promote N` | いいえ | メモNを構造化されたTodoに変換 |

| フラグ | 説明 |
|------|-------------|
| `--global` | メモ操作にグローバルスコープを使用 |

```bash
/gsdt:note "Consider caching strategy for API responses"
/gsdt:note list
/gsdt:note promote 3
```

### `/gsdt:debug`

永続的な状態を持つ体系的なデバッグ。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | いいえ | バグの説明 |

```bash
/gsdt:debug "Login button not responding on mobile Safari"
```

### `/gsdt:add-todo`

後で取り組むアイデアやタスクをキャプチャします。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | いいえ | Todoの説明 |

```bash
/gsdt:add-todo "Consider adding dark mode support"
```

### `/gsdt:check-todos`

保留中のTodoを一覧表示し、取り組むものを選択します。

```bash
/gsdt:check-todos
```

### `/gsdt:add-tests`

完了したフェーズのテストを生成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/gsdt:add-tests 2                    # フェーズ2のテストを生成
```

### `/gsdt:stats`

プロジェクトの統計情報を表示します。

```bash
/gsdt:stats                          # プロジェクトメトリクスダッシュボード
```

### `/gsdt:profile-user`

Claude Codeのセッション分析から8つの次元（コミュニケーションスタイル、意思決定パターン、デバッグアプローチ、UXプリファレンス、ベンダー選択、フラストレーションのトリガー、学習スタイル、説明の深さ）にわたる開発者行動プロファイルを生成します。Claudeのレスポンスをパーソナライズするアーティファクトを生成します。

| フラグ | 説明 |
|------|-------------|
| `--questionnaire` | セッション分析の代わりに対話型アンケートを使用 |
| `--refresh` | セッションを再分析してプロファイルを再生成 |

**生成されるアーティファクト:**
- `USER-PROFILE.md` — 完全な行動プロファイル
- `/gsdt:dev-preferences` コマンド — 任意のセッションでプリファレンスをロード
- `CLAUDE.md` プロファイルセクション — Claude Codeが自動検出

```bash
/gsdt:profile-user                   # セッションを分析してプロファイルを構築
/gsdt:profile-user --questionnaire   # 対話型アンケートのフォールバック
/gsdt:profile-user --refresh         # 新鮮な分析からの再生成
```

### `/gsdt:health`

`.gsdt-planning/` ディレクトリの整合性を検証します。

| フラグ | 説明 |
|------|-------------|
| `--repair` | 回復可能な問題を自動修復 |

```bash
/gsdt:health                         # 整合性チェック
/gsdt:health --repair                # チェックして修復
```

### `/gsdt:cleanup`

完了したマイルストーンの蓄積されたフェーズディレクトリをアーカイブします。

```bash
/gsdt:cleanup
```

---

## 診断コマンド

### `/gsdt:forensics`

失敗またはスタックしたGSDワークフローの事後調査。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | いいえ | 問題の説明（省略時はプロンプトで入力） |

**前提条件:** `.gsdt-planning/` ディレクトリが存在すること
**生成物:** `.gsdt-planning/forensics/report-{timestamp}.md`

**調査の対象:**
- Git履歴分析（直近のコミット、スタックパターン、時間的ギャップ）
- アーティファクトの整合性（完了フェーズで期待されるファイル）
- STATE.mdの異常とセッション履歴
- コミットされていない作業、コンフリクト、放棄された変更
- 少なくとも4種類の異常をチェック（スタックループ、欠損アーティファクト、放棄された作業、クラッシュ/中断）
- アクション可能な所見がある場合、GitHubイシューの作成を提案

```bash
/gsdt:forensics                              # 対話型 — 問題の入力を促す
/gsdt:forensics "Phase 3 execution stalled"  # 問題の説明付き
```

---

## ワークストリーム管理

### `/gsdt:workstreams`

マイルストーンの異なる領域で並行作業するためのワークストリームを管理します。

**サブコマンド:**

| サブコマンド | 説明 |
|------------|-------------|
| `list` | すべてのワークストリームをステータス付きで一覧表示（サブコマンド未指定時のデフォルト） |
| `create <name>` | 新しいワークストリームを作成 |
| `status <name>` | 1つのワークストリームの詳細ステータス |
| `switch <name>` | アクティブなワークストリームを設定 |
| `progress` | 全ワークストリームの進捗サマリー |
| `complete <name>` | 完了したワークストリームをアーカイブ |
| `resume <name>` | ワークストリームでの作業を再開 |

**前提条件:** アクティブなGSDプロジェクト
**生成物:** `.gsdt-planning/` 配下のワークストリームディレクトリ、ワークストリームごとの状態追跡

```bash
/gsdt:workstreams                    # すべてのワークストリームを一覧表示
/gsdt:workstreams create backend-api # 新しいワークストリームを作成
/gsdt:workstreams switch backend-api # アクティブなワークストリームを設定
/gsdt:workstreams status backend-api # 詳細ステータス
/gsdt:workstreams progress           # ワークストリーム横断の進捗概要
/gsdt:workstreams complete backend-api  # 完了したワークストリームをアーカイブ
/gsdt:workstreams resume backend-api    # ワークストリームでの作業を再開
```

---

## 設定コマンド

### `/gsdt:settings`

ワークフロートグルとモデルプロファイルの対話的な設定。

```bash
/gsdt:settings                       # 対話型設定
```

### `/gsdt:set-profile`

クイックプロファイル切り替え。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `profile` | **はい** | `quality`、`balanced`、`budget`、または `inherit` |

```bash
/gsdt:set-profile budget             # budgetプロファイルに切り替え
/gsdt:set-profile quality            # qualityプロファイルに切り替え
```

---

## ブラウンフィールドコマンド

### `/gsdt:map-codebase`

並列マッパーエージェントで既存のコードベースを分析します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `area` | いいえ | マッピングを特定の領域にスコープ |

```bash
/gsdt:map-codebase                   # コードベース全体を分析
/gsdt:map-codebase auth              # auth領域にフォーカス
```

---

## アップデートコマンド

### `/gsdt:update`

変更履歴のプレビュー付きでGSDをアップデートします。

```bash
/gsdt:update                         # アップデートを確認してインストール
```

### `/gsdt:reapply-patches`

GSDアップデート後にローカルの変更を復元します。

```bash
/gsdt:reapply-patches                # ローカルの変更をマージバック
```

---

## 高速＆インラインコマンド

### `/gsdt:fast`

簡単なタスクをインラインで実行 — サブエージェントなし、計画のオーバーヘッドなし。タイポ修正、設定変更、小さなリファクタリング、忘れたコミットなどに最適。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `task description` | いいえ | 実行する内容（省略時はプロンプトで入力） |

**`/gsdt:quick` の代替ではありません** — 調査、複数ステップの計画、または検証が必要な場合は `/gsdt:quick` を使用してください。

```bash
/gsdt:fast "fix typo in README"
/gsdt:fast "add .env to gitignore"
```

---

## コード品質コマンド

### `/gsdt:review`

外部AI CLIからのフェーズプランのクロスAIピアレビュー。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `--phase N` | **はい** | レビューするフェーズ番号 |

| フラグ | 説明 |
|------|-------------|
| `--gemini` | Gemini CLIレビューを含める |
| `--claude` | Claude CLIレビューを含める（別セッション） |
| `--codex` | Codex CLIレビューを含める |
| `--all` | 利用可能なすべてのCLIを含める |

**生成物:** `{phase}-REVIEWS.md` — `/gsdt:plan-phase --reviews` で利用可能

```bash
/gsdt:review --phase 3 --all
/gsdt:review --phase 2 --gemini
```

---

### `/gsdt:pr-branch`

`.gsdt-planning/` のコミットをフィルタリングしてクリーンなPRブランチを作成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `target branch` | いいえ | ベースブランチ（デフォルト: `main`） |

**目的:** レビュアーにはコード変更のみを表示し、GSD計画アーティファクトは含めません。

```bash
/gsdt:pr-branch                     # mainに対してフィルタリング
/gsdt:pr-branch develop             # developに対してフィルタリング
```

---

### `/gsdt:audit-uat`

全フェーズを横断した未処理のUATおよび検証項目の監査。

**前提条件:** 少なくとも1つのフェーズがUATまたは検証付きで実行されていること
**生成物:** カテゴリ分類された監査レポートと人間用テストプラン

```bash
/gsdt:audit-uat
```

---

## バックログ＆スレッドコマンド

### `/gsdt:add-backlog`

999.x番号付けを使用して、バックログのパーキングロットにアイデアを追加します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | **はい** | バックログ項目の説明 |

**999.x番号付け**により、バックログ項目はアクティブなフェーズシーケンスの外に保持されます。フェーズディレクトリは即座に作成されるため、`/gsdt:discuss-phase` や `/gsdt:plan-phase` がそれらに対して動作します。

```bash
/gsdt:add-backlog "GraphQL API layer"
/gsdt:add-backlog "Mobile responsive redesign"
```

---

### `/gsdt:review-backlog`

バックログ項目をレビューし、アクティブなマイルストーンに昇格させます。

**項目ごとのアクション:** 昇格（アクティブシーケンスに移動）、保持（バックログに残す）、削除。

```bash
/gsdt:review-backlog
```

---

### `/gsdt:plant-seed`

トリガー条件付きの将来のアイデアをキャプチャ — 適切なマイルストーンで自動的に表面化します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `idea summary` | いいえ | シードの説明（省略時はプロンプトで入力） |

シードはコンテキストの劣化を解決します：誰も読まないDeferredの一行メモの代わりに、シードは完全なWHY、いつ表面化すべきか、詳細への手がかりを保存します。

**生成物:** `.gsdt-planning/seeds/SEED-NNN-slug.md`
**利用先:** `/gsdt:new-milestone`（シードをスキャンしてマッチするものを提示）

```bash
/gsdt:plant-seed "Add real-time collaboration when WebSocket infra is in place"
```

---

### `/gsdt:thread`

クロスセッション作業のための永続的なコンテキストスレッドを管理します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| （なし） | — | すべてのスレッドを一覧表示 |
| `name` | — | 名前で既存のスレッドを再開 |
| `description` | — | 新しいスレッドを作成 |

スレッドは、複数のセッションにまたがるが特定のフェーズに属さない作業のための軽量なクロスセッション知識ストアです。`/gsdt:pause-work` よりも軽量です。

```bash
/gsdt:thread                         # すべてのスレッドを一覧表示
/gsdt:thread fix-deploy-key-auth     # スレッドを再開
/gsdt:thread "Investigate TCP timeout in pasta service"  # 新規作成
```

---

## コミュニティコマンド

### `/gsdt:join-discord`

Discordコミュニティの招待を開きます。

```bash
/gsdt:join-discord
```
