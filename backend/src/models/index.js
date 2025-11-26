const User = require('./User');
const Project = require('./Project');
const Team = require('./Team');
const Comment = require('./Comment');
const Rating = require('./Rating');
const TeamInvitation = require('./TeamInvitation');
const ProjectInvitation = require('./ProjectInvitation');
const Activity = require('./Activity');
const Milestone = require('./Milestone');
const ProjectFile = require('./ProjectFile');

// User associations
User.hasMany(Project, { foreignKey: 'ownerId', as: 'projects' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' });

// Project associations
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Project.hasMany(Comment, { foreignKey: 'projectId', as: 'comments' });
Project.hasMany(Rating, { foreignKey: 'projectId', as: 'ratings' });
Project.belongsToMany(User, { through: 'ProjectMembers', as: 'members' });
User.belongsToMany(Project, { through: 'ProjectMembers', as: 'memberProjects' });

// Team associations
Team.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });
Team.belongsToMany(User, { through: 'TeamMembers', as: 'members' });
User.belongsToMany(Team, { through: 'TeamMembers', as: 'teams' });
Team.belongsToMany(Project, { through: 'TeamProjects', as: 'projects' });
Project.belongsToMany(Team, { through: 'TeamProjects', as: 'teams' });

// Comment associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Comment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// Rating associations
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Rating.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// TeamInvitation associations
TeamInvitation.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
TeamInvitation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
TeamInvitation.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
Team.hasMany(TeamInvitation, { foreignKey: 'teamId', as: 'invitations' });
User.hasMany(TeamInvitation, { foreignKey: 'userId', as: 'teamInvitations' });

// ProjectInvitation associations
ProjectInvitation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectInvitation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProjectInvitation.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });
Project.hasMany(ProjectInvitation, { foreignKey: 'projectId', as: 'invitations' });
User.hasMany(ProjectInvitation, { foreignKey: 'userId', as: 'projectInvitations' });

// Activity associations
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Activity.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
Activity.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Team.hasMany(Activity, { foreignKey: 'teamId', as: 'activities' });
Project.hasMany(Activity, { foreignKey: 'projectId', as: 'activities' });

// Milestone associations
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// ProjectFile associations
ProjectFile.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
ProjectFile.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
Project.hasMany(ProjectFile, { foreignKey: 'projectId', as: 'files' });

module.exports = {
  User,
  Project,
  Team,
  Comment,
  Rating,
  TeamInvitation,
  ProjectInvitation,
  Activity,
  Milestone,
  ProjectFile
};

