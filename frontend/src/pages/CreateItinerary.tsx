import { Search } from "lucide-react";

export default function CreateItinerary() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex justify-center mt-10">
        <div className="flex items-center bg-white shadow-md rounded-full px-6 py-3 w-full max-w-4xl border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">Where</label>
            <input
              type="text"
              placeholder="Search destinations"
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">
              Check in
            </label>
            <input
              type="text"
              placeholder="Add dates"
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4 border-r border-gray-300">
            <label className="text-sm font-semibold text-gray-800">
              Check out
            </label>
            <input
              type="text"
              placeholder="Add dates"
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-col flex-1 px-4">
            <label className="text-sm font-semibold text-gray-800">Who</label>
            <input
              type="text"
              placeholder="Add guests"
              className="text-gray-600 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>
          <button className="ml-4 bg-[#81b4fa] text-white rounded-full p-3 hover:bg-blue-400 transition">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
