import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import CreateItinerary from "./pages/CreateItinerary";
import Onboarding from "./pages/Onboarding";

function AppContainer() {
  const location = useLocation();

  const isHome = location.pathname === "/";

  const bgClass = isHome
    ? "bg-[url('../../src/assets/mountain-bkg-img.jpg')] bg-cover"
    : "bg-[#F2F3F4]";

  return (
    <div className={`${bgClass} min-h-screen`}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreateItinerary />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContainer />
    </Router>
  );
}
