import type { Compiler } from 'webpack';
import type { ModuleFederationPluginOptions } from '../types';

import CommonJsChunkLoadingPlugin from './CommonJsChunkLoadingPlugin';

interface StreamingTargetOptions extends ModuleFederationPluginOptions {
  promiseBaseURI?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface StreamingTargetContext {}

class StreamingTargetPlugin {
  private options: StreamingTargetOptions;

  constructor(options: StreamingTargetOptions) {
    this.options = options || {};
  }

  apply(compiler: Compiler) {
    if (compiler.options.target) {
      console.warn(
        `target should be set to false while using NodeSoftwareStreamRuntime plugin, actual target: ${compiler.options.target}`
      );
    }

    // When used with Next.js, context is needed to use Next.js webpack
    const { webpack } = compiler;

    // This will enable CommonJsChunkFormatPlugin
    compiler.options.output.chunkFormat = 'commonjs';
    // This will force async chunk loading
    compiler.options.output.chunkLoading = 'async-node';

    // Disable default config
    // FIXME: enabledChunkLoadingTypes is of type 'string[] | undefined'
    // Can't use the 'false' value as it isn't the right format,
    // Perhaps delete the option might solve our use case.

    // compiler.options.output.enabledChunkLoadingTypes = false;
    delete compiler.options.output.enabledChunkLoadingTypes;

    new ((webpack && webpack.node && webpack.node.NodeEnvironmentPlugin) ||
      require('webpack/lib/node/NodeEnvironmentPlugin'))({
      infrastructureLogging: compiler.options.infrastructureLogging,
    }).apply(compiler);

    new ((webpack && webpack.node && webpack.node.NodeTargetPlugin) ||
      require('webpack/lib/node/NodeTargetPlugin'))().apply(compiler);

    new CommonJsChunkLoadingPlugin({
      asyncChunkLoading: true,
      name: this.options.name,
      remotes: this.options.remotes as Record<string, string>,
      baseURI: compiler.options.output.publicPath,
      promiseBaseURI: this.options.promiseBaseURI,
    }).apply(compiler);
  }
}

export default StreamingTargetPlugin;