const HeuristicManager = {
  simple: function(playerMoves) {
    // Favor maximizing the number of available moves for the player.
    return playerMoves;
  },

  defensive: function(playerMoves, opponentMoves) {
    // Favor maximizing the number of available moves for the player weighted while minimizing the available moves for the opponent, emphasis on maximizing the player.
    return (playerMoves * 2) - opponentMoves;
  },

  offensive: function(playerMoves, opponentMoves) {
    // Favor maximizing the number of available moves for the player while minimizing the available moves for the opponent, emphasis on minimizing the opponent.
    return playerMoves  - (opponentMoves * 2);
  },

  defensiveToOffensive: function(playerMoves, opponentMoves, width, height, round) {
    // Early game, play a defensive strategy. Late game, play an offensive strategy.
    const ratio = round / (width * height);
    return ratio <= 0.5 ? HeuristicManager.defensive(playerMoves, opponentMoves) : HeuristicManager.offensive(playerMoves, opponentMoves);
  },

  offensiveToDefensive: function(playerMoves, opponentMoves, width, height, round) {
    // Early game, play an offensive strategy. Late game, play a defensive strategy.
    const ratio = round / (width * height);
    return ratio <= 0.5 ? HeuristicManager.offensive(playerMoves, opponentMoves) : HeuristicManager.defensive(playerMoves, opponentMoves);
  }
};