#!/bin/bash
# デモ動画の保存スクリプト
# Playwrightが録画したwebm動画をRemotionの素材ディレクトリにコピーする

DEST_DIR="public/remotion/videos"

echo "デモ動画を ${DEST_DIR} に保存中..."

# ディレクトリが存在しない場合は作成
mkdir -p "${DEST_DIR}"

# Playwrightのテスト結果ディレクトリからwebm動画を検索してコピー
if [ -d "test-results" ]; then
  find test-results -name "*.webm" -exec cp {} "${DEST_DIR}/" \;
  echo "test-results から動画をコピーしました"
fi

# 保存された動画を一覧表示
echo ""
echo "保存済みデモ動画:"
ls -la "${DEST_DIR}"/*.webm 2>/dev/null || echo "  (動画なし)"

echo ""
echo "完了！"
