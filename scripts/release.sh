#!/usr/bin/env bash
VERSION_TYPE=${VERSION_TYPE:-patch}

NEW_VERSION=$(npm version $VERSION_TYPE)

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "Error: Git is not clean. Please commit or stash your changes."
    exit 1
fi



git add .
git commit -m "chore: release $NEW_VERSION"
git push origin main
git tag $NEW_VERSION
git push origin $NEW_VERSION

rm -rf *.vsix
npm install
npx vsce package
gh release create "$NEW_VERSION" -t "$NEW_VERSION" -n "$NEW_VERSION" 
gh release upload "$NEW_VERSION" *.vsix
