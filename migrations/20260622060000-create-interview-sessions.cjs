"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("interview_sessions", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      role: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      difficulty: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      questions: {
        allowNull: false,
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("interview_sessions", ["user_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("interview_sessions");
  },
};
