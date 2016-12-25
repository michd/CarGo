(function (App) {

  var events = App.eventDispatcher;

  /**
   * Custom exception for things that go wrong in parsing a program
   *
   * @param  {String} message
   * @param  {String} instruction Line of code where it went wrong
   * @return {App.ProgramException}
   */
  App.ParserException = function (message, instruction) {

    // Ensure instantiation
    if (this.constructor !== App.ParserException) {
      return new App.ParserException(message, instruction);
    }

    this.name = "CarGo ParserException";
    this.message = message;
    this.instruction = instruction;
  };


  /**
   * Singleton concerning itself with parsing text programs and returning useful
   * command listings
   *
   * Singleton with public interface
   *
   * @return {App.Parser}
   */
  App.Parser = function () {

    var

      // # Constants

      // ## Instruction types
      SIMPLE            = 'simple',
      CONDITIONAL       = 'conditional',
      CONDITIONAL_BLOCK = 'conditionalBlock',
      BLOCK_ENDER       = 'blockEnder',

      // ## Language keywords

      // ### Simple instructions
      DRIVE           = 'DRIVE',
      TURN_LEFT       = 'TURN LEFT',
      TURN_RIGHT      = 'TURN RIGHT',
      PICK_UP_CREDIT  = 'PICK UP CREDIT',
      STOP            = 'STOP',

      // ### Conditions (car sensors)
      ON_CREDIT       = 'ON CREDIT',
      ON_FINISH       = 'ON FINISH',
      WALL_AHEAD      = 'WALL AHEAD',

      // ### Control structures
      IF              = 'IF',
      UNLESS          = 'UNLESS',
      WHILE           = 'WHILE',
      UNTIL           = 'UNTIL',

      // ### Block terminator
      END             = 'END',


      // # Categories of keywords, used in parsing instructions

      instructions = [
        DRIVE,
        TURN_LEFT,
        TURN_RIGHT,
        PICK_UP_CREDIT,
        STOP
      ],

      conditions = [
        ON_CREDIT,
        ON_FINISH,
        WALL_AHEAD
      ],

      conditionalStructures = [
        IF,
        UNLESS,
        WHILE,
        UNTIL
      ],

      loopStructures = [
        WHILE,
        UNTIL
      ],

      // # Regular expressions of instruction types, based on the keyword arrays
      instructionTypes = (function () {
        var regexes = {};

        regexes[SIMPLE] = new RegExp(
          ['^(', instructions.join('|'), ')$'].join('')
        );

        regexes[CONDITIONAL] = new RegExp(
          [
            '^',
            '(', conditionalStructures.join('|'), ') ',
            '(', conditions.join('|'), '): ',
            '(', instructions.join('|'), ')',
            '$'
          ].join('')
        );

        regexes[CONDITIONAL_BLOCK] = new RegExp(
          [
            '^',
            '(' + conditionalStructures.join('|') + ') ',
            '(' + conditions.join('|') + '):',
            '$'
          ].join('')
        );

        regexes[BLOCK_ENDER] = new RegExp(['^', END, '$'].join(''));

        return regexes;

      }()),


      // # Shorthand
      ParserException = App.ParserException,

      edited = true,

      // Raw code, straight from the input field, updated whenever the
      // change even on said field fires
      rawCode           = '',
      // Cache unparsed lines and parsed program, to avoid re-parsing the same
      // things
      lastUnparsedLines = [],
      parsedProgram     = [],

      // Counts the number of commands/condition checks while parsing
      numCommands = 0,

      // Self-reference (comment referencing the self-reference of code, while referring to itself in parentheses)
      self              = this;


    // Ensure instantiation
    if (this.constructor !== App.Parser) {
      return new App.Parser();
    }


    /**
     * Strips leading and trailing whitespace, converts to uppercase
     *
     * @param  {String} instruction
     * @return {String}
     */
    function normalizeInstruction(instruction) {
      return instruction.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toUpperCase();
    }


    /**
     * Parses a single text line of instruction into a command object program.js
     * can work with.
     *
     * @param  {String} instruction Raw, plaintext instruction
     * @throws {ParserException} If instruction matches no instruction type
     * @return {Object} Command object, possibly unfinished if block starter
     */
    function parseInstruction(instruction) {

      var
        instructionType,
        matches,
        i,
        output = {},
        cleanInstruction = normalizeInstruction(instruction);


      // Find matching instruction type
      for (instructionType in instructionTypes) {
        if (instructionTypes.hasOwnProperty(instructionType)) {
          // Match instruction agains the current instruction type
          matches = cleanInstruction.match(instructionTypes[instructionType]);

          if (matches) {
            // If we've got a match, terminate the loop
            break;
          }
        }
      }

      if (!matches) { // No matches = parse error
        throw new ParserException(
          'Failed to parse instruction',
          instruction
        );
      }

      // For use in showing program progress
      output.plainText = cleanInstruction;

      // Build output comman object based on which pattern matched
      switch (instructionType) {

      case SIMPLE:
        output.instruction = matches[1];
        numCommands++;
        break;

      case CONDITIONAL:
        output.instruction = matches[3];
        numCommands += 2;
        break;


      case CONDITIONAL_BLOCK:
        output.instructions = [];
        numCommands += 1;
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
     * Trims leading and trailing whitespace, splits into lines
     *
     * @param  {String} programText Multi-line string of program code
     * @return {Array}  Array of lines
     */
    function normalizeProgramText(programText) {
      var
        trimmedText = programText.replace(/^\s\s*/, '').replace(/\s\s*$/, ''),
        lines       = trimmedText.split(/\n|\r/);

      if (lines.length < 2 && (lines[0] || '') === '') {
        return [];
      }

      return lines;
    }


    /**
     * Detect whether the program input is identical to the last parsed program
     *
     * @param  {Array}  unparsedLines
     * @return {Boolean}
     */
    function isSameAsLastProgram(unparsedLines) {
      var i;

      if (unparsedLines.length !== lastUnparsedLines.length) {
        return false;
      }

      for (i = 0; i < unparsedLines.length; i += 1) {
        if (normalizeInstruction(unparsedLines[i]) !== normalizeInstruction(lastUnparsedLines[i])) {
          return false;
        }
      }

      return true;
    }


    /**
     * Clears any flags or memory of previously loaded programs
     *
     */
    function clearCache() {
      edited = true;
      lastUnparsedLines = [];
      parsedProgram = [];
      numCommands = 0;
    }


    /**
     * Parses the whole plaintext program into a listing we can work with.
     *
     * Recursion ahead!
     *
     * Ensures commands that are blocks have their own instruction listings
     * nested as a property (instructions)
     *
     * @param  {String} programText Newline-separated list of instructions
     * @triggers {parser.program-parsed} If program parsed succesfully
     * @triggers {parser.program-empty} If parsed program is empty
     * @return {Array}  Parsed list of commands, possibly nested
     */
    function parseProgram(programText) {
      var
        unparsedLines = normalizeProgramText(programText),
        i = 0,
        lineCount = 0;

      // Avoid re-parsing
      if (!edited || isSameAsLastProgram(unparsedLines)) {
        if (parsedProgram.length === 0) {
          events.trigger('parser.program-empty');
        }
        return parsedProgram;
      }

      numCommands = 0;


      /**
       * Parses the next line in the listing and increments the line pointer
       *
       * @return {Object} the parsed instruction
       */
      function parseNextLine() {
        var parsed = parseInstruction(unparsedLines[i]);
        i += 1;
        parsed.lineNumber = lineCount += 1;
        return parsed;
      }


      /**
       * Recursively parses a block of instructions
       *
       * Iterates over the list of unparsedLines,
       * adds commands to the block array,
       * figures out when the block ends.
       *
       * When a new block opener is encountered, uses recursion to populate
       * that block.
       *
       * @return {Array} Array of commands (possibly with nested blocks)
       */
      function parseBlock() {
        var
          block      = [], // List of instructons for this block
          parsed     = '', // Stores one line of parsed instruction
          endReached = false; // Flag set when we reach the end of the block

        while (!endReached) {
          parsed = parseNextLine();

          if (parsed.instructions) {
            // Starts a new block of instructions, note the plural.

            // Use recursion to populate this command's block
            parsed.instructions = parseBlock();
          }

          if (parsed.control !== END) {
            // If the parsed instruction is not the end instruction,
            // add it to the list for this block
            block.push(parsed);
          }

          // Both the END instruction and reach the last line indicate
          // block end.
          endReached = (parsed.control === END || i >= unparsedLines.length);
        }

        return block;
      }

      // Store to avoid re-parsing the same program
      lastUnparsedLines = unparsedLines;

      try {
        parsedProgram = parseBlock();
      } catch (e) {

        if (e.constructor === ParserException) {
          events.trigger('error.parser', e);
          clearCache();
          return;
        }

        throw e; // Eww
      }

      edited = false;

      events.trigger('parser.program-parsed', [parsedProgram, numCommands]);

      if (parsedProgram.length === 0) {
        events.trigger('parser.program-empty');
      }

      return parsedProgram;
    }


    events.subscribe('ui.code.edited', function (newRawCode) {
      edited  = true;
      rawCode = newRawCode;
    });

    events.subscribe('ui.run', function () {
      parseProgram(rawCode);
    }, 10); // Prioritize

    events.subscribe('ui.step', function () {
      parseProgram(rawCode);
    }, 10); // Prioritize


    // Singletonize
    App.parser = self;

    App.Parser = function () {
      App.parser = self;
      return self;
    };

  };

  App.parser = new App.Parser();

}(this.CARGO));
