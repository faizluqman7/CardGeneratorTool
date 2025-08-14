import { useState } from 'react';
import './Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cardgeneratortool.onrender.com";

const Auth = ({ onAuthSuccess, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // ensure cookies are sent/received
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                if (isLogin) {
                    // After login, fetch profile to get canonical user data
                    const profileRes = await fetch(`${API_BASE_URL}/auth/profile`, { credentials: 'include' });
                    if (profileRes.ok) {
                        const profile = await profileRes.json();
                        onAuthSuccess(profile);
                    } else {
                        onAuthSuccess(data.user || null);
                    }
                } else {
                    setIsLogin(true);
                    setFormData({ username: '', email: '', password: '' });
                    setError('Registration successful! Please log in.');
                }
            } else {
                setError(data.error || 'An error occurred');
            }
        } catch (error) {
            setError('Failed to connect to the server');
        }

        setLoading(false);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="auth-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <button className="back-btn" onClick={onClose} aria-label="Close">\u00d7</button>
                <h2>{isLogin ? 'Login' : 'Register'}</h2>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                    />

                    {!isLogin && (
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    )}

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />

                    <button type="submit" disabled={loading} className="auth-button">
                        {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>

                <div className="auth-switch">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setFormData({ username: '', email: '', password: '' });
                                setError('');
                            }}
                            className="switch-button"
                        >
                            {isLogin ? 'Register' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Auth; 