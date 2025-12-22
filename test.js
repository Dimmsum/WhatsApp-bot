const axios = require("axios");
require("dotenv").config();

const LINEAR_API_URL = "https://api.linear.app/graphql";

function isLikelyUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function linearRequest(query, variables = {}) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY is not set");

  const response = await axios.post(
    LINEAR_API_URL,
    { query, variables },
    {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.errors?.length) {
    const message = response.data.errors.map((err) => err.message).join("; ");
    throw new Error(message);
  }

  return response.data.data;
}

async function listUsers() {
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

  return data.users.nodes;
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


async function main() {
  try {
    const query = process.argv.slice(2).join(" ").trim();

    if (query) {
      const resolvedId = await resolveAssigneeId(query);
      if (!resolvedId) {
        console.log("No matching user found.");
        return;
      }
      console.log(`Resolved assignee ID: ${resolvedId}`);
      return;
    }

    const users = await listUsers();
    console.log(`Found ${users.length} users:`);
    for (const user of users) {
      const displayName = user.displayName ? ` (${user.displayName})` : "";
      console.log(`- ${user.name}${displayName} <${user.email}> [${user.id}]`);
    }
  } catch (error) {
    const responseData = error.response?.data;
    console.error("Failed to list users:", error.message);
    if (responseData) {
      console.error("Response:", JSON.stringify(responseData, null, 2));
    }
    process.exitCode = 1;
  }
}

main();
