/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { appSrc } = require('./paths');

module.exports = webpackMerge(commonConfig, {
    output: {
        publicPath: '/',
    },
    mode: 'development',
    entry: ['react-hot-loader/patch', appSrc],
    devtool: 'inline-source-map',
    devServer: {
        watchOptions: {
            poll: true,
            ignored: [/node_modules/, 'src/__tests__/']
        },
        compress: true,
        port: 9001,
        host: "0.0.0.0",
        historyApiFallback: true,
        hot: true,
	
            //   proxy: {
            //     '/backend': {
            //       target: 'http://localhost:8081',
            //       pathRewrite: { '^/backend': '' },
            //     },
             // }, 

             proxy: {
                '/backend': {
                  target: 'https://th2-qa.exp.exactpro.com:30443/th2-commonv3/act-ui/',
                  secure:false,
                  changeOrigin:true,
                },
            },
            
          
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                enforce: 'pre',
                use: [{
                    options: {
                        eslintPath: require.resolve('eslint'),
                        failOnError: false,
                        cache: false,
                        quite: true,
                        formatter: require('eslint-formatter-pretty'),
                    },
                    loader: require.resolve('eslint-loader'),
                }],
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ].filter(loader => loader)
            },
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            eslint: {
                files: './src/**/*{ts,tsx,js,jsx}',
                enabled: true,
            }
        })
    ]
});
