const process = require('process');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// added by me
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => {
  return {
    mode: (argv.mode === 'production') ? 'production' : 'development',
    // force not using 'eval' which doesn't recognize __html__ and other globals
    devtool: (argv.mode === 'production') ? '' : 'inline-source-map',
    entry: {
      main: './src/main.ts',
      ui: './src/ui.js',
    },
    output: {
      filename: '[name].js',
      path: path.join(process.cwd(), './dist'),
    },
    module: {
      rules: [
        // JS and TS
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            'babel-loader',
          ]
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            'babel-loader',
            'ts-loader'
          ]
        },
        // CSS and SCSS
        {
          test: /\.s?css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader',
          ]
        },
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss', '.html',],
    },
    plugins: [
      new MiniCssExtractPlugin({filename: '[name].css'}),
      new HtmlWebpackPlugin({
        filename: 'ui.html',
        template: './src/ui.html',
        inlineSource: '.(js|css)$',
        chunks: ['ui'],
      }),
      new HtmlWebpackInlineSourcePlugin(),
  
      // added by me
      new CopyPlugin([
        { from: './src/manifest.json', to: './manifest.json' },
      ])
    ],  
  }
}