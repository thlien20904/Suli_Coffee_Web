const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    Id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "UQ__Users__536C85E4D080E983"
    },
    Email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "UQ__Users__A9D1053491F6F0B1"
    },
    PasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    FullName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Phone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    Address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "User"
    },
    OTPCode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    OTPExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ResetToken: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ResetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    AvatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    CreatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'Users',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Users__3214EC075362438B",
        unique: true,
        fields: [
          { name: "Id" },
        ]
      },
      {
        name: "UQ__Users__536C85E4D080E983",
        unique: true,
        fields: [
          { name: "Username" },
        ]
      },
      {
        name: "UQ__Users__A9D1053491F6F0B1",
        unique: true,
        fields: [
          { name: "Email" },
        ]
      },
    ]
  });
};
