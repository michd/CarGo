(function (App, $) {

  var
    events = App.eventDispatcher,

    $commandsExecuted = $('#commands-executed'),
    $creditsCollected = $('#credits-collected');


  /**
   * Updates the commands executed display
   *
   * @param  {Number|String} count
   */
  function updateCommandsExecuted(count) {
    $commandsExecuted.text(count);
  }


  /**
   * Updates the credits collected / available display
   *
   * @param  {Number|String} collected Number of credits collected
   * @param  {[type]} available [description]
   * @return {[type]}           [description]
   */
  function updateCredits(collected, available) {
    $creditsCollected.text(collected + '/' + available);
  }

  events.subscribe({
    'game.command-execute-update': updateCommandsExecuted,
    'game.credits-update':         updateCredits
  });

}(this.CARGO, this.jQuery));
