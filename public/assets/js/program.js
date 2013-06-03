(function (App) {

  "use strict";

  var
    // instructions
    DRIVE          = 'DRIVE',
    TURN_LEFT      = 'TURN LEFT',
    TURN_RIGHT     = 'TURN RIGHT',
    PICK_UP_CREDIT = 'PICK UP CREDIT',
    STOP           = 'STOP',

    ON_CREDIT      = 'ON CREDIT',
    ON_FINISH      = 'ON FINISH',
    WALL_AHEAD     = 'WALL AHEAD',

    IF             = 'IF',
    UNLESS         = 'UNLESS',
    WHILE          = 'WHILE',
    UNTIL          = 'UNTIL',

    END            = 'END',

    instructions          = [DRIVE, TURN_LEFT, TURN_RIGHT, PICK_UP_CREDIT, STOP],
    conditions            = [ON_CREDIT, ON_FINISH, WALL_AHEAD],
    conditionalStructures = [IF, UNLESS],
    loopStructures        = [WHILE, UNTIL];

  App.Program = function () {

    var program = [],
      car = App.car;

    if (this.constructor !== App.Program) {
      return new App.Program();
    }

    function parseInstruction(instruction) {
      var
        simple           = new RegExp('^(' + instructions.join('|') + ')$'),
        conditional      = new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '): (' + instructions.join('|') + ')$'),
        loop             = new RegExp('^(' + loopStructures.join('|') + ') (' + conditions.join('|') + '): (' + instructions.join('|') + ')$'),
        conditionalBlock = new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '):$'),
        loopBlock        = new RegExp('^(' + loopStructures.join('|') + ') (' + conditions.join('|') + '):$'),

        simpleMatches           = instruction.match(simple),
        conditionalMatches      = instruction.match(conditional),
        loopMatches             = instruction.match(loop),
        conditionalBlockMatches = instruction.match(conditionalBlock),
        loopBlockMatches        = instruction.match(loopBlock),
        output = {};


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
        output.instructions = [];

      } else if (loopBlockMatches) { // Block loop, continues in later instructions

        output.control      = loopBlockMatches[1];
        output.condition    = loopBlockMatches[2];
        output.instructions = [];

      } else if (instruction === END) {

        output.control = END;

      } else { // Something that wasn't quite right

        return false;

      }
      return output;
    }


    function parseProgram(textInput) {
      var
        arr = textInput.split(/\n|\r/),
        command = false,
        parsed = false,

        listing = [],

        block = [],
        blockInProgress = false,
        i, j;

      function cloneBlock(block) {
        var newBlock = [];
        for (j = 0; j < block.length; j += 1) {
          newBlock.push(block[j]);
        }

        return newBlock;
      }

      for (i = 0; i < arr.length; i += 1) {
        parsed = parseInstruction(arr[i].replace(/^\s\s*/, '').replace(/\s\s*$/, ''));

        if (blockInProgress) {
          if (parsed.control === END) {
            blockInProgress = false;
            command.instructions = cloneBlock(block);
            listing.push(command);
          } else {
            block.push(parsed);
          }
        } else {
          command = parsed;
          if (parsed.instructions) { // BLOCK OPENER
            block = [];
            blockInProgress = true;
            command = parsed;
          } else {
            listing.push(command);
          }
        }
      }

      return listing;
    }


    function execute(command) {
      var
        conditionMet = true,
        i,
        isLoop = command.control === WHILE || command.control === UNTIL;

      if (command.condition) {

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

        conditionMet = command.control === UNLESS || command.control === UNTIL ? !conditionMet : conditionMet;
      }

      if (!conditionMet) { return; }

      if (command.instructions) { //BLOCK
        for (i = 0; i < command.instructions.length; i += 1) {
          execute(command.instructions[i]);
        }
      }

      switch (command.instruction) { // todo: map with an object
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

      if (isLoop) {
        execute(command);
      }
    }

    this.run = function () {
      var i;

      for (i = 0; i < program.length; i += 1) {
        execute(program[i]);
      }
    };

    this.init = function (programText) {
      program = parseProgram(programText);
      console.log(program);
    };

  };

}(this.CARGO));
