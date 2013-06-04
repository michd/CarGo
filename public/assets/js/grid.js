(function (global, App, $) {

  var $grid = $('#grid');

  App.Grid = function (gameData) {

    var
      data = [],
      self = this;

    if (this.constructor !== App.Grid) { //ensure intantiating
      return new App.Grid(gameData);
    }

    // Fills in cells in a rectangle
    function drawRect(coords, type) {
      var
        x, y,
        cell,
        xDir = coords[0][0] <= coords[1][0] ? 1 : -1,
        yDir = coords[0][1] <= coords[1][1] ? 1 : -1;

      for (x = coords[0][0]; x <= coords[1][0]; x += xDir) {
        for (y = coords[0][1]; y <= coords[1][1]; y += yDir) {
          cell = data[y][x];
          cell.toggleFlag(type, true);
        }
      }
    }

    this.getCell = function (pos) {
      if (data[pos[1]] !== undefined) {
        return data[pos[1]][pos[0]] || false;
      }
      return false;
    };

    this.init = function (gameData) {
      var x, y, i, cellData, cell, $cell, $row, car, finish;

      function getCell(pos) {
        return data[pos[1]][pos[0]];
      }

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

        if (cellData.pos !== undefined) {
          cell = getCell(cellData.pos);
          cell.toggleFlag(cellData.type, true);
        } else if (cellData.rect !== undefined) {
          drawRect(cellData.rect, cellData.type);
        }
      }

      // Position finish
      finish = getCell(gameData.goalPos);
      finish.toggleFlag('finish', true);

      // Position car
      App.Car(getCell(gameData.startPos), gameData.startDirection, self);

    };

    this.reset = function () {
      data = [];
      $grid.find('.row').remove();
      this.init(gameData);
      App.car.place(self.getCell(gameData.startPos), gameData.startDirection);
    };

    App.grid = self;

    App.Grid = function () {
      //restore instance if overwritten
      App.grid = self;
      return self;
    };

    this.init(gameData);
  };

}(this, this.CARGO, this.jQuery));
