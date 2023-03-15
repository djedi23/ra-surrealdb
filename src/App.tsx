import {
  Admin,
  Create,
  Datagrid,
  DateField,
  DateInput,
  Edit,
  EditGuesser,
  List,
  ListGuesser,
  ReferenceArrayField,
  ReferenceArrayInput,
  ReferenceManyField,
  Resource,
  Show,
  ShowGuesser,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
} from 'react-admin';
import { surrealDbAuthProvider, surrealDbDataProvider, useRaSurrealDb } from './lib';

function App() {
  const surreal = useRaSurrealDb({
    url: 'http://127.0.0.1:8000/rpc',
    signinOptions: {
      NS: 'test',
      DB: 'test',
      SC: 'account_scope',
    },
    localStorage: 'ra_auth',
  });

  const dataProvider = surrealDbDataProvider(surreal);
  const authProvider = surrealDbAuthProvider(surreal);

  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider}>
      <Resource
        name="article"
        list={ArticleList}
        show={ArticleShow}
        edit={ArticleEdit}
        create={ArticleCreate}
      />
      <Resource
        name="author"
        list={ListGuesser}
        show={ShowGuesser}
        edit={EditGuesser}
        recordRepresentation="name.full"
      />
    </Admin>
  );
}

export default App;

const articleFilters = [<TextInput label="Title" source="title" />];

const ArticleList = () => (
  <List filters={articleFilters}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <ReferenceArrayField source="author" reference="author" />
      <DateField source="created_at" />
      <TextField source="title" />
    </Datagrid>
  </List>
);

const ArticleCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="id" />
      <ReferenceArrayInput source="author" reference="author" />
      <DateInput source="created_at" />
      <TextInput source="title" />
      <TextInput source="text" />
    </SimpleForm>
  </Create>
);

const ArticleShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <DateField source="created_at" />
      <TextField source="text" />
      <TextField source="title" />
      <ReferenceManyField label="Author" reference="author" target="author">
        <Datagrid isRowSelectable={() => false}>
          <TextField source="id" />
          <TextField source="name.full" />
        </Datagrid>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);

const ArticleEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" />
      <ReferenceArrayInput source="author" reference="author" />
      <DateInput source="created_at" />
      <TextInput source="title" />
      <TextInput source="text" />
    </SimpleForm>
  </Edit>
);
