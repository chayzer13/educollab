const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: 2,
      max: 50
    }
  },
  leaderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'public'
  }
}, {
  tableName: 'teams',
  timestamps: true
});

module.exports = Team;

