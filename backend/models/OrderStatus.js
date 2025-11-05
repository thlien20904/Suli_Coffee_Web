const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('OrderStatus', {
    StatusId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    StatusName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "UQ__OrderSta__05E7698AA835F32A"
    }
  }, {
    sequelize,
    tableName: 'OrderStatus',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__OrderSta__C8EE206341E99E68",
        unique: true,
        fields: [
          { name: "StatusId" },
        ]
      },
      {
        name: "UQ__OrderSta__05E7698AA835F32A",
        unique: true,
        fields: [
          { name: "StatusName" },
        ]
      },
    ]
  });
};
