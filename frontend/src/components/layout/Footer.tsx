export function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 学校信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">东莞中学松山湖学校（集团）东莞市第十三高级中学</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              在线编程学习与竞赛平台
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/problems" className="text-gray-300 hover:text-white transition-colors">
                  题目列表
                </a>
              </li>
              <li>
                <a href="/contests" className="text-gray-300 hover:text-white transition-colors">
                  比赛中心
                </a>
              </li>
              <li>
                <a href="/ranking" className="text-gray-300 hover:text-white transition-colors">
                  排行榜
                </a>
              </li>
              <li>
                <a href="/discuss" className="text-gray-300 hover:text-white transition-colors">
                  讨论区
                </a>
              </li>
            </ul>
          </div>

          {/* 系统信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">系统信息</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>SSL Online Judge v1.0</p>
              <p>支持多种编程语言</p>
              <p className="text-xs text-gray-400 mt-4">
                © 2025 东莞中学松山湖学校（集团）东莞市第十三高级中学. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* 底部分割线和版权信息 */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              Powered by SSL OJ Team | 技术支持：信息技术部
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <span className="text-xs text-gray-500">
                服务器状态：正常运行
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}