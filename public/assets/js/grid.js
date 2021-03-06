(function (App, $, global) {
  "use strict";

  var
    $grid = $('#grid'),
    events = App.eventDispatcher;

  /**
   * Describes the game grid, where the user's program will be executed
   *
   * Coupled with App.Cell and App.Car
   *
   * @param  {Object} gameData Structured object with data to build the grid
   * @return {App.Grid}
   */
  App.Grid = function (gameData) {

    var
      // 2-dimensional array of all the Cells
      data = [],
      contentCounters = {},
      self = this;

    // Ensure instantiation
    if (this.constructor !== App.Grid) {
      return new App.Grid(gameData);
    }


    /**
     * Fills in cells in a rectangle, for easily populating an area
     *
     * @param  {Array}  coords Origin and dimensions of rect ([[x, y], [w, h]])
     * @param  {String} type   What to fill this rectangle with
     */
    function drawRect(coords, type) {
      var
        x, y,
        cell,
        originX = coords[0][0],
        originY = coords[0][1],
        width   = coords[1][0],
        height  = coords[1][1];

      for (x = originX; x < originX + width; x += 1) {
        for (y = originY; y < originY + height; y += 1) {
          cell = data[y][x];
          cell.toggleFlag(type, true);
        }
      }
    }


    /**
     * Retrieve a Cell based on coordinates
     *
     * @param  {Array} pos Coordinates ([x, y])
     * @return {App.Cell|Boolean} Either the cell, or false if no such cell
     */
    function getCell(pos) {

      if (data[pos[1]] !== undefined) {
        return data[pos[1]][pos[0]] || false;
      }

      return false;
    }


    /**
     * Empties the grid, both UI-wise as internal data-wise
     *
     */
    function clear() {
      data = [];
      $grid.find('.row').remove();
    }


    /**
     * Initializes the game grid with game data
     *
     * Important: also initializes App.Car
     *
     * @param  {Object} gameData
     */
    function initialize(gameData) {
      var
        x, y,
        i,
        cellData,
        cell,
        $row,
        $cell,
        car,
        finish;

      contentCounters = {};

      // Create grid by building individual cells
      for (y = 0; y < gameData.height; y += 1) {

        data[y] = [];
        $row = $('<div>', {"class": "row"});

        for (x = 0; x < gameData.width; x += 1) {
          data[y][x] = new App.Cell([x, y]);
          $row.append(data[y][x].getElement());
        }

        $grid.append($row);
      }


      // Set classes for special cells
      for (i = 0; i < gameData.content.length; i += 1) {

        cellData = gameData.content[i];

        // Count number of each type of cell
        contentCounters[cellData.type] = contentCounters[cellData.type] || 0;
        contentCounters[cellData.type] += 1;

        if (cellData.pos !== undefined) {
          cell = self.getCell(cellData.pos);
          cell.toggleFlag(cellData.type, true);
        } else if (cellData.rect !== undefined) {
          drawRect(cellData.rect, cellData.type);
        }
      }

      // Position finish
      finish = self.getCell(gameData.goalPos);
      finish.toggleFlag('finish', true);

      // Position car
      if (App.car) {
        App.car.place(self.getCell(gameData.startPos), gameData.startDirection);
      } else {
        App.Car(getCell(gameData.startPos), gameData.startDirection, self);
      }

      // Broadcast how many credits were placed
      events.trigger('grid.credits-placed', contentCounters.credit || 0);
    }


    /**
     * Empties grid and reinitializes it with data in gameData
     *
     */
    function reset() {
      clear();
      initialize(gameData);
    }


    /**
     * Load new grid data and reinitialize grid with newly selected data
     * @param  {String} gridName
     */
    function selectGrid(gridName) {
      if (App.grids[gridName] !== undefined) {
        gameData = App.grids[gridName];
      }
      reset();
    }


    this.getCell = getCell;


    // Listen for events
    events.subscribe({
      'ui.select.grid':        selectGrid,
      'ui.reset':              reset,
      'parser.program-parsed': reset
    });

    App.grid = self;


    // Override constructor (singletonize)
    App.Grid = function () {
      // Restore instance if overwritten
      App.grid = self;
      return self;
    };

    initialize(gameData);
  };

}(this.CARGO, this.jQuery, this));
