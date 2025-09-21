const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI

async function forceDelete() {
  try {
    await mongoose.connect(MONGO_URI);

    // List all collections in this DB
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📂 Collections in DB:", collections.map(c => c.name));

    // Delete all documents in employees
    const result = await mongoose.connection.db
      .collection("employees")
      .deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} employees`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err);
    await mongoose.disconnect();
  }
}

forceDelete();
