import random
from fpdf import FPDF
import requests

# Configure Google Gemini API Key
API_KEY = "AIzaSyB0h1w4sGCCpjU0BUNJo7Th5AOQkYQ4_JE"
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


def generate_word_pairs(category, num_pairs=10):
    """Generate a list of word-pairs using Google Gemini based on a category."""
    try:
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [{
                "parts": [{
                              "text": f"I am constructing a card matching game. Generate 10 pairs of related words in the format 'Word1 - Word2' for the category: {category}. Only in the specified format separated by new lines, remove all numbering and explanations"}]
            }]
        }
        params = {"key": API_KEY}
        response = requests.post(API_URL, headers=headers, json=payload, params=params)
        response.raise_for_status()
        result = response.json()



        # Extract pairs from the response
        text_output = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        pairs = [tuple(pair.split(" - ")) for pair in text_output.strip().split("\n") if " - " in pair]
        return pairs
    except Exception as e:
        print("Error generating word pairs:", e)
        return []


def create_pdf(word_pairs, output_file="cards.pdf"):
    """Generate a PDF with each word from the pairs on separate cards."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=15)

    # Card layout settings
    card_width = 63.5  # Width of a standard playing card in mm
    card_height = 88.9  # Height of a standard playing card in mm
    cards_per_row = 2
    cards_per_column = 3

    x_margin = 10
    y_margin = 10

    x_start = x_margin
    y_start = y_margin

    words = [word for pair in word_pairs for word in pair]  # Flatten pairs into individual words

    for i, word in enumerate(words):
        if i % (cards_per_row * cards_per_column) == 0 and i != 0:
            pdf.add_page()

        col = (i % cards_per_row)
        row = (i // cards_per_row) % cards_per_column

        x_pos = x_start + col * (card_width + x_margin)
        y_pos = y_start + row * (card_height + y_margin)

        pdf.set_xy(x_pos, y_pos)
        pdf.set_fill_color(200, 200, 255)  # Light blue fill color for cards
        pdf.rect(x_pos, y_pos, card_width, card_height, style='DF')

        # Write the word on the card
        pdf.set_xy(x_pos + 5, y_pos + card_height / 2 - 5)
        pdf.multi_cell(card_width - 10, 10, txt=word, align="C")

    pdf.output(output_file)
    print(f"PDF generated successfully: {output_file}")


def main():
    category = input("Enter the category for the word pairs: ")
    num_pairs = 10  # Fixed to 10 pairs for 20 cards

    print("Generating word pairs...")
    word_pairs = generate_word_pairs(category, num_pairs)
    print(word_pairs)

    if not word_pairs:
        print("Failed to generate word pairs. Exiting.")
        return

    print("Creating PDF...")
    create_pdf(word_pairs)


if __name__ == "__main__":
    main()

