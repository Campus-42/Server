function ceilToMultiple(number = new Number(), multiple = 5) {
  /**
   * Round up the number to the nearest 5
   * @Example 4.23 => 5 or 242.2 => 245
   */
  return Math.ceil(number / multiple) * multiple;
}

function levelLimit(level) {
  /**
   * This function determines which limit a certain level has
   * Level 1 has no limit since it's the start
   */
  if (level == 1) return 0;
  else return ceilToMultiple(Math.log10(level + 2) * Math.pow(level + 2, 2));
}

function getLevel(points) {
  /**
   * Get the level from a the user's points
   */
  var level = 1;
  for (var i = 1; i <= 100; i++) {
    const required = levelLimit(i);
    if (points < required) {
      level = i - 1;
      break;
    }
  }
  return level;
}

/**
 * Export all formulas here
 */
exports.ceilToMultiple = ceilToMultiple;
exports.levelLimit = levelLimit;
exports.getLevel = getLevel;
