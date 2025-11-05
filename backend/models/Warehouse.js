const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Warehouse', {
    WarehouseId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    IngredientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Ingredient',
        key: 'IngredientId'
      }
    },
    SoLuong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    DateUpdate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'Warehouse',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Warehous__2608AFF9D4546E08",
        unique: true,
        fields: [
          { name: "WarehouseId" },
        ]
      },
    ]
  });
};
