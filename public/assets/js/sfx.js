(function (App, document, global) {
  "use strict";

  var
    samples = {
      'start':     '/assets/wav/start.wav',
      'drive':     '/assets/wav/drive.wav',
      'turn':      '/assets/wav/turn.wav',
      'collision': '/assets/wav/collision.wav',
      'credit':    '/assets/wav/credit.wav',
      'finish':    '/assets/wav/finish.wav'
    },

    players = {},

    timeouts = {},

    sample, player,

    events = App.eventDispatcher;

  // Init players
  for (sample in samples) {
    if (samples.hasOwnProperty(sample)) {
      timeouts[sample] = null;
      player = players[sample] = document.createElement('audio');
      player.src = samples[sample];
      player.volume = 0.8;
      player.preload = "auto";
      player.autobuffer = "autobuffer";
    }
  }

  function stopAll() {
    var player;

    for (player in players) {
      if (players.hasOwnProperty(player)) {
        clearTimeout(timeouts[player]);
        players[player].pause();
      }
    }
  }

  function play(sampleName, allowRestart, solo) {
    var
      player = players[sampleName],
      otherPlayer;

    if (!player) { return; }

    clearTimeout(timeouts[sampleName]);

    if (!player.paused && !allowRestart) {
      timeouts[sampleName] = setTimeout(function () {
        play(sampleName);
      }, 50);
      return;
    }

    for (otherPlayer in players) {
      if (players.hasOwnProperty(otherPlayer) && players[otherPlayer] !== player) {
        if (solo) {
          players[otherPlayer].pause();
        }
        clearTimeout(timeouts[otherPlayer]);
        timeouts[otherPlayer] = null;
      }
    }

    try {
      player.currentTime = 0;
    } catch (e) {
      // no shits given?
    }
    player.play();
  }

  events.subscribe({
    'program.initialized': function () {
      play('start');
    },

    'drive': function () {
      play('drive');
    },

    'turn-left': function () {
      play('turn', true);
    },

    'turn-right': function () {
      play('turn', true);
    },

    'collision': function () {
      play('collision', true);
    },

    'credit-picked-up': function () {
      play('credit', true);
    },

    'reached-finish': function () {
      play('finish', false, true);
    },

    'ui.sound.stopall': stopAll
  });

}(this.CARGO, this.document, this));