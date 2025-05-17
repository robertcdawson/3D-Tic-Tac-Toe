// Simple AI module for 3D Tic-Tac-Toe
// Provides getAIMove(board, difficulty, aiPlayer) returning {x,y,z}

(function(global){
  const lines = [];
  // X lines
  for(let y=0;y<3;y++){
    for(let z=0;z<3;z++){
      lines.push([{x:0,y,z},{x:1,y,z},{x:2,y,z}]);
    }
  }
  // Y lines
  for(let x=0;x<3;x++){
    for(let z=0;z<3;z++){
      lines.push([{x,y:0,z},{x,y:1,z},{x,y:2,z}]);
    }
  }
  // Z lines
  for(let x=0;x<3;x++){
    for(let y=0;y<3;y++){
      lines.push([{x,y,z:0},{x,y,z:1},{x,y,z:2}]);
    }
  }
  // XY diagonals
  for(let z=0;z<3;z++){
    lines.push([{x:0,y:0,z},{x:1,y:1,z},{x:2,y:2,z}]);
    lines.push([{x:2,y:0,z},{x:1,y:1,z},{x:0,y:2,z}]);
  }
  // XZ diagonals
  for(let y=0;y<3;y++){
    lines.push([{x:0,y,z:0},{x:1,y,z:1},{x:2,y,z:2}]);
    lines.push([{x:2,y,z:0},{x:1,y,z:1},{x:0,y,z:2}]);
  }
  // YZ diagonals
  for(let x=0;x<3;x++){
    lines.push([{x,y:0,z:0},{x,y:1,z:1},{x,y:2,z:2}]);
    lines.push([{x,y:2,z:0},{x,y:1,z:1},{x,y:0,z:2}]);
  }
  // Main 3D diagonals
  lines.push([{x:0,y:0,z:0},{x:1,y:1,z:1},{x:2,y:2,z:2}]);
  lines.push([{x:2,y:0,z:0},{x:1,y:1,z:1},{x:0,y:2,z:2}]);
  lines.push([{x:0,y:2,z:0},{x:1,y:1,z:1},{x:2,y:0,z:2}]);
  lines.push([{x:2,y:2,z:0},{x:1,y:1,z:1},{x:0,y:0,z:2}]);

  function emptyCells(board){
    const moves=[];
    for(let x=0;x<3;x++){
      for(let y=0;y<3;y++){
        for(let z=0;z<3;z++){
          if(!board[x][y][z]) moves.push({x,y,z});
        }
      }
    }
    return moves;
  }

  function findWinningMove(board, player){
    for(const line of lines){
      const values=line.map(p=>board[p.x][p.y][p.z]);
      const count=values.filter(v=>v===player).length;
      const emptyIndex=values.findIndex(v=>v===null);
      if(count===2 && emptyIndex!==-1){
        const pos=line[emptyIndex];
        if(board[pos.x][pos.y][pos.z]===null){
          return pos;
        }
      }
    }
    return null;
  }

  function getRandomMove(board){
    const moves=emptyCells(board);
    if(moves.length===0) return null;
    return moves[Math.floor(Math.random()*moves.length)];
  }

  function getAIMove(board,difficulty,aiPlayer){
    if(difficulty==='hard'){
      let move=findWinningMove(board,aiPlayer);
      if(move) return move;
      const opponent=aiPlayer==='X'?'O':'X';
      move=findWinningMove(board,opponent);
      if(move) return move;
    }
    return getRandomMove(board);
  }

  global.getAIMove=getAIMove;
})(this);

