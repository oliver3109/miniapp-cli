const { join } = require("path");
const path = require("path");
const fs = require("fs");
const server = require("./server");

// 排除的文件夹
const EXCLUDE = ["miniprogram_npm", "node_modules"];

// 根目录
const ROOT = process.cwd();

// 是否存在
const isExist = (path) => fs.existsSync(path);

// 替换一个文件路径的后缀名 柯里化函数
const replaceFilePathExtNameCurry =
  (filePath) => (targetExtname) => (extname) =>
    filePath.replace(targetExtname, extname);

/**
 * 获取小程序所有非全局的组件
 * @param {*} dir 开始扫描的文件夹
 * @param {*} result 结果
 * @param {*} excludeGlobalComponentList 需要排除的全局组件
 * @returns
 */
function getNonGlobalComponentList(dir, result, excludeGlobalComponentList) {
  //根据文件路径读取文件，返回文件列表
  const files = fs.readdirSync(dir);
  for (const fileName of files) {
    //获取当前文件的绝对路径
    const filePath = join(dir, fileName);
    if (EXCLUDE.some((i) => filePath.includes(i))) {
      continue;
    }
    // 获取文件信息
    const stats = fs.statSync(filePath);
    const isFile = stats.isFile(); // 是文件
    const isDir = stats.isDirectory(); // 是文件夹
    if (isFile) {
      const extname = path.extname(filePath);
      const replaceCurry = replaceFilePathExtNameCurry(filePath)(extname);
      const isExistJs = isExist(replaceCurry(".js"));
      const isExistTs = isExist(replaceCurry(".ts"));
      const isExistWxml = isExist(replaceCurry(".wxml"));
      const isExistWxss = isExist(replaceCurry(".wxss"));
      if (
        extname == ".json" &&
        (isExistJs || isExistTs) &&
        isExistWxml &&
        isExistWxss
      ) {
        // 读取 .json 文件
        const jsonFile = fs.readFileSync(filePath, {
          encoding: "utf-8",
        });
        const json = JSON.parse(jsonFile);
        if (json && json.component) {
          // 获取组件路径
          const _comPath = filePath.replace(".json", "");
          if (
            !excludeGlobalComponentList.includes((i) => {
              return i.filePath === _comPath;
            })
          ) {
            const name = _comPath.split("/");
            result.push({
              name: name[name.length - 2],
              filePath: _comPath,
              isGlobal: false,
            });
          }
        }
      }
    }
    if (isDir) {
      // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
      getNonGlobalComponentList(filePath, result, excludeGlobalComponentList);
    }
  }
  return result;
}

/**
 * 获取未注册的页面
 * @param {*} dir 开始扫描的文件夹
 * @param {*} result 结果
 * @param {*} appJsonPages 在主包注册过的页面地址
 * @returns
 */
function getNonRegistedPageList(dir, result, appJsonPages) {
  //根据文件路径读取文件，返回文件列表
  const files = fs.readdirSync(dir);
  for (const fileName of files) {
    //获取当前文件的绝对路径
    const filePath = join(dir, fileName);
    if (EXCLUDE.some((i) => filePath.includes(i))) {
      continue;
    }
    // 获取文件信息
    const stats = fs.statSync(filePath);
    const isFile = stats.isFile(); // 是文件
    const isDir = stats.isDirectory(); // 是文件夹
    if (isFile) {
      const extname = path.extname(filePath);
      const replaceCurry = replaceFilePathExtNameCurry(filePath)(extname);
      const isExistJs = isExist(replaceCurry(".js"));
      const isExistTs = isExist(replaceCurry(".ts"));
      const isExistWxml = isExist(replaceCurry(".wxml"));
      const isExistWxss = isExist(replaceCurry(".wxss"));
      if (
        extname == ".json" &&
        (isExistJs || isExistTs) &&
        isExistWxml &&
        isExistWxss
      ) {
        // 读取 .json 文件
        const jsonFile = fs.readFileSync(filePath, {
          encoding: "utf-8",
        });
        const json = JSON.parse(jsonFile);
        if (json && !json.component) {
          // 获取页面路径
          const _pagePath = filePath.replace(".json", "");
          if (!appJsonPages.includes(_pagePath)) {
            result.push(_pagePath);
          }
        }
      }
    }
    if (isDir) {
      // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
      getNonRegistedPageList(filePath, result, appJsonPages);
    }
  }
  return result;
}

/**
 * 获取小程序页面和组件的数据
 */
function getMiniappPageAndComponentData() {
  // 主包页面路径
  const mainPkgPathList = [];
  // 分包页面路径
  const subPkgPathList = [];
  // 全局组件
  const globalComponents = [];

  // 读取 app.json
  const appJsonText = fs.readFileSync(join(ROOT, ...["app.json"]), {
    encoding: "utf-8",
  });
  const appJson = JSON.parse(appJsonText);

  // 遍历所有主包页面路径
  for (const mainPackageViewPath of appJson.pages) {
    const filePath = join(ROOT, ...[mainPackageViewPath]);
    mainPkgPathList.push(filePath);
  }
  // 遍历所有分包页面路径
  for (const subpackage of appJson.subpackages) {
    for (const subpackageViewPath of subpackage.pages) {
      const filePath = join(ROOT, ...[subpackage.ROOT, subpackageViewPath]);
      subPkgPathList.push(filePath);
    }
  }

  // 遍历所有全局组件路径
  for (const name in appJson.usingComponents) {
    const filePath = join(ROOT, ...[appJson.usingComponents[name]]);
    globalComponents.push({ name, filePath, isGlobal: true });
  }

  // 获取所有组件(排除全局的组件)
  const componentsPathList = getNonGlobalComponentList(
    ROOT,
    [],
    globalComponents
  );

  // 获取未在 app.json 注册的页面
  const nonRegistedPageList = getNonRegistedPageList(
    ROOT,
    [],
    [...mainPkgPathList, ...subPkgPathList]
  );

  return {
    pages: [...mainPkgPathList, ...subPkgPathList],
    globalComponents,
    nonGlobalComponents: componentsPathList,
    nonRegistedPageList,
  };
}

/**
 * 构建小程序组件依赖关系数据
 */
function computeDependencies() {
  const { pages, globalComponents, nonGlobalComponents, nonRegistedPageList } =
    getMiniappPageAndComponentData();
  // 所有组件
  const allComponents = [...globalComponents, ...nonGlobalComponents];
  // 组件数据
  const componentRefData = {};
  // 初始化
  for (const item of allComponents) {
    componentRefData[item.filePath] = {
      pageRefCount: 0,
      componentRefCount: 0,
    };
  }
  // 遍历页面记录 页面与组件之间的引用关系
  for (const pagePath of pages) {
    const pageJsonStr = fs.readFileSync(pagePath + ".json");
    const pageJson = JSON.parse(pageJsonStr);
    const pageComponents = pageJson.usingComponents;
    // 判断当前页面 .json 文件引入的组件
    if (pageComponents) {
      for (const key in pageComponents) {
        // 判断路径是绝对路径或者是相对路径
        const isAbs = path.isAbsolute(pageComponents[key]);
        if (isAbs) {
          const _comPath = join(...[ROOT, pageComponents[key]]);
          if (nonGlobalComponents.some((i) => i.filePath === _comPath)) {
            componentRefData[_comPath].pageRefCount++;
          }
        } else {
          const _comPath = path.normalize(pagePath + pageComponents[key]);
          if (nonGlobalComponents.some((i) => i.filePath === _comPath)) {
            componentRefData[_comPath].pageRefCount++;
          }
        }
      }
    }

    // 判断当前页面 wxml 里面匹配上的组件名称
    const pageWXML = fs.readFileSync(pagePath + ".wxml");
    for (const component of globalComponents) {
      const isUse = pageWXML.includes(`<${component.name} `);
      if (isUse) {
        componentRefData[component.filePath].pageRefCount++;
      }
    }
  }

  // 遍历组件记录 组件与组件之间的引用关系
  for (const component of allComponents) {
    const componentJsonFile = fs.readFileSync(component.filePath + ".json");
    const componentJson = JSON.parse(componentJsonFile);
    const compComponents = componentJson.usingComponents;
    if (compComponents) {
      for (const key in compComponents) {
        // 判断路径是绝对路径或者是相对路径
        const isAbs = path.isAbsolute(compComponents[key]);
        if (isAbs) {
          const _comPath = join(...[ROOT, compComponents[key]]);
          if (componentRefData[_comPath]) {
            componentRefData[_comPath].componentRefCount++;
          }
        } else {
          const componentRelativePath = compComponents[key];
          const _path = component.filePath.split("/");
          Array.prototype.splice.call(_path, -1);
          let _comPath = path.normalize(
            _path.join("/") + "/" + componentRelativePath
          );
          if (isExist(_comPath)) {
            const state = fs.statSync(_comPath);
            if (state.isFile()) {
              componentRefData[_comPath].componentRefCount++;
            }
            if (state.isDirectory()) {
              const files = fs.readdirSync(_comPath);
              for (const fileName of files) {
                //获取当前文件的绝对路径
                const filePath = join(_comPath, fileName);
                const extname = path.extname(filePath);
                const replaceCurry =
                  replaceFilePathExtNameCurry(filePath)(extname);
                const isExistJs = isExist(replaceCurry(".js"));
                const isExistTs = isExist(replaceCurry(".ts"));
                const isExistWxml = isExist(replaceCurry(".wxml"));
                const isExistWxss = isExist(replaceCurry(".wxss"));
                if (
                  extname == ".json" &&
                  (isExistJs || isExistTs) &&
                  isExistWxml &&
                  isExistWxss
                ) {
                  // 读取 .json 文件
                  const jsonFile = fs.readFileSync(filePath, {
                    encoding: "utf-8",
                  });
                  const json = JSON.parse(jsonFile);
                  if (json && !json.component) {
                    const _comPath = filePath.replace(".json", "");
                    if (componentRefData[_comPath]) {
                      componentRefData[_comPath].componentRefCount++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    componentRefData,
    nonRegistedPageList,
  };
}

/**
 * 执行函数
 */
const run = function () {
  const { componentRefData, nonRegistedPageList } = computeDependencies();

  server.get("/report", function (_req, res) {
    res.render(join(__dirname, ...["..", "views", "report.ejs"]), {
      componentRefData,
      nonRegistedPageList,
    });
  });

  server.listen(8080, function () {
    console.log("报告已生成，可访问以下地址：");
    console.log("http://localhost:8080/report");
  });
};

module.exports = run;
