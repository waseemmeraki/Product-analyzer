const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../src/connection');

class Product extends Model {}

Product.init(
  {
    Id: {
      type: DataTypes.STRING,
      primaryKey: true,
      field: 'Id',
    },
    Name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'Name',
    },
    Brand: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'Brand',
    },
    Category: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'Category',
    },
    Ingredients: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Ingredients',
    },
    IngredientCategories: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'IngredientCategories',
    },
    Claims: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'Claims',
    },
    Rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'Rating',
    },
    ReviewCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'ReviewCount',
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'Products',
    timestamps: false, // No createdAt/updatedAt for this table
  }
);

module.exports = Product;