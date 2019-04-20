const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
const NewsSearchAPIClient = require('azure-cognitiveservices-newssearch');

async function search(search_term) {
  const credentials = new CognitiveServicesCredentials(process.env.BingNewsSearchAPIKey);
  const client = new NewsSearchAPIClient(credentials);
  let searchResults = [];

  try {
    const response = await client.newsOperations.search(search_term);
    searchResults = response.value;
  } catch (error) {
    console.log(error);
  }

  return searchResults;
}

module.exports.newsSearch = search;