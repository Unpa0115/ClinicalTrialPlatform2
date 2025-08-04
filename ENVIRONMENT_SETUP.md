# 環境設定ガイド

## 重要: 認証情報の管理

このプロジェクトでは、セキュリティ上の理由から実際の認証情報はGitリポジトリに含まれていません。

## 環境変数ファイルの設定

### 1. ローカル開発用の環境変数ファイルを作成

```bash
# .env.localファイルを作成（このファイルはGitで追跡されません）
cp .env.example .env.local
```

### 2. 実際の認証情報を設定

`.env.local`ファイルを編集して、以下の値を実際の値に置き換えてください：

```bash
# AWS基本認証情報（実際の値に置き換え）
AWS_ACCESS_KEY_ID=your-actual-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret-access-key

# Cognito設定（実際の値に置き換え）
COGNITO_USER_POOL_ID=your-actual-user-pool-id
COGNITO_BACKEND_CLIENT_ID=your-actual-backend-client-id
COGNITO_BACKEND_CLIENT_SECRET=your-actual-backend-client-secret
VITE_COGNITO_CLIENT_ID=your-actual-frontend-client-id
```

### 3. アプリケーションの起動

```bash
# 環境変数を読み込んでアプリケーションを起動
npm run dev
```

## ファイル構成

- `.env.example` - 環境変数のテンプレート（Gitで追跡）
- `.env.local` - 実際の認証情報（Gitで追跡されない）

## セキュリティ注意事項

1. **実際の認証情報は絶対にGitにコミットしない**
2. **`.env.local`ファイルは`.gitignore`に含まれている**
3. **本番環境では環境変数やAWS Secrets Managerを使用**
4. **認証情報を共有する際は安全な方法を使用**

## 実際の設定値の取得

開発環境で使用する実際の値は、プロジェクト管理者から安全な方法で取得してください。

```bash
# .env.localファイルに実際の値を設定してください
AWS_ACCESS_KEY_ID=your-actual-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret-access-key
COGNITO_USER_POOL_ID=your-actual-user-pool-id
COGNITO_BACKEND_CLIENT_ID=your-actual-backend-client-id
COGNITO_BACKEND_CLIENT_SECRET=your-actual-backend-client-secret
VITE_COGNITO_CLIENT_ID=your-actual-frontend-client-id
COGNITO_DOMAIN=your-actual-cognito-domain
VITE_COGNITO_DOMAIN=your-actual-cognito-domain
```

詳細な設定手順は`COGNITO_SETUP.md`を参照してください。