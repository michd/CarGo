(function (App, $, document) {

  var eventDispatcher = App.eventDispatcher;

  $(document).on('click', 'button[data-event]', function (event) {
    var
      events = $(event.target).data('event').split(/,\s*/),
      i;

    for (i = 0; i < events.length; i += 1) {
      eventDispatcher.trigger('ui.' + events[i]);
    }
  });

}(this.CARGO, this.jQuery, this.document));