(function (App, global) {
  "use strict";

  var events = App.eventDispatcher;

  /**
   * Custom exception for things that go wrong in the Program
   *
   * @param  {String} message
   * @param  {String} instruction Where it all went wrong
   * @return {App.ProgramException}
   */
  App.ProgramException = function (message, instruction) {

    this.name = "CarGo ProgramException";
    this.message = message;

    // Ensure instantiation
    if (this.constructor !== App.ProgramException) {
      return new App.ProgramException(message, instruction);
    }

    if (instruction !== undefined) {
      this.instruction = instruction;
    }
  };


  /**
   * Parses an executes the program written by the user
   *
   * @triggers {program.executing}
   * @triggers {program.initialized}
   * @triggers {program.empty}
   * @triggers {program.run}
   * @triggers {program.reset}
   * @triggers {error.program}
   * @return {App.Program}
   */
  App.Program = function () {

    var
      // Constants: program constructs/commands

      // Simple instructions
      DRIVE          = 'DRIVE',
      TURN_LEFT      = 'TURN LEFT',
      TURN_RIGHT     = 'TURN RIGHT',
      PICK_UP_CREDIT = 'PICK UP CREDIT',
      STOP           = 'STOP',

      // Conditions
      ON_CREDIT      = 'ON CREDIT',
      ON_FINISH      = 'ON FINISH',
      WALL_AHEAD     = 'WALL AHEAD',

      // Control structures
      IF             = 'IF',
      UNLESS         = 'UNLESS',
      WHILE          = 'WHILE',
      UNTIL          = 'UNTIL',

      END            = 'END',

      // Arrays of code keyword for regex creation in parsing
      instructions          = [DRIVE, TURN_LEFT, TURN_RIGHT, PICK_UP_CREDIT, STOP],
      conditions            = [ON_CREDIT, ON_FINISH, WALL_AHEAD],
      conditionalStructures = [IF, UNLESS, WHILE, UNTIL],
      loopStructures        = [WHILE, UNTIL],


      program          = [],
      car              = App.car, // The car is what the program is centered on.
      queue            = App.queue,

      self             = this;


    // Ensure instantiation
    if (this.constructor !== App.Program) {
      return new App.Program();
    }




    /**
     * Wraps command objects in function calls
     *
     * Works with arrays of commands too, through recursion
     *
     * @param  {Object|Array} command Single command objector array of them
     * @param  {Function} Function to wrap the command with
     * @return {Function|Array} Single function-wrapped command, or array of 'em
     */
    function wrapCommand(command, fn) {

      var
        isList = command instanceof Array,
        wrappedCommandList = [],
        i;

      if (!isList) {
        return function () { fn(command); };
      }

      for (i = 0; i < command.length; i += 1) {
        wrappedCommandList.push(wrapCommand(command[i], fn));
      }

      return wrappedCommandList;
    }


    /**
     * Adds the instructions of a command (or itself) to the execution queue
     *
     * Includes logic for queueing loops
     *
     * @param  {Object} command Parsed command
     */
    function queueNext(command, fn) {

      var
        isLoop = [WHILE, UNTIL].indexOf(command.control) > -1,
        block  = [];

      if (command.instructions) {
        // Block of instructions

        // Prepend this block's instructions to the execution queue
        block = command.instructions.slice();

        if (isLoop) {
          // Dealing with a loop, so after the block's instructions,
          // re-add the block starter
          block.push(command);
        }

        // Add list of commands at the top of the queue, to execute next
        queue.unshift(wrapCommand(block, fn));

      } else if (isLoop) {
        // Single instruction that is a loop

        // Queue this command to be evaluated again
        queue.unshift(wrapCommand(command, fn));
      }
    }


    /**
     * Execute a given parsed command
     *
     * @param  {Object} command
     * @triggers {program.executing}
     */
    function execute(command) {

      var
        // To determine whether the instruction(s) of this command should be
        // run at all
        conditionMet = true,

        // Maps program conditions to method names of the car
        carConditionMap = {
          'ON CREDIT':  'onCredit',
          'ON FINISH':  'onFinish',
          'WALL AHEAD': 'isWallAhead'
        },

        // Maps program commands to method names of the car
        carCommandMap = {
          'DRIVE':          'drive',
          'TURN LEFT':      'turnLeft',
          'TURN RIGHT':     'turnRight',
          'PICK UP CREDIT': 'pickUpCredit'
        };

      events.trigger('program.executing', command.lineNumber);

      // If there is a condition to this command, figure out whether it's met
      if (command.condition) {
        conditionMet = car[carConditionMap[command.condition]]();

        // Negatory control? Invert conditionMet status
        conditionMet = ([UNLESS, UNTIL].indexOf(command.control) > -1) ? !conditionMet : conditionMet;
      }

      // Don't bother executing / queuing if condition wasn't met
      if (!conditionMet) { return; }

      // Add any instructions the the execution queue
      queueNext(command, execute);

      // Execute any single instruction part of this command
      if (command.instruction) {
        car[carCommandMap[command.instruction]]();
      }
    }


    /**
     * Steps through a parsed program listing and executes all the commands
     *
     */
    function run() {
      if (program.length === 0) { return; }
      if (queue.isEmpty()) {
        queue.push(wrapCommand(program, execute));
      }
      events.trigger('program.run', [program]);
    }


    // Set up event listeners
    events.subscribe({
      'parser.program-parsed': function (newProgram) {
        program = newProgram;
      },
      'ui.run':  run,
      'ui.step': run
    });


    App.program = this;

    // Override constructor (singletonize)
    App.Program = function () {
      App.program = self;
      return self;
    };
  };

}(this.CARGO, this));
