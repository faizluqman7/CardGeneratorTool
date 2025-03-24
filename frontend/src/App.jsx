import {useEffect, useState} from "react";
import "./App.css";

const API_BASE_URL = "https://cardgeneratortool.onrender.com";

const App = () => {
    return (
        <div className="container">
            <h1>CardGPT</h1>
            <h3>Hi, what cards should I generate?</h3>
            <CardGenerator />
        </div>
    );
};

const CardGenerator = () => {
    const [category, setCategory] = useState("");
    const [numPairs, setNumPairs] = useState(10);
    const [wordPairs, setWordPairs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [displayedPairs, setDisplayedPairs] = useState([]);

    const generateCards = async () => {
        setLoading(true);
        setWordPairs([]);
        setDisplayedPairs([]);
        setPdfUrl("");

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
                </div>
            )}
        </div>
    );
};

export default App;