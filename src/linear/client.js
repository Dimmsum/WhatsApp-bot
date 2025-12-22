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

module.exports = {
  linearRequest,
};
