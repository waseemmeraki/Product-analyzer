const { sequelize, Product } = require('@product-analytics/database');
import { Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

interface ProductInterface {
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
  constructor() {
    // Initialize Sequelize connection - already handled in connection.js
  }

  async testConnection(): Promise<void> {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  async getProductsByIds(productIds: string[]): Promise<ProductInterface[]> {
    const products = await Product.findAll({
      where: {
        Id: {
          [Op.in]: productIds
        }
      }
    });
    
    return products.map((p: any) => p.toJSON()) as ProductInterface[];
  }

  async getBrands(): Promise<string[]> {
    const results = await Product.findAll({
      attributes: ['Brand'],
      where: {
        Brand: {
          [Op.not]: null
        }
      },
      group: ['Brand'],
      order: [['Brand', 'ASC']]
    });
    
    return results.map((p: any) => p.getDataValue('Brand'));
  }

  async getCategoriesByBrand(brand: string): Promise<string[]> {
    const results = await Product.findAll({
      attributes: ['Category'],
      where: {
        Brand: brand,
        Category: {
          [Op.not]: null
        }
      },
      group: ['Category'],
      order: [['Category', 'ASC']]
    });
    
    return results.map((p: any) => p.getDataValue('Category'));
  }

  async getProductsByBrandAndCategory(brand: string, category: string): Promise<ProductInterface[]> {
    const products = await Product.findAll({
      where: {
        Brand: brand,
        Category: category
      },
      order: [['Name', 'ASC']]
    });
    
    return products.map((p: any) => p.toJSON()) as ProductInterface[];
  }

  async checkProductExists(name: string, brand: string, category: string): Promise<string | null> {
    const product = await Product.findOne({
      attributes: ['Id'],
      where: {
        Name: name,
        Brand: brand,
        Category: category
      }
    });
    
    return product ? product.getDataValue('Id') : null;
  }

  async insertProduct(product: Omit<ProductInterface, 'Id'> & { Id?: string }): Promise<string> {
    // Check if product already exists
    const existingProductId = await this.checkProductExists(product.Name, product.Brand, product.Category);
    
    if (existingProductId) {
      console.log(`Product already exists: ${product.Name} (${product.Brand} - ${product.Category})`);
      return existingProductId;
    }
    
    const productId = product.Id || this.generateUUID();
    
    const newProduct = await Product.create({
      Id: productId,
      Name: product.Name,
      Brand: product.Brand,
      Category: product.Category,
      Ingredients: product.Ingredients,
      IngredientCategories: product.IngredientCategories,
      Claims: product.Claims,
      Rating: product.Rating,
      ReviewCount: product.ReviewCount
    });
    
    console.log(`Inserted new product: ${product.Name} (${product.Brand} - ${product.Category})`);
    return newProduct.getDataValue('Id');
  }

  async insertProducts(products: (Omit<ProductInterface, 'Id'> & { Id?: string })[]): Promise<{
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
    // Don't close the connection as it's shared across the application
    // await sequelize.close();
  }
}

export { DatabaseService, ProductInterface as Product };