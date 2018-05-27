const fs = require('fs')
const http = require("http")
const socketio = require('socket.io')

states = []
playerCount = 0
const server = http.createServer(async (req,resp) => resp.end(await readfile(req.url.substr(1))))
const io = socketio(server)
server.listen(8000,() => console.log("Four-In-A-Row Server Running"))

const readfile = f => new Promise((resolve,reject) => fs.readFile(f,(e,d) => e?reject(e):resolve(d)))

const ind = (r,c) => (r * 7) + c

const squaresInit = () => {
    const squares = []
    const char = "'"
    for (i = 0;i < 6 * 7;i++) {
        squares.push(char)
    }
    return squares
}

const checkWin = (sID) => {
    const state = states[sID]
    if (state.columnSize.reduce((x,y) => x + y) == 42) {
        return -1
    }
    for (r = 0;r < 3;r++) {
        for (c = 0;c < 7;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r+1,c)] + state.squares[ind(r+2,c)] + state.squares[ind(r+3,c)]
            if (fourInRow == 'XXXX' || fourInRow == 'OOOO') {
                return 1
            }
        }
    }
    for (r = 0;r < 6;r++) {
        for (c = 0;c < 4;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r,c+1)] + state.squares[ind(r,c+2)] + state.squares[ind(r,c+3)]
            if (fourInRow == 'XXXX' || fourInRow == 'OOOO') {
                return 1
            }
        }
    }
    for (r = 0;r < 3;r++) {
        for (c = 0;c < 4;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r+1,c+1)] + state.squares[ind(r+2,c+2)] + state.squares[ind(r+3,c+3)]
            if (fourInRow == 'XXXX' || fourInRow == 'OOOO') {
                return 1
            }
        }
    }
    for (r = 2;r < 6;r++) {
        for (c = 3;c < 7;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r+1,c-1)] + state.squares[ind(r+2,c-2)] + state.squares[ind(r+3,c-3)]
            if (fourInRow == 'XXXX' || fourInRow == 'OOOO') {
                return 1
            }
        }
    }
    return 0
}

const turnUpdate = (newTurn,outcome,sID) => {
    if (outcome == 1) {
        states[sID].notTurn.emit('status',"YOU LOST! :( New game started. Guest's turn, Please wait")
        states[sID].turn.emit('status','YOU WON! :) New game started. Your turn')
        states[sID] = {x: states[sID].x,o: states[sID].o,squares: squaresInit(),columnSize: [0,0,0,0,0,0,0],turn: states[sID].turn,turnSymbol: states[sID].turnSymbol,notTurn: states[sID].notTurn,notTurnSymbol: states[sID].notTurnSymbol}
        newTurn = states[sID].turnSymbol
        states[sID].x.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
        states[sID].o.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
    }
    else if (outcome == -1) {
        states[sID].x.emit('status','GAME DRAWN! New game started. Your turn')
        states[sID].o.emit('status',"GAME DRAWN! New game started. Guest's turn, Please wait")
        states[sID] = {x: states[sID].x,o: states[sID].o,squares: squaresInit(),columnSize: [0,0,0,0,0,0,0],turn: states[sID].x,turnSymbol: 'X',notTurn: states[sID].o,notTurnSymbol: 'O'}
        newTurn = 'X'
        states[sID].x.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
        states[sID].o.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
    }
    states[sID].turnSymbol = newTurn
    if (states[sID].turnSymbol == 'X') {
        states[sID].turn = states[sID].x
        states[sID].notTurn = states[sID].o
        states[sID].notTurnSymbol = 'O'
    }
    else if (states[sID].turnSymbol == 'O') {
        states[sID].turn = states[sID].o
        states[sID].notTurn = states[sID].x
        states[sID].notTurnSymbol = 'X'
    }
    if (outcome == 0) {
        states[sID].notTurn.emit('status',"Guest's turn, Please wait")
        states[sID].turn.emit('status','Your turn')
    }
    states[sID].turn.emit('turn')
}

io.sockets.on('connection',socket => {
    let sID = states.length - 1
    if (playerCount % 2 == 0) {
        const newState = {squares: squaresInit(),columnSize: [0,0,0,0,0,0,0],x: '',o: '',turn: '',turnSymbol: 'u',notTurn: '',notTurnSymbol: ''}
        states.push(newState)
        sID = states.length - 1
        console.log('State ID:',sID,', X Connected')
        states[sID].x = socket
        socket.emit('playerSym','X')
        playerCount++
        states[sID].x.emit('status','Waiting for O to connect')
        io.sockets.emit('playerCountUpdate',playerCount)
    }
    else {
        console.log('State ID:',sID,', O Connected')
        states[sID].o = socket
        socket.emit('playerSym','O')
        playerCount++
        io.sockets.emit('playerCountUpdate',playerCount)
        states[sID].x.emit('gameStart',sID)
        states[sID].o.emit('gameStart',sID)
        turnUpdate('X',0,sID)
    }

    socket.on('turnPlayed',(pos,sID) => {
        if (socket == states[sID].turn) {
            let newPos = (1 * pos) + (35 - (7 * states[sID].columnSize[pos]))
            states[sID].squares[newPos] = states[sID].turnSymbol
            states[sID].columnSize[pos]++
            states[sID].x.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
            states[sID].o.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
            turnUpdate(states[sID].notTurnSymbol,checkWin(sID),sID)
        }
    })

    socket.on('disconnect',() => {
        states.forEach((s,i) => {
            if (s.x == socket) {
                console.log('State ID:',i,', X Left')
                if (s.o != '') {
                    s.o.emit('status','Your opponent has left. Please refresh page for a new opponent.')
                    io.sockets.emit('playerCountUpdate',playerCount-1)
                    states[i].o.disconnect()
                }
                playerCount--
                states[i] = []
            }
            else if (s.o == socket) {
                console.log('State ID:',i,', O Left')
                if (s.x != '') {
                    s.x.emit('status','Your opponent has left. Please refresh page for a new opponent.')
                    io.sockets.emit('playerCountUpdate',playerCount-1)
                    states[i].x.disconnect()
                }
                playerCount--
                states[i] = []
            }
        })
    })
})