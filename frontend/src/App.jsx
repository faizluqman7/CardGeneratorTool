import {useEffect, useState} from "react";
import "./App.css";
import Auth from './components/Auth.jsx';

// Use the deployed backend URL by default; fallback to local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cardgeneratortool.onrender.com";

const truncate = (str, n = 16) => (str && str.length > n ? str.slice(0, n) + "…" : str);

// This app uses cookie-based sessions returned by the backend (Flask-Login).
// Local storage tokens are not used by default. To use token-based auth,
// the backend must issue tokens and the frontend store them.

const App = () => {
    const [showCommunity, setShowCommunity] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");

    // Check session by calling profile endpoint when component mounts or auth state changes
    useEffect(() => {
        let mounted = true;
        async function fetchProfile() {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/profile`, { credentials: 'include' });
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    setIsLoggedIn(true);
                    setUsername(data.username || '');
                } else {
                    // If server returns HTML redirect, or 401/405, treat as not logged in
                    setIsLoggedIn(false);
                    setUsername('');
                }
            } catch (e) {
                setIsLoggedIn(false);
                setUsername('');
            }
        }

        fetchProfile();

        return () => { mounted = false; };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (e) {
            // ignore
        }
        setIsLoggedIn(false);
        setUsername("");
    };

    return (
        <div className="container">
            <div className="community-btn-top">
                <button
                    className="community-btn"
                    onClick={() => setShowCommunity(true)}
                >
                    {/* Group of people icon (SVG) + Community */}
                    <span className="community-icon" aria-label="Community" role="img">
                        {/* Simple group icon SVG */}
                        <svg width="22" height="22" viewBox="0 0 22 22" style={{verticalAlign: "middle", marginRight: "7px"}} fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="8" r="3" fill="#222"/>
                            <circle cx="16" cy="8" r="3" fill="#222"/>
                            <ellipse cx="6" cy="16" rx="5" ry="3" fill="#222" opacity="0.5"/>
                            <ellipse cx="16" cy="16" rx="5" ry="3" fill="#222" opacity="0.5"/>
                        </svg>
                    </span>
                    Community
                </button>
                <div className="auth-btns">
                    {isLoggedIn ? (
                        <>
                            <span className="welcome-user">Welcome{username ? `, ${username}` : ""}!</span>
                            <button className="logout-btn" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <button className="login-btn" onClick={() => setShowAuth(true)}>Login / Register</button>
                    )}
                </div>
            </div>
            <h1>CardGPT</h1>
            <h3>Hi, what cards should I generate?</h3>
            <CardGenerator
                showCommunity={showCommunity}
                setShowCommunity={setShowCommunity}
                isLoggedIn={isLoggedIn}
            />
            {showAuth && (
                <div className="auth-overlay">
                    <Auth
                        onAuthSuccess={(user) => {
                            setIsLoggedIn(true);
                            setUsername(user?.username || '');
                            setShowAuth(false);
                        }}
                        onClose={() => setShowAuth(false)}
                    />
                </div>
            )}
        </div>
    );
};

    // Auth modal moved to `src/components/Auth.jsx` for reuse and clarity

const CardGenerator = ({ showCommunity, setShowCommunity, isLoggedIn }) => {
    const [category, setCategory] = useState("");
    const [numPairs, setNumPairs] = useState(10);
    const [wordPairs, setWordPairs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [displayedPairs, setDisplayedPairs] = useState([]);

    const [communityCards, setCommunityCards] = useState([]);
    const [loadingCommunity, setLoadingCommunity] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [saveName, setSaveName] = useState("");

    const fetchCommunityCards = async () => {
        setLoadingCommunity(true);
        try {
            const response = await fetch(`${API_BASE_URL}/community`);
            if (response.ok) {
                const data = await response.json();
                // Ensure we always set an array
                setCommunityCards(Array.isArray(data) ? data : []);
            } else {
                // handle 404 or other statuses gracefully
                setCommunityCards([]);
            }
        } catch (error) {
            alert("Failed to fetch community cards.");
        }
        setLoadingCommunity(false);
    };

    useEffect(() => {
        console.log('showCommunity state changed:', showCommunity);
        if (showCommunity) {
            fetchCommunityCards();
        }
    }, [showCommunity]);

    const generateCards = async () => {
        setLoading(true);
        setWordPairs([]);
        setDisplayedPairs([]);
        setPdfUrl("");
        setSaveStatus("");
        setSaveName("");

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

    const handleSave = async () => {
        setSaveStatus("");
        try {
            if (!isLoggedIn) {
                setSaveStatus("You must be logged in to save.");
                return;
            }
            if (!saveName) {
                setSaveStatus("Please enter a name for your card set.");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/cards/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({
                    category: saveName,
                    word_pairs: wordPairs,
                    num_pairs: numPairs,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSaveStatus("Saved to community!");
            } else {
                setSaveStatus(data.error || "Failed to save.");
            }
        } catch (err) {
            setSaveStatus("Failed to save.");
        }
    };

    // Always render the generator UI; showCommunity controls an overlay/modal on top

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

                <button
                    onClick={generateCards}
                    disabled={loading}
                    style={{
                        backgroundColor: "white",
                        color: "black",
                        borderRadius: "30px",
                        padding: "10px 20px",
                        border: "2px solid black",
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Generating..." : "Generate Word Pairs"}
                </button>
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
                        <a href={pdfUrl} download>
                            <button style={{
                                backgroundColor: "white",
                                color: "black",
                                borderRadius: "30px",
                                padding: "10px 20px",
                                border: "2px solid black",
                                cursor: "pointer"
                            }}>Download PDF</button>
                        </a>
                    )}
                    {isLoggedIn && (
                        <div style={{marginTop: "10px"}}>
                            <input
                                type="text"
                                placeholder="Enter a name"
                                value={saveName}
                                onChange={e => setSaveName(e.target.value)}
                                style={{
                                    borderRadius: "20px",
                                    padding: "8px 14px",
                                    border: "1px solid #ccc",
                                    marginRight: "10px"
                                }}
                            />
                            <button
                                className="save-btn"
                                onClick={handleSave}
                                style={{
                                    backgroundColor: "#e0ffe0",
                                    color: "#222",
                                    borderRadius: "30px",
                                    padding: "10px 20px",
                                    border: "2px solid #222",
                                    cursor: "pointer"
                                }}
                            >
                                Save to Community
                            </button>
                        </div>
                    )}
                    {!isLoggedIn && (
                        <div style={{marginTop: "10px", color: "#c00", fontSize: "0.95em"}}>
                            Login to save your cards to the community.
                        </div>
                    )}
                    {saveStatus && (
                        <div style={{marginTop: "10px", color: saveStatus.includes("Saved") ? "green" : "#c00"}}>
                            {saveStatus}
                        </div>
                    )}
                </div>
            )}

            {showCommunity && (
                <>
                    <div className="modal-overlay" onClick={() => setShowCommunity(false)} />
                    <div className="community-modal">
                        <button
                            className="back-btn"
                            onClick={() => setShowCommunity(false)}
                        >
                            ×
                        </button>
                        <h2>Community Created Cards</h2>
                        {loadingCommunity ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="community-cards-row">
                                {communityCards.length === 0 ? (
                                    <p>No community cards found.</p>
                                ) : (
                                    communityCards.map((card, idx) => (
                                        <div className="community-card" key={idx}>
                                            <div className="community-card-category">
                                                {truncate(card.name || "N/A", 18)}
                                            </div>
                                            <ul className="community-card-pairs">
                                                {(card.word_pairs || []).slice(0, 8).map((pair, i) => (
                                                    <li key={i}>
                                                        {truncate(pair[0])} - {truncate(pair[1])}
                                                    </li>
                                                ))}
                                                {(card.word_pairs || []).length > 8 && (
                                                    <li>…</li>
                                                )}
                                            </ul>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default App;