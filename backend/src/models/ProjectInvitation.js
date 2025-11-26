const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProjectInvitation = sequelize.define('ProjectInvitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'accepted', 'rejected']]
    }
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  invitedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'project_invitations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'userId'],
      where: {
        status: 'pending'
      }
    }
  ]
});

module.exports = ProjectInvitation;

