import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { confirmEmail, sendConfirmationEmail } = useAuth();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token) {
      confirmEmail(token).then((success) => {
        if (success) {
          setStatus("success");
          setMessage("Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.");
        } else {
          setStatus("error");
          setMessage("Lien de confirmation invalide ou expiré. Veuillez vérifier votre email.");
        }
      });
    } else {
      setStatus("error");
      setMessage("Lien de confirmation invalide. Veuillez vérifier votre email.");
    }
  }, [token]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
            Matcha
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Mail className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Confirmation en cours...
                </h2>
                <p className="text-gray-600 mb-6">
                  Veuillez patienter pendant que nous confirmons votre email...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email confirmé !
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-4">
                  <Link
                    to="/"
                    className="block w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 text-center"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/"
                    className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-center"
                  >
                    Retour à l'accueil
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Erreur de confirmation
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-4">
                  <Link
                    to="/"
                    className="block w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 text-center"
                  >
                    Essayer de se connecter
                  </Link>
                  {email && (
                    <button
                      onClick={handleResendEmail}
                      className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-center"
                    >
                      Renvoyer l'email de confirmation
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {email && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700 text-center">
                <Mail className="w-4 h-4 inline mr-1" />
                Email : {email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;