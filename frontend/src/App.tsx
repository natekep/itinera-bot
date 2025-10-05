import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import CreateItinerary from "./pages/CreateItinerary";

export default function App() {
  return (
    <div className="bg-black min-h-screen">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<CreateItinerary />} />
        </Routes>
      </Router>
    </div>
  );
}
