import { useState } from "react";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {}

  return (
    <div className="mt-20 bg-white rounded-xl shadow-lg p-8 w-[90%] max-w-md mx-auto">
      <h1 className="text-xl">Sign Up</h1>
      <p className="text-gray-500 mt-2">
        Make an account to save itineraries and activities for your future
        vacations!
      </p>
      <form className="flex flex-col gap-4 w-full mt-5">
        <input
          type="text"
          placeholder="Full Name"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={fullName}
        />
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
        />
        <button
          type="submit"
          className="bg-black text-white py-2 rounded-lg hover:bg-gray-800"
        >
          Get Started!
        </button>
        <p className="text-gray-500  mx-auto">
          ------------ or sign up with ------------
        </p>
        <button className="bg-black text-white py-2 rounded-lg hover:bg-gray-800">
          Continue with Google
        </button>
      </form>
    </div>
  );
}
