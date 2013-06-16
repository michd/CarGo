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
      ProgramException = App.ProgramException,
      lineCount        = 0,

      codeEdited       = true,
      unparsedCode     = '',

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
     * @throws {ProgramException} If instruction matches no instruction type
     * @return {Object} Command object, possibly unfinished if block starter
     */
    function parseInstruction(instruction) {

      var
        // Consts for indicating instruction types
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


      // Trim leading and trailing whitespace, convert to uppercase
      instruction = instruction.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toUpperCase();

      // Find matching instruction type
      for (instructionType in instructionTypes) {
        if (instructionTypes.hasOwnProperty(instructionType)) {
          matches = instruction.match(instructionTypes[instructionType]);

          if (matches) { break; }
        }
      }

      if (!matches) { // No matches found means we failed to parse
        throw new ProgramException(
          'Failed to parse instruction: "' + instruction + '"',
          instruction
        );
      }

      output.plainText = instruction; // For use in showing program progress

      // Build output command objected based on what pattern matched
      switch (instructionType) {

      case SIMPLE:
        output.instruction = matches[1];
        break;

      case CONDITIONAL:
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
        // Split program into lines after trimming whitespace
        programLines = textInput.replace(/^\s\s*/, '').replace(/\s\s*$/, '').split(/\n|\r/),

        // Iterator
        i = 0;


      /**
       * Recursively parse a block of isntructions
       *
       * Iterates over the list of program lines and adds commands to the block
       * array, figures out when the block ends.
       *
       * When a new block opener is encountered, uses recursion
       *
       * @return {Object} command
       */
      function parseBlock() {

        var
          // Begin with an empty list of instructions
          block = [],

          // Store one line of parsed instruction
          parsed = false,

          // Store whether we've reached the end of the block
          end = false;

        while (!end) {
          // Parse an instruction and advance the pointer
          parsed = parseInstruction(programLines[i]);
          i += 1;

          parsed.lineNumber = lineCount += 1;

          if (parsed.instructions) {
            // Starts a new block of instructions
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


      if (programLines.length < 2 && programLines[0] === '') {
        return [];
      }

      return parseBlock();
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
      if (queue.isEmpty()) {
        queue.push(wrapCommand(program, execute));
      }
    }


    /**
     * Parses raw program code, intializing the program for run
     *
     * @param {String} programText Unparsed program code
     * @triggers {program.initialized}
     * @triggers {program.empty} If [program.length === 0]
     */
    function initialize(programText) {
      program = parseProgram(programText);
      events.trigger('program.initialized', [program]);

      if (program.length === 0) {
        events.trigger('program.empty');
      }
    }


    /**
     * Starts running programming, optionally parsing new code first
     *
     * @triggers {error.program} if App.ProgramException caught
     * @triggers {program.run}
     * @triggers {program.reset} if codeEdited
     */
    function startProgram() {

      if (codeEdited) {
        try {
          initialize(unparsedCode);
          codeEdited = unparsedCode === '';
          events.trigger('program.reset');
        } catch (e) {

          program = [];

          if (e instanceof App.ProgramException) {
            events.trigger('error.program', e);
          } else { // Ewww
            throw e;
          }
        }
      }

      events.trigger('program.run', [program]);
      run();
    }


    // Set up event listeners
    events.subscribe({
      'ui.run': startProgram,
      'ui.step': startProgram,

      // Code editor content changed
      'ui.code.edited': function (data) {
        unparsedCode = data;
        codeEdited = true;
      }
    });


    App.program = this;

    // Override constructor (singletonize)
    App.Program = function () {
      App.program = self;
      return self;
    };
  };

}(this.CARGO, this));
