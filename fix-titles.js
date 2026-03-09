import sqlite3 from "sqlite3";

console.log("🔧 Starting database cleanup...");

const db = new sqlite3.Database("./chat_history.db", (err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to database");
});

// Fix duplicate titles by keeping only the first title for each session
db.serialize(() => {
  console.log("🔄 Fixing chat titles...");

  // Get all unique sessions
  db.all("SELECT DISTINCT session_id FROM chat_history", (err, sessions) => {
    if (err) {
      console.error("❌ Error fetching sessions:", err);
      db.close();
      return;
    }

    console.log(`📊 Found ${sessions.length} chat sessions`);

    let processed = 0;

    sessions.forEach((session) => {
      // Get the first message's title for this session
      db.get(
        "SELECT title FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC LIMIT 1",
        [session.session_id],
        (err, firstRow) => {
          if (err || !firstRow) {
            console.error(`❌ Error getting first message for ${session.session_id}`);
            return;
          }

          const firstTitle = firstRow.title;

          // Update all messages in this session to use the first title
          db.run(
            "UPDATE chat_history SET title = ? WHERE session_id = ?",
            [firstTitle, session.session_id],
            (err) => {
              if (err) {
                console.error(`❌ Error updating session ${session.session_id}:`, err);
              } else {
                processed++;
                console.log(`✅ Fixed session ${processed}/${sessions.length}: "${firstTitle}"`);
              }

              // Close database when all sessions are processed
              if (processed === sessions.length) {
                console.log("\n🎉 Database cleanup complete!");
                console.log(`✅ Updated ${processed} chat sessions`);
                db.close();
              }
            }
          );
        }
      );
    });

    if (sessions.length === 0) {
      console.log("ℹ️  No sessions to fix");
      db.close();
    }
  });
});
