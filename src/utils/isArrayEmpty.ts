/**
 * Check if an array is: undefined, null, empty, or is not an array.
 * @param array Array
 */
export const isArrayEmpty = (input: any): boolean => {
  // return true if array does not exist, is not an array, or is empty
  return (!Array.isArray(input) || !input.length);
};

/**
     * Check if an array is not: undefined, null, empty, or is not an array.
     * @param array Array
     */
export const isArrayNotEmpty = (input: any): boolean => {
  return !isArrayEmpty(input);
};
