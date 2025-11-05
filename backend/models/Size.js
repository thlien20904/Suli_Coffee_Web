const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Size', {
    SizeID: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    SizeName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ExtraPrice: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'Size',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Size__83BD095AFA33F17D",
        unique: true,
        fields: [
          { name: "SizeID" },
        ]
      },
    ]
  });
};
