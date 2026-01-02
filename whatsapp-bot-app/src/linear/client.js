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
  //   if (err.response) {
  //   console.error("Linear HTTP error:", err.response.status);
  //   console.error("Linear response body:", JSON.stringify(err.response.data, null, 2));
  //   console.error("Linear request body:", JSON.stringify(err.config?.data, null, 2));
  // }

  return response.data.data;
}

module.exports = {
  linearRequest,
};
