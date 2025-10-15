import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="mt-20 ml-[5%]">
      <h1 className="text-[#81b4fa] text-9xl">Itinera</h1>
      <div className="text-xl mt-3">
        <p className="">
          Your AI-powered trip planner that builds custom itineraries
        </p>
        <p>so you can explore the experiences you actually want</p>
        <div className="flex gap-3">
          <Link to="/create">
            <button className="bg-[#81b4fa] text-white text-xl px-5 py-2 rounded-full border-2 border-[#81b4fa] hover:bg-white hover:text-[#81b4fa] transition-colors duration-300 mt-5">
              Plan your vacation
            </button>
          </Link>
          <Link to="/about">
            <button className="bg-white border-2 border-[#81b4fa] text-[#81b4fa] text-xl px-5 py-2 rounded-full hover:bg-[#81b4fa] hover:text-white transition-colors duration-200 mt-5">
              View Saved Itineraries
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
