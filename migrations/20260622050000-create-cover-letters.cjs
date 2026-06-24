/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cover_letters", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      analysis_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tone: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      pdf_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("cover_letters", ["user_id"]);
    await queryInterface.addIndex("cover_letters", ["analysis_id"]);
    await queryInterface.addIndex("cover_letters", ["user_id", "analysis_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cover_letters");
  },
};
