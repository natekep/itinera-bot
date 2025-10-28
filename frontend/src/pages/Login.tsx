import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraLogo from "../assets/ItineraLogo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // prevents page reload when form is submitted

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Log in is succesful!");
      navigate("/");
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen mt-20">
      <img className="w-25" src={ItineraLogo}></img>
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 w-[100%] max-w-md">
        <h1 className="text-3xl text-center font-semibold">Welcome Back</h1>
        <p className="text-gray-500 mt-2">
          Sign in to continue planning your future adventures!
        </p>
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 w-full mt-5"
        >
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-[#81b4fa] text-white p-2 rounded-lg border-2 border-[#81b4fa] hover:bg-white hover:text-[#81b4fa] transition-colors duration-300"
          >
            Continue
          </button>
          <p className="text-gray-500  mx-auto">
            ------------ need to create an account? ------------
          </p>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="bg-white border-2 border-[#81b4fa] text-[#81b4fa] p-2 rounded-lg hover:bg-[#81b4fa] hover:text-white transition-colors duration-200"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
