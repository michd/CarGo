(function (App, $) {
  "use strict";

  /**
   * Describes a single cell in the game grid
   *
   * @param  {Array} pos Position coordinates ([x, y])
   * @return {App.Cell}
   */
  App.Cell = function (pos) {

    var
      // The cell DOM element
      $el = $('<div>', {"class": "cell"}),

      // Flags for indicating the status of this cell
      flags = {
        // Car in this cell?
        car:    false,

        // Is this a wall?
        wall:   false,

        // Is this a/the finish?
        finish: false,

        // Is there a credit in this cell?
        credit: false
      };


    // Ensure instantiation
    if (this.constructor !== App.Cell) {
      return new App.Cell(pos);
    }

    /**
     * Updates the cell's class attribute based on the status of our flags
     *
     */
    function updateClasses() {
      $el
          .toggleClass('car',    flags.car)
          .toggleClass('wall',   flags.wall)
          .toggleClass('finish', flags.finish)
          .toggleClass('credit', flags.credit);
    }


    /**
     * Retrieve the coordinates of this cell in the grid
     *
     * @return {Array} ([x, y])
     */
    this.getPos = function () {
      return pos;
    };


    /**
     * Retrieve the actual cell DOM element
     *
     * @return {HtmlDivElement}
     */
    this.getElement = function () {
      return $el[0];
    };


    /**
     * Detect whether or not this cell contains wall
     *
     * @return {Boolean}
     */
    this.isWall = function () {
      return flags.wall;
    };


    /**
     * Detect whether or not this cell is a/the finish
     *
     * @return {Boolean}
     */
    this.isFinish = function () {
      return flags.finish;
    };


    /**
     * Detect whether or not this cell has a credit in it
     *
     * @return {Boolean}
     */
    this.hasCredit = function () {
      return flags.credit;
    };


    /**
     * Attempt to pick up a credit from this cell and report how this went
     *
     * If it was succesful, the credit flag will be set to false.
     *
     * @return {Boolean} True if succesful, false if not.
     */
    this.takeCredit = function () {
      if (flags.credit) {
        flags.credit = false;
        updateClasses();
        return true;
      }
      return false;
    };


    /**
     * Toggle one of the given flags or an arbitrary flag
     *
     * If it is an arbitrary flag, it will be toggled directly as a class
     * on the DOM element
     *
     * @param  {String} flag Name of the flag to be toggled
     * @param  {Boolean} on Whether or not it should be on, flip if unspecified
     * @return {App.Cell} self
     */
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

}(this.CARGO, this.jQuery));
