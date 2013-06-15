(function (global, App) {
  "use strict";

  var events = App.eventDispatcher;

  /**
   * Controls the car in the game grid
   *
   * Coupled pretty tightly with App.Cell and App.Grid
   *
   * @param    {App.Cell} startCell
   * @param    {String} startDirection Direction to be pointed at u|d|l|r
   * @param    {App.Grid} grid
   * @triggers {drive}
   * @triggers {collission}
   * @triggers {reached-finish}
   * @triggers {credit-picked-up}
   * @triggers {credit-failed}
   * @triggers {turn-left}
   * @triggers {turn-right}
   * @triggers {car-init}
   * @return   {App.Car}
   */
  App.Car = function (startCell, startDirection, grid) {

    var
      // Direction constants for more descriptive use
      UP    = 'u',
      DOWN  = 'd',
      LEFT  = 'l',
      RIGHT = 'r',
      DIRECTIONS = [UP, RIGHT, DOWN, LEFT], // Keep in this order for turn function

      currentCell = startCell,
      direction = startDirection,
      self = this;

    // Ensure instantiation
    if (this.constructor !== App.Car) {
      return new App.Car(startCell, startDirection, grid);
    }

    // Set the start cell up with the relevant car flags
    startCell.toggleFlag('car', true).toggleFlag(direction, true);


    /**
     * Based on the direction the car is currently facing, retrieve the cell
     * ahead of the current one
     *
     * @return {App.Cell|Boolean} Either a Cell instance or false if no cell
     */
    function getCellAhead() {

      var
        aX = currentCell.getPos()[0],
        aY = currentCell.getPos()[1];

      // Determine coordinates based on current location
      switch (direction) {
      case UP:
        aY -= 1;
        break;
      case DOWN:
        aY += 1;
        break;
      case LEFT:
        aX -= 1;
        break;
      case RIGHT:
        aX += 1;
        break;
      }

      return grid.getCell([aX, aY]);
    }


    /**
     * Update the cell we're in's direction flags
     *
     */
    function updateDirection() {
      currentCell
        .toggleFlag(DIRECTIONS.join(' '), false)
        .toggleFlag(direction, true);
    }


    /**
     * Turns the car either left or right
     *
     * Works by selecting next or previous direction from the DIRECTIONS array
     *
     * @param  {String} where [LEFT|RIGHT]
     */
    function turn(where) {
      var
        curDirIndex = DIRECTIONS.indexOf(direction),
        newDirIndex = curDirIndex + (where === RIGHT ? 1 : -1);

      if (newDirIndex >= DIRECTIONS.length) { newDirIndex = 0; }
      if (newDirIndex < 0) { newDirIndex = DIRECTIONS.length - 1; }

      direction = DIRECTIONS[newDirIndex];
      updateDirection();
    }


    // Sensors

    /**
     * Detect whether the cell forward (keeping in mind direction) is a wall
     *
     * @return {Boolean}
     */
    this.isWallAhead = function () {
      var cellAhead = getCellAhead();

      return cellAhead ? cellAhead.isWall() : true;
    };


    /**
     * Detect whether the cell currently occupied has a credit in it
     *
     * @return {Boolean}
     */
    this.onCredit = function () {
      return currentCell.hasCredit();
    };


    /**
     * Detect whether the cell currently occupied is the finish
     *
     * @return {Boolean}
     */
    this.onFinish = function () {
      return currentCell.isFinish();
    };


    // Actions

    /**
     * Attempt to drive forward (in the current direction) one cell
     *
     * @triggers {drive}          If no wall ahead
     * @triggers {collision}      If wall ahead
     * @triggers {reached-finish} If resulting cell is finish
     * @return   {App.Car} self
     */
    this.drive = function () {

      var goalCell = getCellAhead();

      if (!goalCell || goalCell.isWall()) {
        // Broadcast collision event
        events.trigger('collision', currentCell);
        return;
      }

      // Remove car and directions flags from old cell
      currentCell
          .toggleFlag('car', false)
          .toggleFlag(DIRECTIONS.join(' '), false);

      // Add car and direction flag to new cell
      goalCell
          .toggleFlag('car', true)
          .toggleFlag(direction, true);

      // Broadcast drive event
      events.trigger('drive', [currentCell, goalCell]);

      if (goalCell.isFinish()) {
        events.trigger('reached-finish');
      }

      currentCell = goalCell;
      return this;
    };


    /**
     * Attempts to pick up a credit from the current cell
     *
     * @triggers {credit-picked-up} If on credit
     * @triggers {credit-failed}    If not on credit
     * @return   {App.Car} self
     */
    this.pickUpCredit = function () {
      if (currentCell.takeCredit()) {
        events.trigger('credit-picked-up');
        currentCell.toggleFlag('credit', false);
      } else {
        events.trigger('credit-failed');
      }

      return this;
    };


    /**
     * Changes the car's orientiation 90 degrees anticlockwise
     *
     * @triggers {turn-left}
     * @return   {App.Car} self
     */
    this.turnLeft = function () {
      turn(LEFT);
      events.trigger('turn-left');
      return this;
    };


    /**
     * Changes the car's orientation 90 degrees clockwise
     *
     * @triggers {turn-right}
     * @return   {App.Car} self
     */
    this.turnRight = function () {
      turn(RIGHT);
      events.trigger('turn-right');
      return this;
    };


    /**
     * Places the car on a given cell, pointing in a given direction
     *
     * @param  {App.Cell} cell
     * @param  {String} direction u|d|l|r
     * @return {App.Car} self
     */
    this.place = function (cell, direction) {
      currentCell
          .toggleFlag('car', false)
          .toggleFlag(DIRECTIONS.join(' '), false);

      cell
          .toggleFlag('car', true)
          .toggleFlag(direction, true);

      currentCell = cell;
      return self;
    };

    App.car = self;

    // Override constructor (singletonize)
    App.Car = function () {
      App.car = self;
      return self;
    };

    events.trigger('car-init');
  };

}(this, this.CARGO));
