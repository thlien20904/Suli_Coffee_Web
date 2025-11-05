const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TableFood', {
    TableId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    TableName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    TrangThai: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TableFood',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__TableFoo__7D5F01EEEBCFDBD1",
        unique: true,
        fields: [
          { name: "TableId" },
        ]
      },
    ]
  });
};
