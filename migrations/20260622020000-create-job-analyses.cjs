/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("job_analyses", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      resume_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      job_description_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      job_title_detected: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      seniority_detected: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ats_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      skills_match: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      experience_match: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      education_match: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      missing_keywords: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      strengths: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      weaknesses: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      job_summary: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      ai_model_used: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("job_analyses", ["user_id"]);
    await queryInterface.addIndex("job_analyses", ["resume_id"]);
    await queryInterface.addIndex("job_analyses", ["user_id", "created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("job_analyses");
  },
};

