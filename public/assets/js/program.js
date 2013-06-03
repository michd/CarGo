(function (App) {

    "use strict";

    var
        // instructions
        DRIVE          = 'DRIVE',
        TURN_LEFT      = 'TURN LEFT',
        TURN_RIGHT     = 'TURN RIGHT',
        PICK_UP_CREDIT = 'PICK UP CREDIT',

        ON_CREDIT      = 'ON CREDIT',
        WALL_AHEAD     = 'WALL AHEAD',

        IF             = 'IF',
        UNLESS         = 'UNLESS',
        REPEAT         = 'REPEAT',

        instructions          = [DRIVE, TURN_LEFT, TURN_RIGHT, PICK_UP_CREDIT],
        conditions            = [ON_CREDIT, WALL_AHEAD],
        conditionalStructures = [IF, UNLESS],
        loopStructures        = [REPEAT];

    App.Program = function () {

        var program = [],
            car = App.car;

        if (this.constructor !== App.Program) {
            return new App.Program();
        }

        function parseInstruction(instruction) {
            var
                simple = new RegExp('^(' + instructions.join('|') + ')$'),
                conditional = new RegExp('^(' + conditionalStructures.join('|') + ') (' + conditions.join('|') + '): (' + instructions.join('|') + ')$'),
                simpleMatches = instruction.match(simple),
                conditionalMatches = instruction.match(conditional),
                output = {};

            if (simpleMatches) {
                output.instruction = simpleMatches[1];
            } else if (conditionalMatches) {
                output.control = conditionalMatches[1];
                output.condition = conditionalMatches[2];
                output.instruction = conditionalMatches[3];
            } else {
                return false;
            }
            return output;
        }

        function parseProgram(textInput) {
            var
                arr = textInput.split(/\n|\r/),
                command = false,
                commands = [],
                i;

            for (i = 0; i < arr.length; i += 1) {
                command = parseInstruction(arr[i].replace(/([^\s]+)(\s+)$/, "$1"));
                if (command) {
                    commands.push(command);
                }
            }

            return commands;
        }


        function execute(command) {
            var conditionMet = true;

            if (command.condition) {

                switch (command.condition) {
                case ON_CREDIT:
                    conditionMet = car.onCredit();
                    break;
                case WALL_AHEAD:
                    conditionMet = car.isWallAhead();
                    break;
                }

                conditionMet = command.control === UNLESS ? !conditionMet : conditionMet;
            }

            if (!conditionMet) { return; }

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
