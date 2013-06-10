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

    // Describes the whole setup of the game
    // This is to be more dynamic, and not hardcoded.
    gameData = {
      width: 15,
      height: 15,
      startPos: [1, 1],
      startDirection: 'r',

      goalPos: [13, 13],

      content: [
        {type: 'wall',   rect: [[ 0,  0], [14,  0]]},
        {type: 'wall',   rect: [[14,  0], [14, 14]]},
        {type: 'wall',   rect: [[ 0,  1], [ 0, 14]]},
        {type: 'wall',   rect: [[ 1, 14], [13, 14]]},
        {type: 'wall',   rect: [[ 1,  2], [12,  2]]},
        {type: 'wall',   rect: [[ 2,  4], [13,  4]]},
        {type: 'wall',   rect: [[ 1,  6], [12,  6]]},
        {type: 'wall',   rect: [[ 2,  8], [13,  8]]},
        {type: 'wall',   rect: [[ 1, 10], [12, 10]]},
        {type: 'wall',   rect: [[ 2, 12], [13, 12]]},
        {type: 'credit', pos: [ 7, 3]},
        {type: 'credit', pos: [ 1, 4]},
        {type: 'credit', pos: [13, 7]},
        {type: 'credit', pos: [ 4, 9]},
        {type: 'credit', pos: [10, 11]},
        {type: 'credit', pos: [ 7, 13]}
      ]
    },

    events = App.eventDispatcher;

  // Initialize the game grid
  App.Grid(gameData);

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

}(this.CARGO, this.jQuery, this));
