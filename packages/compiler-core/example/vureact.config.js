export default {
  input: 'src',
  output: {
    workspace: '.vureact',
    bootstrapVite: true,
    outDir: 'dist',
    ignoreAssets: ['public/demo.svg', '.env'],
  },
};
