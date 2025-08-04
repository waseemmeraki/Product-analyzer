const User = require('./User');
const Product = require('./Product');

// Define associations if needed
// User.hasMany(Project);
// Project.belongsTo(User);

module.exports = {
  User,
  Product,
};

// Also export as named exports for TypeScript compatibility
module.exports.User = User;
module.exports.Product = Product;