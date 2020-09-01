const AiManager = {
  knowledge: [],
  foundWumpus: false,

  initialize: (playerX, playerY, width, height) => {
    AiManager.knowledge = [];
    AiManager.foundWumpus = false;

    for (let y=0; y<height; y++) {
      const row = [];

      for (let x=0; x<width; x++) {
        row.push({ x, y, visited: 0, pit: 0, wumpus: 0, gold: 0 });
      }

      AiManager.knowledge.push(row);
    }
  },

  update: (x, y, room) => {
    // Adds perceptions about this room to the knowledge base.
    if (room) {
      // Check percepts.
      if (room.includes(WumpusManager.constants.breeze)) {
        AiManager.knowledge[y][x].breeze = true;
      }

      if (room.includes(WumpusManager.constants.stench)) {
        AiManager.knowledge[y][x].stench = true;
      }

      if (room.includes(WumpusManager.constants.glitter)) {
        AiManager.knowledge[y][x].glitter = true;
      }

      // Deduce knowledge about adjacent rooms.
      AiManager.deduce(x, y);

      // Set this room as visited and safe.
      AiManager.knowledge[y][x].visited = AiManager.knowledge[y][x].visited ? AiManager.knowledge[y][x].visited + 1 : 1;
      AiManager.knowledge[y][x].pit = 0;
      AiManager.knowledge[y][x].wumpus = 0;
      AiManager.knowledge[y][x].gold = 0;

      return AiManager.move(x, y);
    }
  },

  deduce: (x, y) => {
    // Updates adjacent rooms with knowledge.
    const knowledge = AiManager.knowledge[y][x];
    AiManager.think(x, y - 1, knowledge);
    AiManager.think(x + 1, y, knowledge);
    AiManager.think(x, y + 1, knowledge);
    AiManager.think(x - 1, y, knowledge);
  },

  think: (x, y, knowledge) => {
    let adjRoom;

    // If this is the first time we've entered this room, update knowledge for adjacent rooms.
    if (x >= 0 && x < AiManager.knowledge[0].length && y >= 0 && y < AiManager.knowledge.length && !knowledge.visited) {
      adjRoom = AiManager.knowledge[y][x];

      if (knowledge.breeze && !adjRoom.visited) {
        adjRoom.pit += 0.25;
      }

      if (knowledge.stench) {
        if (!adjRoom.visited && !AiManager.foundWumpus) {
          adjRoom.wumpus += 0.25;
          if (adjRoom.wumpus >= 0.5) {
            AiManager.foundWumpus = true;

            // We found the wumpus room. Find all adjacent rooms and update their adjacent rooms to no wumpus (except for adjRoom, which of course, has the wumpus).
            const adjRooms = AiManager.availableRooms(adjRoom.x, adjRoom.y);
            // Go through each adjacent room of the wumpus, where we would perceive a stench.
            adjRooms.forEach(room => {
              // Find all adjacent rooms to the stench and set wumpus to 0, except for adjRoom, which is the actual wumpus.
              const adjRooms2 = AiManager.availableRooms(room.x, room.y);
              adjRooms2.forEach(room2 => {
                if (room2.x !== adjRoom.x && room2.y !== adjRoom.y) {
                  AiManager.knowledge[room2.y][room2.x].wumpus = 0;
                }
              })
            });
          }
        }
      }
      else {
        // No stench in the originating room, so all adjacent rooms will not be the wumpus.
        AiManager.knowledge[adjRoom.y][adjRoom.x].wumpus = 0;
      }

      if (knowledge.glitter && !adjRoom.visited) {
        adjRoom.gold += 0.25;
      }
    }

    return adjRoom;
  },

  move: (x, y) => {
    // Determines the next best move from starting point x, y.
    /*
    Rules:
    R = Room, P = Pit, W = Wumpus, T = Treasure
    B = Breeze, S = Stench, G = Glitter, O = OK

    Adj(R)^B(R) => P(R)
    Adj(R)^S(R) => W(R)
    Adj(R)^G(R) => T(R)
    !P(R)^!W(R) => O(R)

    Example: Is R(2,1) safe?

    Satisfy: O(R21) = True

    !P(R)^!W(R) => O(R21)
    !(Adj(R)^B(R)) ^ !(Adj(R)^S(R)) => O(R21)

    ^^ This will check all adjacent rooms for breeze or stench. If none, the room is OK.
    */
    let room;

    const rooms = AiManager.availableRooms(x, y);

    // Does an unvisited room contain a probability of gold >= 0.5?
    room = rooms.find(room => !room.knowledge.visited && room.knowledge.gold >= 0.5);
    if (!room) {
      room = rooms.find(room => !room.knowledge.visited && room.knowledge.gold >= 0.25 && room.knowledge.pit < 0.5 && room.knowledge.wumpus < 0.5);
    }

    // Does a visited room contain a glitter?
    if (!room) {
      room = rooms.find(room => room.knowledge.glitter);
    }

    // Does an unvisited room contain no wumpus and no pit?
    if (!room) {
      room = rooms.find(room => !room.knowledge.visited && !room.knowledge.pit && !room.knowledge.wumpus);
    }

    // All adjacent rooms are either visited or contain a possible enemy. Is there another unvisited room that is safe?
    if (!room) {
      let closestSafeRoom = null;
      for (let ry=0; ry<AiManager.knowledge.length; ry++) {
        // Find the least visited safe room.
        const potentialSafeRoom = AiManager.knowledge[ry].find(knowledge => (knowledge.x !== x || knowledge.y !== y) && knowledge.visited && !knowledge.pit && !knowledge.wumpus);
        if (potentialSafeRoom && (!closestSafeRoom || potentialSafeRoom.visited < closestSafeRoom.visited)) {
          closestSafeRoom = potentialSafeRoom;
        }
      }
      // Finally, move in the safest direction of the room found.
      if (closestSafeRoom) {
        const closestSafeRooms = [];
        if (closestSafeRoom.x < x) {
          // Move left.
          closestSafeRooms.push(rooms.find(room => room.x < x && !room.knowledge.pit && !room.knowledge.wumpus));
        }

        if (closestSafeRoom.x > x) {
          // Move right.
          closestSafeRooms.push(rooms.find(room => room.x > x && !room.knowledge.pit && !room.knowledge.wumpus));
        }

        if (closestSafeRoom.y < y) {
          // Move up.
          closestSafeRooms.push(rooms.find(room => room.y < y && !room.knowledge.pit && !room.knowledge.wumpus));
        }

        if (closestSafeRoom.y > y) {
          // Move down.
          closestSafeRooms.push(rooms.find(room => room.y > y && !room.knowledge.pit && !room.knowledge.wumpus));
        }

        // Choose the room that has the least visits to move to next.
        room = closestSafeRooms.sort((a, b) => { return a.knowledge.visited - b.knowledge.visited; })[0];
      }
    }

    // Does an unvisited room contain a probability of a pit < 0.5 and no wumpus?
    if (!room) {
      room = rooms.find(room => !room.knowledge.visited && room.knowledge.pit < 0.5 && room.knowledge.wumpus === 0);
    }

    // Does an unvisited room contain a probability of a wumpus < 0.5 and no pit?
    if (!room) {
      room = rooms.find(room => !room.knowledge.visited && room.knowledge.wumpus < 0.5 && room.knowledge.pit === 0);
    }

    // Does an unvisited room contain a probability of pit and wumpus < 0.5?
    if (!room) {
      room = rooms.find(room => !room.knowledge.visited && room.knowledge.pit < 0.5 && room.knowledge.wumpus < 0.5);
    }

    // If all else fails, backtrack to a previously visited room.
    if (!room) {
      room = rooms.sort((a, b) => { return a.knowledge.visited - b.knowledge.visited; })[0];
    }

    return room;
  },

  availableRooms: (x, y) => {
    const rooms = [];

    if (x >= 0 && x < AiManager.knowledge[0].length && y - 1 >= 0 && y - 1 < AiManager.knowledge.length)
      rooms.push({ x, y: y - 1, knowledge: AiManager.knowledge[y-1][x] });
    if (x + 1 >= 0 && x + 1 < AiManager.knowledge[0].length && y >= 0 && y < AiManager.knowledge.length)
      rooms.push({ x: x + 1, y, knowledge: AiManager.knowledge[y][x+1] });
    if (x >= 0 && x < AiManager.knowledge[0].length && y + 1 >= 0 && y + 1 < AiManager.knowledge.length)
      rooms.push({ x, y: y + 1, knowledge: AiManager.knowledge[y+1][x] });
    if (x - 1 >= 0 && x - 1 < AiManager.knowledge[0].length && y >= 0 && y < AiManager.knowledge.length)
      rooms.push({ x: x - 1, y, knowledge: AiManager.knowledge[y][x-1] });

    return rooms;
  },

  isPit: (x, y) => {
    if (x >= 0 && x < AiManager.knowledge[0].length && y >= 0 && y < AiManager.knowledge.length)
      return AiManager.knowledge[y][x].pit >= 0.5;
    else
      return false;
  },

  isWumpus: (x, y) => {
    if (x >= 0 && x < AiManager.knowledge[0].length && y >= 0 && y < AiManager.knowledge.length)
      return AiManager.knowledge[y][x].wumpus >= 0.5;
    else
      return false;
  },

  isGold: (x, y) => {
    if (x >= 0 && x < AiManager.knowledge[0].length && y >= 0 && y < AiManager.knowledge.length)
      return AiManager.knowledge[y][x].gold >= 0.5;
    else
      return false;
  },

  pad: (pad, str, padLeft) => {
    if (typeof str === 'undefined')
      return pad;
    if (padLeft) {
      return (pad + str).slice(-pad.length);
    } else {
      return (str + pad).substring(0, pad.length);
    }
  },

  toString: () => {
    let result = '';

    for (let y=0; y < AiManager.knowledge.length; y++) {
      result += '| ';

      for (let x=0; x < AiManager.knowledge[y].length; x++) {
        result += `v: ${AiManager.pad('    ', AiManager.knowledge[y][x].visited)} p: ${AiManager.pad('    ', AiManager.knowledge[y][x].pit)} w: ${AiManager.pad('    ', AiManager.knowledge[y][x].wumpus)} g: ${AiManager.pad('    ', AiManager.knowledge[y][x].gold)} | `;
      }
      result += '\n';
    }

    return result;
  }
};