async function testConnection() {
  try {
    const { sequelize } = require('./src/connection.js');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();