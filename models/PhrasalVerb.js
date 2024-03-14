const { Sequelize, DataTypes } = require('sequelize');
const db = require('../database/connection');

const PhrasalVerb = db.define('PhrasalVerb', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  verb: {
    type: DataTypes.STRING,
    allowNull: false
  },
  meaning: {
    type: DataTypes.STRING,
    allowNull: false
  },
  example: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = PhrasalVerb;
