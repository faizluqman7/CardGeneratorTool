import './Navigation.css';

const Navigation = ({ user, onLogout, currentView, onViewChange }) => {
    const handleLogout = async () => {
        try {
            const response = await fetch('https://cardgeneratortool.onrender.com/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                onLogout();
            } else {
                alert('Failed to logout');
            }
        } catch (error) {
            alert('Failed to logout');
        }
    };

    return (
        <nav className="navigation">
            <div className="nav-container">
                <div className="nav-brand">
                    <h1>CardGPT</h1>
                </div>
                
                <div className="nav-menu">
                    <button 
                        className={`nav-link ${currentView === 'generate' ? 'active' : ''}`}
                        onClick={() => onViewChange('generate')}
                    >
                        Generate Cards
                    </button>
                    <button 
                        className={`nav-link ${currentView === 'saved' ? 'active' : ''}`}
                        onClick={() => onViewChange('saved')}
                    >
                        My Cards
                    </button>
                </div>
                
                <div className="nav-user">
                    <span className="username">Welcome, {user.username}!</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 