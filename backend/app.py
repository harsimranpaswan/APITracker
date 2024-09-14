from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import datetime
from sqlalchemy.dialects.postgresql import JSON
import platform

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://harsimran:harsimran123@localhost/APITracker'
db = SQLAlchemy(app)

class APIHit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.String(255))
    request_type = db.Column(db.String(10))
    request_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    payload = db.Column(JSON, nullable=True)
    content_type = db.Column(db.String(50), nullable=True)
    ip_address = db.Column(db.String(50))
    os = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))

@app.route('/')
def home():
    return 'Welcome to home'
    
@app.route('/track', methods=['POST'])
def track_api():
    data = request.get_json()
    endpoint = data.get('endpoint')
    method = data.get('method')
    
    api_hit = APIHit(
        request_id=endpoint,
        request_type=method,
        request_time=datetime.datetime.utcnow(),
        payload=request.get_json() if request.is_json else None,
        content_type=request.headers.get('Content-Type'),
        ip_address=request.remote_addr,
        os=platform.system(),
        user_agent=request.user_agent.string
    )
    db.session.add(api_hit)
    db.session.commit()
    return 'API Hit Tracked', 200

@app.route('/api/hits', methods=['GET'])
def get_api_hits():
    api_hits = APIHit.query.all()
    hits_list = [{
        'id': hit.id,
        'request_id': hit.request_id,
        'request_type': hit.request_type,
        'request_time': hit.request_time,
        'payload': hit.payload,
        'content_type': hit.content_type,
        'ip_address': hit.ip_address,
        'os': hit.os,
        'user_agent': hit.user_agent
    } for hit in api_hits]
    return jsonify(hits_list)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
