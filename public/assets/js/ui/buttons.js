(function (App, $, document) {
  "use strict";

  // Trigger a ui. event with eventDispatcher when a button with a
  // data-event attribute is clicked
  $(document).on('click', 'button[data-event]', function (event) {
    var
      $target = $(event.target),
      value;

    if ($target.data('value-from')) {
      value = $('#' + $target.data('value-from')).val();
    }

    App.eventDispatcher.trigger('ui.' + $(event.target).data('event'), [value]);
  });

}(this.CARGO, this.jQuery, this.document));