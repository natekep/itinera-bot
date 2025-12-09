import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraLogo from "../assets/ItineraLogo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // alert model states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setModalType("error");

      if (error.message.includes("Email not confirmed")) {
        setModalMessage(
          "Please verify your email address. Check your inbox for the confirmation link."
        );
      } else {
        setModalMessage(error.message);
      }

      setModalOpen(true);
      return;
    }

    // Success modal
    setModalType("success");
    setModalMessage("Login successful! Redirecting...");
    setModalOpen(true);

    setTimeout(() => navigate("/"), 1100);
  }

  return (
    <div className="bg-gradient-to-br from-[#b4d6ff] via-[#dceeff] to-white flex flex-col items-center min-h-screen pt-20">
      <img className="w-25" src={ItineraLogo} alt="Itinera Logo"></img>
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 w-[100%] max-w-md">
        <div className="text-4xl text-center mb-2 animate-bounce">🌍</div>
        <h1 className="text-3xl text-center font-semibold">Welcome Back</h1>
        <p className="text-gray-500 mt-2 text-center">
          Sign in to continue planning your future adventures!
        </p>
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 w-full mt-5"
        >
          <input
            type="email"
            placeholder="Email"
            className="
  border border-[#c7d9f5] 
  rounded-lg p-2
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="
  border border-[#c7d9f5] 
  rounded-lg p-2
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={!isFormValid}
            className={`
    w-full py-3 rounded-lg font-semibold
    transition-all duration-300
    border border-transparent
    bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8]
    text-white shadow-md
    hover:shadow-xl hover:scale-[1.02]
    hover:from-[#81c2ff] hover:to-[#5d9bf0]
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
          >
            Continue
          </button>

          <p className="text-gray-500  mx-auto">
            ------------ need to create an account? ------------
          </p>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className={`
  w-full py-3 rounded-lg font-semibold
  transition-all duration-300
  border border-transparent
  bg-gradient-to-r from-[#6fb3ff] to-[#4b8ce8]
  text-white shadow-md
  hover:shadow-xl hover:scale-[1.02]
  hover:from-[#81c2ff] hover:to-[#5d9bf0]
  active:scale-[0.98]
  disabled:opacity-50 disabled:cursor-not-allowed
`}
          >
            Sign Up
          </button>
        </form>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm animate-fadeIn">
            <div className="text-center text-4xl mb-3">
              {modalType === "success" ? "🎉" : "⚠️"}
            </div>
            <p className="text-center text-gray-700 mb-6">{modalMessage}</p>
            <button
              onClick={() => {
                setModalOpen(false);
                if (modalType === "success") navigate("/");
              }}
              className="
          w-full py-2 rounded-lg bg-gradient-to-r 
          from-[#6fb3ff] to-[#4b8ce8] text-white
          hover:from-[#81c2ff] hover:to-[#5d9bf0]
          shadow-md hover:shadow-xl transition
        "
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
