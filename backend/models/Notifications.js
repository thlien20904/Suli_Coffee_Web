const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "Notifications",
    {
      NotificationId: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "Id",
        },
      },
      Title: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      Message: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      IsRead: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "Notifications",
      schema: "dbo",
      timestamps: false,
      indexes: [
        {
          name: "PK__Notifica__20CF2E122EFE8522",
          unique: true,
          fields: [{ name: "NotificationId" }],
        },
      ],
    }
  );
};
