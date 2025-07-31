const sql = require('mssql');
require('dotenv').config();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    const connectionString = process.env.DATABASE_URL;
    console.log('Connection string format:', connectionString.substring(0, 20) + '...');
    
    // Parse connection string for SQL Server
    const match = connectionString.match(/Server=([^;]+);Database=([^;]+);User ID=([^;]+);Password=([^;]+);/);
    
    let config;
    if (match) {
      const [, server, database, user, password] = match;
      config = {
        server,
        database,
        user,
        password,
        options: {
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
          connectTimeout: 60000,
          requestTimeout: 60000,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };
    }
    
    console.log('Connecting to server:', config.server);
    console.log('Database:', config.database);
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Check if Products table exists
    const checkTableQuery = `
      SELECT COUNT(*) as tableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Products'
    `;
    
    const tableResult = await pool.request().query(checkTableQuery);
    const tableExists = tableResult.recordset[0].tableExists > 0;
    
    console.log('Products table exists:', tableExists);
    
    if (tableExists) {
      // Get table structure
      const structureQuery = `
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Products'
        ORDER BY ORDINAL_POSITION
      `;
      
      const structureResult = await pool.request().query(structureQuery);
      console.log('Table structure:');
      structureResult.recordset.forEach(col => {
        console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
      });
      
      // Count total products
      const countResult = await pool.request().query('SELECT COUNT(*) as totalProducts FROM Products');
      console.log('Total products in table:', countResult.recordset[0].totalProducts);
      
      // Show sample products
      const sampleResult = await pool.request().query('SELECT TOP 5 Id, Name, Brand FROM Products');
      console.log('Sample products:');
      sampleResult.recordset.forEach(product => {
        console.log(`  ${product.Id} - ${product.Name} (${product.Brand})`);
      });
    } else {
      console.log('❌ Products table does not exist. You need to create it first.');
      console.log('Create table SQL:');
      console.log(`
CREATE TABLE Products (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Name NVARCHAR(255),
    Brand NVARCHAR(255),
    Category NVARCHAR(100),
    Ingredients NVARCHAR(MAX),
    IngredientCategories NVARCHAR(MAX),
    Claims NVARCHAR(MAX),
    Rating FLOAT,
    ReviewCount INT
);
      `);
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabase();