module.exports = {
  plugins: [
    require('tailwindcss')({
      config: require('path').join(__dirname, 'tailwind.config.cjs'),
    }),
    require('autoprefixer'),
  ],
};
