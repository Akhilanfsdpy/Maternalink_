from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
import uuid
import os
import sqlite3
from datetime import datetime
import pytesseract
from PIL import Image
import io
import re
import base64
from gtts import gTTS
from io import BytesIO
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_ollama import OllamaLLM
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Store connected users
users = {}

# SQLite database setup
def init_db():
    conn = sqlite3.connect('medications.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS medications
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  dosage TEXT NOT NULL,
                  frequency TEXT NOT NULL,
                  schedule TEXT,
                  status TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS appointments
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  doctor TEXT NOT NULL,
                  location TEXT NOT NULL,
                  date TEXT NOT NULL,
                  time TEXT NOT NULL,
                  notes TEXT,
                  type TEXT NOT NULL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS activity_logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp TEXT NOT NULL,
                  activity_name TEXT NOT NULL,
                  duration INTEGER,
                  category TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS chat_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id TEXT NOT NULL,
                  question TEXT NOT NULL,
                  answer TEXT NOT NULL,
                  attachments TEXT,
                  timestamp TEXT NOT NULL)''')
    conn.commit()
    conn.close()

init_db()

# FAISS and Ollama setup
DB_FAISS_PATH = 'vectorstore/db_faiss'
ollama_embeddings = OllamaEmbeddings(model="deepseek-r1:1.5b")
llm = OllamaLLM(model="deepseek-r1:1.5b")

# Custom prompt template
custom_prompt_template = """
You are a helpful assistant specializing in maternal and newborn care, designed to assist patients with clear, simple advice. Provide a detailed, user-friendly answer as a list of exactly 5 concise points, each starting with "- ". Use easy-to-understand language and actionable steps tailored for patients. Prioritize the provided context for relevance; if insufficient, use general knowledge and suggest related topics to complete the list.
Context: {context}
Question: {question}
Answer as a list of exactly 5 points, each starting with "- ":
"""

QA_CHAIN_PROMPT = PromptTemplate.from_template(custom_prompt_template)

# Initialize FAISS vector store with enhanced data
def init_faiss_vector_store():
    sample_docs = [
        "Maternal health includes prenatal care, nutrition with folate-rich foods, and regular doctor visits. Safe exercises are walking, prenatal yoga, and swimming.",
        "Postpartum care focuses on rest, monitoring for postpartum depression, and tracking baby’s weight and height weekly.",
        "Newborn care requires feeding every 2-3 hours, checking temperature with a thermometer, and a consistent sleep routine.",
        "Pregnancy symptoms like nausea can be eased with ginger tea, hydration, and rest; report severe pain to a doctor.",
        "Fetal movement tracking: Count 10 movements in 2 hours during the third trimester. Sit quietly, note kicks or flutters, and contact a doctor if fewer than 7 or more than 15 movements."
    ]
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    documents = text_splitter.create_documents(sample_docs)
    vector_store = FAISS.from_documents(documents, ollama_embeddings)
    vector_store.save_local(DB_FAISS_PATH)
    return vector_store

vector_store = init_faiss_vector_store()
retriever = vector_store.as_retriever(search_kwargs={"k": 5, "fetch_k": 20})

# Helper function to parse medications
def parse_medications(text):
    medications = []
    med_pattern = r'([A-Za-z\s]+)\s*-?\s*(\d+\s?[a-zA-Z]+|\d+\.\d+\s?[a-zA-Z]+|\d+|\w+\stablet|\w+\scapsule)\s*(daily|twice daily|with meals|every\s\d+\shours|as needed|before meals|after meals|at bedtime|in the morning|[\w\s]+)'
    matches = re.finditer(med_pattern, text, re.IGNORECASE)
    for match in matches:
        if len(match.groups()) >= 3:
            medications.append({
                'name': match.group(1).strip(),
                'dosage': match.group(2).strip(),
                'frequency': match.group(3).strip()
            })
    return medications

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        question = data.get('question', '').strip()

        if not question:
            return jsonify({"error": "Missing question"}), 400

        # Handle greeting for "hi" with hardcoded response
        lower_question = question.lower()
        if lower_question in ["hi", "hello", "hey"]:
            answer_points = [
                "- Hello! I’m here to help with your health questions.",
                "- I focus on maternal and newborn care topics.",
                "- I can guide you on medications, pregnancy, or more.",
                "- My answers are simple and easy for patients to follow.",
                "- What would you like to know today?"
            ]
        else:
            # Get response from RAG chain
            result = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, return_source_documents=True, chain_type_kwargs={"prompt": QA_CHAIN_PROMPT})({"query": question})
            answer_text = result["result"]
            source_docs = [doc.page_content for doc in result["source_documents"]]
            print(f"Generated answer: {answer_text}")

            # Parse answer into points
            answer_points = [line.strip() for line in answer_text.split('\n') if line.strip()]
            answer_points = [point[2:].strip() if point.startswith('- ') else f"- {point}" for point in answer_points]

            # Ensure exactly 5 points, generate dynamically if needed
            if len(answer_points) != 5:
                direct_prompt = f"""
                You are a helpful assistant designed for patients, specializing in maternal and newborn care. Provide a detailed, user-friendly answer as a list of exactly 5 concise points, each starting with "- ". Use simple language and actionable steps. Answer every question, even if outside expertise, with general advice and suggestions to complete the list.
                Question: {question}
                Answer as a list of exactly 5 points, each starting with "- ":
                """
                answer_text = llm.invoke(direct_prompt).strip()
                print(f"Direct query answer: {answer_text}")
                answer_points = [line.strip() for line in answer_text.split('\n') if line.strip()]
                answer_points = [point[2:].strip() if point.startswith('- ') else f"- {point}" for point in answer_points]

                # Pad or trim to ensure exactly 5 points
                if len(answer_points) > 5:
                    answer_points = answer_points[:5]
                elif len(answer_points) < 5:
                    while len(answer_points) < 5:
                        answer_points.append(f"- Ask your doctor for more tailored advice if needed.")

        # Determine attachments
        attachments = []
        if "growth" in lower_question or "weight" in lower_question:
            attachments.append({"type": "growth", "data": {"date": "2025-05-01", "weight": 7.2, "height": 64}})
        elif "video" in lower_question:
            attachments.append({"type": "video", "data": {"id": "vid1", "title": "Baby Care", "url": "https://example.com"}})
        elif "prescription" in lower_question or "medication" in lower_question or "dolo" in lower_question:
            sample_prescription = "Vitamin D - 1 tablet daily" if "dolo" not in lower_question else "Dolo 650 - 1 tablet as needed"
            meds = parse_medications(sample_prescription)
            conn = sqlite3.connect('medications.db')
            c = conn.cursor()
            for med in meds:
                c.execute("INSERT INTO medications (name, dosage, frequency, schedule, status) VALUES (?, ?, ?, ?, ?)",
                          (med['name'], med['dosage'], med['frequency'], '["8:00"]', '["pending"]'))
            conn.commit()
            c.execute("SELECT name, dosage, frequency FROM medications ORDER BY id DESC LIMIT 1")
            recent_med = c.fetchone()
            attachments.append({"type": "prescription", "data": {"name": recent_med[0], "dosage": recent_med[1], "frequency": recent_med[2]}})
            conn.close()

        # Store chat history
        conn = sqlite3.connect('medications.db')
        c = conn.cursor()
        c.execute('''INSERT INTO chat_history (user_id, question, answer, attachments, timestamp)
                     VALUES (?, ?, ?, ?, ?)''', (user_id, question, "\n".join(answer_points), json.dumps(attachments), datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')))
        conn.commit()
        conn.close()

        return jsonify({
            "answer": answer_points,
            "attachments": attachments,
            "source_documents": source_docs if 'source_docs' in locals() else []
        }), 200

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "answer": [
                "- Sorry, I can’t answer that right now.",
                "- Please try a different question.",
                "- I can help with health or baby care.",
                "- I can also assist with cooking tips.",
                "- Let me know what else I can do for you."
            ],
            "attachments": [],
            "source_documents": []
        }), 500

@app.route('/api/scan-prescription', methods=['POST'])
def scan_prescription():
    if 'image' not in request.files and 'imageData' not in request.json:
        return jsonify({'error': 'No image provided'}), 400
    try:
        if 'imageData' in request.json:
            image_data = request.json['imageData'].split(',')[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        else:
            image_file = request.files['image']
            image = Image.open(image_file)
        text = pytesseract.image_to_string(image)
        medications = parse_medications(text)
        conn = sqlite3.connect('medications.db')
        c = conn.cursor()
        for med in medications:
            c.execute("INSERT INTO medications (name, dosage, frequency, schedule, status) VALUES (?, ?, ?, ?, ?)",
                      (med['name'], med['dosage'], med['frequency'], '["8:00"]', '["pending"]'))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'text': text, 'medications': medications})
    except Exception as e:
        print(f"Error in scan-prescription: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
        return jsonify({"success": True, "audio_url": audio_url})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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