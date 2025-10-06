import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Onboarding from "./pages/Onboarding";

function Home() {
  const [message, setMessage] = useState("Loading...");

  // Call FastAPI backend when component loads
  useEffect(() => {
    fetch("http://127.0.0.1:8000/") // <-- your FastAPI GET /
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error("Error fetching from backend:", err);
        setMessage("Backend not available");
      });
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Itinera Frontend</h1>
      <p>{message}</p>
      <p>
        <Link to="/onboarding">Go to Onboarding</Link>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </Router>
  );
}
