const path = require('path');

module.exports = env => {
  return {
    entry: './src/index.js',
    mode: env.MODE,
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ],
        },
      ],
    }
  }
};