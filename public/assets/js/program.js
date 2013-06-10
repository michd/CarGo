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

    if (instruction !== undefined) {
      this.instruction = instruction;
    }
  };


  /**
   * Parses an executes the program written by the user
   *
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
      ProgramException = App.ProgramException,
      lineCount        = -1,

      self             = this;


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
        // consts for indicating instruction types
        SIMPLE            = 'simple',
        CONDITIONAL       = 'conditional',
        CONDITIONAL_BLOCK = 'conditionalBlock',
        BLOCK_ENDER       = 'blockEnder',

        // Regexes of instruction line types
        instructionTypes = {
          simple:           new RegExp('^(' + instructions.join('|') + ')$'),
          conditional:      new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '): (' + instructions.join('|') + ')$'),
          conditionalBlock: new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '):$'),
          blockEnder:       new RegExp('^' + END + '$')
        },

        instructionType,
        matches,
        i,

        // Object to contain the parsed command
        output = {};


      // Trim leading and trailing whitespace
      instruction = instruction.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toUpperCase();

      // Find matching instruction type
      for (instructionType in instructionTypes) {
        if (instructionTypes.hasOwnProperty(instructionType)) {
          matches = instruction.match(instructionTypes[instructionType]);

          if (matches) { break; }
        }
      }

      if (!matches) { // No matches found means we failed to parse
        throw new ProgramException('Failed to parse instruction: "' + instruction + '"', instruction);
      }

      output.plainText = instruction;

      // Build output command objected based on what pattern matched
      switch (instructionType) {

      case SIMPLE:
        output.instruction = matches[1];
        break;

      case CONDITIONAL: // Intentional fallthrough
        output.instruction = matches[3];
        break;

      case CONDITIONAL_BLOCK:
        output.instructions = [];
        break;

      case BLOCK_ENDER:
        output.control = END;
        break;
      }

      if ([CONDITIONAL, CONDITIONAL_BLOCK].indexOf(instructionType) > -1) {
        output.control   = matches[1];
        output.condition = matches[2];
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
        programLines = textInput.replace(/^\s\s*/, '').replace(/\s\s*$/, '').split(/\n|\r/),

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

          parsed.lineNumber = lineCount += 1;

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
      lineCount += 1;

      if (programLines.length < 2 && programLines[0] === '') {
        return [];
      }

      return parseBlock();
    }


    /**
     * Wraps command objects in execute-calling function objects
     *
     * Works with arrays of commands too
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

      events.trigger('program.executing', command.lineNumber);

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
        var block = command.instructions.slice();

        if (isLoop) {
          block.push(command);
        }
        queue.unshift(wrapCommand(block, execute));
      } else {
        if (isLoop) {
          queue.unshift(wrapCommand(command, execute));
        }
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
    }


    /**
     * Steps through a parsed program listing and executes all the commands
     *
     */
    this.run = function () {
      if (queue.isEmpty()) {
        queue.push(wrapCommand(program, execute));
      }
    };


    /**
     * Initialize the program by parsing a plaintext program
     *
     * @param  {String} programText
     */
    this.init = function (programText) {
      program = parseProgram(programText);
      events.trigger('program.initialized', program);

      if (program.length === 0) {
        events.trigger('program.empty');
      }
    };


    // Set up event listeners
    (function () {
      var
        codeEdited = true,
        unparsedCode = '';

      function startProgram() {
        if (codeEdited) { // If code has changed, parse the updated program

          try {
            self.init(unparsedCode);
            codeEdited = unparsedCode === '';
          } catch (e) {

            program = [];
            if (e instanceof App.ProgramException) {
              events.trigger('error.program', e);
            } else { // Ewww
              throw e;
            }
          }
        }

        events.trigger('program.run', program);
        self.run();
      }

      events.subscribe({
        // Todo: clean up needlessly public interfaces
        'ui.run': startProgram,
        'ui.step': startProgram,
        // Code editor content changed
        'ui.code.edited': function (data) {
          unparsedCode = data;
          codeEdited = true;
        }
      });

    }());


    App.program = self;

    // Override constructor (singletonize)
    App.Program = function () {
      App.program = self;
      return self;
    };
  };

}(this.CARGO, this));
