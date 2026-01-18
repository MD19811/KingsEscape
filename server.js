const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (room) => {
        socket.join(room);
        if (!rooms[room]) rooms[room] = [];
        rooms[room].push(socket.id);

        const color = rooms[room].length === 1 ? 'white' : 'black';
        socket.emit('playerColor', color);

        if (rooms[room].length === 2) {
            io.to(room).emit('startGame');
        }
    });

    socket.on('makeMove', (data) => {
        socket.to(data.room).emit('moveMade', data);
    });

    socket.on('gameOver', (data) => {
        io.to(data.room).emit('winner', data.winner);
    });
});

// Zoekt naar de poort van de provider, anders gebruikt hij 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server draait op poort ${PORT}`);
});
//server.listen(3000, () => console.log('Server draait op http://localhost:3000'));