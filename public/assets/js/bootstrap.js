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

  grid = new App.Grid(gameData);

  App.eventDispatcher.enableLogging();

  program = new App.Program();

  $('#program').find('form').submit(function (event) {
    event.preventDefault();
    program.init($('#program-input').val());
    program.run();
  });



}(this.CARGO));
