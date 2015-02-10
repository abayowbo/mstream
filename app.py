from gevent import monkey
monkey.patch_all()

import time
from threading import Thread
from flask import Flask, render_template, Response
from flask.ext.socketio import SocketIO, emit
from cv2 import imdecode, imwrite
from numpy import asarray

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
thread = None

@app.route('/')
def capture():
    return render_template('capture.html')

@socketio.on('connect', namespace='/cdata')
def test_connect():
    print('client wants to connect')
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/cdata')
def test_disconnect():
    print('client disconnected')

@socketio.on('event', namespace='/cdata')
def test_message(message):
    emit('response',
         {'data': message['data']})
    print(message['data'])

@socketio.on('frame', namespace='/cdata') # process frame from client
def process_frame(message):
    buf = message['data'].split(",")[-1].decode('base64')
    x = imdecode(asarray(bytearray(buf)),1)
    imwrite("stream.jpg", x)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0') # listen on hostip:5000
