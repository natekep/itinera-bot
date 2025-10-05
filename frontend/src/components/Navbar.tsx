import ItineraLogo from "../assets/Itinera.png";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div>
      <nav className="flex justify-between items-center w-[92%] mx-auto">
        <div className="">
          <img className="w-25" src={ItineraLogo}></img>
        </div>
        <div className="text-white">
          <ul className=" flex items-center gap-[6vw]">
            <li>
              <Link className="hover:text-gray-500" to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/create">
                Create Itinerary
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/explore">
                Explore
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-500" to="/about">
                About Us
              </Link>
            </li>
          </ul>
        </div>
        <div className="">
          <Link to="/signup">
            <button className="bg-white text-black px-5 py-2 rounded-full hover:bg-gray-300">
              Sign Up
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
