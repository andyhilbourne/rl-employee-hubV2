import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { Button } from './Button';
import { UserCircleIcon } from './icons';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto bg-white shadow-xl rounded-2xl p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mt-4">R&L Employee Hub</h1>
            <p className="text-gray-500 mt-1">Please sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <UserCircleIcon className="h-5 w-5 text-gray-400" />
                 </div>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email Address"
                    disabled={isLoading}
                />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="sr-only">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
                    </svg>
                 </div>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    disabled={isLoading}
                />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
          
          <div>
            <Button type="submit" isLoading={isLoading} className="w-full justify-center py-3 text-base">
              Sign In
            </Button>
          </div>
        </form>
      </div>
       <footer className="text-center p-4 text-sm text-gray-500 mt-8">
        R&L Employee Hub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};