import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import CreateItinerary from "./pages/CreateItinerary";
import Onboarding from "./pages/Onboarding";
import Trevor from "./pages/Trevor";
import Iram from "./pages/Iram";
import Nate from "./pages/Nate";
import Hongjie from "./pages/Hongjie";
import Profile from "./pages/Profile";

export default function App() {
  return (
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/trevor" element={<Trevor />} />
          <Route path="/iram" element={<Iram />} />
          <Route path="/nate" element={<Nate />} />
          <Route path="/hongjie" element={<Hongjie />} />
        </Routes>
      </Router>
    </div>
  );
}
