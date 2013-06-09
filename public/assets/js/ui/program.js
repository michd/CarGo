(function (App, $, global) {
  "use strict";

  var
    INDENT_CHARS = "  ",
    ui     = App.namespace('ui'),
    events = App.eventDispatcher,
    $programProgress = $('#program-progress'),
    programLines = [],
    lastProgram = [];

  function indent(text, depth) {
    var
      spaces = '',
      i;

    while (depth--) {
      spaces += INDENT_CHARS;
    }
    return spaces + text;
  }

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
    }
    return commandText;
  }

  function programToLines(program) {
    return commandToText(program).split("\n");
  }

  function populateProgramProgress(program) {
    var
      textLines = programToLines(program),
      $line,
      i;

    if (program === lastProgram) { return; }

    $programProgress.html('').text('');
    programLines = [];

    for (i = 0; i < textLines.length; i += 1) {
      $line = $('<span>', {"class": "line"}).html(textLines[i]);
      programLines.push($line);
      $programProgress.append($line, "\n");
    }

    lastProgram = program;
  }

  function highlightLine(lineNumber) {
    $programProgress.find('.line').removeClass('active');
    $(programLines[lineNumber - 1]).addClass('active');
  }

  function toggleProgramProgress(on) {
    on = on === undefined ? !$programProgress.is(':visible') : on;
    $programProgress.toggle(on);
    $('#program-input').toggle(!on);
  }

  events.subscribe({
    'program.run': function (program) {

      populateProgramProgress(program);
      toggleProgramProgress(true);
    },
    'program.executing': highlightLine,
    'ui.reset': function () {
      toggleProgramProgress(false);
    },
    'queue.empty': function () {
      toggleProgramProgress(false);
    }
  });

}(this.CARGO, this.jQuery, this));
