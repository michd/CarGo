(function (App) {

  "use strict";

  var
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


    DEFAULT_DELAY  = 250,   //
    MIN_DELAY      = 1,     //  ms
    MAX_DELAY      = 10000, //

    // Arrays of these for regex creation in parsing
    instructions          = [DRIVE, TURN_LEFT, TURN_RIGHT, PICK_UP_CREDIT, STOP],
    conditions            = [ON_CREDIT, ON_FINISH, WALL_AHEAD],
    conditionalStructures = [IF, UNLESS],
    loopStructures        = [WHILE, UNTIL],

    events = App.eventDispatcher;

  App.ProgramException = function (message, instruction) {
    this.name = "CarGo ProgramException";
    this.message = message;

    if (instruction !== undefined) {
      this.instruction = instruction;
    }
  };


  App.Program = function () {

    var
      program = [],
      car = App.car, // The car is what the program is centered on.
      queue,
      ProgramException = App.ProgramException;


    // Ensure instantiation
    if (this.constructor !== App.Program) {
      return new App.Program();
    }


    /**
     * Parses a single text line of instruction from the program into
     * and object that's easier to work with.
     *
     * Uses Regexes based on constants to parse each command and command type
     *
     * @param  {String} instruction Plaintext instruction
     * @return {Object}
     */
    function parseInstruction(instruction) {
      var
        // Regexes of instruction line types

        // Single simple instruction
        simple           = new RegExp('^(' + instructions.join('|') + ')$'),

        // Conditional construct + simple instruction
        conditional      = new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '): (' + instructions.join('|') + ')$'),

        // Conditional loop construct + simple instruction to repeat
        loop             = new RegExp('^(' + loopStructures.join('|') + ') (' + conditions.join('|') + '): (' + instructions.join('|') + ')$'),

        // Start of a conditional block, later terminated by END
        conditionalBlock = new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '):$'),

        // Start of a conditional loop block, later terminated by END
        loopBlock        = new RegExp('^(' + loopStructures.join('|') + ') (' + conditions.join('|') + '):$'),


        // Possible matches to any of these formats

        // In the form of arrays that have the vital info separated
        // TODO: rewrite this bit to use an array of possible matches, base type of instruction of it, etc
        simpleMatches,
        conditionalMatches,
        loopMatches,
        conditionalBlockMatches,
        loopBlockMatches,

        // Object to contain the parsed command
        output = {};


      // Trim leading and trailing whitespace
      instruction = instruction.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

      simpleMatches           = instruction.match(simple);
      conditionalMatches      = instruction.match(conditional);
      loopMatches             = instruction.match(loop);
      conditionalBlockMatches = instruction.match(conditionalBlock);
      loopBlockMatches        = instruction.match(loopBlock);

      // Select which type of command it is
      if (simpleMatches) { // One liner command

        output.instruction = simpleMatches[1];

      } else if (conditionalMatches) { // One liner conditional + command

        output.control     = conditionalMatches[1];
        output.condition   = conditionalMatches[2];
        output.instruction = conditionalMatches[3];

      } else if (loopMatches) { // One liner condition loop + command

        output.control     = loopMatches[1];
        output.condition   = loopMatches[2];
        output.instruction = loopMatches[3];

      } else if (conditionalBlockMatches) { // Block conditional, continues in later instructions

        output.control      = conditionalBlockMatches[1];
        output.condition    = conditionalBlockMatches[2];
        output.instructions = [];  // To be populated by commands that are part of this block

      } else if (loopBlockMatches) { // Block loop, continues in later instructions

        output.control      = loopBlockMatches[1];
        output.condition    = loopBlockMatches[2];
        output.instructions = []; // To be populated by commands that are part of this block

      } else if (instruction === END) { // Block closer

        output.control = END;

      } else { // Something that wasn't quite right
        throw new ProgramException('Failed to parse instruction: "' + instruction + '"', instruction);
      }

      return output;
    }


    /**
     * Parses the whole plaintext program into a listing we can work with.
     *
     * Recursion ahead!
     *
     * Ensures commands that are blocks have their own instructions listings
     * as an array property.
     *
     * Output looks somewhat like this (arbitrary program):
     *  [
     *    {"control": "UNLESS", "condition": "WALL AHEAD", "instruction": "DRIVE"},
     *    {"control": "UNTIL", "condition": "ON FINISH", "instructions": [
     *        {"control": "IF", "condition": "ON CREDIT", "instruction": "PICK UP CREDIT"},
     *        {"control": "IF", "condition": "WALL AHEAD", "instruction": "TURN RIGHT"},
     *        {"control": "UNLESS", "condition": "WALL AHEAD", "instruction": "DRIVE"}
     *      ]
     *    }
     *  ]
     *
     * @param  {String} textInput newline separated instructions
     * @return {Array} program listing
     */
    function parseProgram(textInput) {
      var
        // Split program into lines
        programLines = textInput.split(/\n|\r/),

        // Iterator
        i = 0;

      function parseBlock() {
        var
          // Begin with an empty list of instructions
          block = [],

          // Store one line of parsed instuction
          parsed = false,

          // Store whether we've reached the end of the block
          end = false;

        while (!end) {
          // Parse an instruction and advance the pointer
          parsed = parseInstruction(programLines[i]);
          i += 1;

          if (parsed.instructions) {
            // parsed instuctions starts a new block of instructions
            // Note the plural.

            // Use recursion to fetch the block of instructions
            // for the one we just parsed.
            parsed.instructions = parseBlock();
          }

          if (parsed.control !== END) {
            // If the parsed instruction is not the end instruction,
            // add it to the list for this block
            block.push(parsed);
          }

          // Both the END instruction and reaching the last line indicate block
          // end.
          end = (parsed.control === END || i >= programLines.length);
        }

        return block;
      }

      return parseBlock();
    }


    /**
     * Execute a given parsed command
     *
     * Employs recursion in case the command has a block of instructions
     *
     * @param  {Object} command
     */
    function execute(command) {
      var
        // To determine whether the instruction(s) of this command should be
        // run at all
        conditionMet = true,

        // Determine whether we're dealing with a loop here
        isLoop = command.control === WHILE || command.control === UNTIL,

        // Iterator.
        i;

      // If there is a condition to this command, figure out whether it's met
      if (command.condition) {

        // Which condition are we dealing with? Consult the correct API
        // endpoint to figure out the result
        switch (command.condition) {
        case ON_CREDIT:
          conditionMet = car.onCredit();
          break;
        case ON_FINISH:
          conditionMet = car.onFinish();
          break;
        case WALL_AHEAD:
          conditionMet = car.isWallAhead();
          break;
        }

        // Check if we're working with a negatory control,
        // if so, invert the result of the condition.
        conditionMet = command.control === UNLESS || command.control === UNTIL ? !conditionMet : conditionMet;
      }

      // If the condition was not met, don't bother with instruction execution
      if (!conditionMet) { return; }


      if (command.instructions) {
        // Prepend this block's instructions to the execution queue
        queue.unshift(command.instructions);
      }

      // Single command, not a block, so figure out what we're meant to do,
      // and use the correct API endpoint to do it.
      // TODO: map this functionality with an object
      switch (command.instruction) {
      case DRIVE:
        car.drive();
        break;
      case TURN_LEFT:
        car.turnLeft();
        break;
      case TURN_RIGHT:
        car.turnRight();
        break;
      case PICK_UP_CREDIT:
        car.pickUpCredit();
        break;
      }

      // If this command is a loop, after executing it, we should start over.
      if (isLoop) {
        queue.push(command);
      }
    }


    /**
     * Queue manager to aid with building delays into recursive execution
     *
     * Lets you push stuff to the end of the queue as well as unshift it to
     * give priority over previously queued commands.
     */
    function Queue(stepDelay) {
      var
        commandQueue = [],
        timeout      = null,
        paused       = false,
        self         = this;


      // Ensure instantiation
      if (this.constructor !== Queue) {
        return new Queue();
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

        if (paused || isEmpty()) { return; }

        execute(commandQueue.shift());
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

      events.trigger('program.queue.initialized');
    }


    /**
     * Steps through a parsed program listing and executes all the commands
     *
     */
    this.run = function () {
      if (!queue.isEmpty()) {
        queue.resume();
      } else {
        queue.clear().push(program);
      }
    };


    this.pause = function () {
      queue.pause();
    };


    /**
     * Clear execution queue, thus stopping the program
     *
     */
    this.stop = function () {
      queue.clear();
    };


    /**
     * Exposes the queue's speed interface
     *
     * @return {Object}
     */
    this.speed = function () {
      return queue.speed();
    };


    /**
     * Initialize the program by parsing a plaintext program
     *
     * @param  {String} programText
     */
    this.init = function (programText) {
      if (queue === undefined) {
        queue = new Queue();
      } else {
        queue.clear();
      }

      program = parseProgram(programText);
    };

  };

}(this.CARGO));
