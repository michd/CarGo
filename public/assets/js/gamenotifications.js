(function (App, $) {
  "use strict";

  // Listen for important game-related events and show notifications for them

  var
    events = App.eventDispatcher,
    notify = App.ui.notify;

  /**
   * Strip some basic HTML characters
   *
   * @param  {String} str unsanitized
   * @return {String}
   */
  function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }


  events.subscribe({
    // Program failed to parse
    'error.parser': function (error) {
      notify.error(
        'Error: Failed to parse the following instruction: <pre><code>' + htmlEntities(error.instruction) + '</code></pre>',
        'program'
      );
    },

    // Tried to run program before adding code
    'parser.program-empty': function () {
      notify.warning('You have to write a program before the Run button will do anything!', 'program');
    },

    // ...Yeah.
    'reached-finish': function () {
      notify.success('Good job! You\'ve reached the finish!', 'program');
    },

    // Clicked run button, clear program-related notifications
    'ui.run': function () {
      notify.clear('program');
    },

    'ui.step': function () {
      notify.clear('program');
    },

    'ui.reset': function () {
      notify.clear('program');
    }

  });
}(this.CARGO, this.jQuery));