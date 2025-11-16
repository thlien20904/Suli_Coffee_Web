#!/bin/bash
# Quick deploy script for Vercel

echo "🚀 Starting Vercel Deployment..."

cd "$(dirname "$0")/frontend"

echo "📦 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  
  echo "📤 Committing changes..."
  git add .
  git commit -m "Deploy: Fix WebSocket auto-detect production ($(date +%Y-%m-%d))"
  
  echo "⬆️  Pushing to GitHub..."
  git push origin main
  
  echo "✨ Done! Vercel will auto-deploy in ~2 minutes."
  echo "🔗 Check: https://vercel.com/dashboard"
  echo "🌐 Live: https://suli-coffee-web.vercel.app"
else
  echo "❌ Build failed! Check errors above."
  exit 1
fi
