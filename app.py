from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# 인증 없이 테스트
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    user_id = request.args.get('user_id')  # 클라이언트에서 ?user_id=123 이런 식으로 보내기
    if user_id:
        join_room(user_id)
        print(f"Joined room {user_id}")

# 수동 테스트용 알림 전송 함수
@app.route('/test_notify/<user_id>', methods=['GET'])
def test_notify(user_id):
    message = {
        "id": 999,
        "type": "test",
        "message": "🔔 테스트 알림입니다!",
        "is_read": False,
        "created_at": "2025-05-28 12:00:00"
    }
    socketio.emit('new_notification', message, room=user_id)
    return "알림 전송됨", 200

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)

