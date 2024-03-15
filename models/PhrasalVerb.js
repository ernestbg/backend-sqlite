const { Sequelize, DataTypes } = require('sequelize');

// Crear una instancia de Sequelize
const sequelize = new Sequelize({
  // Configuración de la base de datos
  dialect: 'sqlite',
  storage: './database/phrasal_verbs.db'
});

const PhrasalVerb = sequelize.define('PhrasalVerb', {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  headword: {
    type: DataTypes.STRING,
    allowNull: false
  },
  definition: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guide_word: {
    type: DataTypes.STRING
  },
  example: {
    type: DataTypes.STRING
  },
  phonetics: {
    type: DataTypes.STRING
  },
  level: {
    type: DataTypes.STRING
  },
  sublevel: {
    type: DataTypes.STRING
  }
});

module.exports = PhrasalVerb;
