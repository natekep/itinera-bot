import { Search, Send } from "lucide-react";
import { useState } from "react";

export default function CreateItinerary() {
  const [query, setQuery] = useState("");

  const handleSend = () => {
    if (query.trim()) {
      console.log("User query:", query);
      setQuery("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex justify-center mt-20">
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
      <div className="flex-1"></div>
      <div className="border-t border-gray-200 bg-white p-4 fixed bottom-0 left-0 right-0 flex items-center justify-center shadow-md">
        <input
          type="text"
          placeholder="Ask Itinera anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="w-3/4 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
        />
        <button
          onClick={handleSend}
          className="ml-3 bg-[#81b4fa] text-white p-3 rounded-full hover:bg-blue-400 transition"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
