# オンラインホワイトボード

リアルタイムで複数のユーザーが同時に描画できるオンラインホワイトボードアプリケーションです。

## 機能

- リアルタイム描画
- ルームベースの共同作業
- ペンと消しゴムツール
- 色とサイズの変更
- ボード全体のクリア機能

## セットアップ

### サーバー (Node.js)

```bash
cd server
npm install
npm start
```

### クライアント (React)

```bash
cd client
npm install
npm start
```

## デプロイ

### サーバー - Heroku

1. Herokuアプリを作成
2. `server`ディレクトリをHerokuにデプロイ
3. 環境変数を設定:
   - `CLIENT_URL`: クライアントのURL

### クライアント - Vercel

1. Vercelプロジェクトを作成
2. `client`ディレクトリをVercelにデプロイ
3. 環境変数を設定:
   - `REACT_APP_SERVER_URL`: サーバーのURL

## 使用方法

1. ルームIDを入力して参加するか、新しいルームを作成
2. 描画ツールを選択
3. 色とサイズを調整
4. マウスをドラッグして描画
5. 他のユーザーとリアルタイムで共同作業

## 技術スタック

- **サーバー**: Node.js, Express, Socket.IO
- **クライアント**: React, HTML5 Canvas
- **デプロイ**: Heroku (サーバー), Vercel (クライアント)