(function (global, App) {

  var
    events = App.eventDispatcher;

  App.Car = function (startCell, startDirection, grid) {

    var
      UP    = 'u',
      DOWN  = 'd',
      LEFT  = 'l',
      RIGHT = 'r',
      DIRECTIONS = [UP, DOWN, LEFT, RIGHT],

      currentCell = startCell,
      direction = startDirection,
      self = this;

    if (this.constructor !== App.Car) {
      return new App.Car(startCell, startDirection, grid);
    }

    // Init
    startCell.toggleFlag('car', true).toggleFlag(direction, true);


    function getCellAhead() {
      var
        aX = currentCell.getPos()[0],
        aY = currentCell.getPos()[1];

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

    function updateDirection() {
      currentCell
        .toggleFlag(DIRECTIONS.join(' '), false)
        .toggleFlag(direction, true);
    }

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

    this.isWallAhead = function () {
      var cellAhead = getCellAhead();

      return cellAhead ? cellAhead.isWall() : true;
    };

    this.onCredit = function () {
      return currentCell.hasCredit();
    };

    this.pickUpCredit = function () {
      if (currentCell.takeCredit()) {
        events.trigger('credit-picked-up');
        currentCell.toggleFlag('credit', false);
      } else {
        events.trigger('credit-failed');
      }

      return this;
    };

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

    App.car = self;

    App.Car = function () {
      App.car = self;
      return self;
    };

    events.trigger('car-init');
  };
}(this, this.CARGO));
