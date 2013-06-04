(function (App) {

  // Init all the things
  var
    WALL   = 'wall',
    CREDIT = 'credit',
    CAR    = 'car',
    FINISH = 'finish',
    UP     = 'u',
    DOWN   = 'd',
    LEFT   = 'l',
    RIGHT  = 'r',

    // Describes the whole setup of the game
    gameData = {
      width: 15,
      height: 15,
      startPos: [1, 1],
      startDirection: RIGHT,

      goalPos: [1, 13],

      content: [
        {type: WALL,   rect: [[ 0,  0], [14,  0]]},
        {type: WALL,   rect: [[14,  0], [14, 14]]},
        {type: WALL,   rect: [[ 0,  1], [ 0, 14]]},
        {type: WALL,   rect: [[ 1, 14], [13, 14]]},
        {type: WALL,   rect: [[ 1,  2], [12, 12]]},
        {type: CREDIT, pos: [13, 3]}
      ]
    },
    grid,
    program;

  // Initialize the game grid
  grid = new App.Grid(gameData);

  // Help debugging
  App.eventDispatcher.enableLogging();

  // Set up the program wrapper
  program = new App.Program();


  $('#run-program').click(function (event) {
    program.init($('#program-input').val());
    program.run();
  })

  $('#reset-grid').click(function (event) {
    grid.reset();
  });



}(this.CARGO));
