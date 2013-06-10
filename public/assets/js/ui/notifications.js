(function (App, $, document) {
  "use strict";

  var
    // Types of notification messages
    NOTICE  = 'notice',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR   = 'error',

    $container = $('#flash-messages'), // Where the messages will be inserted

    ui = App.namespace('ui'),
    helpers = [NOTICE, SUCCESS, WARNING, ERROR],
    i;

  /**
   * Show a notification message
   *
   * @param  {String|jQuery} message
   * @param  {String} type used as class attribute, notice|success|warning|error
   * @param  {String} additionalClass Additional class unrelated to message type
   * @return {jQuery} The notification element inserted in the DOM
   */
  ui.notify = function (message, type, additionalClass) {

    var $notification;

    type = type || NOTICE;

    $notification = $('<div>', {'class': 'flashmsg'})
        .addClass(type)
        .append(message)
        .hide();

    if (additionalClass) {
      $notification.addClass(additionalClass);
    }

    $container.prepend($notification);
    return $notification.slideDown(150, 'swing');

  };

  /**
   * Creates shorthand functions to access the types of notifications
   *
   * These helpers will be accessible as properties of the notify function,
   * usable at ui.notify.<helper>(message)
   *
   * @param  {String} type notification type and helper name
   */
  function createHelper(type) {
    ui.notify[type] = function (message, additionalClass) {
      return ui.notify(message, type, additionalClass);
    };
  }

  // Set up some shorthands for the notification types in helpers
  for (i = 0; i < helpers.length; i += 1) {
    createHelper(helpers[i]);
  }

  /**
   * Removes all notifications from the notification area, optionally only with
   * a certain class
   *
   * @param  {String} withClass Notification class filter to use
   */
  ui.notify.clear = function (withClass) {
    var $messages = $container.find('.flashmsg');

    if (withClass) {
      $messages = $messages.filter('.' + withClass);
    }

    $messages.slideUp(150, 'swing', function () { $(this).remove(); });
  };

  // Dismiss notification messages on click
  $(document).on('click', '.flashmsg', function () {
    $(this).slideUp(150, 'swing', function () { $(this).remove(); });
  });

}(this.CARGO, this.jQuery, this.document));
