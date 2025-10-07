// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Maps from "./pages/maps";
import "./styles/app.css"; // add a CSS file for styling

function HomePage() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error("Error fetching from backend:", err);
        setMessage("Backend not available");
      });
  }, []);

  return (
    <div className="home-container">
      <h1>Itinera Frontend</h1>
      <p>{message}</p>
      <Link to="/maps" className="home-link">
        👉 Go to Maps
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/maps" element={<Maps />} />
      </Routes>
    </Router>
  );
}

export default App;
