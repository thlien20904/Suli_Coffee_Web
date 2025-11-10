const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PhuongThucThanhToan', {
    Id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    TenPhuongThuc: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'PhuongThucThanhToan',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__PhuongTh__3214EC07C7A3735E",
        unique: true,
        fields: [
          { name: "Id" },
        ]
      },
    ]
  });
};
