module.exports = function (api) {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // ['babel-plugin-react-compiler'], // 禁用实验性编译器,提升性能
            ['inline-import', { extensions: ['.sql'] }],
            [
                'react-native-reanimated/plugin',
                {
                    processNestedWorklets: true,
                    relativeSourceLocation: true,
                },
            ],
            ['transform-remove-console', { exclude: ['error', 'warn'] }],
        ],
    }
}
