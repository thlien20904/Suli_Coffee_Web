const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('GioHang_Topping', {
    GioHangToppingID: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    GioHangID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'GioHang',
        key: 'GioHangID'
      }
    },
    ToppingID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Topping',
        key: 'ToppingID'
      }
    }
  }, {
    sequelize,
    tableName: 'GioHang_Topping',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__GioHang___0A7C5B6D210A7D02",
        unique: true,
        fields: [
          { name: "GioHangToppingID" },
        ]
      },
    ]
  });
};
