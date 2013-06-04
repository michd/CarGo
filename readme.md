CarGo
=====

Game to learn basic concepts of programming through going through a puzzle course.

Currently runs through the program instantly (no delay between steps).

I'm planning to build an interface so you don't manually have to type commands (using menus).


Commands
--------

- `DRIVE`: Drive one square in the direction you're facing
- `TURN RIGHT`: Turns 90 degrees to the right, relative to where you're facing
- `TURN LEFT`: Turns 90 degrees to the left, relative to where you're facing
- `PICK UP CREDIT`: Pick up a credit you're currently on

Conditions
----------

- `WALL AHEAD`: True if the square directly ahead of the car (keeping in mind the direction) is a wall or boundary of the grid
- `ON CREDIT`: True if currently on a square containing a credit
- `ON FINISH`: True if currently standing on the finish field

Syntax
------

One command per line. You can use conditionals either as one-liners or as blocks.

Conditional one-line examples:

```
IF WALL AHEAD: TURN RIGHT
UNLESS WALL AHEAD: DRIVE
```

Conditional block example:
```
IF WALL AHEAD:
  TURN RIGHT
  TURN RIGHT
END
```

Loops
-----

Currently only conditional loops, either as one-liners or as blocks.
Loop one-line examples:

```
UNTIL WALL AHEAD: DRIVE
WHILE WALL AHEAD: TURN RIGHT
```

Loop block example:

```
WHILE ON CREDIT:
  PICK UP CREDIT
  DRIVE
END
```
