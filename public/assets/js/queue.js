(function (App) {
  "use strict";

  var
    DEFAULT_DELAY = 250,   //
    MIN_DELAY     = 1,     // ms
    MAX_DELAY     = 10000, //

    events = App.eventDispatcher;


  /**
   * Queue manager to aid with building delays into recursive execution of program
   *
   * Lets you push stuff to the end of the queue as well as unshift it to
   * give priority over previously queued commands.
   */
  App.Queue = function (stepDelay) {
    var
      commandQueue = [],
      timeout      = null,
      paused       = false,
      self         = this;


    // Ensure instantiation
    if (this.constructor !== App.Queue) {
      return new App.Queue();
    }

    // Intialize delay between steps
    stepDelay = stepDelay !== undefined ? stepDelay : DEFAULT_DELAY;


    /**
     * Shorthand to check if the queue has been emptied
     * @return {Boolean}
     */
    function isEmpty() {
      return commandQueue.length === 0;
    }


    /**
     * Execute whatever command is at the top of the queue right now
     *
     * Clears any more timeouts set, then set the timeout for executing the
     * next command in the queue.
     *
     * Doesn't do anything if the paused flag is set or the queue's empty
     *
     */
    function executeNext() {

      if (paused) { return; }

      if (isEmpty()) {
        // I assume this only happens when the program has finished executing
        events.trigger('queue.empty');
        return;
      }

      commandQueue.shift()();
      clearTimeout(timeout);
      timeout = setTimeout(executeNext, stepDelay);
    }


    /**
     * Prevent executing the next command in the queue for the time being
     * @return {Queue} self
     */
    this.pause = function () {
      paused = true;
      clearTimeout(timeout);
      return self;
    };


    /**
     * (Re)start executing the queue.
     *
     * @return {Queue} self
     */
    this.resume = function () {
      paused = false;
      setTimeout(executeNext, stepDelay);
      return self;
    };


    /**
     * Add command(s) to the end of the execution queue
     *
     * If the queue was empty and not paused, resumes execution
     *
     * @param  {Object|Array} command parsed command | array of commands
     * @return {Queue} self
     */
    this.push = function (command) {
      var
        wasEmpty = isEmpty(),
        i;

      if (command instanceof Array) {
        // An array of commands was passed (block)

        for (i = 0; i < command.length; i += 1) {
          commandQueue.push(command[i]);
        }

      } else {
        // A single command was passed
        commandQueue.push(command);
      }

      if (wasEmpty && !paused) {
        self.resume();
      }

      return self;
    };


    /**
     * Tnsert command(s) at top of the execution queue
     *
     * If the queue was empty and not paused, resume execution
     *
     * @param  {Object|Array} command parsed command | array of commands
     * @return {Queue} self
     */
    this.unshift = function (command) {
      var
        wasEmpty = isEmpty(),
        i;

      if (command instanceof Array) {
        // An array of command was passed (block)

        for (i = command.length - 1; i >= 0; i -= 1) {
          commandQueue.unshift(command[i]);
        }

      } else {
        // A single command was passed
        commandQueue.unshift(command);
      }

      if (wasEmpty && !paused) {
        self.resume();
      }

      return self;
    };

    /**
     * Empties the execution queue
     * @return {[type]} [description]
     */
    this.clear = function () {
      commandQueue = [];
      return self;
    };


    this.isEmpty = isEmpty;


    /**
     * Returns an interface for controlling the speed of the queue
     *
     * @return {Object}
     */
    this.speed = function () {

      return {
        /**
         * Halves delay between steps, within limits.
         *
         * @return {Bool} false if limit reached and no change made
         */
        faster: function () {
          if (stepDelay > MIN_DELAY) {
            stepDelay /= 2;
            return true;
          }
          return false;
        },

        /**
         * Doubles delay between steps, within limits.
         *
         * @return {Bool} false if limit reached and no change made
         */
        slower: function () {
          if (stepDelay < MAX_DELAY) {
            stepDelay *= 2;
            return true;
          }
          return false;
        },


        /**
         * Resets delay between steps to default value
         */
        reset: function () {
          stepDelay = DEFAULT_DELAY;
        },

        /**
         * Gets the currently set step delay
         *
         * @return {Number}
         */
        currentStepDelay: function () {
          return stepDelay;
        }
      };
    };

    events.subscribe({
      // Todo: clean up all these needlessly public interfaces
      'ui.queue.speed.faster': self.speed().faster,
      'ui.queue.speed.reset':  self.speed().reset,
      'ui.queue.speed.slower': self.speed().slower,
      'ui.queue.pause':        self.pause,
      'ui.queue.resume':       self.resume,
      'ui.queue.clear':        self.clear,
      'program.initialized':   self.clear
    });

    App.queue = self;

    App.Queue = function () {

      App.queue = self;

      if (this.constructor === App.Queue) {
        self.speed.reset();
        return self.clear();
      }
      return self;
    };
  };

  // Init automatically as this has no dependencies
  App.queue = new App.Queue();

}(this.CARGO));
