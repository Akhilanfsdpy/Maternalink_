from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
import uuid
import os
from gtts import gTTS
import base64
from io import BytesIO

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Store connected users
users = {}

@app.route('/')
def index():
    return jsonify({"message": "Flask WebSocket Server is running"})

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    text = data.get('text')
    lang = data.get('lang', 'en')

    try:
        tts = gTTS(text=text, lang=lang)
        audio_buffer = BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode('utf-8')
        audio_url = f"data:audio/mp3;base64,{audio_base64}"
        return jsonify({
            "success": True,
            "audio_url": audio_url
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@socketio.on('join_room')
def on_join(data):
    username = data.get('username', f'User-{uuid.uuid4().hex[:8]}')
    sid = request.sid
    users[sid] = {"username": username, "sid": sid}
    join_room('chat_room')
    emit('user_list', list(users.values()), broadcast=True, room='chat_room')

@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    if sid in users:
        del users[sid]
    emit('user_list', list(users.values()), broadcast=True, room='chat_room')

@socketio.on('video_offer')
def handle_video_offer(data):
    target = data.get('target')
    offer = data.get('offer')
    source = request.sid
    if target in users:
        emit('video_offer', {'offer': offer, 'source': source}, to=target)

@socketio.on('video_answer')
def handle_video_answer(data):
    target = data.get('target')
    answer = data.get('answer')
    if target in users:
        emit('video_answer', {'answer': answer}, to=target)

@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    target = data.get('target')
    candidate = data.get('candidate')
    if target in users:
        emit('ice_candidate', {'candidate': candidate}, to=target)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)