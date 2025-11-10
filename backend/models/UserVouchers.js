const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "UserVouchers",
    {
      UserVoucherId: {
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
        unique: "UQ__UserVouc__14262BDF4A55905E",
      },
      VoucherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Vouchers",
          key: "VoucherId",
        },
        unique: "UQ__UserVouc__14262BDF4A55905E",
      },
      IsUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      ReceivedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      sequelize,
      tableName: "UserVouchers",
      schema: "dbo",
      timestamps: false,
      indexes: [
        {
          name: "PK__UserVouc__8017D49922C30B06",
          unique: true,
          fields: [{ name: "UserVoucherId" }],
        },
        {
          name: "UQ__UserVouc__14262BDF4A55905E",
          unique: true,
          fields: [{ name: "UserId" }, { name: "VoucherId" }],
        },
      ],
    }
  );
};
