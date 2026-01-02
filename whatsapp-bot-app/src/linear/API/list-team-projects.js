const axios = require("axios");
require("dotenv").config();

const LINEAR_API_URL = "https://api.linear.app/graphql";

async function listTeams() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error("LINEAR_API_KEY is not set");
  }

  const response = await axios.post(
    LINEAR_API_URL,
    {
      query: `
        query {
          team(id: "cf0f736e-8d4e-425f-806c-38c05a280f9a") {
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
      
    },
    {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.data.errors && response.data.errors.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.team.projects;
    // return response.data.data.teams.nodes;

}

async function main() {
  try {
    const teams = await listTeams();
    // console.log(`Found ${teams.length} teams:`);
    console.log(teams);
    // for (const team of teams) {
    //   console.log(`- ${team.name} (${team.key}) [${team.id}]`);
    // }
  } catch (error) {
    console.error("Failed to list teams:", error.message);
    process.exitCode = 1;
  }
}

main();
