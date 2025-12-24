// 统一版本管理配置文件
// 只需修改这一个地方，所有文件会自动使用此版本号
const APP_VERSION = '1.2.0';

// 如果在 Service Worker 中，导出给 SW 使用
if (typeof self !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  self.APP_VERSION = APP_VERSION;
}
