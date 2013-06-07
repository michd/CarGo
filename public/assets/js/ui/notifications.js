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

  ui.notify = function (message, type, additionalClass) {

    var $notification;

    type = type || NOTICE;

    $notification = $('<div>', {'class': 'flashmsg'})
        .addClass(type)
        .html(message)
        .hide();

    if (additionalClass) {
      $notification.addClass(additionalClass);
    }

    $container.prepend($notification);
    return $notification.slideDown(150, 'swing');

  };

  function createHelper(type) {
    ui.notify[type] = function (message, additionalClass) {
      return ui.notify(message, type, additionalClass);
    };
  }

  // Set up some shorthands for the notification types in helpers
  for (i = 0; i < helpers.length; i += 1) {
    createHelper(helpers[i]);
  }

  ui.notify.clear = function (withClass) {
    var $messages = $container.find('.flashmsg');

    if (withClass) {
      $messages = $messages.filter('.' + withClass);
    }

    $messages.slideUp(150, 'swing', function () { $(this).remove(); });
  };

  $(document).on('click', '.flashmsg', function () {
    $(this).slideUp(150, 'swing', function () { $(this).remove(); });
  });

}(this.CARGO, this.jQuery, this.document));
