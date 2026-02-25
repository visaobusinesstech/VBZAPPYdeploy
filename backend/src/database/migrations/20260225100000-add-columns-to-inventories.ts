import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Inventories", "currency", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "BRL"
    });
    await queryInterface.addColumn("Inventories", "image", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Inventories", "sku", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Inventories", "category", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Inventories", "brand", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Inventories", "description", {
      type: DataTypes.TEXT,
      allowNull: true
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Inventories", "description");
    await queryInterface.removeColumn("Inventories", "brand");
    await queryInterface.removeColumn("Inventories", "category");
    await queryInterface.removeColumn("Inventories", "sku");
    await queryInterface.removeColumn("Inventories", "image");
    await queryInterface.removeColumn("Inventories", "currency");
  }
};
