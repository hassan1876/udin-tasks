/**
 * SOKOBAN LEVELS
 * 
 * Level format:
 * - Array of strings, each string is a row
 * - Legend:
 *   # = wall
 *   . = goal (target spot)
 *   (space) = floor
 *   $ = box/crate
 *   @ = player
 *   * = box on goal
 *   + = player on goal
 */

const LEVELS = [
    // Level 1 - Simple introduction
    {
        name: "Getting Started",
        map: [
            "#####",
            "#.  #",
            "# $$#",
            "# @ #",
            "#####"
        ]
    },
    
    // Level 2 - Three boxes
    {
        name: "Three Goals",
        map: [
            "#######",
            "#  .  #",
            "# $$$ #",
            "#  @  #",
            "#######"
        ]
    },
    
    // Level 3 - Corridor challenge
    {
        name: "The Corridor",
        map: [
            "########",
            "#  . . #",
            "#  $ $ #",
            "#  @ . #",
            "#  $   #",
            "########"
        ]
    },
    
    // Level 4 - Classic puzzle
    {
        name: "Classic Puzzle",
        map: [
            "  #####  ",
            "###   ###",
            "#..$@$..#",
            "###   ###",
            "  #####  "
        ]
    },
    
    // Level 5 - Corner challenge
    {
        name: "Corner Strategy",
        map: [
            "########",
            "#..    #",
            "#.. $$ #",
            "#  $  ##",
            "# $ #  #",
            "#   @  #",
            "########"
        ]
    }
];
