const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Account', {
    AccountId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    DisplayName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    UserName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    PassWord: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    RoleName: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'Account',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Account__349DA5A68A8F6076",
        unique: true,
        fields: [
          { name: "AccountId" },
        ]
      },
    ]
  });
};
