![miniapp-cli](https://socialify.git.ci/OLIVERgZzy/miniapp-cli/image?description=1&font=Bitter&forks=1&issues=1&language=1&owner=1&pattern=Formal%20Invitation&pulls=1&stargazers=1&theme=Dark)

# 动机

为什么要做这个工具？随着小程序项目参与开发的人越来越多，组件和页面也越来越多，主包大小一不留神就会超限，所以做了这个命令行工具来分析小程序组件和页面的情况，方便我们优化小程序。

# 技术栈

1. Node
2. express
3. ejs
4. echart
5. bootstrap

# 功能清单

- [x] 分析小程序组件依赖情况
- [x] 查找出未在 app.json 中注册的页面
- [x] 本地生成报告

# 使用方法

> 暂时还没发布到 npm，所以需要本地安装

1. 下载并放入当前小程序根目录中
2. 进入 miniapp-cli 文件夹中安装依赖
3. 回到根目录，执行 `sudo npm link miniapp-cli`
4. 执行命令

```bash
mp-cli -v        # 查看版本
mp-cli analysis  # 执行分析
mp-cli a         # 执行分析（简写）
```

# 页面截图

![page1](./images/page1.png)
![page2](./images/page2.png)
![page3](./images/page3.png)
