'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Products',
          key: 'id'
        }
      },
      clientId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'UserProfiles',
          key: 'id'
        }
      },
      totalUnit: {
        type: Sequelize.INTEGER
      },
      notes: {
        type: Sequelize.STRING
      },
      method: {
        type: Sequelize.STRING
      },
      destination: {
        type: Sequelize.STRING
      },
      destinationPoint: {
        type: Sequelize.GEOMETRY('POINT')
      },
      status: {
        type: Sequelize.STRING
      },
      rating: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};