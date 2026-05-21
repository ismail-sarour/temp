from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/api/ai-chat', methods=['POST'])
def handle_ai_chat():
    try:
        data = request.get_json()
        message = data['message']

        # Sanitize prompt and inject relevant platform data
        prompt = message

        # Send prompt to Groq API
        response = requests.post(
            'https://api.groq.com/v1/llama-3.3-70b-versatile',
            json={'prompt': prompt},
            headers={'Authorization': 'Bearer ACTUAL_API_KEY'}
        )

        # Handle response from Groq API
        if response.status_code == 200:
            return jsonify({'message': response.json()['completion']})
        else:
            return jsonify({'error': 'Failed to retrieve response from Groq API'}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Failed to send request to Groq API'}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred'}), 500

if __name__ == '__main__':
    app.run(debug=True)