# Testing the Chatbot Frontend

Follow these steps to test your chatbot functionality locally.

## Step 1: Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify it's running:
```bash
docker-compose ps
```

You should see the postgres container with status "healthy".

## Step 2: Create Database Tables

```bash
pnpm --filter @workspace/db run push
```

This creates the necessary tables for storing messages and sessions.

## Step 3: Start Frontend & Backend Together

From the repo root:

```bash
./start-dev.sh
```

Wait for both servers to start. You should see:
```
✨  [vite] v... ready in ... ms
➜  local:   http://localhost:5173/
```

## Step 4: Open the Chatbot in Browser

Open your browser and go to:
```
http://localhost:5173
```

You should see:
- ✅ Left sidebar with "Start Chat" button
- ✅ Main chat area with welcome message
- ✅ Right panel with insights/mood tracking
- ✅ Input field at the bottom

## Step 5: Test the Chat

### Test 1: Send a Basic Message

1. Click on the input field at the bottom
2. Type a message like: `I'm worried about my finances`
3. Press Enter or Shift+Enter to send
4. **Expected Result:** 
   - Your message appears in the chat
   - A few seconds later, an AI response appears
   - The "Session #" number displays in the header

### Test 2: Check AI Response

The AI should respond with financial wellness advice. For example:
- Input: `How can I save more money?`
- Expected: AI provides helpful tips about budgeting and savings

### Test 3: Verify Mood Tracking

1. Send a few messages
2. **Expected Result:** 
   - The Insights Panel (right side) should update
   - Shows mood indicators (calm, anxious, etc.)
   - Displays mood dimensions

### Test 4: Clear Chat

1. Click the "🗑 Clear" button in the top right
2. **Expected Result:** All messages disappear (but are saved in database)

## Step 6: Verify Backend Connection

Open your browser's **Developer Tools** (F12) → **Network** tab:

1. Send a chat message
2. Look for request: `POST /api/v1/chat`
3. **Expected Result:**
   - Status: `200` (success)
   - Response includes: `message`, `mood`, `suggestions`

### Sample Response:
```json
{
  "message": "That's a great question! Here are some tips...",
  "mood": {
    "primary_emotion": "calm",
    "dimensions": {
      "stress_level": 0.4,
      "financial_anxiety": 0.3
    }
  },
  "suggestions": ["Create a budget", "Track expenses"]
}
```

## Step 7: Check Console for Errors

In browser DevTools → **Console** tab:

1. Should see NO red error messages
2. May see some warnings (those are okay)
3. If you see red errors, note the message for troubleshooting

## Step 8: Verify Data Persistence (Optional)

Run this SQL query to check saved messages:

```bash
# Connect to the database
psql postgresql://finheal_user:finheal_password@localhost:5432/finheal

# Run this query
SELECT id, user_id, role, content, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 5;
```

You should see your chat messages stored in the database.

## Troubleshooting During Testing

### Issue: Page shows blank/loading forever
**Solution:**
1. Check browser console (F12) for errors
2. Verify backend is running: `curl http://localhost:3000/api/health`
3. Check terminal where `start-dev.sh` is running for errors
4. Scroll up in terminal to see startup messages

### Issue: Messages don't send (no response)
**Solution:**
1. Open DevTools Network tab
2. Check if request goes to backend
3. Check Response status code:
   - 200 = Success (check response data)
   - 400 = Bad request (check message format)
   - 500 = Server error (check backend terminal logs)
4. Check backend terminal for error messages

### Issue: "Network error" or CORS error
**Solution:**
1. Verify backend is running on port 3000
2. Check that `VITE_API_URL` is correct in App.tsx
3. Backend has CORS enabled - should work automatically

### Issue: Database connection failed
**Solution:**
```bash
# Check if postgres is running
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose down
docker-compose up -d
docker-compose logs postgres  # Wait for "healthy" status

# Recreate tables
pnpm --filter @workspace/db run push
```

## Quick Test Checklist

- [ ] Docker postgres is running
- [ ] Database tables created (`pnpm --filter @workspace/db run push`)
- [ ] `./start-dev.sh` shows both servers started
- [ ] Browser opens to http://localhost:5173
- [ ] UI loads (sidebar, chat area, insights panel visible)
- [ ] Can type in chat input field
- [ ] Message sends (appears in chat)
- [ ] AI responds within 5 seconds
- [ ] No red errors in browser console
- [ ] Network tab shows 200 response from `/api/v1/chat`

## What Each Component Does

| Component | Purpose | Testing |
|-----------|---------|---------|
| **Sidebar** | Shows chat sessions | Sessions should increase after each chat |
| **ChatArea** | Main chat interface | Type, send, see messages |
| **InsightsPanel** | Mood tracking | Updates with mood data from AI |
| **API Client** | Connects to backend | Check Network tab in DevTools |
| **Backend Routes** | Process chat requests | Check Network response |

## Next Steps After Testing

1. ✅ If everything works → Great! Chatbot is functional
2. ❌ If something breaks → Check troubleshooting section
3. 🚀 Ready to expand with:
   - User authentication
   - Financial data integration
   - Loan product recommendations
   - Dashboard analytics

Good luck! 🚀
