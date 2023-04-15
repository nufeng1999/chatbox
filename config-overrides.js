const webpack = require('webpack');
const { override, addLessLoader, } = require('customize-cra');
const path = require('path');

module.exports = override(
    config => {
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.PUBLIC_URL': JSON.stringify('https://www.myapp.com'),
                'process.env.REACT_APP_ASSETS_PATH': JSON.stringify('/assets')

            })
        );
        return config;
    },
    addLessLoader()

)