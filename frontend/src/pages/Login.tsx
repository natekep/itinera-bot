export default function Login() {
  return (
    <div className="mt-20 bg-white rounded-xl shadow-lg p-8 w-[90%] max-w-md mx-auto">
      <h1 className="text-xl">Login</h1>
      <p className="text-gray-500 mt-2">
        Log back in to view saved itineraries and activities for your future
        vacations!
      </p>
      <form className="flex flex-col gap-4 w-full mt-5">
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-black text-white py-2 rounded-lg hover:bg-gray-800"
        >
          Continue
        </button>
        <p className="text-gray-500  mx-auto">
          ------------ or log in with ------------
        </p>
        <button className="bg-black text-white py-2 rounded-lg hover:bg-gray-800">
          Continue with Google
        </button>
      </form>
    </div>
  );
}
