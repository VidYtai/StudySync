
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { BookOpenIcon } from '../components/icons';

const LoginPage: React.FC = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const result = await login(name, password);
        if (result.success) {
            navigate('/app/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 group mb-4">
                        <div className="w-10 h-10 bg-primary-accent rounded-lg flex items-center justify-center">
                           <BookOpenIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-text-primary">StudySync</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-text-primary">
                        Welcome Back
                    </h2>
                </div>
                <div className="glass-pane p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                                Full Name
                            </label>
                            <input
                                id="name" name="name" type="text" autoComplete="name" required
                                value={name} onChange={(e) => setName(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password"
                                       className="block text-sm font-medium text-text-secondary">
                                    Password
                                </label>
                                <Link to="/forgot-password"
                                   className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                id="password" name="password" type="password" autoComplete="current-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••" className="form-input"
                            />
                        </div>
                        
                        {error && <p className="text-sm font-medium text-red-400">{error}</p>}

                        <div>
                            <button type="submit" className="w-full btn btn-primary">
                                Log in
                            </button>
                        </div>
                    </form>
                    <p className="mt-8 text-center text-sm text-text-secondary">
                        Not a member?{' '}
                        <Link to="/signup" className="font-medium text-white hover:underline">
                            Sign up now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
