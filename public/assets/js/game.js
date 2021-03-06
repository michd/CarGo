(function (App) {
  "use strict";

  var events = App.eventDispatcher;

  /**
   * Custom exception for things that go wrong in the Game module
   *
   * @param  {String} message
   * @return {App.GameException}
   */
  App.GameException = function (message) {
    this.name = "CarGo GameException";
    this.message = message;
  };


  /**
   * Controls game aspects of CarGo: scores, keeping count of credits picked up
   *
   * Singleton
   *
   * @triggers {game.command-execute-update}
   * @triggers {game.credits-update}
   * @triggers {game.got-all-credits}
   * @return   {App.Game}
   */
  App.Game = function () {
    var
      creditsPickedUp = 0,
      creditsInGame   = 0,
      commandExecutes = 0,
      commandsInProgram = 0,
      score = 0,
      self            = this;

    // Ensure instantiation
    if (this.constructor !== App.Game) {
      return new App.Game();
    }


    /**
     * Handler for program.executing, increments commandExecutes
     *
     * @triggers {game.command-execute-update}
     */
    function commandExecuted() {
      commandExecutes += 1;

      events.trigger('game.command-execute-update', commandExecutes);
      calculateScore();
    }


    /**
     * Handler for credit-picked-up, increments creditsPickedUp
     *
     * @triggers {game.credits-update}
     * @triggers {game.got-all-credits} If [creditsPickedUp === creditsInGame]
     * @throws   {App.GameException}    If [creditsPickedUp > creditsInGame]
     */
    function creditPickedUp() {

      creditsPickedUp += 1;

      if (creditsPickedUp > creditsInGame) {
        throw new App.GameException(
          'More credits picked up than there are credits in this game. ' +
            'Credits in game: ' + creditsInGame +
            ', credits picked up: ' + creditsPickedUp
        );
      }

      events.trigger('game.credits-update', [creditsPickedUp, creditsInGame]);

      if (creditsPickedUp === creditsInGame) {
        events.trigger('game.got-all-credits', creditsPickedUp);
      }

      calculateScore();
    }

    function calculateScore() {
      score = (creditsInGame - creditsPickedUp) * 10 + commandExecutes + commandsInProgram * 2;
      events.trigger('game.score-update', score);
      // Get as low a score as possible.
      // More commands executed = increases score
      // Not getting credits = increases score
      // Number of lines increases score
      //
      // score = (total credits - credits picked up) * 10 + commands executed + commands in program
    }

    /**
     * Resets the counters to zero
     *
     * @triggers {game.credits-update}
     * @triggers {game.command-execute-update}
     */
    function reset() {
      commandExecutes = 0;
      creditsPickedUp = 0;
      score = 0;

      events.trigger('game.command-execute-update', commandExecutes);
      events.trigger('game.credits-update', [creditsPickedUp, creditsInGame]);
      events.trigger('game.score-update', score);
    }

    function onProgramParsed(program, numCommands) {
      console.log("### onProgramParsed with numCommands:", numCommands);
      commandsInProgram = numCommands;
      reset();
    }

    /**
     * Set up how many credits there are to be picked up in the grid
     *
     * @param {Number} creditCount
     * @triggers {game.credits-update}
     */
    function setGameCredits(creditCount) {
      creditsInGame = Math.max(0, creditCount);

      events.trigger('game.credits-update', [creditsPickedUp, creditsInGame]);
    }


    // Map events to functions
    events.subscribe({
      'program.executing':     commandExecuted,
      'credit-picked-up':      creditPickedUp,
      'grid.credits-placed':   setGameCredits,
      'ui.reset':              reset,
      'parser.program-parsed': onProgramParsed
    });


    // Singletonize

    // Overwrite constructor and store instance
    App.game = self;

    App.Game = function () {
      App.game = self;
      return self;
    };
  };

  App.game = new App.Game();

}(this.CARGO));
