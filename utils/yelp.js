const yelp = require('yelp-fusion');
const apiKey = 't6s-oG23KMKya65umm9QBUJ0UVEqHYqqdPhm7L6IDzgyl1nDTs3PuTvhBgCmi7DP6FC1amSFaGPzpA5sGdqgSc0GFjovcLKvbF13fdBpwlVSrl9WjLxXb73iUMi4XHYx';

async function search(keyword) {
  const searchRequest = {
    term: keyword,
    location: 'Calgary, Alberta, Canada',
    limit: 10
  };

  const client = yelp.client(apiKey);
  const response = await client.search(searchRequest);
  return response.jsonBody.businesses;
}

module.exports.yelpSearch = search;