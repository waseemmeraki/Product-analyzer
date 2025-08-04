const { sequelize } = require('./connection.js');
const { User, Product } = require('../models');

// Export sequelize instance and models
module.exports = {
  sequelize,
  User,
  Product,
};