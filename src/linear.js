const axios = require("axios");
require("dotenv").config();

const LINEAR_API_URL = "https://api.linear.app/graphql";

function getApiKey() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error("LINEAR_API_KEY is not set");
  }
  return apiKey;
}

async function linearRequest(query, variables = {}) {
  const response = await axios.post(
    LINEAR_API_URL,
    { query, variables },
    {
      headers: {
        Authorization: getApiKey(),
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.errors && response.data.errors.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data;
}

function isLikelyUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function fetchTeams() {
  const data = await linearRequest(`
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `);

  return data.teams.nodes;
}

async function resolveTeamId(teamIdOrKeyOrName) {
  if (!teamIdOrKeyOrName) return null;
  if (isLikelyUuid(teamIdOrKeyOrName)) return teamIdOrKeyOrName;

  const needle = teamIdOrKeyOrName.trim().toLowerCase();
  const teams = await fetchTeams();

  const byKey = teams.find(
    (team) => team.key && team.key.toLowerCase() === needle
  );
  if (byKey) return byKey.id;

  const byName = teams.find(
    (team) => team.name && team.name.toLowerCase() === needle
  );
  if (byName) return byName.id;

  const partial = teams.find(
    (team) =>
      (team.name && team.name.toLowerCase().includes(needle)) ||
      (team.key && team.key.toLowerCase().includes(needle))
  );

  return partial ? partial.id : null;
}

async function listTeams() {
  try {
    const teams = await fetchTeams();

    return {
      success: true,
      teams,
      message: `Found ${teams.length} teams`,
    };
  } catch (error) {
    console.error("Error listing Linear teams:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to list Linear teams",
    };
  }
}

async function listProjects(teamId = null) {
  try {
    const resolvedTeamId = await resolveTeamId(teamId);
    const data = await linearRequest(`
      query {
        projects {
          nodes {
            id
            name
            state
            url
            team {
              id
              name
              key
            }
          }
        }
      }
    `);

    const projects = teamId
      ? data.projects.nodes.filter(
          (project) => project.team?.id === resolvedTeamId
        )
      : data.projects.nodes;

    return {
      success: true,
      projects,
      message: `Found ${projects.length} projects`,
    };
  } catch (error) {
    console.error("Error listing Linear projects:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to list Linear projects",
    };
  }
}

async function listIssueStates(teamId) {
  try {
    const resolvedTeamId = await resolveTeamId(teamId);
    if (!resolvedTeamId) {
      return {
        success: false,
        message: "Team not found. Provide a team name, key, or ID.",
      };
    }

    const data = await linearRequest(
      `
        query($teamId: String!) {
          team(id: $teamId) {
            id
            name
            states {
              nodes {
                id
                name
                type
                position
              }
            }
          }
        }
      `,
      { teamId: resolvedTeamId }
    );

    return {
      success: true,
      states: data.team?.states?.nodes || [],
      message: `Found ${data.team?.states?.nodes?.length || 0} states`,
    };
  } catch (error) {
    console.error("Error listing Linear states:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to list Linear issue states",
    };
  }
}

async function searchIssues(query, first = 10) {
  try {
    const data = await linearRequest(
      `
        query($query: String!, $first: Int!) {
          searchIssues(query: $query, first: $first) {
            nodes {
              id
              identifier
              title
              url
              state {
                name
              }
              assignee {
                name
              }
            }
          }
        }
      `,
      { query, first }
    );

    return {
      success: true,
      issues: data.searchIssues.nodes,
      message: `Found ${data.searchIssues.nodes.length} issues`,
    };
  } catch (error) {
    console.error("Error searching Linear issues:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to search Linear issues",
    };
  }
}

async function getIssue(issueIdOrKey) {
  try {
    let issue = null;

    if (isLikelyUuid(issueIdOrKey)) {
      const data = await linearRequest(
        `
          query($id: String!) {
            issue(id: $id) {
              id
              identifier
              title
              description
              url
              state {
                name
              }
              assignee {
                name
              }
              team {
                id
                name
                key
              }
            }
          }
        `,
        { id: issueIdOrKey }
      );

      issue = data.issue;
    } else {
      const search = await searchIssues(issueIdOrKey, 1);
      issue = search.issues?.[0] || null;
    }

    if (!issue) {
      return {
        success: false,
        message: "No issue found for that identifier",
      };
    }

    return {
      success: true,
      issue,
      message: `Found issue ${issue.identifier}`,
    };
  } catch (error) {
    console.error("Error getting Linear issue:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to get Linear issue",
    };
  }
}

async function resolveIssueId(issueIdOrKey) {
  if (isLikelyUuid(issueIdOrKey)) {
    return issueIdOrKey;
  }

  const search = await searchIssues(issueIdOrKey, 1);
  const issue = search.issues?.[0];
  return issue ? issue.id : null;
}

async function createIssue(
  title,
  description = null,
  teamId,
  projectId = null,
  stateId = null,
  assigneeId = null,
  labelIds = null
) {
  try {
    const resolvedTeamId = await resolveTeamId(teamId);
    if (!resolvedTeamId) {
      return {
        success: false,
        message: "Team not found. Provide a team name, key, or ID.",
      };
    }

    const input = { title, teamId: resolvedTeamId };
    if (description) input.description = description;
    if (projectId) input.projectId = projectId;
    if (stateId) input.stateId = stateId;
    if (assigneeId) input.assigneeId = assigneeId;
    if (Array.isArray(labelIds) && labelIds.length) input.labelIds = labelIds;

    const data = await linearRequest(
      `
        mutation($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              identifier
              title
              url
              state {
                name
              }
            }
          }
        }
      `,
      { input }
    );

    return {
      success: data.issueCreate.success,
      issue: data.issueCreate.issue,
      message: `Issue created: ${data.issueCreate.issue.identifier}`,
    };
  } catch (error) {
    console.error("Error creating Linear issue:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to create Linear issue",
    };
  }
}

async function updateIssueStatus(issueIdOrKey, stateId) {
  try {
    const issueId = await resolveIssueId(issueIdOrKey);
    if (!issueId) {
      return {
        success: false,
        message: "No issue found for that identifier",
      };
    }

    const data = await linearRequest(
      `
        mutation($id: String!, $stateId: String!) {
          issueUpdate(input: { id: $id, stateId: $stateId }) {
            success
            issue {
              id
              identifier
              title
              url
              state {
                name
              }
            }
          }
        }
      `,
      { id: issueId, stateId }
    );

    return {
      success: data.issueUpdate.success,
      issue: data.issueUpdate.issue,
      message: `Issue updated to ${data.issueUpdate.issue.state.name}`,
    };
  } catch (error) {
    console.error("Error updating Linear issue:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to update Linear issue status",
    };
  }
}

module.exports = {
  listTeams,
  listProjects,
  listIssueStates,
  searchIssues,
  getIssue,
  createIssue,
  updateIssueStatus,
};
