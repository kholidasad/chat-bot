#!/bin/bash

echo "🧪 Testing Bedrock Chatbot Setup"
echo "================================="
echo ""

# Check if Node.js is installed
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js installed: $NODE_VERSION"
else
    echo "   ❌ Node.js not found! Please install Node.js"
    exit 1
fi

# Check if Redis is running
echo ""
echo "2️⃣  Checking Redis..."
if command -v redis-cli &> /dev/null
then
    if redis-cli ping &> /dev/null
    then
        echo "   ✅ Redis is running"
    else
        echo "   ⚠️  Redis installed but not running"
        echo "   💡 Start it with: redis-server"
        echo "   💡 Or: brew services start redis"
    fi
else
    echo "   ❌ Redis not found! Please install Redis"
    echo "   💡 Install with: brew install redis"
fi

# Check if database file exists
echo ""
echo "3️⃣  Checking SQLite database..."
if [ -f "chat_history.db" ]; then
    DB_SIZE=$(du -h chat_history.db | cut -f1)
    echo "   ✅ Database exists (size: $DB_SIZE)"

    # Count chats
    CHAT_COUNT=$(sqlite3 chat_history.db "SELECT COUNT(DISTINCT session_id) FROM chat_history;" 2>/dev/null || echo "0")
    echo "   📊 Total chats: $CHAT_COUNT"
else
    echo "   ℹ️  Database will be created on first run"
fi

# Check if .env exists
echo ""
echo "4️⃣  Checking environment variables..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"

    if grep -q "AGENT_ID" .env; then
        echo "   ✅ AGENT_ID configured"
    else
        echo "   ⚠️  AGENT_ID not found in .env"
    fi

    if grep -q "AGENT_ALIAS_ID" .env; then
        echo "   ✅ AGENT_ALIAS_ID configured"
    else
        echo "   ⚠️  AGENT_ALIAS_ID not found in .env"
    fi
else
    echo "   ❌ .env file not found!"
    echo "   💡 Create .env with AWS credentials"
fi

# Check if node_modules exists
echo ""
echo "5️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  Dependencies not installed"
    echo "   💡 Run: npm install"
fi

# Check if server is running
echo ""
echo "6️⃣  Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 3000"

    # Get health status
    HEALTH=$(curl -s http://localhost:3000/health)
    echo "   📊 Health status:"
    echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
    echo "   ℹ️  Server not running"
    echo "   💡 Start with: node server.js"
    echo "   💡 Or: npm start"
fi

echo ""
echo "================================="
echo "✨ Setup check complete!"
echo ""

# Provide next steps
if redis-cli ping &> /dev/null && [ -d "node_modules" ]; then
    echo "🚀 You're ready to go!"
    echo ""
    echo "Next steps:"
    echo "  1. Make sure Redis is running: redis-server"
    echo "  2. Start the server: npm start"
    echo "  3. Open browser: http://localhost:3000"
    echo "  4. Check health: http://localhost:3000/health"
    echo ""
    echo "If you have old data with duplicate titles:"
    echo "  npm run fix-titles"
else
    echo "⚠️  Some issues need attention. Check above for details."
fi
