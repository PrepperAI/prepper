// config-overrides.js at root
const path = require("path");

module.exports = {
  webpack: function (config) {
    config.resolve = {
      ...config.resolve,
      alias: {
        "pdfjs-dist": path.resolve(
          __dirname,
          "./node_modules/pdfjs-dist/es5/build/pdf.js"
        ),
      },
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    };

    config.module.rules.unshift({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
};
