(function (App, $, global) {
  "use strict";

  // This component converts a parsed program back to text, with the purpose
  // of displaying the currently active line during execution.

  var
    // Characters to insert before the line for each indent
    INDENT_CHARS = "  ",

    ui     = App.namespace('ui'),
    events = App.eventDispatcher,
    $programProgress = $('#program-progress'),
    $programInput    = $('#program-input'),
    programLines = [],
    lastProgram = [];


  /**
   * Adds indentation to a single line of code
   *
   * @param  {String} text  Unindented LOC
   * @param  {Number} depth Indentation level
   * @return {String} Indented text
   */
  function indent(text, depth) {
    var indentation = '';

    while (depth--) {
      indentation += INDENT_CHARS;
    }
    return indentation + text;
  }


  /**
   * Recursively converts a command object to newline-separated lines of code
   *
   * Uses indent to get sub-blocks indented right
   *
   * @param  {Object|Array} command One command object or array of 'em
   * @param  {Number} depth Block depth of this command
   * @return {String}
   */
  function commandToText(command, depth) {
    var
      commandText = "",
      i;

    depth = depth || 0;

    commandText = (command instanceof Array) ?
        "" :
        indent(command.plainText, depth);

    if (command.instructions && command.instructions.length > 0) {
      commandText += "\n";
      for (i = 0; i < command.instructions.length; i += 1) {
        commandText += commandToText(command.instructions[i], depth + 1) +  "\n";
      }
      commandText += indent("END", depth);

    } else if (command instanceof Array) { // Account for arrays of commands

      for (i = 0; i < command.length; i += 1) {
        commandText += commandToText(command[i], depth) + "\n";
      }
    }

    return commandText;
  }


  /**
   * Converts a structured parsed program to an array of lines of code
   *
   * @param  {Object} program
   * @return {Array}
   */
  function programToLines(program) {
    return commandToText(program).split("\n");
  }


  /**
   * Generate the DOM elements for the program progress UI module
   *
   * Skips of program appears to be unchanged
   *
   * @param  {Object} program Structured, parsed program
   */
  function populateProgramProgress(program) {
    var
      textLines = programToLines(program),
      $line,
      i;

    // If unchanged, don't bother
    if (program === lastProgram) { return; }

    // Clear the module first
    $programProgress.html('').text('');

    // Store the jQuery line objects in an array for line-number-based access
    programLines = [];

    for (i = 0; i < textLines.length; i += 1) {
      $line = $('<span>', {"class": "line"}).html(textLines[i]);
      programLines.push($line);
      $programProgress.append($line, "\n");
    }

    // Store the program we've just drawn to check for changes
    lastProgram = program;
  }


  /**
   * Highlights the current line
   *
   * @param  {Number} lineNumber
   */
  function highlightLine(lineNumber) {
    $programProgress.find('.line').removeClass('active');
    $(programLines[lineNumber - 1]).addClass('active');
  }


  /**
   * Toggle between program progress module and program input module
   *
   * If no on value is provided, it will flip the current state
   *
   * @param  {Boolean} on
   */
  function toggleProgramProgress(on) {
    on = on === undefined ? !$programProgress.is(':visible') : !!on;
    $programProgress.toggle(on);
    $programInput.toggle(!on);
  }


  // Subscribe to relevant events
  events.subscribe({

    // Program began running / stepping
    'program.run': function (program) {
      populateProgramProgress(program);
      toggleProgramProgress(true);
    },

    // A command got executed
    'program.executing': highlightLine,

    // Reset button clicked
    'ui.reset': function () {
      toggleProgramProgress(false);
    },

    // Program completed
    'queue.empty': function () {
      toggleProgramProgress(false);
    }
  });

}(this.CARGO, this.jQuery, this));
