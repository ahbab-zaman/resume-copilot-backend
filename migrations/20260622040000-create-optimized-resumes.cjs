/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("optimized_resumes", {
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
      optimized_content: {
        type: Sequelize.JSONB,
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

    await queryInterface.addIndex("optimized_resumes", ["user_id"]);
    await queryInterface.addIndex("optimized_resumes", ["analysis_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("optimized_resumes");
  },
};
