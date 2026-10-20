// Preloaded with `node --import` so scripts that run as their own process
// (scripts/action.js) talk to a fake GitHub API instead of the network.
import { graphqlPage, graphqlRepo, mockFetch } from '../helpers.js';

globalThis.fetch = mockFetch(() => ({
  json: graphqlPage([graphqlRepo('hello-world', 1500, 'TypeScript', '#3178c6')]),
})).fetchImpl;
