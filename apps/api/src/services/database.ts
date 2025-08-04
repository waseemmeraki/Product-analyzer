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

  async checkProductExists(name: string, brand: string, category: string): Promise<string | null> {
    const pool = await this.connect();
    
    const query = `
      SELECT Id FROM Products 
      WHERE Name = @name AND Brand = @brand AND Category = @category
    `;
    
    const request = pool.request();
    request.input('name', sql.NVarChar, name);
    request.input('brand', sql.NVarChar, brand);
    request.input('category', sql.NVarChar, category);
    
    const result = await request.query(query);
    
    if (result.recordset.length > 0) {
      return result.recordset[0].Id;
    }
    
    return null;
  }

  async insertProduct(product: Omit<Product, 'Id'> & { Id?: string }): Promise<string> {
    // Check if product already exists
    const existingProductId = await this.checkProductExists(product.Name, product.Brand, product.Category);
    
    if (existingProductId) {
      console.log(`Product already exists: ${product.Name} (${product.Brand} - ${product.Category})`);
      return existingProductId;
    }
    
    const pool = await this.connect();
    const productId = product.Id || this.generateUUID();
    
    const query = `
      INSERT INTO Products (Id, Name, Brand, Category, Ingredients, IngredientCategories, Claims, Rating, ReviewCount)
      VALUES (@id, @name, @brand, @category, @ingredients, @ingredientCategories, @claims, @rating, @reviewCount)
    `;
    
    const request = pool.request();
    request.input('id', sql.UniqueIdentifier, productId);
    request.input('name', sql.NVarChar, product.Name);
    request.input('brand', sql.NVarChar, product.Brand);
    request.input('category', sql.NVarChar, product.Category);
    request.input('ingredients', sql.NVarChar, product.Ingredients);
    request.input('ingredientCategories', sql.NVarChar, product.IngredientCategories);
    request.input('claims', sql.NVarChar, product.Claims);
    request.input('rating', sql.Float, product.Rating);
    request.input('reviewCount', sql.Int, product.ReviewCount);
    
    await request.query(query);
    console.log(`Inserted new product: ${product.Name} (${product.Brand} - ${product.Category})`);
    return productId;
  }

  async insertProducts(products: (Omit<Product, 'Id'> & { Id?: string })[]): Promise<{
    insertedIds: string[];
    newCount: number;
    duplicateCount: number;
    totalProcessed: number;
  }> {
    const insertedIds: string[] = [];
    let newCount = 0;
    let duplicateCount = 0;
    
    for (const product of products) {
      try {
        const existingId = await this.checkProductExists(product.Name, product.Brand, product.Category);
        
        if (existingId) {
          duplicateCount++;
          insertedIds.push(existingId); // Include existing ID in results
        } else {
          const id = await this.insertProduct(product);
          insertedIds.push(id);
          newCount++;
        }
      } catch (error) {
        console.error('Error processing product:', product.Name, error);
      }
    }
    
    return {
      insertedIds,
      newCount,
      duplicateCount,
      totalProcessed: insertedIds.length
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }
}

export { DatabaseService, Product };