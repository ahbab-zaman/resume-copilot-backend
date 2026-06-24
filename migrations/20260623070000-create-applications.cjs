"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("applications", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      company: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      role: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      status: {
        allowNull: false,
        type: Sequelize.TEXT,
        defaultValue: "applied",
      },
      applied_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      notes: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
    });

    await queryInterface.addIndex("applications", ["user_id"]);
    await queryInterface.addIndex("applications", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("applications");
  },
};
