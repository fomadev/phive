import * as vscode from 'vscode';

export async function toggleFileVisibility(fileName: string, hide: boolean): Promise<void> {
    const config = vscode.workspace.getConfiguration('files');
    const exclude = { ...config.get<Record<string, unknown>>('exclude') };

    const isCurrentlyHidden = !!exclude[fileName];
    if (hide === isCurrentlyHidden) return;

    if (hide) {
        exclude[fileName] = true;
    } else {
        delete exclude[fileName];
    }

    await config.update('exclude', exclude, vscode.ConfigurationTarget.Workspace);
}
