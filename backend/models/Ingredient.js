const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Ingredient', {
    IngredientId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    IngredientName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    SoLuong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    PhanLoai: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ImageURL: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    LastUpdated: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'Ingredient',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Ingredie__BEAEB25A84F8FACC",
        unique: true,
        fields: [
          { name: "IngredientId" },
        ]
      },
    ]
  });
};
