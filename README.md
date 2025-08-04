# 眼科臨床試験管理プラットフォーム

## 概要

眼科臨床試験における包括的なデータ収集、管理、および監査を支援するWebベースのシステムです。階層的なデータ構造（ClinicalStudy → Survey → Visit → 検査データ）により、標準化された試験実施と高品質なデータ収集を実現します。

## 主要機能

### 実装済み（UIモックアップ）
- **臨床試験作成**: 新しい臨床試験プロトコルの作成と管理
- **患者サーベイ管理**: 患者マスター管理と既存患者のサーベイ割り当て
- **動的検査データ入力**: Visit構成に応じた柔軟な検査データ入力フォーム
- **データレビュー**: 検査データの表示、比較、管理機能

### 技術スタック
- **Frontend**: React 18 + TypeScript + Material-UI v5
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: DynamoDB (AWS SDK v3)
- **Shared**: TypeScript型定義とユーティリティ
- **Development**: Docker + DynamoDB Local

## プロジェクト構造

```
clinical-trial-platform/
├── apps/
│   ├── frontend/          # React フロントエンドアプリケーション
│   └── backend/           # Express.js バックエンドAPI
├── packages/
│   └── shared/            # 共有TypeScript型定義
├── docker-compose.yml     # 開発環境用Docker設定
└── .github/workflows/     # CI/CDパイプライン
```

## 開発環境セットアップ

### 前提条件
- Node.js 18+
- Docker & Docker Compose
- npm

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd clinical-trial-platform
```

2. 依存関係をインストール
```bash
npm install
```

3. 共有パッケージをビルド
```bash
npm run build --workspace=packages/shared
```

4. 環境変数を設定
```bash
cp .env.example .env
```

### 開発サーバー起動

#### Docker使用（推奨）
```bash
# DynamoDB Local + アプリケーションを起動
npm run docker:up

# 停止
npm run docker:down
```

#### ローカル開発
```bash
# DynamoDB Localを起動
docker run -p 8000:8000 amazon/dynamodb-local

# 別ターミナルで開発サーバーを起動
npm run dev
```

### アクセス
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- DynamoDB Local: http://localhost:8000

## UIモックアップ

現在、以下の主要ワークフローのUIモックアップが実装されています：

1. **臨床試験作成** (`/mockups/clinical-study`)
   - 新規臨床試験プロトコルの作成
   - Visit テンプレート設定
   - 既存試験の管理

2. **患者サーベイ管理** (`/mockups/patient-survey`)
   - 患者マスター登録・検索
   - 既存患者のサーベイ割り当て
   - サーベイ進捗管理

3. **動的検査データ入力** (`/mockups/examination-entry`)
   - Visit構成に応じた動的フォーム
   - 左右の目別データ入力
   - 自動保存・下書き機能

4. **データレビュー** (`/mockups/data-review`)
   - 検査データの表示・比較
   - 推移分析とグラフ表示
   - データ品質管理

## 開発コマンド

```bash
# 全体
npm run dev              # フロントエンド + バックエンド同時起動
npm run build            # 全アプリケーションビルド
npm run test             # 全テスト実行
npm run lint             # ESLint実行
npm run format           # Prettier実行

# フロントエンド
npm run dev:frontend     # フロントエンド開発サーバー
npm run build --workspace=apps/frontend

# バックエンド
npm run dev:backend      # バックエンド開発サーバー
npm run build --workspace=apps/backend

# 共有パッケージ
npm run build --workspace=packages/shared
```

## データベース設計

DynamoDBを使用した16テーブル構成：
- ClinicalStudy（臨床試験）
- Organizations（組織）
- Users（ユーザー）
- Patients（患者マスター）
- Surveys（個別患者試験）
- Visits（患者訪問）
- 8つの検査データテーブル
- AuditLog（監査ログ）
- DraftData（下書きデータ）

## 次のステップ

1. **データベーススキーマ実装** (Task 2.2)
2. **認証・認可システム** (Task 3)
3. **臨床試験管理システム** (Task 4)
4. **検査データ収集システム** (Task 6-7)
5. **データ可視化システム** (Task 8)

## ライセンス

[ライセンス情報を記載]