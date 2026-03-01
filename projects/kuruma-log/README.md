# 🚗 クルマログ（Kuruma Log）

個人向けカーメンテナンス管理アプリ

---

## 📁 プロジェクト構成

```
kuruma-log/
├── docs/                          # ドキュメント
│   ├── PRD.md                     # Product Requirements Document
│   ├── PROJECT_PLAN.md            # プロジェクト計画書（このファイル）
│   ├── API_SPEC.md                # API 仕様書（作成予定）
│   ├── UI_DESIGN.md               # UI 設計書・ワイヤーフレーム（作成予定）
│   └── ARCHITECTURE.md            # システムアーキテクチャ（作成予定）
│
├── frontend/                      # Vue.js フロントエンド
│   ├── src/
│   │   ├── components/            # 再利用可能なコンポーネント
│   │   │   ├── Button.vue
│   │   │   ├── Form.vue
│   │   │   ├── Chart.vue
│   │   │   └── ...
│   │   ├── pages/                 # ページコンポーネント
│   │   │   ├── HomePage.vue       # ホーム・ダッシュボード
│   │   │   ├── NewRecordPage.vue  # 新規記録フォーム
│   │   │   ├── ListPage.vue       # 記録一覧
│   │   │   └── StatsPage.vue      # 統計ページ
│   │   ├── assets/                # 画像・スタイル
│   │   │   ├── styles/
│   │   │   └── icons/
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── api.js             # API クライアント
│   │   │   └── format.js          # フォーマット関数
│   │   ├── App.vue                # ルートコンポーネント
│   │   └── main.js                # エントリーポイント
│   ├── public/                    # 静的ファイル
│   ├── package.json               # 依存関係
│   ├── vite.config.js             # Vite 設定
│   └── .env.example               # 環境変数テンプレート
│
├── backend/                       # Node.js + Express API
│   ├── src/
│   │   ├── routes/                # API ルート定義
│   │   │   ├── maintenance.js     # メンテナンス CRUD
│   │   │   ├── dashboard.js       # ダッシュボード
│   │   │   └── settings.js        # 設定
│   │   ├── controllers/           # ビジネスロジック
│   │   │   ├── maintenanceController.js
│   │   │   ├── dashboardController.js
│   │   │   └── ...
│   │   ├── models/                # データベース操作
│   │   │   ├── maintenance.js
│   │   │   └── ...
│   │   ├── middleware/            # ミドルウェア
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── db.js              # DB 接続
│   │   │   └── logger.js          # ロギング
│   │   └── app.js                 # Express アプリケーション
│   ├── tests/                     # テスト
│   │   ├── unit/                  # Unit テスト
│   │   └── integration/           # 統合テスト
│   ├── package.json               # 依存関係
│   ├── .env.example               # 環境変数テンプレート
│   └── server.js                  # サーバーエントリー
│
├── database/                      # データベース定義
│   ├── schema.sql                 # DB スキーマ
│   ├── migrations/                # マイグレーションスクリプト
│   │   ├── 001_initial.sql
│   │   └── ...
│   └── seeds/                     # サンプルデータ
│       └── sample_data.sql
│
├── tests/                         # 全体的なテスト
│   ├── e2e/                       # End-to-End テスト
│   └── performance/               # パフォーマンステスト
│
├── docker-compose.yml             # Docker オーケストレーション
├── Dockerfile                     # コンテナイメージ定義
├── .gitignore                     # Git 無視ファイル
├── .env.example                   # 環境変数テンプレート
└── CHANGELOG.md                   # 変更履歴
```

---

## 🚀 クイックスタート

### 前提条件
- Node.js v18+
- npm または yarn
- Docker & docker-compose（オプション）

### 開発環境構築

```bash
# 1. リポジトリクローン
cd /root/.openclaw/workspace/projects/kuruma-log/

# 2. バックエンド環境構築
cd backend
npm install
cp .env.example .env
npm run dev

# 3. フロントエンド環境構築（別ターミナル）
cd frontend
npm install
cp .env.example .env
npm run dev
```

### ブラウザでアクセス
```
http://localhost:5173 (フロント)
http://localhost:3000 (API)
```

---

## 📊 プロジェクト進捗

| フェーズ | 期間 | ステータス | 進捗 |
|---------|------|-----------|------|
| Phase 0: 準備 | 2026-03-01 - 03-07 | 📋 計画中 | 0% |
| Phase 1: バックエンド | 2026-03-08 - 03-21 | ⏳ 予定 | 0% |
| Phase 2: フロントエンド | 2026-03-15 - 03-28 | ⏳ 予定 | 0% |
| Phase 3: テスト・調整 | 2026-03-29 - 04-04 | ⏳ 予定 | 0% |
| Phase 4: リリース | 2026-04-05 - 04-11 | ⏳ 予定 | 0% |

**最終目標完成日**: 2026-04-30

---

## 📚 ドキュメント

| ドキュメント | 内容 | 状態 |
|------------|------|------|
| [PRD.md](./docs/PRD.md) | 製品要件書 | ✅ 確定版 |
| [PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | プロジェクト計画書 | ✅ 確定版 |
| API_SPEC.md | API 仕様書 | 📝 作成予定 |
| UI_DESIGN.md | UI 設計書 | 📝 作成予定 |
| ARCHITECTURE.md | システム設計 | 📝 作成予定 |

---

## 👥 チーム

| 役割 | 担当 |
|------|------|
| PM | クロー（OpenClaw Agent） |
| バックエンド開発 | クロー |
| フロントエンド開発 | クロー |
| テスター | クロー |
| 利害関係者 | しゅんさん |

---

## 📝 意思決定・変更ログ

### 決定事項

#### 決定 #1: MVP スコープ確定
- **日付**: 2026-03-01
- **内容**: 5 種類のメンテナンス記録 + 予定計算 + グラフ
- **承認**: しゅんさん
- **記録**: PRD 内に詳細

#### 決定 #2: 技術スタック確定
- **日付**: 2026-03-01
- **内容**: Vue.js 3 + Node.js/Express + SQLite
- **理由**: シンプル・高速・学習コスト低
- **承認**: クロー（PM）

---

## 🔗 関連リンク

- **GitHub リポジトリ**: （作成予定）
- **本番 URL**: （デプロイ後）
- **ステージング URL**: （デプロイ後）

---

## 📞 お問い合わせ

質問・フィードバック → Discord で相談

---

**作成日**: 2026-03-01  
**バージョン**: v1.0（初版）  
**最終更新**: 2026-03-01
