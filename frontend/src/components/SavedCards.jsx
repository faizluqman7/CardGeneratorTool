import { useState, useEffect } from 'react';
import './SavedCards.css';

const API_BASE_URL = "https://cardgeneratortool.onrender.com";

const SavedCards = ({ user }) => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/cards/my-cards`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setCards(data);
            } else {
                setError('Failed to load saved cards');
            }
        } catch (error) {
            setError('Failed to connect to the server');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (cardId, pdfFilename) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cards/card/${cardId}/download`, {
                credentials: 'include',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = pdfFilename || 'cards.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download PDF');
            }
        } catch (error) {
            alert('Failed to download PDF');
        }
    };

    const handleDelete = async (cardId) => {
        if (!window.confirm('Are you sure you want to delete this card?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cards/card/${cardId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setCards(cards.filter(card => card.id !== cardId));
            } else {
                alert('Failed to delete card');
            }
        } catch (error) {
            alert('Failed to delete card');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="saved-cards-loading">Loading your cards...</div>;
    }

    if (error) {
        return <div className="saved-cards-error">{error}</div>;
    }

    return (
        <div className="saved-cards-container">
            <h2>Your Saved Cards</h2>
            
            {cards.length === 0 ? (
                <div className="no-cards">
                    <p>You haven't saved any cards yet.</p>
                    <p>Generate some cards and save them to see them here!</p>
                </div>
            ) : (
                <div className="cards-grid">
                    {cards.map((card) => (
                        <div key={card.id} className="card-item">
                            <div className="card-header">
                                <h3>{card.category}</h3>
                                <span className="card-date">{formatDate(card.created_at)}</span>
                            </div>
                            
                            <div className="card-pairs">
                                <p><strong>Word Pairs ({card.num_pairs}):</strong></p>
                                <ul>
                                    {card.word_pairs.slice(0, 3).map((pair, index) => (
                                        <li key={index}>{pair[0]} - {pair[1]}</li>
                                    ))}
                                    {card.word_pairs.length > 3 && (
                                        <li>... and {card.word_pairs.length - 3} more</li>
                                    )}
                                </ul>
                            </div>
                            
                            <div className="card-actions">
                                <button 
                                    onClick={() => handleDownload(card.id, card.pdf_filename)}
                                    className="download-btn"
                                >
                                    Download PDF
                                </button>
                                <button 
                                    onClick={() => handleDelete(card.id)}
                                    className="delete-btn"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedCards; 