const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Parse Azure SQL connection string
const connectionString = process.env.DATABASE_URL || '';
console.log('Connection string:', connectionString);
const connectionMatch = connectionString.match(/Server=([^;]+);Database=([^;]+);User ID=([^;]+);Password=([^;]+);/);

let sequelize;

if (connectionMatch) {
  const [, host, database, username, password] = connectionMatch;
  
  sequelize = new Sequelize(database, username, password, {
    host: host,
    port: 1433,
    dialect: 'mssql',
    dialectModule: require('tedious'),
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        instanceName: '',
        useUTC: false,
        dateFirst: 1,
        connectTimeout: 60000,
        requestTimeout: 60000,
        cancelTimeout: 5000,
        packetSize: 4096,
        useColumnNames: false,
        columnNameReplacer: false,
        debug: {
          packet: false,
          data: false,
          payload: false,
          token: false
        }
      },
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