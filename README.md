# MAGI SYSTEM - 三位一体 AI 熟議・合議制意思決定デスクトップアプリ

アニメ『新世紀エヴァンゲリオン』に登場する超高精度スーパーコンピュータ**「MAGI（マギ）」**の意思決定システムをモチーフにした、OpenAI互換LLM（Local LLM / OpenAI / Groq等）対応の合議・熟議デスクトップアプリケーションです。

---

## 🌟 主な特徴

### 1. 3つの独立人格ユニット (The Tripartite Personalities)
赤木ナオコ博士の3つの面を移植したオリジナルMAGIの構造に基づき、思考回路の異なる3ユニットが独立して議題を審議します。

* 🟠 **MELCHIOR-1 (メルキオール-1)**: `SCIENTIST`（科学者としての論理・データ・技術的合理性を最優先）
* 🔷 **BALTHASAR-2 (バルタザール-2)**: `MOTHER`（母としての人間愛・倫理・リスク回避・保護的視点を最優先）
* 🔴 **CASPAR-3 (カスパー-3)**: `WOMAN`（女としての感情・利害・現実主義・人間臭い直感を最優先）

※ 各ユニットのシステムプロンプトや使用するLLMモデルは自由にカスタマイズ可能です。

### 2. 単純投票を超えた「熟議プロトコル」 (3-Phase Deliberation)
* **Phase 1: 独立分析 (Initial Analysis)** - 3ユニットが各々の哲学に基づき初案を作成。
* **Phase 2: 相互熟議 (Cross Examination & Debate)** - 他ユニットの初案を吟味し、反論・補足・説得を実施。
* **Phase 3: 最終合議 & 統合報告 (Synthesis & Consensus)** - 各ユニットの個別判定（可決/否決/条件付可決）を集計し、MAGIシステムとしての統合レポートを生成。

### 3. 意見変節 & 相互説得ダイナミクスグラフィック (Deliberation Flow Graph)
* 熟議によって「誰の意見がどう変化したか（`OPINION SHIFT`）」を横軸タイムラインで可視化。
* 誰が誰に対してどんな反論・説得を行ったか（`PERSUADE` / `CRITICISE` / `AGREE`）をネオンベクトルカードで表示。

### 4. 外部ドキュメント (URL) の自動解析 & コンテキスト隔離
* 議題文中のURLや添付されたWebページから主要テキストをクリーンに抽出し、マギの参考資料として自動読み込み。
* 他セッションや無関係な過去文脈の混入を防ぐ厳密なコンテキスト隔離（Context Isolation）ルールを適用。

### 5. OpenAI 互換 API 柔軟対応 & ✨ AI人格生成アシスタント
* **対応エンドポイント**: Ollama (`http://localhost:11434/v1`), LM Studio, OpenAI, Groq, DeepSeek, LocalAI 等。
* **AI人格アシスタント**: 「`皮肉屋の投資家`」「`超慎重なセキュリティ専門家`」などのキーワードを入力するだけで、LLMが適合する性格プロンプトを自動生成。

### 6. 特務機関 NERV 風ネオンサイバー UI/UX
* ネオンオレンジ / シアン / マゼンタのヘクスパターンデザイン。
* macOSウィンドウドラッグ移動対応、およびクリックで全文を確認できる**プロトコルログインスペクター**を搭載。

---

## 📦 インストール方法 (macOS Homebrew)

[blue1st/homebrew-taps](https://github.com/blue1st/homebrew-taps) を経由して Homebrew から簡単にインストールできます。

```bash
# Tap リポジトリの追加
brew tap blue1st/taps

# MAGI System のインストール
brew install magi-system
```

※ インストール時に macOS の未署名警告を回避するため、自動的に `xattr -d com.apple.quarantine` が実行され、スムーズに起動できます。

---

## 💻 ローカル開発 & ビルド手順

### 動作要件
* Node.js v18.0.0 以上
* npm v9.0.0 以上

### リポジトリのクローン & パッケージのインストール
```bash
git clone https://github.com/blue1st/magi-system.git
cd magi-system
npm install
```

### 開発モードの起動
```bash
# Web 開発サーバーの起動
npm run dev

# Electron デスクトップアプリの起動
npm run build
npm run electron
```

### デスクトップバイナリ (DMG / Zip) のビルド
```bash
npm run dist
```
ビルド成果物は `release/` ディレクトリに出力されます。

---

## 🚀 バージョンリリース手順 (release-it)

`release-it` を導入しているため、以下のコマンド1つでバージョン選択、CHANGELOG (`CHANGELOG.md`) の自動生成、Git タグ打ち、GitHub Release 作成、および GitHub Actions と連携した Homebrew Tap の更新が全自動で進行します。

```bash
npm run release
```

---

## 📄 ライセンス

MIT License © [blue1st](https://github.com/blue1st)
