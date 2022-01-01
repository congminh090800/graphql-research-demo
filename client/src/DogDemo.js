import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from "@apollo/client";

const client = new ApolloClient({
  uri: "https://71z1g.sse.codesandbox.io/",
  cache: new InMemoryCache(),
});



const GET_DOGS = gql`
  query GetDogs {
    dogs {
      id
      breed
    }
  }
`;

function Dogs({ onDogSelected, selectedDog }) {
  const { loading, error, data } = useQuery(GET_DOGS);

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  return (
    <FormControl fullWidth sx={{ marginTop: 2 }}>
      <InputLabel id="demo-simple-select-label">Dog</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        name="dog"
        label="Dog"
        onChange={onDogSelected}
        sx={{ maxWidth: 300 }}
      >
        {data.dogs.map((dog) => (
          <MenuItem key={dog.id} value={dog.breed}>
            {dog.breed}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const GET_DOG_PHOTO = gql`
  query dog($breed: String!) {
    dog(breed: $breed) {
      id
      displayImage
    }
  }
`;

function DogPhoto({ breed }) {
  const { loading, error, data, refetch, networkStatus } = useQuery(
    GET_DOG_PHOTO,
    {
      variables: { breed },
      notifyOnNetworkStatusChange: true,
      // pollInterval: 500
    }
  );

  if (networkStatus === 4) return <p>Refecting data!</p>;
  if (loading) return <Typography>Querying data...</Typography>;
  if (error) return `Error!: ${error}`;

  return (
    // <div>
    //   <div>
    //     <img src={data.dog.displayImage} style={{ height: 100, width: 100 }} />
    //   </div>
    //   <button onClick={() => refetch()}>Refetch!</button>
    // </div>
    <Box sx={{ marginTop: 4, display: "flex", alignItems: "center" }}>
      <Box>
        <img
          src={data.dog.displayImage}
          style={{ height: 200, width: 200, objectFit: "contain" }}
        />
      </Box>
      <Button
        onClick={() => refetch()}
        fullWidth={false}
        variant="outlined"
        sx={{ width: 100, height: 40, marginLeft: 4 }}
      >
        <Typography>Refetch</Typography>
      </Button>
    </Box>
  );
}

const DogDemoPage = () => {
  const [selectedDog, setSelectedDog] = useState(null);

  function onDogSelected({ target }) {
    setSelectedDog(target.value);
  }
  return (
    <ApolloProvider client={client}>
      <Box sx={{ padding: 4 }}>
        <Box sx={{ display: "flex", marginBottom: 1 }}>
          <Typography sx={{ fontWeight: 600, marginRight: 1 }}>
            Simple GraphQL Fetching Demo
          </Typography>
          <Link to="/">
            <Typography>Go back</Typography>
          </Link>
        </Box>
        <Dogs onDogSelected={onDogSelected} />
        {selectedDog && <DogPhoto breed={selectedDog} />}
      </Box>
    </ApolloProvider>
  );
};

export default DogDemoPage;
