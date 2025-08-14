import {useEffect, useState} from "react";
import "./App.css";
import Auth from "./components/Auth";
import Navigation from "./components/Navigation";
import SavedCards from "./components/SavedCards";

const API_BASE_URL = "https://cardgeneratortool.onrender.com";

const App = () => {
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('generate');

    useEffect(() => {
        // Check if user is already logged in
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                credentials: 'include',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.log('User not authenticated');
        }
    };

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setCurrentView('generate');
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentView('generate');
    };

    if (!user) {
        return <Auth onAuthSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="app">
            <Navigation 
                user={user} 
                onLogout={handleLogout}
                currentView={currentView}
                onViewChange={setCurrentView}
            />
            
            <div className="main-content">
                {currentView === 'generate' && (
                    <CardGenerator user={user} />
                )}
                {currentView === 'saved' && (
                    <SavedCards user={user} />
                )}
            </div>
        </div>
    );
};

const CardGenerator = ({ user }) => {
    const [category, setCategory] = useState("");
    const [numPairs, setNumPairs] = useState(10);
    const [wordPairs, setWordPairs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [displayedPairs, setDisplayedPairs] = useState([]);
    const [savedCardId, setSavedCardId] = useState(null);

    const generateCards = async () => {
        setLoading(true);
        setWordPairs([]);
        setDisplayedPairs([]);
        setPdfUrl("");
        setSavedCardId(null);

        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, num_pairs: numPairs }),
            });

            const data = await response.json();
            if (response.ok) {
                setWordPairs(data);
                setPdfUrl(`${API_BASE_URL}/download`);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
        }

        setLoading(false);
    };

    const generateAndSaveCards = async () => {
        setLoading(true);
        setWordPairs([]);
        setDisplayedPairs([]);
        setPdfUrl("");
        setSavedCardId(null);

        try {
            const response = await fetch(`${API_BASE_URL}/generate-and-save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ category, num_pairs: numPairs }),
            });

            const data = await response.json();
            if (response.ok) {
                setWordPairs(data.word_pairs);
                setPdfUrl(`${API_BASE_URL}/cards/card/${data.card_id}/download`);
                setSavedCardId(data.card_id);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            alert("Failed to connect to the server.");
        }

        setLoading(false);
    };

    useEffect(() => {
        if (wordPairs.length > 0) {
            setDisplayedPairs([]); // Reset before animation
            wordPairs.forEach((pair, index) => {
                setTimeout(() => {
                    setDisplayedPairs((prev) => [...prev, pair]);
                }, index * 300); // Adjust timing for a slower reveal
            });
        }
    }, [wordPairs]);

    return (
        <div className="card-generator">
            <input
                type="text"
                className="large-textbox"
                placeholder="Generate any category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            />
            <div className="input-pairs-container">
                <p>Word pairs:</p>
                <input
                    type="number"
                    className="small-textbox"
                    placeholder="How many pairs?"
                    value={numPairs}
                    min="1"
                    max="10"
                    onChange={(e) => {
                        let value = parseInt(e.target.value);
                        if (value > 10) value = 10;
                        if (value < 1 || isNaN(value)) value = 1;
                        setNumPairs(value);
                    }}
                />

                <div className="button-group">
                    <button
                        onClick={generateCards}
                        disabled={loading}
                        className="generate-btn"
                    >
                        {loading ? "Generating..." : "Generate Word Pairs"}
                    </button>
                    
                    <button
                        onClick={generateAndSaveCards}
                        disabled={loading}
                        className="generate-save-btn"
                    >
                        {loading ? "Generating..." : "Generate & Save"}
                    </button>
                </div>
            </div>

            {loading && <p className="thinking">Thinking<span className="dots">...</span></p>}

            {displayedPairs.length > 0 && (
                <div>
                    <h2>Generated Word Pairs</h2>
                    <ul>
                        {displayedPairs.map(([word1, word2], index) => (
                            <li key={index} className="fade-in">
                                {word1} - {word2}
                            </li>
                        ))}
                    </ul>
                    {pdfUrl && (
                        <div className="download-section">
                            <a href={pdfUrl} download>
                                <button className="download-btn">Download PDF</button>
                            </a>
                            {savedCardId && (
                                <div className="saved-notice">
                                    ✅ Card saved to your account!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;