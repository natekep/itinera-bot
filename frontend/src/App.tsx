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
import Profile from "./pages/Profile";
import TripSummary from "./pages/TripSummary";

function AppContainer() {
  const location = useLocation();

  const isHome = location.pathname === "/";
  const hideNavbarRoutes = ["/login", "/signup", "/onboarding", "/404"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  const bgClass = isHome
    ? "bg-[url('/mountain-bkg-img.jpg')] bg-cover"
    : "bg-[#F2F3F4]";

  return (
    <div
      className={`${bgClass} ${
        isHome ? "h-screen overflow-auto" : "min-h-screen"
      }`}
    >
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreateItinerary />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/tripSummary/:itinerary_id" element={<TripSummary />}></Route>
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
