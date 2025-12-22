const { linearRequest } = require("./client");
const { isLikelyUuid, resolveTeamId } = require("./teams");

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


async function resolveProjectId(projectIdOrName) {
  if (!projectIdOrName) return null;
  if (isLikelyUuid(projectIdOrName)) return projectIdOrName;

  const raw = projectIdOrName.trim().toLowerCase();

  // clean: "the ATLAS project" -> "atlas"
  const needle = raw
    .replace(/\b(the|project|on|in|for|to|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const data = await linearRequest(`
    query {
      projects {
        nodes {
          id
          name
          state
          url
        }
      }
    }
  `);

  const projects = data.projects?.nodes || [];
  console.log("Projects fetched:", projects, "Input", projectIdOrName, "needle", needle);

  // 1) exact match
  const exact = projects.find((p) => (p.name || "").toLowerCase() === needle);
  if (exact) return exact.id;

  // 2) contains match (atlas -> "[Delivery] ATLAS MCP Agent")
  const contains = projects.find((p) =>
    (p.name || "").toLowerCase().includes(needle)
  );
  if (contains) return contains.id;

  // 3) token match (handles "atlas agent" etc.)
  const tokens = needle.split(/\s+/).filter(Boolean);
  const tokenMatch = projects.find((p) => {
    const name = (p.name || "").toLowerCase();
    return tokens.length > 0 && tokens.every((t) => name.includes(t));
  });
  if (tokenMatch) return tokenMatch.id;

  return null;
}

async function resolveAssigneeId(assigneeIdOrEmailOrName) {
  if (!assigneeIdOrEmailOrName) return null;
  if (isLikelyUuid(assigneeIdOrEmailOrName)) {
    return assigneeIdOrEmailOrName;
  }

  const needle = assigneeIdOrEmailOrName.trim().toLowerCase();
  const data = await linearRequest(`
    query {
      users {
        nodes {
          id
          name
          displayName
          email
        }
      }
    }
  `);

  const users = data.users.nodes;
  const byEmail = users.find(
    (user) => user.email && user.email.toLowerCase() === needle
  );
  if (byEmail) return byEmail.id;

  const byDisplayName = users.find(
    (user) => user.displayName && user.displayName.toLowerCase() === needle
  );
  if (byDisplayName) return byDisplayName.id;

  const byName = users.find(
    (user) => user.name && user.name.toLowerCase() === needle
  );
  if (byName) return byName.id;

  const tokens = needle.split(/\s+/).filter(Boolean);
  const partial = users.find((user) => {
    const name = user.name ? user.name.toLowerCase() : "";
    const displayName = user.displayName ? user.displayName.toLowerCase() : "";
    const email = user.email ? user.email.toLowerCase() : "";
    const fields = [name, displayName, email].filter(Boolean);

    if (fields.some((field) => field.includes(needle))) return true;
    if (fields.some((field) => needle.includes(field))) return true;

    return tokens.some((token) =>
      fields.some((field) => field.includes(token))
    );
  });

  return partial ? partial.id : null;
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

    console.log("Creating issue with  resolvedTeamId:", resolvedTeamId)


    const resolvedProjectId = await resolveProjectId(
      projectId
        );
    if (projectId && !resolvedProjectId) {
      return {
        success: false,
        message: "Project not found. Provide a project name or ID.",
      };
    }

    console.log("Creating issue with resolvedProjectId:", resolvedProjectId)

    const resolvedAssigneeId = await resolveAssigneeId(assigneeId);
    if (assigneeId && !resolvedAssigneeId) {
      return {
        success: false,
        message: "Assignee not found. Provide a name, email, or ID.",
      };
    }

    console.log("Creating issue with resolvedAssigneeId:", resolvedAssigneeId)

    const input = { title, teamId: resolvedTeamId };
    if (description) input.description = description;
    if (resolvedProjectId) input.projectId = resolvedProjectId;
    if (stateId) input.stateId = stateId;
    if (resolvedAssigneeId) input.assigneeId = resolvedAssigneeId;
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
  searchIssues,
  getIssue,
  createIssue,
  updateIssueStatus,
};
