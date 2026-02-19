import { useState } from 'react';

const AuthForm = ({ isLogin, onToggle, onSubmit, error, success }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="login-container">
            <img
                className="auth-logo"
                src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Logonetflix.png"
                alt="Netflix"
            />

            <div className="auth-card">
                <div className="login-form-wrapper">
                    <h2 className="auth-title">{isLogin ? 'Sign In' : 'Sign Up'}</h2>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    className="form-input-clean"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <input
                                type="text"
                                name={isLogin ? "username" : "email"}
                                placeholder={isLogin ? "Email or username" : "Email"}
                                className="form-input-clean"
                                value={isLogin ? formData.username : formData.email}
                                onChange={handleChange}
                                autoComplete={isLogin ? "username" : "email"}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number"
                                    className="form-input-clean"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                className="form-input-clean"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-continue">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="social-login">
                        <p className="toggle-text">
                            {isLogin ? "New to Netflix?" : "Already have an account?"}
                            <span className="toggle-link" onClick={onToggle}>
                                {isLogin ? 'Sign up now.' : 'Sign in.'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
