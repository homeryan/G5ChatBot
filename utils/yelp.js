const yelp = require('yelp-fusion');

async function search(keyword) {
  const searchRequest = {
    term: keyword,
    location: 'Calgary, Alberta, Canada',
    limit: 10
  };

  const client = yelp.client(process.env.YelpAPIKey);
  const response = await client.search(searchRequest);
  return response.jsonBody.businesses;
}

module.exports.yelpSearch = search;