#!/bin/bash

echo "🚀 Vercel Deployment Helper"
echo "============================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI is installed"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Check for environment variables
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo "⚠️  No environment file found!"
    echo "💡 Create .env.local with your AWS credentials"
    echo ""
    echo "Example:"
    echo "AWS_REGION=ap-southeast-1"
    echo "AWS_ACCESS_KEY_ID=your-key"
    echo "AWS_SECRET_ACCESS_KEY=your-secret"
    echo "AGENT_ID=your-agent-id"
    echo "AGENT_ALIAS_ID=your-alias-id"
    echo ""
fi

# Offer deployment options
echo "Choose deployment option:"
echo "1) Deploy to preview (test before production)"
echo "2) Deploy to production"
echo "3) Run local development server"
echo "4) Check deployment status"
echo "5) View logs"
echo "6) Cancel"
echo ""

read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "🔄 Deploying to preview..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Deploying to production..."
        echo "⚠️  This will deploy to your live site!"
        read -p "Are you sure? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            vercel --prod
        else
            echo "❌ Deployment cancelled"
        fi
        ;;
    3)
        echo ""
        echo "🏃 Starting local development server..."
        echo "📝 Make sure you have Vercel KV and Postgres set up locally"
        vercel dev
        ;;
    4)
        echo ""
        echo "📊 Checking deployment status..."
        vercel ls
        ;;
    5)
        echo ""
        echo "📋 Viewing logs..."
        vercel logs
        ;;
    6)
        echo "❌ Cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "📚 Next steps:"
echo "1. Check your deployment at the URL shown above"
echo "2. Test the /api/health endpoint"
echo "3. Try sending a chat message"
echo "4. Configure custom domain in Vercel dashboard"
