
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { BookOpenIcon } from '../components/icons';
import { SECURITY_QUESTIONS } from '../constants';
import CustomDropdown from '../components/CustomDropdown';

const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (!securityAnswer.trim()) {
            setError('Please provide an answer to your security question.');
            return;
        }

        const result = await signup(name.trim(), password, securityQuestion, securityAnswer.trim());
        if (result.success) {
            sessionStorage.setItem('isNewUser', 'true');
            navigate('/app/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="w-full h-screen flex items-start justify-center px-4 py-12 md:py-20 overflow-y-auto">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
                        <div className="w-10 h-10 bg-primary-accent rounded-lg flex items-center justify-center">
                            <BookOpenIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-text-primary">StudySync</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-text-primary">
                        Create Your Account
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
                            <label htmlFor="password"
                                    className="block text-sm font-medium text-text-secondary mb-1">
                                Password
                            </label>
                            <input
                                id="password" name="password" type="password" autoComplete="new-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="form-input"
                            />
                        </div>

                        <CustomDropdown
                            id="security-question"
                            label="Security Question"
                            options={SECURITY_QUESTIONS}
                            value={securityQuestion}
                            onChange={setSecurityQuestion}
                        />
                        
                            <div>
                            <label htmlFor="security-answer" className="block text-sm font-medium text-text-secondary mb-1">
                                Security Answer
                            </label>
                            <input
                                id="security-answer" name="security-answer" type="text" required
                                value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        {error && <p className="text-sm font-medium text-red-400">{error}</p>}

                        <div>
                            <button type="submit" className="w-full btn btn-primary">
                                Create Account
                            </button>
                        </div>
                    </form>
                    <p className="mt-8 text-center text-sm text-text-secondary">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-white hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
