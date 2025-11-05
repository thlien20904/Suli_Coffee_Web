const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Vouchers', {
    VoucherId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "UQ__Vouchers__A25C5AA795B91174"
    },
    DiscountAmount: {
      type: DataTypes.DECIMAL(18,3),
      allowNull: true
    },
    DiscountPercentage: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: true
    },
    MinOrderAmount: {
      type: DataTypes.DECIMAL(18,3),
      allowNull: true
    },
    ExpiryDate: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    CreatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    MaxUsage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    UsedCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    Description: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Vouchers',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Vouchers__3AEE7921B1D39206",
        unique: true,
        fields: [
          { name: "VoucherId" },
        ]
      },
      {
        name: "UQ__Vouchers__A25C5AA795B91174",
        unique: true,
        fields: [
          { name: "Code" },
        ]
      },
    ]
  });
};
