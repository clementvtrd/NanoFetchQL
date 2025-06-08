# nano-fetch-ql

A minimalist, zero-dependency (except for `graphql` itself) GraphQL client based on the Fetch API, written in TypeScript. Designed to be lightweight and straightforward for making GraphQL requests.

## Features

*   Tiny footprint.
*   Uses the native `fetch` API.
*   Supports GraphQL queries, mutations, variables, and operation names.
*   Allows setting default `RequestInit` options (e.g., headers) for the client instance.
*   Provides an `abort()` function to cancel in-flight requests using `AbortController`.
*   Written in TypeScript, providing type safety.

## Installation

You can install `nano-fetch-ql` using npm or yarn. You'll also need `graphql` (which is a peer dependency for handling `DocumentNode` types) and typically `graphql-tag` for easily creating GraphQL query documents.

```bash
# Using npm
npm install nano-fetch-ql graphql graphql-tag

# Using yarn
yarn add nano-fetch-ql graphql graphql-tag
```

## Basic Usage

Here's a simple example of how to use `NanoQLClient`:

```typescript
import NanoQLClient from 'nano-fetch-ql';
import gql from 'graphql-tag'; // Or your preferred way to create a DocumentNode

// Initialize the client with your GraphQL endpoint
const client = new NanoQLClient('https://your-graphql-api.com/graphql');

// Define your GraphQL query
const HELLO_QUERY = gql`
  query SayHello {
    greeting
  }
`;

async function fetchGreeting() {
  try {
    // Execute the query
    const { response } = client.execute({ document: HELLO_QUERY });

    // Get the actual fetch Response object
    const fetchResponse = await response;

    if (!fetchResponse.ok) {
      // Handle HTTP errors
      console.error(`HTTP error! status: ${fetchResponse.status}`);
      // You might want to parse the body for more details if available
      const errorBody = await fetchResponse.text();
      console.error('Error body:', errorBody);
      return;
    }

    // Parse the JSON response
    const result = await fetchResponse.json();

    if (result.errors) {
      // Handle GraphQL errors
      console.error('GraphQL Errors:', result.errors);
    } else {
      // Access your data
      console.log('Data:', result.data); // e.g., { greeting: 'Hello, world!' }
    }
  } catch (error) {
    // Handle network errors or other issues
    if (error.name === 'AbortError') {
      console.log('Request was aborted.');
    } else {
      console.error('Request failed:', error);
    }
  }
}

fetchGreeting();
```

## Advanced Usage

### Using Variables and Operation Name

You can pass variables and an operation name to the `execute` method:

```typescript
import NanoQLClient from 'nano-fetch-ql';
import gql from 'graphql-tag';

const client = new NanoQLClient('https://your-graphql-api.com/graphql');

const GET_USER_QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

async function fetchUser(userId: string) {
  try {
    const { response } = client.execute({
      document: GET_USER_QUERY,
      variables: { id: userId },
      operationName: 'GetUser', // Optional, but good practice
    });

    const result = await (await response).json();

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
    } else {
      console.log('User Data:', result.data.user);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

fetchUser('123');
```

### Setting Default Request Options

You can provide default `RequestInit` options (like custom headers) when creating the client. These will be merged with the options for each request.

```typescript
const clientWithAuth = new NanoQLClient(
  'https://your-graphql-api.com/graphql',
  {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'X-Custom-Header': 'MyValue'
    },
    cache: 'no-store' // Example of another RequestInit option
  }
);

// Now, all requests made with clientWithAuth will include these headers.
// clientWithAuth.execute({ document: SOME_QUERY });
```

### Aborting a Request

The `execute` method returns an `abort` function that you can call to cancel the request.

```typescript
const VERY_LONG_QUERY = gql`
  query LongRunningOperation {
    someDataThatTakesTime
  }
`;

const { response, abort } = client.execute({ document: VERY_LONG_QUERY });

// If you need to cancel the request (e.g., user navigates away, timeout)
setTimeout(() => {
  console.log('Aborting request...');
  abort('Request timed out by client'); // Optional reason
}, 5000); // Abort after 5 seconds

try {
  const result = await (await response).json();
  console.log('Data received:', result.data);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request successfully aborted:', error.message);
  } else {
    console.error('Error during fetch:', error);
  }
}
```

## API Reference

### `NanoQLClient`

#### `constructor(url: string | URL, defaultOptions?: RequestInit)`

*   `url`: The URL of your GraphQL endpoint.
*   `defaultOptions` (optional): Default `RequestInit` options to be used for all requests made by this client instance.

#### `execute<V extends Record<string, unknown>>({ document, variables, operationName }: ExecuteParams<V>)`

*   `document: DocumentNode`: The GraphQL query or mutation document (AST). Typically created using `graphql-tag`.
*   `variables?: V`: An object containing variables for the GraphQL operation.
*   `operationName?: string`: The name of the operation to execute, if your document contains multiple operations.
*   **Returns**: An object `{ response: Promise<Response>, abort: (reason?: any) => void }`
    *   `response`: A `Promise` that resolves to the raw `fetch` API `Response` object. You'll need to call methods like `.json()` on it to get the body.
    *   `abort(reason?: any)`: A function that, when called, aborts the underlying `fetch` request. An optional `reason` can be provided.

#### `url: string`
Returns the string representation of the GraphQL endpoint URL.

#### `options: RequestInit | undefined`
Returns the default `RequestInit` options configured for the client.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [COPYRIGHT.md](COPYRIGHT.md) file for details.
