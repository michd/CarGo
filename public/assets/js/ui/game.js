(function (App, $) {

  var
    events = App.eventDispatcher,

    $score = $('#score'),
    $creditsCollected = $('#credits-collected');

  function updateScore(points) {
    $score.text(points);
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
    'game.score-update': updateScore,
    'game.credits-update':         updateCredits
  });

}(this.CARGO, this.jQuery));
