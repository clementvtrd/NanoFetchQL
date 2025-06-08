import fetchMock from 'jest-fetch-mock'
import gql from 'graphql-tag'

import NanoQLClient from './nano-ql-client'

const MOCKED_URL = 'https://example.com/graphql'

beforeEach(() => {
  fetchMock.resetMocks()
})

afterEach(() => {
  fetchMock.mock.calls.forEach(([url, { signal, ...body }]: any) => {
    expect(url).toBe(MOCKED_URL)
    expect(body).toMatchSnapshot()
  })
})

it('sends simple graphql request', async () => {
  const client = new NanoQLClient(MOCKED_URL);
  const mockResponse = { data: { hello: 'world' } };

  fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

  const query = gql`query { hello }`;
  const { response } = client.execute({ document: query });

  const json = await (await response).json();

  expect(fetchMock).toHaveBeenCalledWith(
    MOCKED_URL,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: expect.any(String)
    })
  );

  expect(json).toMatchSnapshot();
});

it('sends variables and operation name', async () => {
  const client = new NanoQLClient(MOCKED_URL);
  fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));

  const query = gql`
    query GetUser($id: ID!) {
      user(id: $id) { name }
    }
  `;

  client.execute({
    document: query,
    variables: { id: '123' },
    operationName: 'GetUser'
  });

  const { body } = fetchMock.mock.calls[0][1]!;
  const parsed = JSON.parse(body as string);

  expect(parsed.variables.id).toEqual('123');
  expect(parsed.operationName).toBe('GetUser');
})

it('merges RequestInit options with internal options', async () => {
  const client = new NanoQLClient(MOCKED_URL, {
    headers: { Authorization: 'Bearer token' },
    cache: 'no-store'
  });

  fetchMock.mockResponseOnce(JSON.stringify({ data: {} }));

  const query = gql`query { ping }`;
  await (await client.execute({ document: query }).response).json();

  expect(fetchMock).toHaveBeenCalledWith(
    MOCKED_URL,
    expect.objectContaining({
      cache: 'no-store',
      headers: expect.objectContaining({
        Authorization: 'Bearer token'
      })
    })
  );
});

it('allows cancelling a request via AbortController', async () => {
  const client = new NanoQLClient(MOCKED_URL);

  let rejectFetch: ((reason?: any) => void) | undefined;
  fetchMock.mockImplementationOnce(() =>
    new Promise((_resolve, reject) => {
      rejectFetch = reject;
    })
  );

  const { response, abort } = client.execute({
    document: gql`query { wait }`
  });

  // Simulate aborting the fetch
  abort();
  if (rejectFetch) {
    rejectFetch(new DOMException('The user aborted a request.', 'AbortError'));
  }

  await expect(response).rejects.toThrow(/aborted|AbortError/);
});

it('throws an error if the response contains GraphQL errors', async () => {
  const client = new NanoQLClient(MOCKED_URL);
  fetchMock.mockResponseOnce(JSON.stringify({
    errors: [{ message: 'Something went wrong' }]
  }));

  const { response } = client.execute({
    document: gql`query { fail }`
  });

  const data = await response;
  const json = await data.json();

  expect(json.errors).toBeDefined();
});
