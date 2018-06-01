# Four-In-A-Row
A purely NodeJS + ReactJS implementation of the classic Four-In-A-Row game. (Online Multiplayer)
### Instructions (Server)
1. Open a Terminal window in the directory containing server.js and run:
> npm install socket.io
2. Run the Four-In-A-Row Server using the command:
> node server.js
### Instructions (Client)
1. To play the Four-In-A-Row browse to **/client.html** of the host URL. (e.g: http://localhost:8000/client.html)
2. The player will then either wait for another player to connect or immediately start a game session if another player was already waiting.
### Features
- Columns on mouse-over are highlighted red if the other player could potentially win in the next move
- Server and player states preserved on server crash
- New game starts immediately as soon as previous ends
- Multiple parallel game instances
- Player notified if opponent leaves
- Online player count tracking
