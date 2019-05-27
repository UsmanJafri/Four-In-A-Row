Four-In-A-Row
============================
*A React + NodeJS implementation of the classic 2-player game: Four-In-A-Row. Features online multiplayer.*

<img src="/four-in-a-row-sample.png">

## Requirements

1. NodeJS (Tested on v8.16.0)
2. JavaScript-capable browser (Tested on Google Chrome)

## Instructions (Client)

1. To play the Four-In-A-Row game, browse to `/client.html` of the host URL. (e.g: http://localhost:8000/client.html)
2. A new game will immediately start if an opponent was available. Otherwise, the player will wait for an opponent to connect.
3. One of the players is assigned the `X` piece while the other is assigned the `O` piece.
4. To make a move, the player clicks on the column in which they want to drop their piece.
5. The `STATUS` bar will display whose turn it is and when the match is won, lost or drawn.
6. If the opponent could possibly win in the next move, columns on mouse-hover are highlighted red.
7. The first player to get 4 pieces in a row either horizontally, vertically or diagonally wins.

### Instructions (Server)
1. Open a Terminal window in the directory containing server.js and run:
> npm install
2. Run the Four-In-A-Row Server using the command:
> node server.js
3. The server automatically restores from a previous backup on startup, if available.
4. The server state is automatically backed up at every turn update and player disconnect.

### Features
- Server side turn verification to prevent cheating
- Columns on mouse-over are highlighted red if the other player could potentially win in the next move
- Server and player states preserved on server crash
- New game starts immediately as soon as previous ends
- Multiple parallel game instances
- Player notified if opponent leaves
- Online player count tracking