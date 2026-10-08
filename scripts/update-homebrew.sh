#!/bin/bash

# This script updates the Homebrew Cask definition in the tap repository.
# Expected environment variables:
# HOMEBREW_TAP_TOKEN: GitHub Personal Access Token or GitHub App token with repo scope

set -e

TAP_REPO="blue1st/homebrew-taps"
CASK_NAME="magi-system"
PACKAGE_JSON="package.json"

# Get version from package.json
VERSION=$(node -p "require('./$PACKAGE_JSON').version")
echo "Updating Homebrew Cask to version $VERSION"

# Find zip file
ZIP_FILE=$(find . -name "*.zip" | head -n 1)

if [ -z "$ZIP_FILE" ]; then
  echo "Error: Could not find ZIP file"
  exit 1
fi

ZIP_NAME=$(basename "$ZIP_FILE")
SHA256=$(shasum -a 256 "$ZIP_FILE" | awk '{print $1}')

echo "Found ZIP: $ZIP_NAME"
echo "ZIP SHA256: $SHA256"

# Clone the tap repository
TMP_DIR=$(mktemp -d)
git clone "https://x-access-token:${HOMEBREW_TAP_TOKEN}@github.com/${TAP_REPO}.git" "$TMP_DIR"

# Ensure Casks directory exists
mkdir -p "$TMP_DIR/Casks"
CASK_FILE="$TMP_DIR/Casks/${CASK_NAME}.rb"

# Create or update the Cask file
cat <<EOF > "$CASK_FILE"
cask "${CASK_NAME}" do
  version "${VERSION}"
  sha256 "${SHA256}"

  url "https://github.com/blue1st/electron-magi-system/releases/download/v#{version}/${ZIP_NAME}"
  name "MAGI System"
  desc "Tripartite Consensus AI Deliberation System for Electron"
  homepage "https://github.com/blue1st/electron-magi-system"

  app "MAGI System.app"

  caveats <<~EOS
    MAGI System is not notarized. If macOS blocks it from running, execute:
      xattr -cr "/Applications/MAGI System.app"
  EOS
end
EOF

# Commit and push
cd "$TMP_DIR"
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add "Casks/${CASK_NAME}.rb"
git commit -m "Update ${CASK_NAME} to v${VERSION}" || echo "No changes to commit"
git push origin main

echo "Homebrew tap updated successfully!"
