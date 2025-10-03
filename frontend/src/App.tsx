import { useEffect, useState } from "react";

function App() {
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
    </div>
  );
}

export default App;
