const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Category', {
    CategoryId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    CategoryName: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'Category',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Category__19093A0B58279CE8",
        unique: true,
        fields: [
          { name: "CategoryId" },
        ]
      },
    ]
  });
};
