import express from 'express';
import { ProductController } from '../controllers/productController';

const router = express.Router();
const productController = new ProductController();

// Get all brands
router.get('/brands', productController.getBrands);

// Get categories by brand
router.get('/brands/:brand/categories', productController.getCategoriesByBrand);

// Get products by brand and category
router.get('/brands/:brand/categories/:category/products', productController.getProductsByBrandAndCategory);

export default router;