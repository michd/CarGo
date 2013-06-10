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
   * @triggers drive
   * @triggers collission
   * @triggers reached-finish
   * @triggers credit-picked-up
   * @triggers credit-failed
   * @triggers turn-left
   * @triggers turn-right
   * @triggers car-init
   * @return {App.Car}
   */
  App.Car = function (startCell, startDirection, grid) {

    var
      // Direction constants for more descriptive use
      UP    = 'u',
      DOWN  = 'd',
      LEFT  = 'l',
      RIGHT = 'r',
      DIRECTIONS = [UP, DOWN, LEFT, RIGHT],

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
     * Attempt to drive forward (in the current direction) one cell
     *
     * If succesful, triggers a drive event
     * If unsuccesful (wall or grid boundary ahead), triggers a collision event
     * If succesful and reaches finish, triggers a reached-finish event
     *
     * @triggers drive
     * @triggers collision
     * @triggers reached-finish
     * @return {App.Car} self
     */
    this.drive = function () {
      var goalCell = getCellAhead();

      if (!goalCell || goalCell.isWall()) {
        // Broadcast collision event
        events.trigger('collision', currentCell);
        return;
      }

      currentCell
          .toggleFlag('car', false)
          .toggleFlag([UP, DOWN, LEFT, RIGHT].join(' '), false);

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


    /**
     * Attempts to pick up a credit from the current cell
     *
     * If this succeed (there was a credit), credit-picked-up is triggered
     * If it fails (no credit), credit-failed is triggered
     *
     * @triggers credit-picked-up
     * @triggers credit-failed
     * @return {App.Car} self
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
     * @triggers turn-left
     * @return {App.Car} self
     */
    this.turnLeft = function () {
      switch (direction) {
      case UP:
        direction = LEFT;
        break;
      case DOWN:
        direction = RIGHT;
        break;
      case LEFT:
        direction = DOWN;
        break;
      case RIGHT:
        direction = UP;
        break;
      }

      updateDirection();
      events.trigger('turn-left');

      return this;
    };


    /**
     * Changes the car's orientation 90 degrees clockwise
     *
     * @triggers turn-right
     * @return {App.Car} self
     */
    this.turnRight = function () {
      switch (direction) {
      case UP:
        direction = RIGHT;
        break;
      case DOWN:
        direction = LEFT;
        break;
      case LEFT:
        direction = UP;
        break;
      case RIGHT:
        direction = DOWN;
        break;
      }

      updateDirection();
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
          .toggleFlag([UP, DOWN, LEFT, RIGHT].join(' '), false);

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
