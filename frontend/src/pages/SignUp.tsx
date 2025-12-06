import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraLogo from "../assets/ItineraLogo.png";

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
        // Redirect the user to this page after they click the email link
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    // Check if email confirmation is required
    if (data.user && !data.session) {
      alert("Registration successful! Please check your email to confirm your account.");
      // You might want to navigate to a "Check your email" page or clear the form
      navigate("/login"); 
    } else {
      // If auto-confirm is on (or for testing), log them in immediately
      alert("Sign up is successful!");
      navigate("/onboarding");
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-10">
      <img className="w-25" src={ItineraLogo}></img>
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 w-[100%] max-w-md">
        <h1 className="text-3xl text-center font-semibold">Create Account</h1>
        <p className="text-gray-500 mt-2 text-center">
          Start planning your dream adventures today!
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full mt-5"
        >
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
            className="bg-[#81b4fa] text-white p-2 rounded-lg border-2 border-[#81b4fa] hover:bg-white hover:text-[#81b4fa] transition-colors duration-300"
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
            className="bg-white border-2 border-[#81b4fa] text-[#81b4fa] p-2 rounded-lg hover:bg-[#81b4fa] hover:text-white transition-colors duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
