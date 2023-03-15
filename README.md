# SurrealDB Data Provider and Auth Provider for React Admin

This package provides a data provider and auth provider for [react admin](https://marmelab.com/) to integrate with [SurrealDB](https://surrealdb.com/).
It uses [surrealdb.js](https://surrealdb.com/docs/integration/libraries/javascript) as driver to the database.

## Usage

### Installation:

```shell
yarn add ra-surrealdb
```

### Standalone Data Provider

In your code:

```typescript
import { Admin, Resource } from 'react-admin';
import { surrealDbDataProvider, useRaSurrealDb } from 'ra-surrealdb';

const App = () => (
  <Admin
    dataProvider={surrealDbDataProvider(
      useRaSurrealDb({
        url: 'http://127.0.0.1:8000/rpc',
        signinOptions: {
          NS: 'test',
          DB: 'test',
          SC: 'account_scope',
          user: 'user',
          pass: 'password',
        },
      })
    )}
  >
    <Resource name="article" list={ArticleList} />
  </Admin>
);
export default App;
```

The hook `useRaSurrealDb` creates the connexion to SurrealDB. It takes these parameters:

- the `url` of the database;
- `signinOptions` is the `Auth` object used by SurrealDB to connect.
- `localStorage`, if set to a string then the library stores the auth informations (jwt token) in local storage. If not set the auth informations are stored in memory and are reseted on page reload. The string represents the key used in the local storage.

The result of the hook is passed to the provider function `surrealDbDataProvider`.

### Data Provider with Auth Provider

```typescript
import { Admin, Resource } from 'react-admin';
import { surrealDbAuthProvider, surrealDbDataProvider, useRaSurrealDb } from 'ra-surrealdb';

const App = () => {
  const surreal = useRaSurrealDb({
    url: 'http://127.0.0.1:8000/rpc',
    signinOptions: {
      NS: 'test',
      DB: 'test',
      SC: 'account_scope',
    },
  });
  const authProvider = surrealDbAuthProvider(surreal);
  const dataProvider = surrealDbDataProvider(surreal);
  return (
    <Admin authProvider={authProvider} dataProvider={dataProvider}>
      <Resource name="article" list={ArticleList} />
    </Admin>
  );
};
export default App;
```

`useRaSurrealDb` creates a connexion to SurrealDB.
The same result is sent to both the auth provider and the data provider.

## Development

The library code is in `./src/lib`.

The repository also provides an example in `./src/App.tsx`.

To run the example, you need to setup a SurrealDB instance. It can be launch with the following commands:

```shell
docker compose up -d
curl -k -L -s --compressed POST --header "Accept: application/json" --header "NS: test" --header "DB: test" --user "root:root" --data-binary "@surreal_example.sql" http://localhost:8000/sql
```

Then launch the app:

```
yarn dev
```

The login is _user_:_password_ ...
