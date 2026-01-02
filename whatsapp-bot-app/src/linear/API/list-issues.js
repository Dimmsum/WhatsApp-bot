
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
            issues {
              nodes {
                id
                title
                description
                assignee {
                  id
                  name
                }
                createdAt
                archivedAt
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

  return response.data;
    // return response.data.data.teams.nodes;

}
