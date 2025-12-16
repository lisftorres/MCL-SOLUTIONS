import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, ArrowRight, Hexagon, Wrench } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation d'un délai réseau pour l'effet "sécurisé"
    setTimeout(async () => {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
        setIsLoading(false);
      }
      // Si succès, le composant parent (App) démontera ce composant
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gym-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gym-yellow/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        
        {/* Logo Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-6 bg-gym-darker rounded-2xl mb-4 shadow-xl border border-gray-700 relative">
            {/* Logo Composition */}
            <div className="relative w-24 h-24 flex items-center justify-center">
                 <Hexagon className="text-gray-500 absolute w-full h-full" strokeWidth={1} />
                 <Dumbbell className="text-white absolute w-14 h-14 transform -rotate-45" strokeWidth={2} />
                 <Wrench className="text-gym-yellow absolute w-14 h-14 transform rotate-45" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none">MCL</h1>
          <p className="text-xl font-bold text-gym-yellow tracking-[0.3em] mt-1">SOLUTIONS</p>
        </div>

        {/* Card */}
        <div className="bg-gym-light/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300">
          
            <div className="p-8 space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">Connexion</h2>
                <p className="text-sm text-gray-400">Accédez à votre espace sécurisé</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded flex items-start gap-2">
                    <span className="mt-0.5 block w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300 uppercase ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-gym-yellow transition-colors" size={20} />
                    <input 
                      type="email" 
                      required
                      className="w-full bg-gym-darker border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:border-gym-yellow focus:ring-1 focus:ring-gym-yellow outline-none transition-all placeholder-gray-600"
                      placeholder="nom@mclsolutions.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-semibold text-gray-300 uppercase">Mot de passe</label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-gym-yellow transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-gym-darker border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:border-gym-yellow focus:ring-1 focus:ring-gym-yellow outline-none transition-all placeholder-gray-600"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gym-yellow text-gym-dark font-bold py-3 rounded-lg hover:bg-yellow-400 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gym-dark border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Se connecter <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
        </div>
        
        <div className="text-center mt-6 text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} MCL SOLUTIONS. Sécurisé par SSL.
        </div>
      </div>
    </div>
  );
};

export default Login;