<<<<<<< HEAD
<<<<<<< Updated upstream
// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Maps from "./pages/Maps";
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
=======
=======
>>>>>>> main
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import CreateItinerary from "./pages/CreateItinerary";
import { supabase } from "./supabaseClient";
import Onboarding from "./pages/Onboarding";
import Trevor from "./pages/Trevor";
import Iram from "./pages/Iram";
import Nate from "./pages/Nate";
import Hongjie from "./pages/Hongjie";
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> main

export default function App() {
  return (
<<<<<<< HEAD
<<<<<<< Updated upstream
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
=======
    <div>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<CreateItinerary />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/trevor" element={<Trevor />} />
          <Route path="/iram" element={<Iram />} />
          <Route path="/nate" element={<Nate />} />
          <Route path="/hongjie" element={<Hongjie />} />
        </Routes>
      </Router>
    </div>
  );
}
>>>>>>> Stashed changes
=======
    <div>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<CreateItinerary />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/trevor" element={<Trevor />} />
          <Route path="/iram" element={<Iram />} />
          <Route path="/nate" element={<Nate />} />
          <Route path="/hongjie" element={<Hongjie />} />
        </Routes>
      </Router>
    </div>
  );
}
>>>>>>> main
