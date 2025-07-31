import { Request, Response } from 'express';
import { DatabaseService } from '../services/database';

class ProductController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  getBrands = async (req: Request, res: Response): Promise<void> => {
    try {
      const brands = await this.databaseService.getBrands();
      res.json({
        success: true,
        data: brands
      });
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({
        error: 'Failed to fetch brands',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getCategoriesByBrand = async (req: Request, res: Response): Promise<void> => {
    try {
      const { brand } = req.params;
      
      if (!brand) {
        res.status(400).json({
          error: 'Brand parameter is required'
        });
        return;
      }

      const categories = await this.databaseService.getCategoriesByBrand(brand);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  getProductsByBrandAndCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { brand, category } = req.params;
      
      if (!brand || !category) {
        res.status(400).json({
          error: 'Brand and category parameters are required'
        });
        return;
      }

      const products = await this.databaseService.getProductsByBrandAndCategory(brand, category);
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export { ProductController };