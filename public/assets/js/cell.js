(function (global, App, $) {

  App.Cell = function (pos) {

    var
      $el = $('<div>', {"class": "cell"}),
      flags = {
        car: false,
        wall:   false,
        finish: false,
        credit: false,
        direction: null
      };

    if (this.constructor !== App.Cell) {
      return new App.Cell(pos);
    }

    function updateClasses() {
      $el
          .toggleClass('car',    flags.car)
          .toggleClass('wall',   flags.wall)
          .toggleClass('finish', flags.finish)
          .toggleClass('credit', flags.credit);
    }

    this.getPos = function () {
      return pos;
    };

    this.getElement = function () {
      return $el[0];
    };

    this.isWall = function () {
      return flags.wall;
    };

    this.isFinish = function () {
      return flags.finish;
    };

    this.hasCredit = function () {
      return flags.credit;
    };

    this.takeCredit = function () {
      if (flags.credit) {
        flags.credit = false;
        return true;
      }
      return false;
    };

    this.toggleFlag = function (flag, on) {
      if (flags[flag] !== undefined) {
        flags[flag] = on !== undefined ? !!on : !flags[flag];
        updateClasses();
      } else {
        $el.toggleClass(flag, on);
      }
      return this;
    };
  };

}(this, this.CARGO, this.jQuery));
