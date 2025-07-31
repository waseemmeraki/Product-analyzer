import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

interface Product {
  Id: string;
  Name: string;
  Brand: string;
  Category: string;
  Ingredients: string;
  IngredientCategories: string;
  Claims: string;
  Rating: number;
  ReviewCount: number;
}

class DatabaseService {
  private config: sql.config;
  private pool: sql.ConnectionPool | null = null;

  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    
    // Parse connection string for SQL Server
    const match = connectionString.match(/Server=([^;]+);Database=([^;]+);User ID=([^;]+);Password=([^;]+);?/);
    
    if (match) {
      const [, serverPart, database, user, password] = match;
      
      // Handle server,port format (e.g., "localhost,1433" or just "server.database.windows.net")
      const [server, port] = serverPart.includes(',') ? serverPart.split(',') : [serverPart, '1433'];
      
      this.config = {
        server,
        port: parseInt(port),
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
    } else {
      throw new Error(`Invalid DATABASE_URL format: ${connectionString}`);
    }
  }

  async connect(): Promise<sql.ConnectionPool> {
    if (!this.pool) {
      this.pool = new sql.ConnectionPool(this.config);
      await this.pool.connect();
    }
    return this.pool;
  }

  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    const pool = await this.connect();
    
    const placeholders = productIds.map((_, index) => `@id${index}`).join(',');
    const query = `
      SELECT Id, Name, Brand, Category, Ingredients, IngredientCategories, Claims, Rating, ReviewCount
      FROM Products
      WHERE Id IN (${placeholders})
    `;
    
    const request = pool.request();
    productIds.forEach((id, index) => {
      request.input(`id${index}`, sql.UniqueIdentifier, id);
    });
    
    const result = await request.query(query);
    return result.recordset;
  }

  async getBrands(): Promise<string[]> {
    const pool = await this.connect();
    const query = `SELECT DISTINCT Brand FROM Products WHERE Brand IS NOT NULL ORDER BY Brand`;
    const result = await pool.request().query(query);
    return result.recordset.map(row => row.Brand);
  }

  async getCategoriesByBrand(brand: string): Promise<string[]> {
    const pool = await this.connect();
    const query = `SELECT DISTINCT Category FROM Products WHERE Brand = @brand AND Category IS NOT NULL ORDER BY Category`;
    const request = pool.request();
    request.input('brand', sql.NVarChar, brand);
    const result = await request.query(query);
    return result.recordset.map(row => row.Category);
  }

  async getProductsByBrandAndCategory(brand: string, category: string): Promise<Product[]> {
    const pool = await this.connect();
    const query = `
      SELECT Id, Name, Brand, Category, Ingredients, IngredientCategories, Claims, Rating, ReviewCount
      FROM Products
      WHERE Brand = @brand AND Category = @category
      ORDER BY Name
    `;
    const request = pool.request();
    request.input('brand', sql.NVarChar, brand);
    request.input('category', sql.NVarChar, category);
    const result = await request.query(query);
    return result.recordset;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }
}

export { DatabaseService, Product };