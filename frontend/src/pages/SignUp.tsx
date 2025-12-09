import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import ItineraLogo from "../assets/ItineraLogo.png";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // alert modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const allFieldsFilled =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // prevents page reload when form is submitted

    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage(""); // clear previous error

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
      setModalType("success");
      setModalMessage(
        "Registration successful! Please check your email to confirm your account."
      );
      setModalOpen(true);
      return;

      // You might want to navigate to a "Check your email" page or clear the form
      navigate("/login");
    } else {
      // If auto-confirm is on (or for testing), log them in immediately
      setModalType("success");
      setModalMessage("Sign up is successful!");
      setModalOpen(true);
      navigate("/onboarding");
    }
  }
  return (
    <div className="bg-gradient-to-br from-[#b4d6ff] via-[#dceeff] to-white flex flex-col items-center min-h-screen pt-5">
      <img className="w-25" src={ItineraLogo}></img>
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-8 w-[100%] max-w-md">
        <div className="text-4xl text-center mb-2 animate-bounce">✈️</div>

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
            className="
  border border-[#c7d9f5] 
  rounded-lg p-2
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
            }}
          />
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
            onChange={(e) => {
              setEmail(e.target.value);
            }}
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
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <p className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
            <span
              className={
                password.length >= 8 ? "text-green-600" : "text-gray-400"
              }
            >
              {password.length >= 8 ? "✔" : "•"} 8+ chars
            </span>

            <span
              className={
                /[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"
              }
            >
              {/[A-Z]/.test(password) ? "✔" : "•"} upper
            </span>

            <span
              className={
                /[0-9]/.test(password) ? "text-green-600" : "text-gray-400"
              }
            >
              {/[0-9]/.test(password) ? "✔" : "•"} number
            </span>

            <span
              className={
                /[^A-Za-z0-9]/.test(password)
                  ? "text-green-600"
                  : "text-gray-400"
              }
            >
              {/[^A-Za-z0-9]/.test(password) ? "✔" : "•"} symbol
            </span>
          </p>

          <input
            type="password"
            placeholder="Confirm Password"
            className="
  border border-[#c7d9f5] 
  rounded-lg p-2
  bg-white/40 backdrop-blur-sm
  transition-all duration-300
  focus:outline-none focus:ring-2 focus:ring-[#81b4fa]
  hover:bg-white/60 
  hover:border-[#81b4fa]
"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword.length > 0 && (
            <p
              className={`text-sm mt-[-6px] ${
                passwordsMatch ? "text-green-600" : "text-red-500"
              }`}
            >
              {passwordsMatch
                ? "✔ Passwords match"
                : "✖ Passwords do not match"}
            </p>
          )}
          <button
            type="submit"
            disabled={
              !(
                allFieldsFilled &&
                password.length >= 8 &&
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password) &&
                passwordsMatch
              )
            }
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
            Login
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
                if (modalType === "success") {
                  navigate("/login");
                }
              }}
              className="w-full py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
