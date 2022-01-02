import React from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  useMutation,
  gql,
} from "@apollo/client";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const client = new ApolloClient({
  uri: "https://sxewr.sse.codesandbox.io/",
  cache: new InMemoryCache(),
});

const GET_TODOS = gql`
  {
    todos {
      id
      type
    }
  }
`;

const UPDATE_TODO = gql`
  mutation UpdateTodo($id: String!, $type: String!) {
    updateTodo(id: $id, type: $type) {
      id
      type
    }
  }
`;

function Todos() {
  const { loading, error, data } = useQuery(GET_TODOS);
  const [
    updateTodo,
    { loading: mutationLoading, error: mutationError, reset },
  ] = useMutation(UPDATE_TODO);
  console.log(mutationLoading);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return data.todos.map(({ id, type }) => {
    let input;

    return (
      <div key={id} style={{ display: "flex", alignItems: "center" }}>
        <p>{type}</p>
        <form
          style={{ marginLeft: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            updateTodo({ variables: { id, type: input.value } });

            input.value = "";
          }}
        >
          <input
            ref={(node) => {
              input = node;
            }}
          />
          <button type="submit">Update Todo</button>
        </form>
        {mutationLoading && <p>updating...</p>}
        {mutationError && <p>Error :( Please try again</p>}
      </div>
    );
  });
}

const ADD_TODO = gql`
  mutation AddTodo($type: String!) {
    addTodo(type: $type) {
      id
      type
    }
  }
`;

function AddTodo() {
  let input;
  const [addTodo] = useMutation(ADD_TODO, {
    update(cache, { data: { addTodo } }) {
      cache.modify({
        fields: {
          todos(existingTodos = []) {
            const newTodoRef = cache.writeFragment({
              data: addTodo,
              fragment: gql`
                fragment NewTodo on Todo {
                  id
                  type
                }
              `,
            });
            return existingTodos.concat(newTodoRef);
          },
        },
      });
    },
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTodo({ variables: { type: input.value } });
          input.value = "";
        }}
      >
        <input
          ref={(node) => {
            input = node;
          }}
        />
        <button type="submit">Add Todo</button>
      </form>
    </div>
  );
}

export default function TodoListDemoPage() {
  return (
    <ApolloProvider client={client}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: "flex", marginBottom: 1 }}>
          <Typography sx={{ fontWeight: 600, marginRight: 1 }}>
            Simple GraphQL Mutation Demo
          </Typography>
          <Link to="/">
            <Typography>Go back</Typography>
          </Link>
        </Box>
        <AddTodo />
        <Todos />
      </Box>
    </ApolloProvider>
  );
}
