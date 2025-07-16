
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, User, Lock } from 'lucide-react';

const ResetPassword = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [username, setUsername] = useState('');
  const [resetData, setResetData] = useState({
    token: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }), // ou { email: formData.email } selon ton champ
      });

      const data = await response.json();

      if (!response.ok) {
      } else {
        setMessage(data.message);
        setStep("reset"); // si tu as une étape suivante à afficher
      }
    } catch (error) {
      console.error("Erreur de réinitialisation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function checkPassword(value: string): boolean {
    const hasSpecialChar = /[_\-*@!]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    return hasSpecialChar && hasDigit && hasLowercase && hasUppercase;
  }

  function validate(password: string, confirm: string, setMessage: (msg: string) => void): boolean {
    if (!checkPassword(password)) {
      setMessage('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (_-*@!)');
      return false;
    }

    if (password !== confirm) {
      setMessage("Passwords don't match");
      return false;
    }

    return true;
  }


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const { password, confirmPassword } = resetData;
    if (!validate(password, confirmPassword, setMessage)) {
      return;
    }


    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // toast.error(data.message || "Erreur lors de la réinitialisation du mot de passe");
      } else {
        // toast.success(data.message || "Mot de passe réinitialisé !");
        setMessage("Mot de passe réinitialisé ! Vous pouvez maintenant vous connecter.");
        // navigate('/login');
      }
    } catch (error) {
      console.error("Erreur de réinitialisation:", error);
      // toast.error("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetData({
      ...resetData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
            Matcha
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'request' ? 'Reset your password' : 'Enter your new password'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Token
                </label>
                <input
                  type="text"
                  name="token"
                  value={resetData.token}
                  onChange={handleResetInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter reset token from email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={resetData.password}
                  onChange={handleResetInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={resetData.confirmPassword}
                  onChange={handleResetInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {message && (
            <div className={`mt-4 p-4 rounded-xl ${
              message.includes('successfully') || message.includes('sent')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
