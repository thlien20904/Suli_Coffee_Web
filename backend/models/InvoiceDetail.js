const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('InvoiceDetail', {
    InvoiceDetailId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    InvoiceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Invoice',
        key: 'InvoiceId'
      }
    },
    FoodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Food',
        key: 'FoodId'
      }
    },
    SoLuong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    Price: {
      type: DataTypes.DECIMAL(18,3),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'InvoiceDetail',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__InvoiceD__1F157811E532D60E",
        unique: true,
        fields: [
          { name: "InvoiceDetailId" },
        ]
      },
    ]
  });
};
