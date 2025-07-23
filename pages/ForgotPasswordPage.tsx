
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { BookOpenIcon } from '../components/icons';

type Step = 'enterName' | 'answerQuestion' | 'resetPassword' | 'success';

const ForgotPasswordPage: React.FC = () => {
    const [step, setStep] = useState<Step>('enterName');
    const [name, setName] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    
    const { getSecurityQuestionForUser, verifySecurityAnswer, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const question = await getSecurityQuestionForUser(name);
        if (question) {
            setSecurityQuestion(question);
            setStep('answerQuestion');
        } else {
            setError('No account found with that name.');
        }
    };

    const handleAnswerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const isCorrect = await verifySecurityAnswer(name, securityAnswer);
        if (isCorrect) {
            setStep('resetPassword');
        } else {
            setError('The answer is incorrect. Please try again.');
        }
    };
    
    const handlePasswordResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        const success = await resetPassword(name, newPassword);
        if (success) {
            setStep('success');
        } else {
            setError('An unexpected error occurred. Please try again later.');
        }
    };
    
    const commonInputClasses = "form-input";

    const renderStep = () => {
        switch (step) {
            case 'enterName':
                return (
                    <form onSubmit={handleNameSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                                Full Name
                            </label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={commonInputClasses}/>
                        </div>
                        <button type="submit" className="w-full btn btn-primary">Continue</button>
                    </form>
                );
            case 'answerQuestion':
                return (
                    <form onSubmit={handleAnswerSubmit} className="space-y-6">
                        <p className="text-sm text-text-secondary">
                            <strong>Question:</strong> {securityQuestion}
                        </p>
                        <div>
                            <label htmlFor="answer" className="block text-sm font-medium text-text-secondary mb-1">
                                Your Answer
                            </label>
                            <input id="answer" type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required className={commonInputClasses} />
                        </div>
                        <button type="submit" className="w-full btn btn-primary">Verify Answer</button>
                    </form>
                );
            case 'resetPassword':
                return (
                    <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="newPassword"
                                   className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                            <input id="newPassword" type="password" value={newPassword}
                                   onChange={(e) => setNewPassword(e.target.value)} required
                                   placeholder="••••••••"
                                   className={commonInputClasses}/>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword"
                                   className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
                            <input id="confirmPassword" type="password" value={confirmPassword}
                                   onChange={(e) => setConfirmPassword(e.target.value)} required
                                   placeholder="••••••••"
                                   className={commonInputClasses}/>
                        </div>
                        <button type="submit" className="w-full btn btn-primary">Reset Password</button>
                    </form>
                );
             case 'success':
                return (
                    <div className="text-center space-y-4">
                        <p className="text-lg font-medium text-text-primary">Password reset successfully!</p>
                        <Link to="/login" className="w-full block btn btn-primary">
                            Return to Login
                        </Link>
                    </div>
                );
        }
    };
    
    const getTitle = () => {
        switch(step) {
            case 'enterName': return 'Forgot Password';
            case 'answerQuestion': return 'Security Question';
            case 'resetPassword': return 'Set New Password';
            case 'success': return 'Success!';
        }
    }

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
                        {getTitle()}
                    </h2>
                        {step === 'enterName' && <p className="mt-2 text-sm text-text-secondary">Enter your name to begin.</p>}
                </div>
                <div className="glass-pane p-8">
                    {renderStep()}
                    {error && <p className="mt-4 text-sm font-medium text-center text-red-400">{error}</p>}
                    {step !== 'success' && (
                        <p className="mt-8 text-center text-sm text-text-secondary">
                            Remember your password?{' '}
                            <Link to="/login" className="font-medium text-white hover:underline">
                                Log in
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
