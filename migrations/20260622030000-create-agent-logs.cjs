/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("agent_logs", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      feature: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      level: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("agent_logs", ["user_id"]);
    await queryInterface.addIndex("agent_logs", ["feature"]);
    await queryInterface.addIndex("agent_logs", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("agent_logs");
  },
};
