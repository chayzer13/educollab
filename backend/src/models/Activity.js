const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM(
      'team_invitation_sent',
      'team_invitation_accepted',
      'team_invitation_rejected',
      'team_invitation_cancelled',
      'team_member_joined',
      'team_member_left',
      'team_member_removed',
      'team_project_added',
      'team_project_removed',
      'team_created',
      'team_updated',
      'project_created',
      'project_updated',
      'project_deleted',
      'comment_created',
      'comment_deleted',
      'rating_created',
      'user_joined_team',
      'user_left_team'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'activities',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['teamId'] },
    { fields: ['projectId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Activity;





