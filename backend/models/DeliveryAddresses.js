const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('DeliveryAddresses', {
    AddressId: {
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
    Address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    IsDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    CreatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'DeliveryAddresses',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Delivery__091C2AFB9FD569F6",
        unique: true,
        fields: [
          { name: "AddressId" },
        ]
      },
    ]
  });
};
