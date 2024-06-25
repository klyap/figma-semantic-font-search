const nextConfig = {
  // From https://github.com/xenova/transformers.js/issues/741
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
  },
}
module.exports = nextConfig;