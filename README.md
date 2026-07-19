# MAGI SYSTEM - 三位一体 AI 熟議・合議制意思決定デスクトップアプリ

アニメ『新世紀エヴァンゲリオン』に登場する超高精度スーパーコンピュータ**「MAGI（マギ）」**の合議意思決定システムをモチーフにした、OpenAI互換LLM（Local LLM / OpenAI / Groq等）対応の合議・熟議デスクトップアプリケーションです。

自分の中にある3つの視点（**エンジニア・社会人・オタク少年**）が独立して思考し、相互討論（熟議）を経て最終的な合議判決を導き出します。

---

## 🌟 最新の主な特徴

### 1. 「自分の中の3つの思考視点」に基づく初期人格 (The Tripartite Personalities)
単なるフィクションのコピーではなく、個人のセルフ意思決定を多角的にサポートするバランスの良い3つの初期人格を搭載しています。

* 🟠 **MELCHIOR-1 (メルキオール-1)**: `ENGINEER (ITエンジニア)`
  - **論理・技術的クオリティ・効率・システム拡張性**を最優先。
  - 「技術的に実現可能か」「保守性やコード品質は保たれているか」「ロジックに破綻はないか」を冷却に検証。
* 🔷 **BALTHASAR-2 (バルタザール-2)**: `CITIZEN (社会人・組織人)`
  - **現実的実用性・コスト・リスク回避・コンプライアンス**を最優先。
  - 「費用対効果や時間に見合うか」「世間体や周囲との調和を乱さないか」「後でトラブルにならないか」を堅実に検証。
* 🔴 **CASPAR-3 (カスパー-3)**: `OTAKU (オタク少年・ロマン)`
  - **個人のワクワク・直感・圧倒的ロマン・本音**を最優先。
  - 「世間体や無味乾燥なコスト計算を排し、で、最高に面白いのか？心が躍るロマンはあるか？」を熱く主張。

※ 各ユニットのシステムプロンプトや使用モデル（例: DeepSeek / Llama3 / Claude等）は自由にカスタマイズ可能です。

### 2. 単純投票を超えた「熟議プロトコル」 (3-Phase Deliberation)
* **Phase 1: 独立分析 (Initial Analysis)** - 3ユニットが各々の哲学に基づき初案を作成。
* **Phase 2: 相互熟議 (Cross Examination & Debate)** - 他ユニットの初案を吟味し、反論・補足・説得を実施。
* **Phase 3: 最終合議 & 統合報告 (Synthesis & Consensus)** - 各ユニットの個別判定（可決/否決/条件付可決）を集計し、MAGIシステムとしての統合レポートを生成。

### 3. リアルタイム熟議進行 & 意見変節グラフィック (Deliberation Flow Graph)
* 熟議中には **`⚡ DEBATING...`** の動的演出が表示され、判定が覆る可能性をリアルタイムに表現。
* 熟議によって「誰の意見がどう変化したか（`OPINION SHIFT`）」を横軸タイムラインで可視化。
* 誰が誰に対してどんな反論・説得を行ったか（`PERSUADE` / `CRITICISE` / `AGREE`）をネオンベクトルカードで表示。

### 4. フェーズ連動 Dynamic Dock & Favicon アイコン
* 文字を一切排した「3者（3ノード三角形）」の純粋な幾何学エンブレムアイコンを搭載。
* マギの審議フェーズに合わせて、**macOS Dock アイコンおよび Favicon がリアルタイムに単色ネオン光彩変化**（待機 ⚪ / Phase 1 🟠 / Phase 2 🔷 / Phase 3 🟡 / 完了 🟢）。アプリを最小化していても思考状況が一目でわかります。

### 5. 固定ヘッダー & 常時フェーズインジケーター
* スクロール時にも常に最上部に固定される **Sticky Header Layout** を採用。
* ヘッダー中央に現在の審議フェーズ（`PHASE 1: 独立分析中`, `PHASE 2: 相互熟議中`, `CODE 601: 決議完了`）が常時点滅表示。
* macOS ウィンドウドラッグ移動に対応し、日本語 IME 変換キー入力の誤送信防止機能を完備。

### 6. 外部ドキュメント (URL) の自動解析 & コンテキスト隔離
* 議題文中のURLや添付されたWebページからメイン記事テキストのみを自動抽出し、マギの参考資料として読み込み。
* 過去会話や無関係な過去文脈の混入を防ぐ厳密なコンテキスト隔離（Context Isolation）ルールを適用。

### 7. OpenAI 互換 API 柔軟対応 & ✨ AI人格生成アシスタント
* **対応エンドポイント**: Ollama (`http://localhost:11434/v1`), LM Studio, OpenAI, Groq, DeepSeek, LocalAI 等。
* **AI人格アシスタント**: 「`皮肉屋の投資家`」「`超慎重なセキュリティ専門家`」などのキーワードを入力するだけで、LLMが適合する性格プロンプトを自動生成。

---

## 📦 インストール方法 (macOS Homebrew)

[blue1st/homebrew-taps](https://github.com/blue1st/homebrew-taps) を経由して Homebrew から簡単にインストールできます。

```bash
# Tap リポジトリの追加
brew tap blue1st/taps

# MAGI System のインストール
brew install magi-system
```

※ インストール時に macOS の未署名警告を自動解除するため、Cask 内で `xattr -dr com.apple.quarantine` が自動実行されます。

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

### デスクトップバイナリ (Zip) のビルド
```bash
npm run dist
```
ビルド成果物は `release/` ディレクトリに出力されます。

---

## 🚀 バージョンリリース手順 (release-it)

```bash
npm run release
```
`release-it` により、バージョン選択、`CHANGELOG.md` の自動更新、Git タグ打ち、GitHub Release 作成、および GitHub Actions と連携した Homebrew Tap の更新が全自動で進行します。

---

## 📄 ライセンス

MIT License © [blue1st](https://github.com/blue1st)
