(function (App, $, document) {
  "use strict";

  // Trigger a ui. event with eventDispatcher when a button with a
  // data-event attribute is clicked
  $(document).on('click', 'button[data-event]', function (event) {
    App.eventDispatcher.trigger('ui.' + $(event.target).data('event'));
  });

}(this.CARGO, this.jQuery, this.document));