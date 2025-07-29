import { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import { IsUnlocked } from '../wailsjs/go/main/App';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const unlocked = await IsUnlocked();
      setIsLoggedIn(unlocked);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <MainScreen onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
