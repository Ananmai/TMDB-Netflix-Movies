import { useState } from 'react';
import AuthForm from './components/AuthForm';
import HomeScreen from './components/HomeScreen';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Auth state
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    setUser(null);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (formData) => {
    setError('');
    setSuccess('');

    const endpoint = isLogin ? '/api/login' : '/api/users';
    const url = `http://localhost:3000${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        setSuccess(`Welcome back, ${data.user.username}!`);
        // Simulate a delay to show the success message before switching
        setTimeout(() => {
          setUser(data.user);
        }, 1000);
      } else {
        setSuccess('Account created successfully! Please login.');
        setTimeout(() => setIsLogin(true), 2000);
      }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`App ${user ? 'app-netflix' : 'app-login'}`}>
      {!user ? (
        <AuthForm
          isLogin={isLogin}
          onToggle={toggleMode}
          onSubmit={handleSubmit}
          error={error}
          success={success}
        />
      ) : (
        <HomeScreen user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
