const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let rooms = {};
let gameStates = {}; // Houdt de status van elk spel vast

io.on('connection', (socket) => {
    socket.on('joinGame', (room) => {
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = [];
            gameStates[room] = {
                board: null, // Wordt door eerste client gestuurd of geïnitialiseerd
                captured: { white: [], black: [] },
                turn: 'white',
                lastMove: null
            };
        }
        rooms[room].push(socket.id);

        const color = rooms[room].indexOf(socket.id) === 0 ? 'white' : 'black';
        socket.emit('playerColor', color);

        // Als er een bestaande state is, stuur deze naar de herladende speler
        if (gameStates[room].board) {
            socket.emit('syncState', gameStates[room]);
        }

        if (rooms[room].length >= 2) {
            io.to(room).emit('startGame');
        }
    });

    socket.on('makeMove', (data) => {
        // Update de server-state
        gameStates[data.room].lastMove = { from: data.from, to: data.to };
        gameStates[data.room].turn = data.turn === 'white' ? 'black' : 'white';

        if (data.capturedPiece) {
            const color = data.capturedPiece === data.capturedPiece.toUpperCase() ? 'white' : 'black';
            gameStates[data.room].captured[color].push(data.capturedPiece);
        }

        socket.to(data.room).emit('moveMade', data);
    });

    socket.on('updateBoard', (data) => {
        if (gameStates[data.room]) gameStates[data.room].board = data.board;
    });

    socket.on('timeOut', (data) => {
        const winner = data.color === 'white' ? 'ZWART' : 'WIT';
        io.to(data.room).emit('winner', winner);
    });

    socket.on('gameOver', (data) => {
        io.to(data.room).emit('winner', data.winner);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
   console.log(`Server draait op poort ${PORT}`);
});