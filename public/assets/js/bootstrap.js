(function (App, $, global) {

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

      goalPos: [13, 13],

      content: [
        {type: WALL,   rect: [[ 0,  0], [14,  0]]},
        {type: WALL,   rect: [[14,  0], [14, 14]]},
        {type: WALL,   rect: [[ 0,  1], [ 0, 14]]},
        {type: WALL,   rect: [[ 1, 14], [13, 14]]},
        {type: WALL,   rect: [[ 1,  2], [12,  2]]},
        {type: WALL,   rect: [[ 2,  4], [13,  4]]},
        {type: WALL,   rect: [[ 1,  6], [12,  6]]},
        {type: WALL,   rect: [[ 2,  8], [13,  8]]},
        {type: WALL,   rect: [[ 1, 10], [12, 10]]},
        {type: WALL,   rect: [[ 2, 12], [13, 12]]},
        {type: CREDIT, pos: [ 7, 3]},
        {type: CREDIT, pos: [ 1, 4]},
        {type: CREDIT, pos: [13, 7]},
        {type: CREDIT, pos: [ 4, 9]},
        {type: CREDIT, pos: [10, 11]},
        {type: CREDIT, pos: [ 7, 13]}
      ]
    },
    grid,
    program,
    codeChanged = true,
    speedControl = null,
    events = App.eventDispatcher;

  // Initialize the game grid
  grid = new App.Grid(gameData);

  // Help debugging
  //App.eventDispatcher.enableLogging();

  // Set up the program wrapper
  program = new App.Program();

  // TODO: write proper UI module(s) using event dispatcher,
  // instead of this hodge-podge

  $('#run-program').click(function (event) {
    if (codeChanged) {
      try {
        grid.reset();
        program.init($('#program-input').val());
        speedControl = program.speed();
      } catch (e) {
        //TODO: better error messaging system
        global.alert(e.message);
      }
      codeChanged = false;
    }

    program.run();
  });

  $('#pause-program').click(program.pause);

  $('#reset-program').click(function (event) {
    grid.reset();
    program.stop();
  });

  $('#program-input').change(function () {
    codeChanged = true;
  });

  $('#speed-faster').click(function () {
    if (speedControl) {
      speedControl.faster();
    }
  });

  $('#speed-slower').click(function () {
    if (speedControl) {
      speedControl.slower();
    }
  });

  $('#speed-reset').click(function () {
    if (speedControl) {
      speedControl.reset();
    }
  });

  events.subscribe('program.queue.initialized', function () {
    $('#speed').show();
  });



}(this.CARGO, this.jQuery, this));
