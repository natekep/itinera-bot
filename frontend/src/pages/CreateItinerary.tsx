export default function CreateItinerary() {
  return (
    <div className="flex justify-center mt-4 gap-4 ">
      <div className="flex flex-col">
        <label htmlFor="destination" className="text-black mb-2">
          Where
        </label>
        <input
          id="destination"
          type="text"
          placeholder="Enter your destination"
          className="border border-gray-300 rounded-lg px-4 py-2 w-50  focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destination" className="text-black mb-2">
          Arrive
        </label>
        <input
          id="destination"
          type="text"
          placeholder="Add dates"
          className="border border-gray-300 rounded-lg px-4 py-2 w-25  focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destination" className="text-black mb-2">
          Depart
        </label>
        <input
          id="destination"
          type="text"
          placeholder="Add dates"
          className="border border-gray-300 rounded-lg px-4 py-2 w-25  focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="destination" className="text-black mb-2">
          Who
        </label>
        <input
          id="destination"
          type="text"
          placeholder="Add guests"
          className="border border-gray-300 rounded-lg px-4 py-2 w-30 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col ml-2">
        <label htmlFor="destination" className="text-white mb-2">
          ...
        </label>
        <button className="bg-[#81b4fa] text-white px-4 py-2 rounded-lg hover:bg-gray-300">
          Sign Up
        </button>
      </div>
    </div>
  );
}
