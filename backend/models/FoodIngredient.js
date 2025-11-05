const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('FoodIngredient', {
    FoodIngredientId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    FoodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Food',
        key: 'FoodId'
      }
    },
    IngredientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Ingredient',
        key: 'IngredientId'
      }
    },
    Quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'FoodIngredient',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__FoodIngr__CB78CEA6A437B911",
        unique: true,
        fields: [
          { name: "FoodIngredientId" },
        ]
      },
    ]
  });
};
