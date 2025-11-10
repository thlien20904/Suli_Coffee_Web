const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Orders', {
    OrderId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'Id'
      }
    },
    OrderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    TotalAmount: {
      type: DataTypes.DECIMAL(18,3),
      allowNull: false
    },
    PaymentMethodId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PhuongThucThanhToan',
        key: 'Id'
      }
    },
    StatusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'OrderStatus',
        key: 'StatusId'
      }
    },
    PaymentStatusId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'PaymentStatus',
        key: 'PaymentStatusId'
      }
    },
    DeliveryAddress: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    VoucherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Vouchers',
        key: 'VoucherId'
      }
    }
  }, {
    sequelize,
    tableName: 'Orders',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Orders__C3905BCF630B9BC0",
        unique: true,
        fields: [
          { name: "OrderId" },
        ]
      },
    ]
  });
};
