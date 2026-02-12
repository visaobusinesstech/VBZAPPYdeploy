const { DataTypes } = require("sequelize");

module.exports = {
  up: (queryInterface) => {
    return Promise.all([
      queryInterface.changeColumn("Whatsapps", "token", {
        type: DataTypes.TEXT,
        allowNull: true,
      }),
      queryInterface.changeColumn("Whatsapps", "send_token", {
        type: DataTypes.TEXT,
        allowNull: true,
      }),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.changeColumn("Whatsapps", "token", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
      queryInterface.changeColumn("Whatsapps", "send_token", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
    ]);
  },
};
