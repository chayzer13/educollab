const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamInvitation = sequelize.define('TeamInvitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teams',
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
  tableName: 'team_invitations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teamId', 'userId'],
      where: {
        status: 'pending'
      }
    }
  ]
});

module.exports = TeamInvitation;





