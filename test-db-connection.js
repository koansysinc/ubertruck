/**
 * Test Database Connection
 */

const { query, healthCheck } = require('./src/config/database');

async function testConnection() {
  console.log('Testing Neon DB connection...\n');

  // Test health check
  console.log('1. Testing health check...');
  const health = await healthCheck();
  console.log('Health check result:', health);

  if (!health.connected) {
    console.error('Failed to connect to database!');
    process.exit(1);
  }

  console.log('\n2. Testing query execution...');
  try {
    // Test simple query
    const result = await query('SELECT COUNT(*) as count FROM users');
    console.log('Users in database:', result.rows[0].count);

    // Test data retrieval
    const users = await query('SELECT user_id, phone_number, role FROM users LIMIT 5');
    console.log('\nSample users:');
    users.rows.forEach(user => {
      console.log(`- ${user.phone_number} (${user.role})`);
    });

    // Test bookings count
    const bookings = await query('SELECT COUNT(*) as count FROM bookings');
    console.log('\nTotal bookings:', bookings.rows[0].count);

    console.log('\n✅ Database connection successful!');
    console.log('✅ All tables accessible!');
  } catch (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

testConnection().catch(console.error);