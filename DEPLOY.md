# デプロイメントガイド

## Vercel (クライアント) - 完了済み ✅
URL: https://client-qv9fxs5wc-kamechans-projects.vercel.app

## サーバーデプロイメント (複数のオプション)

### Option 1: Heroku
**注意**: アカウント認証（支払い情報の追加）が必要です

```bash
heroku create whiteboard-server-[your-name]
git push heroku main
heroku config:set CLIENT_URL=https://client-qv9fxs5wc-kamechans-projects.vercel.app
```

### Option 2: Render.com
1. https://render.com にサインアップ
2. GitHub連携でリポジトリを選択
3. `render.yaml` 設定を使用して自動デプロイ

### Option 3: Railway
```bash
npm install -g @railway/cli
railway login
railway new
railway up
```

### Option 4: Fly.io
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
fly launch
```

## 環境変数の設定

### サーバー側
- `CLIENT_URL`: Vercelで生成されたクライアントURL
- `PORT`: デプロイプラットフォームが自動設定

### クライアント側 (Vercel)
- `REACT_APP_SERVER_URL`: デプロイされたサーバーのURL

## 接続テスト
1. サーバーがデプロイされたら、Vercelの環境変数を更新
2. Vercelを再デプロイ
3. アプリケーションの動作確認