const socket = io()
const state = {}

const squaresInit = () => {
    const squares = []
    const char = "'"
    for(i = 0;i < 6 * 7;i++) {
        squares.push(char)
    }
    return squares
}

const ind = (r,c) => (r * 7) + c

const checkEnemyWin = () => {
    for (r = 0;r < 3;r++) {
        for (c = 0;c < 7;c++) {
            if (state.squares[ind(r,c)] == "'" && state.squares[ind(r+1,c)] == state.squares[ind(r+2,c)] && state.squares[ind(r+2,c)] == state.squares[ind(r+3,c)] && state.squares[ind(r+3,c)] == state.enemySymbol) {
                return c
            }
        }
    }
    for (r = 0;r < 6;r++) {
        for (c = 0;c < 4;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r,c+1)] + state.squares[ind(r,c+2)] + state.squares[ind(r,c+3)]
            if (state.enemySymbol == 'X') {
                if (fourInRow == "XXX'") {return (c + 3)}
                else if (fourInRow == "XX'X") {return (c + 2)}
                else if (fourInRow == "X'XX") {return (c + 1)}
                else if (fourInRow == "'XXX") {return c}
            }
            else if (state.enemySymbol == 'O') {
                if (fourInRow == "OOO'") {return (c + 3)}
                else if (fourInRow == "OO'O") {return (c + 2)}
                else if (fourInRow == "O'OO") {return (c + 1)}
                else if (fourInRow == "'OOO") {return c}
            }
        }
    }
    for (r = 0;r < 3;r++) {
        for (c = 0;c < 4;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r+1,c+1)] + state.squares[ind(r+2,c+2)] + state.squares[ind(r+3,c+3)]
            if (state.enemySymbol == 'X') {
                if (fourInRow == "XXX'") {return (c + 3)}
                else if (fourInRow == "XX'X") {return (c + 2)}
                else if (fourInRow == "X'XX") {return (c + 1)}
                else if (fourInRow == "'XXX") {return c}
            }
            else if (state.enemySymbol == 'O') {
                if (fourInRow == "OOO'") {return (c + 3)}
                else if (fourInRow == "OO'O") {return (c + 2)}
                else if (fourInRow == "O'OO") {return (c + 1)}
                else if (fourInRow == "'OOO") {return c}
            }
        }
    }
    for (r = 2;r < 6;r++) {
        for (c = 3;c < 7;c++) {
            let fourInRow = state.squares[ind(r,c)] + state.squares[ind(r+1,c-1)] + state.squares[ind(r+2,c-2)] + state.squares[ind(r+3,c-3)]
            if (state.enemySymbol == 'X') {
                if (fourInRow == "XXX'") {return (c + 3)}
                else if (fourInRow == "XX'X") {return (c + 2)}
                else if (fourInRow == "X'XX") {return (c + 1)}
                else if (fourInRow == "'XXX") {return c}
            }
            else if (state.enemySymbol == 'O') {
                if (fourInRow == "OOO'") {return (c + 3)}
                else if (fourInRow == "OO'O") {return (c + 2)}
                else if (fourInRow == "O'OO") {return (c + 1)}
                else if (fourInRow == "'OOO") {return c}
            }
        }
    }
    return -1
}

const moveUpdate = (event,c) => {
    if (state.game && state.turn) {
        if (state.columnSize[c] >= 6) {
            ReactDOM.render(React.createElement('h4',null,'STATUS: Selected Column is full. Choose another column'),document.getElementById('status'))
        }
        else {
            socket.emit('turnPlayed',c,state.gameId)
            setState({turn: false})
        }
    }
    else if (!state.game || (state.game && !state.turn)) {
    }
}

const hoverInUpdate = (v,c) => {
    const squaresList = state.squares.map((d,i) => React.createElement('button',{style: {'max-width': '24px',padding: '10px 24px'},key: i,value: i,'data-column': i%7,onClick: (e) => moveUpdate(e,e.target.dataset.column),onMouseOver: (e)=> hoverInUpdate(e.target.value,e.target.dataset.column),onMouseOut: (e)=> setState()},state.squares[i]))
    for (r = 0;r<6;r++) {
        let hoverColor = 'green'
        // if (state.enemyWin != -1 && state.enemyWin != c) {
        if (state.enemyWin != -1) {
            hoverColor = 'red'
        }
        squaresList[(r * 7) + (c*1)].props.style.backgroundColor=hoverColor
    }
    ReactDOM.render(
        (document.title = "Four-In-A-Row",
        React.createElement('div',{id: 'myGrid'},
            React.createElement('h2',null,"Welcome to Four-In-A-Row"),
            React.createElement('div',{id: 'p1'},React.createElement('h4',null,"X - Not Connected")),
            React.createElement('div',{id: 'p2'},React.createElement('h4',null,"O - Not Connected")),
            React.createElement('div',{id: 'status'},React.createElement('h4',null,"STATUS: Not Connected")),
            React.createElement('div',{id: 0},squaresList.slice(0,7)),
            React.createElement('div',{id: 1},squaresList.slice(7,14)),
            React.createElement('div',{id: 2},squaresList.slice(14,21)),
            React.createElement('div',{id: 3},squaresList.slice(21,28)),
            React.createElement('div',{id: 4},squaresList.slice(28,35)),
            React.createElement('div',{id: 5},squaresList.slice(35,42)),
            React.createElement('div',{id: 'playerCount'},React.createElement('h5',null,'Players Online: Not Connected'))
        )
    ),document.getElementById('root'))
}

const setState = updates => {
    Object.assign(state,updates)
    const squaresList = state.squares.map((d,i) => React.createElement('button',{style: {'max-width': '24px',padding: '10px 24px'},key: i,value: i,'data-column': i%7,onClick: (e) => moveUpdate(e,e.target.dataset.column),onMouseOver: (e)=> hoverInUpdate(e.target.value,e.target.dataset.column),onMouseOut: (e)=> setState()},state.squares[i]))
    ReactDOM.render(
        (document.title = "Four-In-A-Row",
        React.createElement('div',{id: 'myGrid'},
            React.createElement('h2',null,"Welcome to Four-In-A-Row"),
            React.createElement('div',{id: 'p1'},React.createElement('h4',null,"X - Not Connected")),
            React.createElement('div',{id: 'p2'},React.createElement('h4',null,"O - Not Connected")),
            React.createElement('div',{id: 'status'},React.createElement('h4',null,"STATUS: Not Connected")),
            React.createElement('div',{id: 0},squaresList.slice(0,7)),
            React.createElement('div',{id: 1},squaresList.slice(7,14)),
            React.createElement('div',{id: 2},squaresList.slice(14,21)),
            React.createElement('div',{id: 3},squaresList.slice(21,28)),
            React.createElement('div',{id: 4},squaresList.slice(28,35)),
            React.createElement('div',{id: 5},squaresList.slice(35,42)),
            React.createElement('div',{id: 'playerCount'},React.createElement('h5',null,'Players Online: Not Connected'))
        )
    ),document.getElementById('root'))
}

socket.on('connectionInit',() => {
    if (state.gameId !== '') {
        socket.emit('connectionAck',state.gameId,state.symbol)
    }
    else {
        socket.emit('connectionAck',-1,-1)
    }
})

socket.on('playerSym',data => {
    state.symbol = data
    if (data == 'X') {
        state.enemySymbol = 'O'
        ReactDOM.render(React.createElement('h4',null,"X - Me"),document.getElementById('p1'))
    }
    else if (data == 'O') {
        state.enemySymbol = 'X'
        ReactDOM.render(React.createElement('h4',null,"O - Me"),document.getElementById('p2'))
    }
})
socket.on('status',data => {
    ReactDOM.render(React.createElement('h4',null,'STATUS: '+data),document.getElementById('status'))
})
socket.on('gameStart',gameId => {
    state.gameId = gameId
    if (state.symbol == 'X') {
        ReactDOM.render(React.createElement('h4',null,"O - Guest"),document.getElementById('p2'))
    }
    else if (state.symbol == 'O') {
        ReactDOM.render(React.createElement('h4',null,"X - Guest"),document.getElementById('p1'))
    }
    state.game = true
})
socket.on('turn',() => setState({turn: true}))
socket.on('squaresUpdate',(newSquares,newColSizes) => {
    setState({squares: newSquares,columnSize: newColSizes})
    state.enemyWin = checkEnemyWin()
})
socket.on('playerCountUpdate',data => ReactDOM.render(React.createElement('h4',null,'Players Online: '+data),document.getElementById('playerCount')))

setState({gameId: '',squares: squaresInit(),columnSize: [0,0,0,0,0,0,0],game: false,turn: false,symbol: '',enemySymbol: '',enemyWin: -1})