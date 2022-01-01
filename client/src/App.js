import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import DogDemoPage from "./DogDemo";
import TodoListDemoPage from "./TodoListDemo";

const Home = () => {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography sx={{ fontWeight: 600 }}>Demo Pages</Typography>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Link to="/dog">
          <Typography>Dog Demo</Typography>
        </Link>
        <Link to="/todo">
          <Typography>Todolist Demo</Typography>
        </Link>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dog" element={<DogDemoPage />} />
        <Route path="/todo" element={<TodoListDemoPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
