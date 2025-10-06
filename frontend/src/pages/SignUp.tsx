import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // prevents page reload when form is submitted

    // supabase sign up call
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Sign up is succesful!");
      navigate("/");
    }
  }

  return (
    <div className="mt-20 bg-white rounded-xl shadow-lg p-8 w-[100%] max-w-md mx-auto">
      <h1 className="text-xl">Sign Up</h1>
      <p className="text-gray-500 mt-2">
        Make an account to save itineraries and activities for your future
        vacations!
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-5">
        <input
          type="text"
          placeholder="Full Name"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
          }}
        />
        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <button
          type="submit"
          className="bg-black text-white py-2 rounded-lg hover:bg-gray-800"
        >
          Get Started!
        </button>
        <p className="text-gray-500  mx-auto">
          ------------ already have an account? ------------
        </p>
        <button
          type="button"
          onClick={() => {
            navigate("/login");
          }}
          className="bg-black text-white py-2 rounded-lg hover:bg-gray-800"
        >
          Login
        </button>
      </form>
    </div>
  );
}
