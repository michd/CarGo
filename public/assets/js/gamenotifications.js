(function (App, $) {
  "use strict";

  var
    events = App.eventDispatcher,
    notify = App.ui.notify;

  function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  events.subscribe({
    'error.program': function (error) {
      notify.error(
        'Error: Failed to parse the following instruction: <pre><code>' + htmlEntities(error.instruction) + '</code></pre>',
        'program'
      );
    },

    'program.empty': function () {
      notify.warning('You have to write a program before the Run button will do anything!', 'program');
    },

    'reached-finish': function () {
      notify.success('Good job! You\'ve reached the finish!', 'program');
    },

    'ui.program.run': function () {
      notify.clear('program');
    }
  });
}(this.CARGO, this.jQuery));