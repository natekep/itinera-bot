import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Itinera from "./pages/Maps";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/itinera" element={<Itinera />} />
      </Routes>
    </Router>
  );
}
