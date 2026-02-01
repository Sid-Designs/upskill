/**
 * Script to drop the old upiRef_1 index from the payments collection
 * 
 * Run this script once after migrating to Razorpay:
 * node scripts/drop-upi-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function dropUpiRefIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    // Get current indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes on payments collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if upiRef_1 index exists
    const upiRefIndex = indexes.find(idx => idx.name === 'upiRef_1');
    
    if (upiRefIndex) {
      console.log('\n🔧 Dropping upiRef_1 index...');
      await collection.dropIndex('upiRef_1');
      console.log('✅ Successfully dropped upiRef_1 index');
    } else {
      console.log('\n✅ upiRef_1 index does not exist (already removed or never created)');
    }

    // Also check for utr_1 index
    const utrIndex = indexes.find(idx => idx.name === 'utr_1');
    if (utrIndex) {
      console.log('\n🔧 Dropping utr_1 index...');
      await collection.dropIndex('utr_1');
      console.log('✅ Successfully dropped utr_1 index');
    }

    // Print final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes on payments collection:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

dropUpiRefIndex();
