require('dotenv').config();

// Parse MySQL connection string
const connectionString = process.env.DATABASE_URL || '';
const mysqlMatch = connectionString.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

let config = {};

if (mysqlMatch) {
  const [, username, password, host, port, database] = mysqlMatch;
  
  config = {
    development: {
      dialect: 'mysql',
      host: host,
      port: parseInt(port),
      username: username,
      password: password,
      database: database,
      dialectOptions: {
        charset: 'utf8mb4',
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    production: {
      dialect: 'mysql',
      host: host,
      port: parseInt(port),
      username: username,
      password: password,
      database: database,
      dialectOptions: {
        charset: 'utf8mb4',
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  };
} else {
  throw new Error('Invalid DATABASE_URL format');
}

module.exports = config;