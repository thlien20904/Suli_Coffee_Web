const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CuaHang', {
    CuaHangId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CuaHangName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Address: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    Opening_Hours: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Image_URL: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Latitude: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true
    },
    Longitude: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'CuaHang',
    schema: 'dbo',
    timestamps: true,
    indexes: [
      {
        name: "PK__CuaHang__1BECA8F86E903B31",
        unique: true,
        fields: [
          { name: "CuaHangId" },
        ]
      },
    ]
  });
};
