(function (App, $, global) {
  "use strict";

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

    grids = {},
    events = App.eventDispatcher;

  grids.simple = {
    width: 7,
    height: 3,
    startPos: [1, 1],
    startDirection: 'r',

    goalPos: [5, 1],

    content: [
      {type: 'wall', rect: [[0, 0], [7, 1]]},
      {type: 'wall', rect: [[0, 2], [7, 1]]},
      {type: 'wall', pos: [0, 1]},
      {type: 'wall', pos: [6, 1]}
    ]
  };

  grids.turn = {
    width: 7,
    height: 7,
    startPos: [1, 1],
    startDirection: 'r',

    goalPos: [1, 3],
    content: [
      {type: 'wall', rect: [[0, 0], [7, 1]]},
      {type: 'wall', rect: [[0, 6], [7, 1]]},
      {type: 'wall', rect: [[0, 1], [1, 5]]},
      {type: 'wall', rect: [[6, 1], [1, 5]]},
      {type: 'wall', rect: [[2, 2], [3, 3]]},
      {type: 'wall', pos: [1, 2]}
    ]
  };


  grids.zigzag = {
    width: 15,
    height: 15,
    startPos: [1, 1],
    startDirection: 'r',

    goalPos: [13, 13],

    content: [
      {type: 'wall',   rect: [[ 0,  0], [15,  1]]},
      {type: 'wall',   rect: [[14,  0], [ 1, 15]]},
      {type: 'wall',   rect: [[ 0,  1], [ 1, 14]]},
      {type: 'wall',   rect: [[ 1, 14], [13,  1]]},
      {type: 'wall',   rect: [[ 1,  2], [12,  1]]},
      {type: 'wall',   rect: [[ 2,  4], [12,  1]]},
      {type: 'wall',   rect: [[ 1,  6], [12,  1]]},
      {type: 'wall',   rect: [[ 2,  8], [12,  1]]},
      {type: 'wall',   rect: [[ 1, 10], [12,  1]]},
      {type: 'wall',   rect: [[ 2, 12], [12,  1]]},
      {type: 'credit', pos: [ 7, 3]},
      {type: 'credit', pos: [ 1, 4]},
      {type: 'credit', pos: [13, 7]},
      {type: 'credit', pos: [ 4, 9]},
      {type: 'credit', pos: [10, 11]},
      {type: 'credit', pos: [ 7, 13]}
    ]
  };

  // Make available to the App namespace
  App.grids = grids;



  // Initialize the game grid
  App.Grid(grids.simple);

  // Help debugging
  App.eventDispatcher.enableLogging();

  // Set up the program wrapper
  App.Program();

  $('#program-input').change(function () {
    events.trigger('ui.code.edited', $(this).val());
  });

  events.subscribe({
    'ui.run': function () {
      $('#speed').show();
    },

    'ui.pause': function () {
      $('#speed').hide();
    },

    'queue.empty': function () {
      $('#speed').hide();
    }
  });

  $('select').chosen();

}(this.CARGO, this.jQuery, this));
