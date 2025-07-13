import {useEffect, useState} from "react";
import "./App.css";

const API_BASE_URL = "https://cardgeneratortool.onrender.com";

const truncate = (str, n = 16) => (str && str.length > n ? str.slice(0, n) + "…" : str);

function getToken() {
    return localStorage.getItem("jwt_token");
}

function setToken(token) {
    localStorage.setItem("jwt_token", token);
}

function removeToken() {
    localStorage.removeItem("jwt_token");
}

// Decode JWT to get username (if present)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch {
        return {};
    }
}

const App = () => {
    const [showCommunity, setShowCommunity] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
    const [username, setUsername] = useState("");

    useEffect(() => {
        if (isLoggedIn) {
            const token = getToken();
            const payload = parseJwt(token || "");
            setUsername(payload.username || "");
        } else {
            setUsername("");
        }
    }, [isLoggedIn]);

    const handleLogout = () => {
        removeToken();
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
                <AuthModal
                    onClose={() => setShowAuth(false)}
                    onLoginSuccess={() => {
                        setIsLoggedIn(true);
                        setShowAuth(false);
                    }}
                />
            )}
        </div>
    );
};

const AuthModal = ({ onClose, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (isLogin) {
                // Login: POST /login with email, password
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (response.ok && data.token) {
                    setToken(data.token);
                    onLoginSuccess();
                } else {
                    setError(data.error || "Authentication failed.");
                }
            } else {
                // Register: POST /register with email, username, password
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, username, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    setIsLogin(true);
                } else {
                    setError(data.error || "Registration failed.");
                }
            }
        } catch (err) {
            setError("Network error.");
        }
        setLoading(false);
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="auth-modal">
                <button className="back-btn" onClick={onClose}>×</button>
                <h2>{isLogin ? "Login" : "Register"}</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        autoFocus
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "Login" : "Register")}
                    </button>
                </form>
                <div className="auth-switch">
                    {isLogin ? (
                        <span>
                            Don't have an account?{" "}
                            <button type="button" onClick={() => setIsLogin(false)}>Register</button>
                        </span>
                    ) : (
                        <span>
                            Already have an account?{" "}
                            <button type="button" onClick={() => setIsLogin(true)}>Login</button>
                        </span>
                    )}
                </div>
                {error && <div className="auth-error">{error}</div>}
            </div>
        </>
    );
};

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
            const data = await response.json();
            setCommunityCards(data);
        } catch (error) {
            alert("Failed to fetch community cards.");
        }
        setLoadingCommunity(false);
    };

    useEffect(() => {
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
            const token = getToken();
            if (!token) {
                setSaveStatus("You must be logged in to save.");
                return;
            }
            if (!saveName) {
                setSaveStatus("Please enter a name for your card set.");
                return;
            }
            const response = await fetch(`${API_BASE_URL}/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: saveName,
                    word_pairs: wordPairs,
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

    if (showCommunity) {
        return (
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
        );
    }

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
        </div>
    );
};

export default App;