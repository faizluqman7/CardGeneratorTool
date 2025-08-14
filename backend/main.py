from fpdf import FPDF
import re

from fpdf import FPDF
import requests
import os
import json
from config import Config


class CardGenerator:
    def __init__(self):
        self.API_KEY = Config.API_KEY
        if not self.API_KEY:
            raise RuntimeError('API_KEY is not configured in environment')

        # Prefer using Authorization header instead of query param
        self.API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        self.pairs = []
        # Ensure PDF upload folder exists
        os.makedirs(Config.PDF_UPLOAD_FOLDER, exist_ok=True)

    def get_word_pairs(self):
        return self.pairs

    def generate_word_pairs(self, category, num_pairs=10):
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.API_KEY}",
        }

        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Generate {num_pairs} pairs of related words in the format 'WORD - WORD' for the category: {category}. Return plain text, one pair per line, words in uppercase letters separated by a hyphen. Do not include numbering or additional text."
                }]
            }]
        }

        try:
            response = requests.post(self.API_URL, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            result = response.json()

            # Extract the words from the response and sanitize
            text_output = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            # Normalize line endings and split
            raw_pairs = [line.strip() for line in text_output.strip().splitlines() if line.strip()]

            parsed = []
            for line in raw_pairs:
                if "-" not in line:
                    continue
                left, right = [p.strip() for p in re.split(r"\s*-\s*", line, maxsplit=1)]

                # Basic validation: non-empty, uppercase letters and spaces only, reasonable length
                valid_re = re.compile(r"^[A-Z0-9 ]{1,50}$")
                if not (valid_re.match(left) and valid_re.match(right)):
                    # skip any invalid pair
                    continue

                parsed.append((left, right))

            # Enforce number of pairs requested
            if not parsed or len(parsed) < min(num_pairs, 1):
                return []

            return parsed[:num_pairs]
        except Exception as e:
            print("Error generating word pairs:", e)
            return []

    def create_pdf(self, word_pairs, output_file="cards.pdf"):
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        # size=25 for when cards are vertical, size=30 for when cards are horizontal
        pdf.set_font("Arial", size=30, style="B")

        # CARD DIMENSIONS
        card_width = 89  # width in mm
        card_height = 58  # height in mm
        cards_per_row = 2
        cards_per_column = 4

        x_margin = 10
        y_margin = 12

        x_start = x_margin
        y_start = y_margin

        words = []
        for pair in word_pairs:
            for word in pair:
                words.append(word)

        for i, word in enumerate(words):
            if i % (cards_per_row * cards_per_column) == 0 and i != 0:
                pdf.add_page()

            col = (i % cards_per_row)
            row = (i // cards_per_row) % cards_per_column

            x_pos = x_start + col * (card_width + x_margin)
            y_pos = y_start + row * (card_height + y_margin)

            pdf.set_xy(x_pos, y_pos)
            pdf.set_fill_color(255, 255, 255)
            pdf.rect(x_pos, y_pos, card_width, card_height, style='DF')

            # word on the card
            pdf.set_xy(x_pos + 5, y_pos + card_height / 2 - 5)
            pdf.multi_cell(card_width - 10, 10, txt=word, align="C")

        # Ensure output_file is placed in configured upload folder
        output_basename = os.path.basename(output_file)
        safe_path = os.path.join(Config.PDF_UPLOAD_FOLDER, output_basename)
        pdf.output(safe_path)
        print(f"PDF generated: {safe_path}")
        return safe_path


def main():
    card_generator = CardGenerator()
    category = input("Enter the category for the word pairs: ")
    num_pairs = 10

    word_pairs = card_generator.generate_word_pairs(category, num_pairs)
    print(word_pairs)

    if not word_pairs:
        print("Failed to generate word pairs. Exiting.")
        return
    card_generator.create_pdf(word_pairs)

    card_generator.pairs = word_pairs

    return word_pairs


if __name__ == "__main__":
    main()
    #main()


