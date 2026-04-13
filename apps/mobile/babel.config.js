module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Must be last — required for react-native-reanimated (Expo / RN)
    plugins: ["react-native-reanimated/plugin"],
  };
};
