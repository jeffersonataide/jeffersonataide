module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");

  // Copy all PNG images directly to build
  eleventyConfig.addPassthroughCopy("**/*.png");
};
