const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from API directory first, then fallback to root
dotenv.config({ path: path.join(__dirname, '../../../apps/api/.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Parse MySQL connection string
const connectionString = process.env.DATABASE_URL || '';
console.log('Connection string:', connectionString);
const mysqlMatch = connectionString.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

let sequelize;

if (mysqlMatch) {
  const [, username, password, host, port, database] = mysqlMatch;
  
  sequelize = new Sequelize(database, username, password, {
    host: host,
    port: parseInt(port),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  throw new Error('Invalid DATABASE_URL format');
}

module.exports = { sequelize };