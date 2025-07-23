import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici tu appelleras ton API de login
    console.log("Connexion avec :", email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-slate-700 p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>

        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-600 mb-4"
          required
        />

        <label className="block mb-2 font-medium">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-600 mb-6"
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition rounded-xl py-3 font-semibold"
        >
          Se connecter
        </button>

        <p className="text-sm mt-4 text-center">
          Vous n’avez pas de compte ?{" "}
          <Link to="/register" className="text-indigo-400 hover:underline">
            S’inscrire
          </Link>
        </p>
      </form>
    </div>
  );
}
