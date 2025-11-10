const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PaymentStatus', {
    PaymentStatusId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    PaymentStatusName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "UQ__PaymentS__BBAC58DBE75C5EC7"
    }
  }, {
    sequelize,
    tableName: 'PaymentStatus',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__PaymentS__34F8AC3FAD8694AA",
        unique: true,
        fields: [
          { name: "PaymentStatusId" },
        ]
      },
      {
        name: "UQ__PaymentS__BBAC58DBE75C5EC7",
        unique: true,
        fields: [
          { name: "PaymentStatusName" },
        ]
      },
    ]
  });
};
