/** Build a fake fetch that answers from a list of handlers and records calls. */
export function mockFetch(respond) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const call = { url, init, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    const { status = 200, json } = await respond(call, calls.length - 1);
    return {
      status,
      ok: status >= 200 && status < 300,
      json: async () => json,
    };
  };
  return { fetchImpl, calls };
}

export function graphqlRepo(name, stars, language = 'JavaScript', color = '#f1e05a') {
  return {
    name,
    description: null,
    stargazerCount: stars,
    forkCount: Math.floor(stars / 10),
    isFork: false,
    isArchived: false,
    primaryLanguage: language ? { name: language, color } : null,
  };
}

export function graphqlPage(nodes, { hasNextPage = false, endCursor = null, totalCount } = {}) {
  return {
    data: {
      repositoryOwner: {
        __typename: 'User',
        login: 'octocat',
        name: 'The Octocat',
        followers: { totalCount: 42 },
        repositories: {
          totalCount: totalCount ?? nodes.length,
          pageInfo: { hasNextPage, endCursor },
          nodes,
        },
      },
    },
  };
}
