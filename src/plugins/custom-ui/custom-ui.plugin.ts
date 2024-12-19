import * as path from 'path';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { AdminUiExtension } from '@vendure/ui-devkit/compiler';

@VendurePlugin({
    imports: [PluginCommonModule],
    compatibility: '^2.1.0',
})
export class CustomUiPlugin {
    static ui: AdminUiExtension = {
        id: 'custom-ui',
        extensionPath: path.join(__dirname, 'ui'),
        providers: ['providers.ts'], // Link to your providers file
    };
}
