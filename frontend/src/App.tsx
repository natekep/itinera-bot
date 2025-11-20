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
import Bookings from "./pages/Bookings";

function AppContainer() {
  const location = useLocation();

  const isHome = location.pathname === "/";
  const hideNavbarRoutes = ["/login", "/signup", "/onboarding", "/404"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  const bgClass = isHome
    ? "bg-[url('../../src/assets/mountain-bkg-img.jpg')] bg-cover"
    : "bg-[#F2F3F4]";
import Trevor from "./pages/Trevor";
import Iram from "./pages/Iram";
import Nate from "./pages/Nate";
import Hongjie from "./pages/Hongjie";
import UserOnboarding from "./pages/UserOnboarding";
import About from "./pages/About";
import ViewItinerary from "./pages/ViewItinerary";

function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/signup", "/useronboarding", "/404"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreateItinerary />} />
        <Route path="/itinerary/:itineraryId" element={<ViewItinerary />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/useronboarding" element={<UserOnboarding />} />
        <Route path="/about" element={<About />} />
        <Route path="/trevor" element={<Trevor />} />
        <Route path="/iram" element={<Iram />} />
        <Route path="/nate" element={<Nate />} />
        <Route path="/hongjie" element={<Hongjie />} />
      </Routes>
    </>
  );
}

  return (
    <div
      className={`${bgClass} ${
        isHome ? "h-screen overflow-hidden" : "min-h-screen"
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
        <Route path="/bookings" element={<Bookings />}></Route>
      </Routes>
    </div>
    <Router>
      <AppContent />
    </Router>
  );
}

export default function App() {
  return (
    <Router>
      <AppContainer />
    </Router>
  );
}
