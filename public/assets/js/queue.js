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
   *
   * @param {Number} stepDelay Initial delay in ms between steps
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
     *
     * @return {Boolean}
     */
    function isEmpty() {
      return commandQueue.length === 0;
    }


    /**
     * Execute whatever function is at the top of the queue right now
     *
     * Clears any more timeouts set, then set the timeout for executing the
     * next command in the queue.
     *
     * Doesn't do anything if the paused flag is set or the queue's empty
     *
     * @param {Boolean} oneStep If true, don't set a timeout for executing next
     */
    function executeNext(oneStep) {

      if (paused && !oneStep) { return; }

      if (isEmpty()) {
        // Only happens when the program has finished executing
        events.trigger('queue.empty');
        return;
      }

      // Execute the next command up, remove from queue
      commandQueue.shift()();

      // Clear any double timeouts
      clearTimeout(timeout);

      // If only doing one step, don't set a new timeout
      if (oneStep) { return; }

      timeout = setTimeout(executeNext, stepDelay);
    }


    /**
     * Prevent executing the next command in the queue for the time being
     *
     */
    function pause() {
      paused = true;
      clearTimeout(timeout);
    }


    /**
     * (Re)start executing the queue.
     *
     */
    function resume() {
      paused = false;
      timeout = setTimeout(executeNext, stepDelay);
    }


    /**
     * Exexcute a single step only
     *
     * This sets the pause flag as well.
     *
     */
    function step() {
      paused = true;
      executeNext(true);
    }


    /**
     * Empties the execution queue
     *
     */
    function clear() {
      commandQueue = [];
    }


    /**
     * Halves delay between steps, within limits.
     *
     */
    function faster() {
      if (stepDelay <= MIN_DELAY) { return; }
      stepDelay /= 2;
    }


    /**
     * Doubles delay between steps, within limits.
     *
     */
    function slower() {
      if (stepDelay >= MAX_DELAY) { return; }
      stepDelay *= 2;
    }


    /**
     * Resets delay between steps to default value
     *
     */
    function resetSpeed() {
      stepDelay = DEFAULT_DELAY;
    }


    // Public interface for adding to queue

    /**
     * Add command(s) to the end of the execution queue
     *
     * @param  {Object|Array} command parsed command | array of commands
     * @return {App.Queue} self
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

      return self;
    };


    /**
     * Tnsert command(s) at top of the execution queue
     *
     * If the queue was empty and not paused, resume execution
     *
     * @param  {Object|Array} command parsed command | array of commands
     * @return {App.Queue} self
     */
    this.unshift = function (command) {
      var
        wasEmpty = isEmpty(),
        i;

      if (command instanceof Array) {
        // An array of commands was passed (block)

        for (i = command.length - 1; i >= 0; i -= 1) {
          commandQueue.unshift(command[i]);
        }

      } else {
        // A single command was passed
        commandQueue.unshift(command);
      }

      return self;
    };


    this.isEmpty = isEmpty;


    events.subscribe({
      'ui.run':              resume,
      'ui.pause':            pause,
      'ui.step':             step,
      'ui.reset':            clear,
      'program.initialized': clear,
      'ui.speed.faster':     faster,
      'ui.speed.reset':      resetSpeed,
      'ui.speed.slower':     slower
    });

    App.queue = self;


    // Override constructor (singletonize)
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
