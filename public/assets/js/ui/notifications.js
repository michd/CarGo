(function (App, $, document) { // Flash notifications
  "use strict";

  var
    NOTICE  = 'notice',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR   = 'error',

    $container = $('#flash-messages'),

    ui = App.namespace('ui'),
    helpers = [NOTICE, SUCCESS, WARNING, ERROR],
    i;

  ui.notify = function (message, type) {

    var $notification;

    type = type || NOTICE;

    $notification = $('<div>', {'class': 'flashmsg'})
        .addClass(type)
        .html(message)
        .hide();
    $container.prepend($notification);
    return $notification.slideDown(150, 'swing');

  };

  function createHelper(type) {
    ui.notify[type] = function (message) {
      return ui.notify(message, type);
    };
  }

  // Set up some shorthands for the notification types in helpers
  for (i = 0; i < helpers.length; i += 1) {
    createHelper(helpers[i]);
  }

  ui.notify.clear = function () {
    $container.find('.flashmsg')
        .slideUp(150, 'swing', function () { $(this).remove(); });
  };

  $(document).on('click', '.flashmsg', function () {
    $(this).slideUp(150, 'swing', function () { $(this).remove(); });
  });

}(this.CARGO, this.jQuery, this.document));
