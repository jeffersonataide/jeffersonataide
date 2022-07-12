module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  // Copy all PNG images directly to build
  eleventyConfig.addPassthroughCopy("src/**/*.png");

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
