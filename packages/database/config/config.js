require('dotenv').config();

// Parse Azure SQL connection string
const connectionString = process.env.DATABASE_URL || '';
const connectionMatch = connectionString.match(/Server=([^;]+);Database=([^;]+);User ID=([^;]+);Password=([^;]+);/);

let config = {};

if (connectionMatch) {
  const [, host, database, username, password] = connectionMatch;
  
  config = {
    development: {
      dialect: 'mssql',
      dialectModule: require('tedious'),
      host: host,
      port: 1433,
      username: username,
      password: password,
      database: database,
      dialectOptions: {
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    production: {
      dialect: 'mssql',
      dialectModule: require('tedious'),
      host: host,
      port: 1433,
      username: username,
      password: password,
      database: database,
      dialectOptions: {
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
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