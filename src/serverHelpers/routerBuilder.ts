import * as path from 'path';

export function buildRouterContent(injectionScript: string): string {
    return `<?php
    $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    $file = __DIR__ . $path;

    if (is_dir($file)) {
        $file = rtrim($file, "/") . "/index.php";
    }

    if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === "php") {
        ob_start();
        include $file;
        $content = ob_get_clean();
        if (strpos($content, '</body>') !== false) {
            echo str_replace("</body>", "${injectionScript}</body>", $content);
        } else {
            echo $content . "${injectionScript}";
        }
    } else {
        return false;
    }
    `;
}

export function getRouterFilePath(rootPath: string): string {
    return path.join(rootPath, '.phive_router.php');
}