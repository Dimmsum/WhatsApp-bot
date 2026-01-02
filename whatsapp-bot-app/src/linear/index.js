const teams = require("./teams");
const issues = require("./issues");

module.exports = {
  listTeams: teams.listTeams,
  listProjects: teams.listProjects,
  listIssueStates: teams.listIssueStates,
  searchIssues: issues.searchIssues,
  getIssue: issues.getIssue,
  createIssue: issues.createIssue,
  updateIssueStatus: issues.updateIssueStatus,
};
