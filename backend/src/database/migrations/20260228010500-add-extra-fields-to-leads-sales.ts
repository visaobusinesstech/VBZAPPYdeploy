import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("leads_sales", "site", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("leads_sales", "origin", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("leads_sales", "document", {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "CPF/CNPJ"
    });
    await queryInterface.addColumn("leads_sales", "birthDate", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("leads_sales", "address", {
      type: DataTypes.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("leads_sales", "address");
    await queryInterface.removeColumn("leads_sales", "birthDate");
    await queryInterface.removeColumn("leads_sales", "document");
    await queryInterface.removeColumn("leads_sales", "origin");
    await queryInterface.removeColumn("leads_sales", "site");
  }
};

