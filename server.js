const fs = require('fs')
const http = require("http")
const socketio = require('socket.io')

const readfile = f => new Promise((resolve,reject) => fs.readFile(f,(e,d) => e?reject(e):resolve(d)))

const restoreBackup = () => new Promise((resolve,reject) => {
    readfile("serverState.JSON").then(data => {
        resolve(JSON.parse(data))
    }).catch(() => {
        console.log("Error reading backup file. Generating new states data.")
        resolve({})
    })
})

const backup = (states,lastAssignedState) => new Promise((resolve,reject) => {
    let backupStates = {}
    for (var [k,v] of Object.entries(states)) {
        backupStates[k] = {stateID: k,squares: states[k].squares,columnSize: states[k].columnSize,turnSymbol: states[k].turnSymbol,notTurnSymbol: states[k].notTurnSymbol,x: '',o: '',turn: '',notTurn: ''}
    }
    backupStates["lastAssignedState"] = lastAssignedState
    fs.writeFile("serverState.JSON",JSON.stringify(backupStates),err => {
        if (err) {
            console.log("Error backing up server state.")
            reject()
        } else {
            resolve()
        }
    })
})

const ind = (r,c) => (r * 7) + c

const squaresInit = () => {
    const squares = []
    const char = "'"
    for (i = 0;i < 6 * 7;i++) {
        squares.push(char)
    }
    return squares
}

const checkWin = (states,sID) => {
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

const turnUpdate = (states,lastAssignedState,newTurn,outcome,sID) => {
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
    backup(states,lastAssignedState).then(states[sID].turn.emit('turn')).catch(states[sID].turn.emit('turn'))
}

let playerCount = 0

restoreBackup().then(states => {
    let lastAssignedState = -1
    if (Object.keys(states).length !== 0) {
        lastAssignedState = states["lastAssignedState"]
        delete states["lastAssignedState"]
    }
    const server = http.createServer(async (req,resp) => resp.end(await readfile(req.url.substr(1))))
    server.listen(8000,() => console.log("Four-In-A-Row Server Running"))
    const io = socketio(server)

    io.sockets.on('connection',socket => {
        socket.emit('connectionInit')

        socket.on('connectionAck',(stateId,symbol) => {
            if (!(stateId in states)) {
                if (playerCount % 2 == 0) {
                    const newState = {squares: squaresInit(),columnSize: [0,0,0,0,0,0,0],x: '',o: '',turn: '',turnSymbol: '',notTurn: '',notTurnSymbol: ''}
                    lastAssignedState += 1
                    states[lastAssignedState] = newState
                    console.log('State ID:',lastAssignedState,', X Connected')
                    states[lastAssignedState].x = socket
                    socket.emit('playerSym','X')
                    playerCount++
                    states[lastAssignedState].x.emit('status','Waiting for O to connect')
                    io.sockets.emit('playerCountUpdate',playerCount)
                }
                else {
                    console.log('State ID:',lastAssignedState,', O Connected')
                    states[lastAssignedState].o = socket
                    socket.emit('playerSym','O')
                    playerCount++
                    io.sockets.emit('playerCountUpdate',playerCount)
                    states[lastAssignedState].x.emit('gameStart',lastAssignedState)
                    states[lastAssignedState].o.emit('gameStart',lastAssignedState)
                    turnUpdate(states,lastAssignedState,'X',0,lastAssignedState)
                }
            } else {
                if (symbol == 'X') {
                    states[stateId].x = socket
                    states[stateId].x.emit('status','Grid will be restored when O reconnects')
                    states[stateId].x.emit('squaresUpdate',squaresInit(),[0,0,0,0,0,0,0])
                    playerCount++
                    console.log('State ID:',stateId,', X RE-Connected')
                }
                else if (symbol == 'O') {
                    states[stateId].o = socket
                    states[stateId].o.emit('status','Grid will be restored when X reconnects')
                    states[stateId].o.emit('squaresUpdate',squaresInit(),[0,0,0,0,0,0,0])
                    playerCount++
                    console.log('State ID:',stateId,', O RE-Connected')
                }
                if (states[stateId].x != '' && states[stateId].o != '') {
                    states[stateId].x.emit('squaresUpdate',states[stateId].squares,states[stateId].columnSize)
                    states[stateId].o.emit('squaresUpdate',states[stateId].squares,states[stateId].columnSize)
                    turnUpdate(states,lastAssignedState,states[stateId].turnSymbol,checkWin(states,stateId),stateId)
                }
            }
        })
    
        socket.on('turnPlayed',(pos,sID) => {
            if (socket == states[sID].turn) {
                let newPos = (1 * pos) + (35 - (7 * states[sID].columnSize[pos]))
                states[sID].squares[newPos] = states[sID].turnSymbol
                states[sID].columnSize[pos]++
                states[sID].x.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
                states[sID].o.emit('squaresUpdate',states[sID].squares,states[sID].columnSize)
                turnUpdate(states,lastAssignedState,states[sID].notTurnSymbol,checkWin(states,sID),sID)
            }
        })
    
        socket.on('disconnect',() => {
            for (var [k,v] of Object.entries(states)) {
                if (states[k].x == socket) {
                    console.log('State ID:',k,', X Left')
                    if (states[k].o != '') {
                        states[k].o.emit('status','Your opponent has left. Please refresh page for a new opponent.')
                        states[k].o.disconnect()
                    }
                    playerCount--
                    io.sockets.emit('playerCountUpdate',playerCount)
                    delete states[k]
                    backup(states,lastAssignedState)
                    break
                }
                else if (states[k].o == socket) {
                    console.log('State ID:',k,', O Left')
                    if (states[k].x != '') {
                        states[k].x.emit('status','Your opponent has left. Please refresh page for a new opponent.')
                        states[k].x.disconnect()
                    }
                    playerCount--
                    io.sockets.emit('playerCountUpdate',playerCount)
                    delete states[k]
                    backup(states,lastAssignedState)
                    break
                }
            }
        })
    })
})