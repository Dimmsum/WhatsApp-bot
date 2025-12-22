const { linearRequest } = require("./client");

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
  console.log("Teams fetched:", teams, "Input", teamIdOrKeyOrName, "needle", needle);

  const byKey = teams.find(
    (team) => team.key && team.key.toLowerCase() === needle
  );
  console.log("By key:", byKey);
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

    // If teamId was provided but couldn't be resolved, fail clearly
    if (teamId && !resolvedTeamId) {
      return {
        success: false,
        projects: [],
        message: "Team not found. Provide a team name, key, or ID.",
      };
    }

    // If no team was provided, fall back to listing all projects (optional)
    if (!resolvedTeamId) {
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

      return {
        success: true,
        projects: data.projects.nodes,
        message: `Found ${data.projects.nodes.length} projects`,
      };
    }

    // ✅ "Like your axios script": fetch team -> projects directly
    const data = await linearRequest(
      `
      query($teamId: String!) {
        team(id: $teamId) {
          id
          name
          projects {
            nodes {
              id
              name
              state
              url
            }
          }
        }
      }
      `,
      { teamId: resolvedTeamId }
    );

    const projects = data.team?.projects?.nodes || [];

    return {
      success: true,
      projects,
      message: `Found ${projects.length} projects for team ${data.team?.name || ""}`.trim(),
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

module.exports = {
  isLikelyUuid,
  resolveTeamId,
  listTeams,
  listProjects,
  listIssueStates,
};
